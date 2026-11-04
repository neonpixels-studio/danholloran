import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import {
  STATUS,
  fetchOutcome,
  buildReport,
  checkAll,
  checkUrl,
  classifyOutcome,
  extractUrls,
  findDeadLinksByPost,
  groupUrlsByPost,
  isMostlyUnverifiable,
} from "../../../scripts/check-external-links.mjs";

const WORKFLOW_PATH = ".github/workflows/external-link-rot.yml";
const noDelay = () => Promise.resolve();

function responseWithStatus(status: number) {
  return { status, body: { cancel: () => Promise.resolve() } };
}

function dnsError() {
  return Object.assign(new TypeError("fetch failed"), {
    cause: { code: "ENOTFOUND" },
  });
}

describe("extractUrls", () => {
  it("finds markdown links, autolinks and bare urls", () => {
    const markdown =
      "[a](https://a.com/x) <https://b.com> and https://c.com/y here";
    expect(extractUrls(markdown)).toEqual([
      "https://a.com/x",
      "https://b.com",
      "https://c.com/y",
    ]);
  });

  it("dedupes repeated urls", () => {
    expect(extractUrls("https://a.com https://a.com")).toEqual([
      "https://a.com",
    ]);
  });

  it("trims trailing punctuation and the closing markdown paren", () => {
    expect(
      extractUrls("(see [x](https://a.com/p).) Also https://b.com/q,"),
    ).toEqual(["https://a.com/p", "https://b.com/q"]);
  });

  it("keeps balanced parens inside a url", () => {
    expect(extractUrls("[w](https://en.wikipedia.org/wiki/Foo_(bar))")).toEqual(
      ["https://en.wikipedia.org/wiki/Foo_(bar)"],
    );
  });

  it("ignores fenced and inline code", () => {
    const markdown =
      "```js\nfetch('https://code.com')\n```\n`https://inline.com` https://real.com";
    expect(extractUrls(markdown)).toEqual(["https://real.com"]);
  });

  it("keeps urls after a fence that opens indented and closes unindented", () => {
    const markdown = "  ```\nhttps://code.com\n```\nhttps://real.com";
    expect(extractUrls(markdown)).toEqual(["https://real.com"]);
  });

  it("decodes html ampersands and ignores example subdomains", () => {
    expect(
      extractUrls(
        'href="https://a.com/?x=1&amp;y=2" https://api.example.com/x',
      ),
    ).toEqual(["https://a.com/?x=1&y=2"]);
  });

  it("ignores local and example hosts", () => {
    const markdown =
      "http://localhost:3000 http://127.0.0.1 https://www.example.com https://foo.test/x https://real.com";
    expect(extractUrls(markdown)).toEqual(["https://real.com"]);
  });
});

describe("classifyOutcome", () => {
  it.each([200, 204, 301, 302])("treats %i as ok", (status) => {
    expect(classifyOutcome({ status })).toBe(STATUS.OK);
  });

  it.each([404, 410])("treats %i as dead", (status) => {
    expect(classifyOutcome({ status })).toBe(STATUS.DEAD);
  });

  it.each([401, 403, 999])("treats %i as unknown (bot block)", (status) => {
    expect(classifyOutcome({ status })).toBe(STATUS.UNKNOWN);
  });

  it.each([429, 500, 502, 503, 504])("retries %i", (status) => {
    expect(classifyOutcome({ status })).toBe(STATUS.RETRY);
  });

  it.each([400, 405])("treats other 4xx (%i) as unknown", (status) => {
    expect(classifyOutcome({ status })).toBe(STATUS.UNKNOWN);
  });

  it("retries a single DNS failure rather than calling it dead", () => {
    expect(classifyOutcome({ error: dnsError() })).toBe(STATUS.RETRY);
  });

  it("retries timeouts and other network errors", () => {
    const timeout = Object.assign(new Error("timed out"), {
      name: "TimeoutError",
    });
    const reset = Object.assign(new TypeError("fetch failed"), {
      cause: { code: "ECONNRESET" },
    });
    expect(classifyOutcome({ error: timeout })).toBe(STATUS.RETRY);
    expect(classifyOutcome({ error: reset })).toBe(STATUS.RETRY);
  });
});

describe("checkUrl", () => {
  it("does not report a single 503 as dead", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(responseWithStatus(503))
      .mockResolvedValueOnce(responseWithStatus(200));
    const result = await checkUrl("https://a.com", {
      fetchImpl,
      delay: noDelay,
    });
    expect(result).toBe(STATUS.OK);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("reports unknown, not dead, when every attempt is transient", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(responseWithStatus(503));
    const result = await checkUrl("https://a.com", {
      fetchImpl,
      delay: noDelay,
      maxAttempts: 3,
    });
    expect(result).toBe(STATUS.UNKNOWN);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("reports dead on a 404 without retrying", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(responseWithStatus(404));
    const result = await checkUrl("https://a.com", {
      fetchImpl,
      delay: noDelay,
    });
    expect(result).toBe(STATUS.DEAD);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("reports dead only when every attempt is a DNS failure", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(dnsError());
    const result = await checkUrl("https://gone.example.io", {
      fetchImpl,
      delay: noDelay,
      maxAttempts: 3,
    });
    expect(result).toBe(STATUS.DEAD);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("does not report dead when DNS fails once then the host answers", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(dnsError())
      .mockResolvedValueOnce(responseWithStatus(200));
    expect(await checkUrl("https://a.com", { fetchImpl, delay: noDelay })).toBe(
      STATUS.OK,
    );
  });

  it("backs off between attempts and sends a timeout signal", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(responseWithStatus(503));
    const delay = vi.fn().mockResolvedValue(undefined);
    await checkUrl("https://a.com", { fetchImpl, delay, maxAttempts: 3 });
    expect(delay.mock.calls).toEqual([[2000], [4000]]);
    expect(fetchImpl.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("reports unknown for a bot-blocking 403", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(responseWithStatus(403));
    expect(await checkUrl("https://a.com", { fetchImpl, delay: noDelay })).toBe(
      STATUS.UNKNOWN,
    );
  });
});

describe("fetchOutcome", () => {
  it("keeps the status when cancelling the body fails", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      status: 404,
      body: { cancel: () => Promise.reject(new Error("locked")) },
    });
    expect(await fetchOutcome("https://a.com", fetchImpl)).toEqual({
      status: 404,
    });
    expect(fetchImpl.mock.calls[0][1].headers["User-Agent"]).toContain(
      "link-rot-check",
    );
  });
});

describe("checkAll", () => {
  it("never exceeds the concurrency limit and checks every url", async () => {
    let active = 0;
    let peak = 0;
    const check = async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active--;
      return STATUS.OK;
    };
    const urls = Array.from(
      { length: 12 },
      (_, index) => `https://a.com/${index}`,
    );
    const results = await checkAll(urls, check, 3);
    expect(results.size).toBe(12);
    expect(peak).toBe(3);
  });
});

describe("checkAll deadline and run health", () => {
  it("marks urls unknown once the deadline has passed", async () => {
    const check = vi.fn().mockResolvedValue(STATUS.OK);
    const results = await checkAll(["https://a.com"], check, 2, Date.now() - 1);
    expect(check).not.toHaveBeenCalled();
    expect(results.get("https://a.com")).toBe(STATUS.UNKNOWN);
  });

  it("flags a run where most urls are unverifiable", () => {
    const mostlyUnknown = new Map([
      ["https://a.com", STATUS.UNKNOWN],
      ["https://b.com", STATUS.UNKNOWN],
      ["https://c.com", STATUS.OK],
    ]);
    const mostlyOk = new Map([
      ["https://a.com", STATUS.UNKNOWN],
      ["https://b.com", STATUS.OK],
      ["https://c.com", STATUS.OK],
    ]);
    expect(isMostlyUnverifiable(mostlyUnknown)).toBe(true);
    expect(isMostlyUnverifiable(mostlyOk)).toBe(false);
  });
});

describe("reporting", () => {
  const posts = [
    { slug: "post-a", markdown: "https://dead.com https://alive.com" },
    { slug: "post-b", markdown: "https://dead.com https://blocked.com" },
  ];
  const urlToPosts = groupUrlsByPost(posts);
  const results = new Map([
    ["https://dead.com", STATUS.DEAD],
    ["https://alive.com", STATUS.OK],
    ["https://blocked.com", STATUS.UNKNOWN],
  ]);

  it("lists only dead links, under every post that uses them", () => {
    const dead = findDeadLinksByPost(urlToPosts, results);
    expect([...dead.entries()]).toEqual([
      ["post-a", ["https://dead.com"]],
      ["post-b", ["https://dead.com"]],
    ]);
  });

  it("renders a report grouped by post", () => {
    const dead = findDeadLinksByPost(urlToPosts, results);
    const report = buildReport(dead, { checkedCount: 3, unknownCount: 1 });
    expect(report).toContain("### post-a\n\n- https://dead.com");
    expect(report).toContain("### post-b");
    expect(report).toContain(
      "Checked 3 unique outbound URLs. 1 could not be verified",
    );
    expect(report).not.toContain("alive.com");
    expect(report).not.toContain("blocked.com");
  });

  it("renders no post headings when nothing is dead", () => {
    const report = buildReport(new Map(), { checkedCount: 3, unknownCount: 0 });
    expect(report).not.toMatch(/^### /m);
  });
});

describe("external-link-rot workflow", () => {
  const workflow = parse(
    readFileSync(join(process.cwd(), WORKFLOW_PATH), "utf8"),
  );

  it("only runs on schedule or manual dispatch, never on PRs or pushes", () => {
    expect(Object.keys(workflow.on).sort()).toEqual([
      "schedule",
      "workflow_dispatch",
    ]);
  });

  it("grants issues: write on the job only, with no workflow-level permissions", () => {
    expect(workflow.permissions).toBeUndefined();
    const [job] = Object.values(workflow.jobs) as {
      permissions: Record<string, string>;
    }[];
    expect(job.permissions).toEqual({ contents: "read", issues: "write" });
  });
});

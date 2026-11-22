import { describe, it, expect, vi } from "vitest";
import {
  LastDeployLookupError,
  decideDeploy,
  fetchLastDeploy,
  findLastDeploy,
  findPostsDueSince,
  isMainModule,
  main,
} from "../../../scripts/check-undeployed-commits.mjs";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SITE_ID = "site-1";
const TOKEN = "token-abc";
const LIVE_SHA = "aaa111";
const NEW_SHA = "bbb222";
const DEPLOYED_AT = "2026-11-21T06:00:00.000Z";
const NOW = Date.parse("2026-11-22T06:00:00.000Z");

function deploy(
  state: string,
  commitRef: string | null,
  context = "production",
  createdAt = DEPLOYED_AT,
) {
  return { state, commit_ref: commitRef, context, created_at: createdAt };
}

function postsDirectoryWith(posts: Record<string, string>): string {
  const directory = join(mkdtempSync(join(tmpdir(), "posts-")), "posts");
  mkdirSync(directory);
  for (const [file, frontmatter] of Object.entries(posts)) {
    writeFileSync(join(directory, file), `---\n${frontmatter}\n---\nbody\n`);
  }
  return directory;
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe("findLastDeploy", () => {
  it("returns the newest ready production deploy, skipping failures", () => {
    const deploys = [
      deploy("error", "ccc333"),
      deploy("ready", LIVE_SHA),
      deploy("ready", "old000"),
    ];
    expect(findLastDeploy(deploys)).toEqual({
      sha: LIVE_SHA,
      createdAt: DEPLOYED_AT,
    });
  });

  it("ignores non-production and commit-less deploys", () => {
    const deploys = [
      deploy("ready", "preview1", "deploy-preview"),
      deploy("ready", null),
    ];
    expect(findLastDeploy(deploys)).toBeNull();
  });

  it("returns null for an empty list", () => {
    expect(findLastDeploy([])).toBeNull();
  });
});

describe("fetchLastDeploy", () => {
  it("requests production deploys for the site with the bearer token", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse([deploy("ready", LIVE_SHA)]),
    );
    const lastDeploy = await fetchLastDeploy({
      siteId: SITE_ID,
      token: TOKEN,
      fetchImpl,
    });
    expect(lastDeploy?.sha).toBe(LIVE_SHA);
    const [url, options] = fetchImpl.mock.calls[0] as unknown as [
      string,
      { headers: Record<string, string> },
    ];
    expect(url).toContain(`/sites/${SITE_ID}/deploys?production=true`);
    expect(options.headers.Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it("throws a lookup error on auth failure", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 401));
    await expect(
      fetchLastDeploy({ siteId: SITE_ID, token: TOKEN, fetchImpl }),
    ).rejects.toThrow(LastDeployLookupError);
  });

  it("throws a lookup error on other HTTP failures", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 500));
    await expect(
      fetchLastDeploy({ siteId: SITE_ID, token: TOKEN, fetchImpl }),
    ).rejects.toThrow("HTTP 500");
  });
});

describe("findPostsDueSince", () => {
  const since = Date.parse(DEPLOYED_AT);

  it("lists a non-draft post dated between the last deploy and now", () => {
    const postsDirectory = postsDirectoryWith({
      "due.md": 'draft: false\ndate: "2026-11-21T09:00:00.000-08:00"',
      "old.md": 'draft: false\ndate: "2026-01-01T09:00:00.000-08:00"',
      "later.md": 'draft: false\ndate: "2026-12-25T09:00:00.000-08:00"',
    });
    expect(findPostsDueSince({ since, now: NOW, postsDirectory })).toEqual([
      "due.md",
    ]);
  });

  it("reads a date-only value as midnight Pacific", () => {
    // 2026-11-22 starts at 08:00 UTC, two hours after NOW.
    const postsDirectory = postsDirectoryWith({
      "tomorrow.md": "draft: false\ndate: 2026-11-22",
      "today.md": "draft: false\ndate: '2026-11-21'",
    });
    expect(findPostsDueSince({ since, now: NOW, postsDirectory })).toEqual([
      "today.md",
    ]);
  });

  it("ignores drafts and undated posts", () => {
    const postsDirectory = postsDirectoryWith({
      "draft.md": 'draft: true\ndate: "2026-11-21T09:00:00.000-08:00"',
      "undated.md": "draft: false\ntitle: Undated",
    });
    expect(findPostsDueSince({ since, now: NOW, postsDirectory })).toEqual([]);
  });
});

describe("decideDeploy", () => {
  const log = vi.fn();
  const quietPostsDirectory = postsDirectoryWith({
    "published.md": 'draft: false\ndate: "2026-01-01T09:00:00.000-08:00"',
  });
  const decide = (
    fetchImpl: typeof fetch,
    overrides: Record<string, unknown> = {},
  ) =>
    decideDeploy({
      siteId: SITE_ID,
      token: TOKEN,
      currentSha: NEW_SHA,
      fetchImpl,
      log,
      now: NOW,
      postsDirectory: quietPostsDirectory,
      ...overrides,
    });

  it("deploys an unchanged main when a scheduled post came due since the last deploy", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse([deploy("ready", NEW_SHA)]),
    );
    const postsDirectory = postsDirectoryWith({
      "scheduled.md": 'draft: false\ndate: "2026-11-21T09:00:00.000-08:00"',
    });
    expect(await decide(fetchImpl, { postsDirectory })).toEqual({
      deploy: true,
    });
  });

  it("deploys an unchanged main when the last deploy time is unreadable", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse([deploy("ready", NEW_SHA, "production", "not-a-date")]),
    );
    expect(await decide(fetchImpl)).toEqual({ deploy: true });
  });

  it("deploys an unchanged main when the posts can't be read", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse([deploy("ready", NEW_SHA)]),
    );
    expect(
      await decide(fetchImpl, { postsDirectory: "/nonexistent/posts" }),
    ).toEqual({ deploy: true });
  });

  it("skips when main is already the live commit", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse([deploy("ready", NEW_SHA)]),
    );
    expect(await decide(fetchImpl)).toEqual({ deploy: false });
  });

  it("deploys when main is ahead of the live commit, however old the commit", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse([deploy("ready", LIVE_SHA)]),
    );
    expect(await decide(fetchImpl)).toEqual({ deploy: true });
  });

  it("deploys when the most recent deploy failed but main is not live", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse([deploy("error", NEW_SHA), deploy("ready", LIVE_SHA)]),
    );
    expect(await decide(fetchImpl)).toEqual({ deploy: true });
  });

  it("deploys when there is no prior successful deploy", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse([]));
    expect(await decide(fetchImpl)).toEqual({ deploy: true });
  });

  it("deploys when the API errors", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 500));
    expect(await decide(fetchImpl)).toEqual({ deploy: true });
  });

  it("deploys when the network call rejects", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    });
    expect(await decide(fetchImpl)).toEqual({ deploy: true });
  });

  it("deploys without calling the API when config is missing", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    expect(await decide(fetchImpl, { siteId: undefined })).toEqual({
      deploy: true,
    });
    expect(await decide(fetchImpl, { token: "" })).toEqual({ deploy: true });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("main", () => {
  it("writes skip=false to GITHUB_OUTPUT when config is missing", async () => {
    const outputPath = join(mkdtempSync(join(tmpdir(), "deploy-")), "output");
    writeFileSync(outputPath, "");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await main({ GITHUB_OUTPUT: outputPath, CURRENT_SHA: NEW_SHA });
    logSpy.mockRestore();
    expect(readFileSync(outputPath, "utf8")).toBe("skip=false\n");
  });
});

describe("isMainModule", () => {
  it("is false when imported", () => {
    expect(isMainModule(undefined)).toBe(false);
    expect(isMainModule("/nonexistent/other.mjs")).toBe(false);
  });
});

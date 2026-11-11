import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { writeTopicFeeds } from "../../theme/utils/writeTopicFeeds";

let outDir = "";

afterEach(() => {
  rmSync(outDir, { recursive: true, force: true });
});

describe("writeTopicFeeds", () => {
  it("writes each feed to /topic/<slug>/feed.xml under the output dir", () => {
    outDir = mkdtempSync(join(tmpdir(), "topic-feeds-"));

    writeTopicFeeds(outDir, [
      { slug: "development", xml: "<rss>dev</rss>" },
      { slug: "ai", xml: "<rss>ai</rss>" },
    ]);

    expect(
      readFileSync(join(outDir, "topic/development/feed.xml"), "utf-8"),
    ).toBe("<rss>dev</rss>");
    expect(readFileSync(join(outDir, "topic/ai/feed.xml"), "utf-8")).toBe(
      "<rss>ai</rss>",
    );
  });
});

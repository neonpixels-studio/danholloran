import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import {
  expectedDistChecks,
  findDistProblems,
  findUnpublishedPostLeaks,
  NOT_FOUND_RECOVERY_LABEL,
  requireNonEmpty,
  requireText,
  type DistCheck,
} from "../../theme/utils/distArtifacts";
import { loadPublishedPosts } from "../../theme/utils/loadPublishedPosts";
import { buildNotFoundRecoveryHtml } from "../../theme/utils/notFoundRecovery";

const FIXTURE_POST = "posts/example.html";
const FIXTURE_TOPIC_FEED = "topic/example/feed.xml";
const FIXTURE_CHECKS: DistCheck[] = [
  { file: "feed.xml", inspect: requireText("<item>") },
  { file: FIXTURE_TOPIC_FEED, inspect: requireText("<rss") },
  { file: "sitemap.xml", inspect: requireText("<loc>") },
  { file: "llms.txt", inspect: requireNonEmpty },
  {
    file: "404.html",
    inspect: requireText(buildNotFoundRecoveryHtml(), NOT_FOUND_RECOVERY_LABEL),
  },
  { file: FIXTURE_POST, inspect: requireNonEmpty },
];

let outDir = "";

function writeDistFile(file: string, contents: string): void {
  const path = join(outDir, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

function validContents(file: string): string {
  if (file === "404.html") {
    return `<body>${buildNotFoundRecoveryHtml()}</body>`;
  }
  if (file === "sitemap.xml") {
    return "<urlset><url><loc>https://example.com/</loc></url></urlset>";
  }
  if (file === "feed.xml") {
    return "<rss><channel><item></item></channel></rss>";
  }
  if (file.endsWith("/feed.xml")) {
    return "<rss></rss>";
  }
  return "content";
}

function writeCompleteDist(): void {
  for (const check of FIXTURE_CHECKS) {
    writeDistFile(check.file, validContents(check.file));
  }
}

beforeEach(() => {
  outDir = mkdtempSync(join(tmpdir(), "dist-artifacts-"));
});

afterEach(() => {
  rmSync(outDir, { recursive: true, force: true });
});

describe("expectedDistChecks", () => {
  it("expects the core artifacts, a topic feed, and one page per published post", () => {
    const files = expectedDistChecks().map((check) => check.file);
    expect(files).toEqual(
      expect.arrayContaining([
        "feed.xml",
        "sitemap.xml",
        "llms.txt",
        "404.html",
      ]),
    );
    expect(files.some((file) => /^topic\/.+\/feed\.xml$/.test(file))).toBe(
      true,
    );
    for (const post of loadPublishedPosts()) {
      expect(files).toContain(`posts/${post.slug}.html`);
    }
  });
});

describe("expectedDistChecks inspectors", () => {
  function inspectorFor(file: string) {
    const check = expectedDistChecks().find(
      (candidate) => candidate.file === file,
    );
    expect(check, `${file} not in expectedDistChecks`).toBeDefined();
    return check!.inspect;
  }

  it("rejects an item-less feed.xml and a 404 without the recovery block", () => {
    expect(inspectorFor("feed.xml")("<rss></rss>")).not.toBeNull();
    expect(inspectorFor("404.html")("<body></body>")).not.toBeNull();
    expect(
      inspectorFor("404.html")(`<body>${buildNotFoundRecoveryHtml()}</body>`),
    ).toBeNull();
  });

  it("rejects an empty post page", () => {
    const [post] = loadPublishedPosts();
    const inspect = inspectorFor(`posts/${post.slug}.html`);
    expect(inspect(" \n")).not.toBeNull();
    expect(inspect("<html></html>")).toBeNull();
  });

  it("rejects a sitemap without <loc> and an empty llms.txt", () => {
    expect(inspectorFor("sitemap.xml")("<urlset></urlset>")).not.toBeNull();
    expect(inspectorFor("llms.txt")("")).not.toBeNull();
  });
});

describe("findDistProblems", () => {
  it("reports nothing for a complete output directory", () => {
    writeCompleteDist();
    expect(findDistProblems(outDir, FIXTURE_CHECKS)).toEqual([]);
  });

  it("reports every missing file when the directory is empty", () => {
    const problems = findDistProblems(outDir, FIXTURE_CHECKS);
    expect(problems).toHaveLength(FIXTURE_CHECKS.length);
    expect(problems).toContain("sitemap.xml is missing");
  });

  it.each(["llms.txt", "sitemap.xml", "feed.xml", "404.html"])(
    "reports %s when it is removed",
    (file) => {
      writeCompleteDist();
      rmSync(join(outDir, file));
      expect(findDistProblems(outDir, FIXTURE_CHECKS)).toEqual([
        `${file} is missing`,
      ]);
    },
  );

  it("reports a topic feed that was not written", () => {
    writeCompleteDist();
    rmSync(join(outDir, FIXTURE_TOPIC_FEED));
    expect(findDistProblems(outDir, FIXTURE_CHECKS)).toEqual([
      `${FIXTURE_TOPIC_FEED} is missing`,
    ]);
  });

  it("reports a topic feed that is not RSS", () => {
    writeCompleteDist();
    writeDistFile(FIXTURE_TOPIC_FEED, "");
    expect(findDistProblems(outDir, FIXTURE_CHECKS)).toEqual([
      `${FIXTURE_TOPIC_FEED} does not contain <rss`,
    ]);
  });

  it("reports a post page that was not built", () => {
    writeCompleteDist();
    rmSync(join(outDir, FIXTURE_POST));
    expect(findDistProblems(outDir, FIXTURE_CHECKS)).toEqual([
      `${FIXTURE_POST} is missing`,
    ]);
  });

  it("reports an empty post page", () => {
    writeCompleteDist();
    writeDistFile(FIXTURE_POST, "");
    expect(findDistProblems(outDir, FIXTURE_CHECKS)).toEqual([
      `${FIXTURE_POST} is empty`,
    ]);
  });

  it("reports a path that exists but is not a file", () => {
    writeCompleteDist();
    rmSync(join(outDir, FIXTURE_POST));
    mkdirSync(join(outDir, FIXTURE_POST));
    expect(findDistProblems(outDir, FIXTURE_CHECKS)).toEqual([
      `${FIXTURE_POST} is not a file`,
    ]);
  });

  it("reports a sitemap without any <loc>", () => {
    writeCompleteDist();
    writeDistFile("sitemap.xml", "<urlset></urlset>");
    expect(findDistProblems(outDir, FIXTURE_CHECKS)).toEqual([
      "sitemap.xml does not contain <loc>",
    ]);
  });

  it("reports an empty feed", () => {
    writeCompleteDist();
    writeDistFile("feed.xml", "<rss><channel></channel></rss>");
    expect(findDistProblems(outDir, FIXTURE_CHECKS)).toEqual([
      "feed.xml does not contain <item>",
    ]);
  });

  it("reports an empty llms.txt", () => {
    writeCompleteDist();
    writeDistFile("llms.txt", "  \n");
    expect(findDistProblems(outDir, FIXTURE_CHECKS)).toEqual([
      "llms.txt is empty",
    ]);
  });

  it("reports a 404 page without the recovery block", () => {
    writeCompleteDist();
    writeDistFile("404.html", "<body></body>");
    expect(findDistProblems(outDir, FIXTURE_CHECKS)).toEqual([
      `404.html does not contain ${NOT_FOUND_RECOVERY_LABEL}`,
    ]);
  });
});

describe("findUnpublishedPostLeaks", () => {
  const SCHEDULED = "scheduled-post";
  const SITE = "https://danholloran.me";

  function writeCleanDist(): void {
    writeDistFile("posts/published-post.html", "<html></html>");
    writeDistFile(
      "sitemap.xml",
      `<urlset><url><loc>${SITE}/posts/published-post</loc></url></urlset>`,
    );
    writeDistFile(
      "feed.xml",
      `<rss><item><link>${SITE}/posts/published-post</link></item></rss>`,
    );
    writeDistFile(FIXTURE_TOPIC_FEED, "<rss></rss>");
    writeDistFile("llms.txt", `- [Published](${SITE}/posts/published-post)`);
  }

  it("reports nothing when no unpublished post shipped", () => {
    writeCleanDist();
    expect(findUnpublishedPostLeaks(outDir, [SCHEDULED])).toEqual([]);
  });

  it("reports a built page for an unpublished post, since its URL must 404", () => {
    writeCleanDist();
    writeDistFile(`posts/${SCHEDULED}.html`, "<html></html>");
    expect(findUnpublishedPostLeaks(outDir, [SCHEDULED])).toEqual([
      `posts/${SCHEDULED}.html was built for unpublished post "${SCHEDULED}"`,
    ]);
  });

  it.each(["sitemap.xml", "feed.xml", "llms.txt", FIXTURE_TOPIC_FEED])(
    "reports an unpublished post linked from %s",
    (file) => {
      writeCleanDist();
      writeDistFile(file, `<loc>${SITE}/posts/${SCHEDULED}</loc>`);
      expect(findUnpublishedPostLeaks(outDir, [SCHEDULED])).toEqual([
        `${file} links unpublished post "${SCHEDULED}"`,
      ]);
    },
  );

  it("does not flag a published post whose slug only starts with the unpublished one", () => {
    writeCleanDist();
    writeDistFile(
      "sitemap.xml",
      `<loc>${SITE}/posts/${SCHEDULED}-part-two</loc>`,
    );
    expect(findUnpublishedPostLeaks(outDir, [SCHEDULED])).toEqual([]);
  });

  it("reports nothing for the real posts when no build output exists", () => {
    expect(findUnpublishedPostLeaks(outDir)).toEqual([]);
  });
});

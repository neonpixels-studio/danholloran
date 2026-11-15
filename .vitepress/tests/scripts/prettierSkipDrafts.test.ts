import { afterEach, describe, it, expect, vi } from "vitest";
import { parse } from "yaml";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isPublished } from "../../theme/utils/loadPublishedPosts";
import {
  buildPrettierArguments,
  findDraftPosts,
  main,
  toIgnorePatterns,
} from "../../../scripts/prettier-skip-drafts.mjs";

const scriptUrl = pathToFileURL(
  resolve(process.cwd(), "scripts/prettier-skip-drafts.mjs"),
).href;
const temporaryDirectories: string[] = [];

function makePostsDirectory(posts: Record<string, string>) {
  const directory = mkdtempSync(join(tmpdir(), "draft-posts-"));
  temporaryDirectories.push(directory);
  for (const [name, content] of Object.entries(posts)) {
    mkdirSync(join(directory, name, ".."), { recursive: true });
    writeFileSync(join(directory, name), content);
  }
  return directory;
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("findDraftPosts", () => {
  it("returns only posts with draft: true", () => {
    const directory = makePostsDirectory({
      "draft.md": "---\ndraft: true\ntitle: A\n---\n",
      "live.md": "---\ndraft: false\ntitle: B\n---\n",
      "plain.md": "---\ntitle: C\n---\n",
    });
    expect(findDraftPosts(directory)).toEqual([join(directory, "draft.md")]);
  });

  it("treats any truthy draft value as a draft, like the site", () => {
    const directory = makePostsDirectory({
      "quoted.md": '---\ndraft: "yes"\n---\n',
      "yes.md": "---\ndraft: yes\n---\n",
      "spaced.md": "---\ndraft:   true\n---\n",
      "commented.md": "---\ndraft: true # wip\n---\n",
      "crlf.md": "---\r\ndraft: true\r\n---\r\n",
      "null.md": "---\ndraft:\n---\n",
      "zero.md": "---\ndraft: 0\n---\n",
    });
    expect(findDraftPosts(directory)).toEqual([
      join(directory, "commented.md"),
      join(directory, "crlf.md"),
      join(directory, "quoted.md"),
      join(directory, "spaced.md"),
      join(directory, "yes.md"),
    ]);
  });

  it("agrees with the site's isPublished policy for every draft value", () => {
    const values = [
      "true",
      "false",
      "yes",
      "off",
      "no",
      '"false"',
      "0",
      "1",
      "",
      "[]",
    ];
    const posts = Object.fromEntries(
      values.map((value, index) => [
        `post-${index}.md`,
        `---\ndraft: ${value}\n---\n`,
      ]),
    );
    const directory = makePostsDirectory(posts);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const expected = values
      .map((value, index) => ({ value, index }))
      .filter(
        ({ value, index }) =>
          !isPublished({ draft: parse(value) }, `post-${index}.md`),
      )
      .map(({ index }) => join(directory, `post-${index}.md`))
      .sort();
    expect(findDraftPosts(directory)).toEqual(expected);
    expect(expected.length).toBeGreaterThan(0);
  });

  it("throws on malformed frontmatter, naming the file", () => {
    const directory = makePostsDirectory({ "bad.md": "---\ndraft: [\n---\n" });
    expect(() => findDraftPosts(directory)).toThrow(join(directory, "bad.md"));
  });

  it("loads under plain Node, outside the bundler", () => {
    const result = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", `import("${scriptUrl}")`],
      { encoding: "utf8" },
    );
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
  });

  it("ignores draft: true outside the frontmatter block", () => {
    const directory = makePostsDirectory({
      "body.md": "---\ntitle: A\n---\n\ndraft: true\n",
      "nofrontmatter.md": "draft: true\n",
    });
    expect(findDraftPosts(directory)).toEqual([]);
  });

  it("finds drafts in nested directories and ignores non-markdown files", () => {
    const directory = makePostsDirectory({
      "nested/draft.md": "---\ndraft: true\n---\n",
      "notes.txt": "draft: true\n",
    });
    expect(findDraftPosts(directory)).toEqual([
      join(directory, "nested", "draft.md"),
    ]);
  });

  it("returns an empty list when there are no drafts", () => {
    const directory = makePostsDirectory({ "live.md": "---\ntitle: B\n---\n" });
    expect(findDraftPosts(directory)).toEqual([]);
  });

  it("throws when the directory does not exist", () => {
    expect(() => findDraftPosts("/nonexistent/posts-directory")).toThrow(
      /ENOENT/,
    );
  });
});

describe("toIgnorePatterns", () => {
  it("roots each path at the repository directory", () => {
    expect(
      toIgnorePatterns(["posts/a.md", "/repo/posts/b.md"], "/repo"),
    ).toEqual(["/posts/a.md", "/posts/b.md"]);
  });
});

describe("buildPrettierArguments", () => {
  it("keeps .gitignore and .prettierignore alongside the draft ignore file", () => {
    expect(buildPrettierArguments("drafts.ignore", ["--check", "."])).toEqual([
      "--check",
      ".",
      "--ignore-path",
      ".gitignore",
      "--ignore-path",
      ".prettierignore",
      "--ignore-path",
      "drafts.ignore",
    ]);
  });
});

const FORMATTED_POST = "---\ntitle: Live\n---\n\nBody.\n";
const UNFORMATTED_POST = "---\ntitle:   Bad\n---\n\n*  Body\n";

function makeRepository(posts: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), "draft-repo-"));
  temporaryDirectories.push(root);
  writeFileSync(join(root, ".prettierignore"), "node_modules\n");
  mkdirSync(join(root, "posts"));
  for (const [name, content] of Object.entries(posts)) {
    writeFileSync(join(root, "posts", name), content);
  }
  return root;
}

function runMain(root: string) {
  return main(["--check", "."], {
    rootDirectory: root,
    postsDirectory: join(root, "posts"),
  });
}

function leftoverIgnoreFiles(root: string) {
  return readdirSync(root).filter((name) => name.includes("drafts-"));
}

describe("main", () => {
  it("skips unformatted drafts and removes its ignore file", () => {
    const root = makeRepository({
      "draft.md": `---\ndraft: true\n---\n\n*  Body\n`,
      "live.md": FORMATTED_POST,
    });
    expect(runMain(root)).toBe(0);
    expect(leftoverIgnoreFiles(root)).toEqual([]);
  });

  it("still fails for an unformatted non-draft post", () => {
    const root = makeRepository({
      "draft.md": `---\ndraft: true\n---\n\n*  Body\n`,
      "live.md": UNFORMATTED_POST,
    });
    expect(runMain(root)).toBe(1);
    expect(leftoverIgnoreFiles(root)).toEqual([]);
  });

  it("throws when the posts directory is missing", () => {
    const root = makeRepository({});
    expect(() =>
      main(["--check", "."], {
        rootDirectory: root,
        postsDirectory: join(root, "missing"),
      }),
    ).toThrow(/ENOENT/);
  });
});

import { afterEach, describe, it, expect } from "vitest";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildPrettierArguments,
  findDraftPosts,
  main,
  toIgnorePatterns,
} from "../../../scripts/prettier-skip-drafts.mjs";

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

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs", () => {
  const readdirSync = vi.fn();
  const readFileSync = vi.fn();
  return { default: { readdirSync, readFileSync }, readdirSync, readFileSync };
});

vi.mock("../../theme/utils/frontmatter", () => ({
  parseFrontmatter: vi.fn(),
}));

import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "../../theme/utils/frontmatter";
import postsPaths from "../../../posts/[slug].paths";

const mockReaddirSync = vi.mocked(fs.readdirSync);
const mockReadFileSync = vi.mocked(fs.readFileSync);
const mockParseFrontmatter = vi.mocked(parseFrontmatter);

function generatedSlugs(): string[] {
  return postsPaths.paths().map((entry) => entry.params.slug);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockReadFileSync.mockReturnValue("" as any);
});

describe("posts/[slug].paths", () => {
  it("excludes draft posts from the generated routes", () => {
    mockReaddirSync.mockReturnValue(["published.md", "draft.md"] as any);
    mockParseFrontmatter
      .mockReturnValueOnce({ data: { title: "Published" }, content: "" })
      .mockReturnValueOnce({
        data: { title: "Draft", draft: true },
        content: "",
      });

    expect(generatedSlugs()).toEqual(["published"]);
    // Pins the loader to the content posts directory it declares, so the read
    // path can't silently drift away from where the posts actually live.
    expect(mockReadFileSync).toHaveBeenCalledWith(
      path.join("./.vitepress/content/posts", "published.md"),
      "utf-8",
    );
  });

  it("treats a truthy non-boolean draft as a draft and warns with the file", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockReaddirSync.mockReturnValue(["typo.md"] as any);
    mockParseFrontmatter.mockReturnValueOnce({
      data: { title: "Typo", draft: "false" },
      content: "",
    });

    expect(generatedSlugs()).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/typo\.md.*treating the post as a draft/),
    );

    warnSpy.mockRestore();
  });

  it("publishes a post with a falsy non-boolean draft but warns", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockReaddirSync.mockReturnValue(["bare.md"] as any);
    mockParseFrontmatter.mockReturnValueOnce({
      data: { title: "Bare", draft: null },
      content: "",
    });

    expect(generatedSlugs()).toEqual(["bare"]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/bare\.md.*treating the post as published/),
    );

    warnSpy.mockRestore();
  });

  it("throws an error naming the file when a post cannot be read", () => {
    mockReaddirSync.mockReturnValue(["broken.md"] as any);
    mockReadFileSync.mockImplementation(() => {
      throw new Error("ENOENT");
    });

    expect(() => postsPaths.paths()).toThrow(/broken\.md/);
  });

  it("generates a route for every published post", () => {
    mockReaddirSync.mockReturnValue(["first.md", "second.md"] as any);
    mockParseFrontmatter
      .mockReturnValueOnce({ data: { title: "First" }, content: "" })
      .mockReturnValueOnce({
        data: { title: "Second", draft: false },
        content: "",
      });

    expect(generatedSlugs()).toEqual(["first", "second"]);
  });

  it("skips non-markdown files without parsing them", () => {
    mockReaddirSync.mockReturnValue(["real-post.md", "notes.txt"] as any);
    mockParseFrontmatter.mockReturnValueOnce({
      data: { title: "Real" },
      content: "",
    });

    expect(generatedSlugs()).toEqual(["real-post"]);
    expect(mockParseFrontmatter).toHaveBeenCalledTimes(1);
  });
});

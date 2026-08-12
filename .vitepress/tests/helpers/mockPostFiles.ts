import { readdirSync } from "fs";
import { vi } from "vitest";
import { parseFrontmatter } from "../../theme/utils/frontmatter";

// Shared across every test that drives the frontmatter loaders (the feed,
// llms.txt, the sitemap, loadPublishedPosts itself). Registers a posts
// directory listing plus the frontmatter — and optionally the markdown body —
// each file resolves to, in the order the loader will read them. Relies on the
// caller's `vi.mock("fs")` and `vi.mock(".../frontmatter")`, and on the caller
// stubbing `readFileSync` itself (the loader reads raw file text but the
// frontmatter comes from the mocked `parseFrontmatter`, so its content is
// irrelevant here).
export function mockPostFiles(
  files: string[],
  frontmatters: Record<string, unknown>[],
  bodies: string[] = [],
): void {
  vi.mocked(readdirSync).mockReturnValue(files as any);
  frontmatters.forEach((data, index) => {
    vi.mocked(parseFrontmatter).mockReturnValueOnce({
      data,
      content: bodies[index] ?? "",
    });
  });
}

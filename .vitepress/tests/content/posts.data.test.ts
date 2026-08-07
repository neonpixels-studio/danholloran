import { describe, it, expect, vi, beforeAll } from "vitest";
import {
  POSTS_GLOB,
  transformPosts,
} from "../../content/posts/transformPosts.ts";

// createContentLoader is provided by vitepress at build time; capture the
// config object the loader module hands it so its options can be asserted.
let capturedPattern: string;
let capturedConfig: {
  includeSrc?: boolean;
  render?: boolean;
  excerpt?: boolean;
  transform: (_data: unknown[]) => unknown[];
};

vi.mock("vitepress", () => ({
  createContentLoader: (pattern: string, config: typeof capturedConfig) => {
    capturedPattern = pattern;
    capturedConfig = config;
    return { watch: [], load: () => [] };
  },
}));

describe("posts.data.ts list loader", () => {
  beforeAll(async () => {
    await import("../../content/posts/posts.data.ts");
  });

  it("registers the shared posts glob and shared transform with createContentLoader", () => {
    expect(capturedPattern).toBe(POSTS_GLOB);
    expect(capturedConfig.transform).toBe(transformPosts);
  });

  it("runs with render:false so Home and the blog index ship no rendered html", () => {
    expect(capturedConfig.render).toBe(false);
    expect(capturedConfig.includeSrc).toBe(true);
    expect(capturedConfig).not.toHaveProperty("excerpt");
  });
});

import { describe, it, expect, vi, beforeAll } from "vitest";
import {
  INSTAGRAM_GLOB,
  transformInstagram,
} from "../../content/instagram/transformInstagram.ts";

// createContentLoader is provided by vitepress at build time; capture the
// config object the loader module hands it so its options can be asserted.
let capturedPattern: string;
let capturedConfig: {
  transform: (_data: unknown[]) => unknown[];
};

vi.mock("vitepress", () => ({
  createContentLoader: (pattern: string, config: typeof capturedConfig) => {
    capturedPattern = pattern;
    capturedConfig = config;
    return { watch: [], load: () => [] };
  },
}));

describe("instagram.data.ts list loader", () => {
  beforeAll(async () => {
    await import("../../content/instagram/instagram.data.ts");
  });

  it("registers the shared instagram glob and shared transform with createContentLoader", () => {
    expect(capturedPattern).toBe(INSTAGRAM_GLOB);
    expect(capturedConfig.transform).toBe(transformInstagram);
  });
});

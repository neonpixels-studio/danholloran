import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PageData } from "vitepress";
import { mockPosts } from "../__fixtures__/mockData";
import { POSTS_GLOB } from "../../content/posts/transformPosts.ts";

type LoaderOptions = {
  includeSrc?: boolean;
  render?: boolean;
  excerpt?: boolean;
  transform: (_data: unknown[]) => unknown[];
};

const loaderMock = vi.hoisted(() => ({
  pattern: "",
  options: null as LoaderOptions | null,
  load: vi.fn(),
}));

vi.mock("vitepress", () => ({
  createContentLoader: (pattern: string, options: LoaderOptions) => {
    loaderMock.pattern = pattern;
    loaderMock.options = options;
    return { watch: [], load: loaderMock.load };
  },
}));

// Re-imported per test so the module-level loader and cache start empty.
async function importModule() {
  return import("../../content/posts/postPageData.ts");
}

function buildPageData(
  filePath: string,
  params?: Record<string, unknown>,
): PageData {
  return {
    filePath,
    relativePath: filePath,
    title: "",
    description: "",
    headers: [],
    frontmatter: {},
    params,
  };
}

describe("postPageData", () => {
  beforeEach(() => {
    vi.resetModules();
    loaderMock.options = null;
    loaderMock.load.mockReset();
    loaderMock.load.mockResolvedValue(mockPosts);
  });

  it("loads with the shared glob and transform, render:false, and no excerpt", async () => {
    const { loadPosts } = await importModule();
    // Imported after resetModules so it's the same instance postPageData got.
    const { transformPosts } =
      await import("../../content/posts/transformPosts.ts");
    await loadPosts();

    expect(loaderMock.pattern).toBe(POSTS_GLOB);
    expect(loaderMock.options?.transform).toBe(transformPosts);
    expect(loaderMock.options?.render).toBe(false);
    expect(loaderMock.options?.includeSrc).toBe(true);
    expect(loaderMock.options).not.toHaveProperty("excerpt");
  });

  it("loads the posts once across pages while no post file changes", async () => {
    const { attachPostPageData } = await importModule();
    await attachPostPageData(buildPageData("posts/index.md"));
    await attachPostPageData(buildPageData("index.md"));

    expect(loaderMock.load).toHaveBeenCalledTimes(1);
  });

  it("gives an archive route only its own filtered slice, keeping its params", async () => {
    const { attachPostPageData } = await importModule();
    const pageData = buildPageData("posts/topic/[topic].md", {
      topic: "development",
      page: "1",
    });
    await attachPostPageData(pageData);

    expect(pageData.params?.topic).toBe("development");
    expect(
      pageData.params?.archive.posts.map(
        (post: (typeof mockPosts)[number]) => post.frontmatter.slug,
      ),
    ).toEqual(["first-post"]);
  });

  it("creates params for the unfiltered posts index", async () => {
    const { attachPostPageData } = await importModule();
    const pageData = buildPageData("posts/index.md");
    await attachPostPageData(pageData);

    expect(pageData.params?.archive.posts).toHaveLength(mockPosts.length);
  });

  it("gives a post page the post and its neighbors", async () => {
    const { attachPostPageData } = await importModule();
    const pageData = buildPageData("posts/[slug].md", { slug: "second-post" });
    await attachPostPageData(pageData);

    expect(pageData.params?.postNeighbors.post.frontmatter.slug).toBe(
      "second-post",
    );
    expect(pageData.params?.postNeighbors.nextPost.frontmatter.slug).toBe(
      "first-post",
    );
  });

  it("gives the home page its latest posts", async () => {
    const { attachPostPageData } = await importModule();
    const pageData = buildPageData("index.md");
    await attachPostPageData(pageData);

    expect(pageData.params?.home.latestPosts).toHaveLength(mockPosts.length);
  });

  it("leaves pages that don't list posts untouched and unloaded", async () => {
    const { attachPostPageData } = await importModule();
    const pageData = buildPageData("resume.md");
    await attachPostPageData(pageData);

    expect(pageData.params).toBeUndefined();
    expect(loaderMock.load).not.toHaveBeenCalled();
  });
});

describe("refreshPostPagesInDev", () => {
  function startPlugin() {
    let onChange: (_event: string, _file: string) => void = () => {};
    const pageModule = { id: "page" };
    const scriptModule = { id: "script" };
    const server = {
      watcher: {
        on: (_event: "all", listener: typeof onChange) => {
          onChange = listener;
        },
      },
      moduleGraph: {
        idToModuleMap: new Map<string, unknown>([
          ["/site/posts/index.md", pageModule],
          ["/site/theme/index.ts", scriptModule],
        ]),
        invalidateModule: vi.fn(),
      },
    };
    return {
      server,
      pageModule,
      fire: (file: string) => onChange("change", file),
    };
  }

  it("invalidates page modules when a post file changes", async () => {
    const { refreshPostPagesInDev } = await importModule();
    const { POSTS_DIR } = await import("@utils/loadPublishedPosts");
    const { server, pageModule, fire } = startPlugin();
    refreshPostPagesInDev().configureServer(server);

    fire(`${POSTS_DIR}/some-post.md`);

    expect(server.moduleGraph.invalidateModule).toHaveBeenCalledTimes(1);
    expect(server.moduleGraph.invalidateModule).toHaveBeenCalledWith(
      pageModule,
    );
  });

  it("ignores changes to files that aren't posts", async () => {
    const { refreshPostPagesInDev } = await importModule();
    const { server, fire } = startPlugin();
    refreshPostPagesInDev().configureServer(server);

    fire("/site/theme/style.css");

    expect(server.moduleGraph.invalidateModule).not.toHaveBeenCalled();
  });
});

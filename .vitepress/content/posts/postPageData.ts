import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createContentLoader, type PageData } from "vitepress";
import type { Post } from "@typedefs";
import { POSTS_DIR } from "../../theme/utils/loadPublishedPosts";
import {
  buildArchiveView,
  buildHomePosts,
  findPostNeighbors,
} from "../../theme/utils/postViews";
import { POSTS_GLOB, transformPosts } from "./transformPosts";

// Every page that lists posts used to import a `posts.data.ts` loader, which
// bundled every post's metadata into one shared chunk that grew with each new
// post and dragged down Lighthouse on /posts/ and every post page. Instead this
// runs from transformPageData at build (and dev) time and writes only what one
// page renders into that page's own `params`, which VitePress serializes into
// the page's chunk.

const MARKDOWN_EXTENSION = ".md";

const ARCHIVE_FILES = new Set([
  "posts/index.md",
  "posts/page/[page].md",
  "posts/topic/[topic].md",
  "posts/topic/[topic]/page/[page].md",
  "posts/tag/[tag].md",
  "posts/tag/[tag]/page/[page].md",
]);
const HOME_FILE = "index.md";
const POST_FILE = "posts/[slug].md";

type PostsLoader = { load: () => Promise<Post[]> };

let loader: PostsLoader | null = null;
let cached: { fingerprint: string; posts: Promise<Post[]> } | null = null;

// createContentLoader throws until VitePress has resolved its config, so it
// can't run at import time from config.ts; create it on first use instead.
function postsLoader(): PostsLoader {
  loader ??= createContentLoader(POSTS_GLOB, {
    // includeSrc is needed only so `transform` can compute readTime; src
    // itself is stripped before the payload leaves `transform`.
    includeSrc: true,
    render: false,
    transform: transformPosts,
  });
  return loader;
}

// transformPageData runs once per page (~1600 at build), and each load()
// re-globs and re-runs transformPosts over every post. Names plus mtimes are
// enough to tell when a reload is needed, including in dev after an edit.
function postsFingerprint(): string {
  return readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(MARKDOWN_EXTENSION))
    .map((file) => `${file}:${statSync(join(POSTS_DIR, file)).mtimeMs}`)
    .join("|");
}

export function loadPosts(): Promise<Post[]> {
  const fingerprint = postsFingerprint();
  if (cached?.fingerprint === fingerprint) {
    return cached.posts;
  }
  cached = { fingerprint, posts: postsLoader().load() };
  return cached.posts;
}

function pageParams(pageData: PageData): Record<string, unknown> {
  pageData.params ??= {};
  return pageData.params;
}

export async function attachPostPageData(pageData: PageData): Promise<void> {
  const { filePath } = pageData;
  if (ARCHIVE_FILES.has(filePath)) {
    const params = pageParams(pageData);
    params.archive = buildArchiveView(await loadPosts(), {
      topic: params.topic as string | undefined,
      tag: params.tag as string | undefined,
      page: params.page,
    });
    return;
  }
  if (filePath === POST_FILE) {
    const params = pageParams(pageData);
    params.postNeighbors = findPostNeighbors(
      await loadPosts(),
      String(params.slug),
    );
    return;
  }
  if (filePath === HOME_FILE) {
    pageParams(pageData).home = buildHomePosts(await loadPosts());
  }
}

// The slice of Vite's dev server the plugin below touches, typed structurally
// for the same reason config.ts casts the tailwind plugin: vite's own types and
// the copy vitepress bundles don't line up.
type DevServer = {
  watcher: {
    on(
      _event: "all",
      _listener: (_event: string, _file: string) => void,
    ): unknown;
  };
  moduleGraph: {
    idToModuleMap: Map<string, unknown>;
    invalidateModule(_module: unknown): void;
  };
};

function isPostFile(file: string): boolean {
  return file.startsWith(POSTS_DIR) && file.endsWith(MARKDOWN_EXTENSION);
}

// Dev only. A post edit changes other pages' injected data (archive slices,
// home, a neighbor's prev/next link) without changing their markdown, so Vite
// would keep serving them stale. Invalidating every page module on a post
// change makes the reload VitePress already triggers re-run transformPageData.
// Pairs with `markdown.cache: false` in config.ts, since VitePress otherwise
// caches the transform by the page's own source text.
export function refreshPostPagesInDev() {
  return {
    name: "refresh-post-pages-in-dev",
    configureServer(server: DevServer) {
      server.watcher.on("all", (_event, file) => {
        if (!isPostFile(file)) {
          return;
        }
        for (const [id, module] of server.moduleGraph.idToModuleMap) {
          if (id.endsWith(MARKDOWN_EXTENSION)) {
            server.moduleGraph.invalidateModule(module);
          }
        }
      });
    },
  };
}

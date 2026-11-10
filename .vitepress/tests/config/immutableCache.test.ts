import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, it, expect } from "vitest";
import fingerprints from "../../data/imageVariantsManifest.json";
import {
  IMAGE_VARIANTS_DIR,
  imageVersionFor,
  resolveResponsiveImageSources,
} from "../../theme/utils/responsiveImage";
import { DEFAULT_IMAGE_VARIANT_PATHS } from "../../theme/utils/imageVariantManifest";

const ROOT = process.cwd();
const HEADERS_PATH = resolve(ROOT, "public/_headers");
const PUBLIC_DIR = resolve(ROOT, "public");
// Hashed by Vite at build time, so not part of the /public versioning rule.
const VITE_HASHED_PREFIX = "/assets/";

interface HeaderRule {
  path: string;
  cacheControl: string;
}

function parseCacheRules(headers: string): HeaderRule[] {
  return headers.split("\n\n").flatMap((block) => {
    const lines = block.split("\n").filter((line) => line.trim().length);
    const path = lines.find((line) => line.startsWith("/"));
    const cacheControl = lines.find((line) =>
      line.trim().toLowerCase().startsWith("cache-control:"),
    );
    if (!path || !cacheControl) {
      return [];
    }
    return [{ path, cacheControl: cacheControl.trim().toLowerCase() }];
  });
}

function immutableRules(): HeaderRule[] {
  const headers = readFileSync(HEADERS_PATH, "utf8");
  return parseCacheRules(headers).filter((rule) =>
    rule.cacheControl.includes("immutable"),
  );
}

function ruleDirectory(rule: HeaderRule): string {
  return rule.path.replace(/\*$/, "");
}

function pathsOverlap(first: string, second: string): boolean {
  return first.startsWith(second) || second.startsWith(first);
}

describe("immutable cache headers", () => {
  it("only mark paths immutable that are Vite-hashed or carry a ?v= content version", () => {
    const allowedPrefixes = [VITE_HASHED_PREFIX, `${IMAGE_VARIANTS_DIR}/`];
    const rules = immutableRules();

    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      expect(allowedPrefixes, rule.path).toContain(ruleDirectory(rule));
    }
  });

  it("never overlap a rule with another cache-control rule (Netlify concatenates matching values)", () => {
    const headers = readFileSync(HEADERS_PATH, "utf8");
    const rules = parseCacheRules(headers);
    const overlaps = rules.flatMap((rule, index) =>
      rules
        .slice(index + 1)
        .filter((other) =>
          pathsOverlap(ruleDirectory(rule), ruleDirectory(other)),
        )
        .map((other) => `${rule.path} vs ${other.path}`),
    );

    expect(overlaps).toEqual([]);
  });

  it("keeps the immutable variants directory out of /images, which revalidates", () => {
    expect(IMAGE_VARIANTS_DIR.startsWith("/images")).toBe(false);
    expect(existsSync(join(PUBLIC_DIR, IMAGE_VARIANTS_DIR))).toBe(true);
    expect(DEFAULT_IMAGE_VARIANT_PATHS.outputDir).toBe(
      join(PUBLIC_DIR, IMAGE_VARIANTS_DIR),
    );
  });

  it("does not leave any immutable-cached variant url without a version in shipped source", () => {
    const sourceRoots = [".vitepress/theme", ".vitepress/content", "posts"];
    const unversioned = sourceRoots
      .map((root) => resolve(ROOT, root))
      .filter((root) => existsSync(root))
      .flatMap((root) =>
        (readdirSync(root, { recursive: true }) as string[]).map((entry) =>
          join(root, entry),
        ),
      )
      .filter((file) => /\.(vue|md|ts)$/.test(file))
      .filter((file) => !file.includes("responsiveImage.ts"))
      .filter((file) => {
        const contents = readFileSync(file, "utf8");
        return contents.includes(`${IMAGE_VARIANTS_DIR}/`);
      });

    expect(unversioned).toEqual([]);
  });

  it("serves every committed variant from a versioned url that exists on disk", () => {
    const urls = Object.keys(fingerprints).flatMap((fileName) =>
      (["thumb", "hero"] as const).flatMap((variant) => {
        const src = `/images/posts/${fileName}`;
        const version = imageVersionFor(src, fingerprints);
        if (version === null) {
          throw new Error(`${fileName} has no variant version`);
        }
        const sources = resolveResponsiveImageSources(src, variant, version);
        return [sources.avifSrcset, sources.webpSrcset]
          .flatMap((srcset) => srcset.split(", "))
          .map((candidate) => candidate.split(" ")[0]);
      }),
    );

    expect(urls.length).toBeGreaterThan(0);
    const problems = urls.filter((url) => {
      const [path, query] = url.split("?");
      return (
        !/^v=[0-9a-f]{10}$/.test(query ?? "") ||
        !existsSync(join(PUBLIC_DIR, decodeURIComponent(path)))
      );
    });
    expect(problems).toEqual([]);
  });

  it("has the Image Variants workflow commit the directory the variants are written to", () => {
    const workflow = readFileSync(
      resolve(ROOT, ".github/workflows/image-variants.yml"),
      "utf8",
    );

    expect(workflow).toContain(`git add public${IMAGE_VARIANTS_DIR}`);
  });
});

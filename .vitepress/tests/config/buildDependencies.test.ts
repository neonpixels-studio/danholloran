import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

// Packages needed to build the site with `vitepress build`: `.vitepress/config.ts`
// imports vitepress, @tailwindcss/vite, plist, feed, yaml, and minisearch (directly
// or via the theme utils it calls in `buildEnd`), and the theme CSS imports
// tailwindcss. Because they are used at build time, the project's dependency audit
// (`fallow audit`) requires them in `dependencies`, and a production-style install
// (`npm ci --omit=dev`) must still install them. This test fails if one of these
// declared packages regresses back to `devDependencies`; a brand-new build-time
// import that lands in `devDependencies` is caught by `fallow audit`, not here.
// Paths resolve from `process.cwd()` (the repo root vitest runs in), matching
// generateFeed.ts and sitemap.ts.
const BUILD_TIME_DEPENDENCIES = [
  "@tailwindcss/vite",
  "feed",
  "minisearch",
  "plist",
  "tailwindcss",
  "vitepress",
  "yaml",
];

// `vue` is a build-time import too, but is intentionally undeclared and consumed
// via vitepress's transitive copy (see `.fallowrc.json` `ignoreDependencies`), so
// it has no manifest edge to assert. Its lockfile node still exists and must
// survive `--omit=dev`, so the per-node check below covers it even though the
// manifest checks cannot.
const BUILD_TIME_LOCKFILE_NODES = [...BUILD_TIME_DEPENDENCIES, "vue"];

type DependencyManifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function readJsonFromRoot(fileName: string): unknown {
  const filePath = join(process.cwd(), fileName);
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readPackageJson(): DependencyManifest {
  return readJsonFromRoot("package.json") as DependencyManifest;
}

type LockfilePackageEntry = {
  dev?: boolean;
};

function readLockfilePackages(): Record<
  string,
  LockfilePackageEntry & DependencyManifest
> {
  const lockfile = readJsonFromRoot("package-lock.json") as {
    packages?: Record<string, LockfilePackageEntry & DependencyManifest>;
  };
  if (!lockfile.packages) {
    throw new Error(
      "package-lock.json has no `packages` block (lockfile v2+ required)",
    );
  }
  return lockfile.packages;
}

// The lockfile's `packages[""]` block mirrors package.json's dependency edges;
// asserting against it catches a lockfile left stale relative to package.json
// (hand-edited, `npm install` never re-run).
function readLockfileRootManifest(): DependencyManifest {
  const rootManifest = readLockfilePackages()[""];
  if (!rootManifest) {
    throw new Error(
      'package-lock.json is missing its root `packages[""]` entry',
    );
  }
  return rootManifest;
}

function describePlacement(describeName: string, manifest: DependencyManifest) {
  describe(describeName, () => {
    it.each(BUILD_TIME_DEPENDENCIES)("declares %s in dependencies", (name) => {
      expect(Object.keys(manifest.dependencies ?? {})).toContain(name);
    });

    it.each(BUILD_TIME_DEPENDENCIES)(
      "does not declare %s in devDependencies",
      (name) => {
        expect(Object.keys(manifest.devDependencies ?? {})).not.toContain(name);
      },
    );
  });
}

describePlacement(
  "package.json build-time dependency placement",
  readPackageJson(),
);
describePlacement(
  "package-lock.json build-time dependency placement",
  readLockfileRootManifest(),
);

// `npm ci --omit=dev` prunes each installed node whose lockfile entry is flagged
// `dev: true`, independent of the root edges checked above. This asserts on the
// exact mechanism the production install uses, catching a lockfile that lists a
// package as a root dependency yet still marks its node dev-only. (`devOptional`
// nodes survive `--omit=dev`, so they are not a failure condition here.) Covers
// `vue`, whose node the manifest checks cannot reach.
describe("package-lock.json build-time entries survive --omit=dev", () => {
  const lockfilePackages = readLockfilePackages();

  it.each(BUILD_TIME_LOCKFILE_NODES)(
    "does not flag %s as dev-only",
    (packageName) => {
      const entry = lockfilePackages[`node_modules/${packageName}`];
      expect(entry).toBeDefined();
      expect(entry.dev).not.toBe(true);
    },
  );
});

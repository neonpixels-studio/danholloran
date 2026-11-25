import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const sentryVitePlugin = vi.hoisted(() =>
  vi.fn(() => ({ name: "sentry-vite-plugin" })),
);

vi.mock("@sentry/vite-plugin", () => ({ sentryVitePlugin }));

import {
  findSourceMaps,
  isSourceMapUploadConfigured,
  removeSourceMaps,
  sourceMapPlugins,
} from "@utils/sourceMaps";

const FULL_ENV = {
  SENTRY_AUTH_TOKEN: "token",
  SENTRY_ORG: "org",
  SENTRY_PROJECT: "project",
};
const directories: string[] = [];

function makeOutput(files: string[]) {
  const directory = mkdtempSync(join(tmpdir(), "source-maps-"));
  directories.push(directory);
  files.forEach((file) => {
    mkdirSync(join(directory, file, ".."), { recursive: true });
    writeFileSync(join(directory, file), "x");
  });
  return directory;
}

function listFiles(directory: string): string[] {
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      join(entry.parentPath, entry.name).slice(directory.length + 1),
    )
    .sort();
}

afterEach(() => {
  directories
    .splice(0)
    .forEach((directory) =>
      rmSync(directory, { recursive: true, force: true }),
    );
});

describe("isSourceMapUploadConfigured", () => {
  it("is true only when all three variables are set", () => {
    expect(isSourceMapUploadConfigured(FULL_ENV)).toBe(true);
    Object.keys(FULL_ENV).forEach((name) => {
      expect(isSourceMapUploadConfigured({ ...FULL_ENV, [name]: "" })).toBe(
        false,
      );
    });
    expect(isSourceMapUploadConfigured({})).toBe(false);
  });
});

describe("sourceMapPlugins", () => {
  it("only generates hidden maps without credentials", () => {
    const plugins = sourceMapPlugins({});
    expect(plugins.map((plugin) => plugin.name)).toEqual([
      "hidden-source-maps",
    ]);
  });

  it("adds the Sentry upload, configured from the three variables", () => {
    const names = sourceMapPlugins(FULL_ENV).map((plugin) => plugin.name);
    expect(names).toEqual(["hidden-source-maps", "sentry-vite-plugin"]);
    expect(sentryVitePlugin).toHaveBeenCalledWith(
      expect.objectContaining({
        authToken: "token",
        org: "org",
        project: "project",
        release: { create: false, finalize: false, inject: false },
      }),
    );
  });

  it("never builds the upload without all three variables", () => {
    sentryVitePlugin.mockClear();
    sourceMapPlugins({ ...FULL_ENV, SENTRY_ORG: undefined });
    expect(sentryVitePlugin).not.toHaveBeenCalled();
  });

  it("keeps every plugin off the server-render build", () => {
    sourceMapPlugins(FULL_ENV).forEach((plugin) => {
      const apply = plugin.apply as (
        _config: object,
        _env: { command: string; isSsrBuild: boolean },
      ) => boolean;
      expect(apply({}, { command: "build", isSsrBuild: true })).toBe(false);
    });
  });

  it("applies to the client build only", () => {
    const [plugin] = sourceMapPlugins({});
    const apply = plugin.apply as (
      _config: object,
      _env: { command: string; isSsrBuild?: boolean },
    ) => boolean;
    expect(apply({}, { command: "build", isSsrBuild: false })).toBe(true);
    expect(apply({}, { command: "build", isSsrBuild: true })).toBe(false);
    expect(apply({}, { command: "serve" })).toBe(false);
  });

  it("asks for hidden source maps", () => {
    const [plugin] = sourceMapPlugins({});
    const config = plugin.config as () => { build: { sourcemap: string } };
    expect(config().build.sourcemap).toBe("hidden");
  });
});

describe("removeSourceMaps", () => {
  it("deletes every bundle map, nested ones included, and nothing else", () => {
    const directory = makeOutput([
      "assets/app.js",
      "assets/app.js.map",
      "assets/chunks/theme.js.map",
      "assets/style.css.map",
      "data/places.map",
      "index.html",
    ]);
    expect(removeSourceMaps(directory)).toEqual([
      join("assets", "app.js.map"),
      join("assets", "chunks", "theme.js.map"),
      join("assets", "style.css.map"),
    ]);
    expect(findSourceMaps(directory)).toEqual([]);
    expect(listFiles(directory)).toEqual([
      join("assets", "app.js"),
      join("data", "places.map"),
      "index.html",
    ]);
  });
});

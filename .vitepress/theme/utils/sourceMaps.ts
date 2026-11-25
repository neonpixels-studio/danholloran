import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import type { UserConfig } from "vitepress";

// Only the maps Vite emits for bundles, so an unrelated .map file (a data file
// in public/, say) is left alone.
const SOURCE_MAP_SUFFIXES = [".js.map", ".css.map"];
export const SENTRY_UPLOAD_VARIABLES = [
  "SENTRY_AUTH_TOKEN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
] as const;
export const UPLOAD_SKIPPED_MESSAGE = `Source map upload skipped: set ${SENTRY_UPLOAD_VARIABLES.join(", ")} to enable it.`;

// vite is not a direct dependency; take the plugin type from vitepress's copy,
// the one `vite.plugins` in the config expects.
type Plugin = Extract<
  NonNullable<NonNullable<UserConfig["vite"]>["plugins"]>[number],
  { name: string }
>;
type Environment = Record<string, string | undefined>;

export function isSourceMapUploadConfigured(env: Environment): boolean {
  return SENTRY_UPLOAD_VARIABLES.every((name) => Boolean(env[name]));
}

// The browser bundle only. The server-render build is never published and has
// no use for maps, and `apply` runs per build with isSsrBuild set for it.
function clientBuildOnly(plugin: Plugin): Plugin {
  return {
    ...plugin,
    apply: (_config, env) => env.command === "build" && !env.isSsrBuild,
  };
}

function hiddenSourceMaps(): Plugin {
  return {
    name: "hidden-source-maps",
    // Hidden: maps are written but the bundles carry no sourceMappingURL.
    config: () => ({ build: { sourcemap: "hidden" } }),
  };
}

function uploadPlugin(env: Environment): Plugin[] {
  const uploader = sentryVitePlugin({
    authToken: env.SENTRY_AUTH_TOKEN,
    org: env.SENTRY_ORG,
    project: env.SENTRY_PROJECT,
    telemetry: false,
    // Debug ids tie each bundle to its map, so no release needs to exist.
    release: { create: false, finalize: false, inject: false },
  });
  return [uploader].flat() as unknown as Plugin[];
}

// Vite plugins for the client build: hidden maps always (so the build is the
// same with or without credentials), plus the upload only when all three
// variables are set.
export function sourceMapPlugins(env: Environment): Plugin[] {
  const plugins = [hiddenSourceMaps()];
  if (isSourceMapUploadConfigured(env)) {
    plugins.push(...uploadPlugin(env));
  }
  return plugins.map(clientBuildOnly);
}

export function findSourceMaps(directory: string): string[] {
  return readdirSync(directory, { recursive: true })
    .filter((entry): entry is string => typeof entry === "string")
    .filter((entry) =>
      SOURCE_MAP_SUFFIXES.some((suffix) => entry.endsWith(suffix)),
    )
    .sort();
}

// Runs after the upload (which happens during the bundle), so the published
// output never carries a map whether or not an upload ran.
export function removeSourceMaps(directory: string): string[] {
  const removed = findSourceMaps(directory);
  removed.forEach((file) => rmSync(join(directory, file)));
  return removed;
}

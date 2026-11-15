import {
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { parseFrontmatter } from "../.vitepress/theme/utils/frontmatter.ts";

const POSTS_DIRECTORY = ".vitepress/content/posts";
// Passing any --ignore-path replaces Prettier's defaults (.gitignore and
// .prettierignore), so both are listed explicitly.
const BASE_IGNORE_FILES = [".gitignore", ".prettierignore"];
const DRAFT_IGNORE_FILE_PREFIX = ".prettierignore.drafts-";
const DEFAULT_PRETTIER_ARGUMENTS = ["--check", "."];
const PRETTIER_PACKAGE_JSON = "prettier/package.json";
const PRETTIER_BIN_PATH = join("bin", "prettier.cjs");

// Mirrors isPublished() in loadPublishedPosts.ts (any truthy `draft` is a
// draft) on top of the site's own frontmatter parser. isPublished isn't
// imported because its module graph uses extensionless imports that Node
// can't resolve outside the bundler; a test pins the two together.
// Throws on malformed frontmatter, like the build.
function readFrontmatter(filePath) {
  const raw = readFileSync(filePath, "utf8");
  try {
    return parseFrontmatter(raw).data;
  } catch (error) {
    throw new Error(`Malformed frontmatter in ${filePath}`, { cause: error });
  }
}

function isDraftPost(filePath) {
  return Boolean(readFrontmatter(filePath).draft);
}

// Throws on a missing or unreadable directory so CI fails loudly. An empty
// result means no drafts, which is a normal success.
export function findDraftPosts(postsDirectory = POSTS_DIRECTORY) {
  return readdirSync(postsDirectory, { recursive: true })
    .filter((entry) => entry.endsWith(".md"))
    .map((entry) => join(postsDirectory, entry))
    .filter(isDraftPost)
    .sort();
}

// Ignore patterns resolve relative to the ignore file, so root them at the
// directory holding that file with a leading slash.
export function toIgnorePatterns(draftPaths, rootDirectory = process.cwd()) {
  return draftPaths.map(
    (draftPath) =>
      `/${relative(rootDirectory, resolve(rootDirectory, draftPath))}`,
  );
}

export function buildPrettierArguments(ignoreFilePath, prettierArguments) {
  return [
    ...prettierArguments,
    ...[...BASE_IGNORE_FILES, ignoreFilePath].flatMap((ignoreFile) => [
      "--ignore-path",
      ignoreFile,
    ]),
  ];
}

function resolvePrettierBin() {
  const packageJsonPath = createRequire(import.meta.url).resolve(
    PRETTIER_PACKAGE_JSON,
  );
  return join(dirname(packageJsonPath), PRETTIER_BIN_PATH);
}

function writeDraftIgnoreFile(draftPaths, rootDirectory) {
  const ignoreFileName = `${DRAFT_IGNORE_FILE_PREFIX}${process.pid}`;
  writeFileSync(
    join(rootDirectory, ignoreFileName),
    `${toIgnorePatterns(draftPaths, rootDirectory).join("\n")}\n`,
  );
  return ignoreFileName;
}

// Returns Prettier's exit code. The ignore file lives in the root directory
// (see toIgnorePatterns) and is always removed afterwards.
export function main(
  argv = process.argv.slice(2),
  {
    rootDirectory = process.cwd(),
    postsDirectory = join(rootDirectory, POSTS_DIRECTORY),
  } = {},
) {
  const prettierArguments = argv.length ? argv : DEFAULT_PRETTIER_ARGUMENTS;
  const draftPaths = findDraftPosts(postsDirectory);
  const ignoreFileName = writeDraftIgnoreFile(draftPaths, rootDirectory);
  try {
    const result = spawnSync(
      process.execPath,
      [
        resolvePrettierBin(),
        ...buildPrettierArguments(ignoreFileName, prettierArguments),
      ],
      { stdio: "inherit", cwd: rootDirectory },
    );
    if (result.error) {
      throw result.error;
    }
    return result.status ?? 1;
  } finally {
    rmSync(join(rootDirectory, ignoreFileName), { force: true });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
) {
  process.exitCode = main();
}

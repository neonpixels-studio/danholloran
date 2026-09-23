import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

// Environment variables git hooks (e.g. this repo's husky hooks) can export
// to point every git invocation at the real repo instead of an argument's
// working directory. If the test runner ever inherits one of these, the
// temp-repo isolation below silently breaks and commands operate on the real
// repo, so strip the whole GIT_* family before layering on the isolation env
// vars below (an enumerated list would miss the next one git adds).
const processEnvWithoutGitOverrides = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !name.startsWith("GIT_")),
);

// Also isolate git from this machine's global/system config (e.g. an
// iCloud-synced ~/.gitconfig) so these subprocess calls can't fail or behave
// differently depending on where the test happens to run.
type ProcessEnv = Record<string, string | undefined>;

const GIT_ENV: ProcessEnv = {
  ...processEnvWithoutGitOverrides,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_SYSTEM: "/dev/null",
};

const SCRIPT_PATH = join(__dirname, "../../../netlify-ignore.sh");

let repoDir: string;
let shimCleanups: Array<() => void>;

function runGit(...args: string[]): void {
  const result = spawnSync("git", args, {
    cwd: repoDir,
    encoding: "utf-8",
    env: GIT_ENV,
  });

  if (result.error) {
    throw new Error(
      `git ${args.join(" ")} failed to spawn: ${result.error.message}`,
    );
  }

  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  }
}

function commitFile(fileName: string, contents: string, message: string): void {
  writeFileSync(join(repoDir, fileName), contents);
  runGit("add", fileName);
  runGit("commit", "-q", "-m", message);
}

function runNetlifyIgnore(env: ProcessEnv = GIT_ENV): {
  status: number;
  stdout: string;
  stderr: string;
} {
  const result = spawnSync("bash", [SCRIPT_PATH], {
    cwd: repoDir,
    encoding: "utf-8",
    env,
  });

  if (result.error) {
    throw new Error(
      `netlify-ignore.sh failed to spawn: ${result.error.message}`,
    );
  }

  return {
    status: result.status ?? -1,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function locateRealGitBinary(): string {
  const whichResult = spawnSync("which", ["git"], { encoding: "utf-8" });
  const path = whichResult.stdout?.trim();

  if (whichResult.status !== 0 || !path) {
    throw new Error(
      `could not locate the real git binary: ${whichResult.stderr ?? whichResult.error?.message}`,
    );
  }

  return path;
}

// Puts a fake `git` ahead of the real one on PATH that prints a warning to
// stderr on every `git diff` call, then hands off to the real git binary so
// behavior is otherwise unchanged. Used to prove the script's diff/stderr
// handling doesn't let a successful-but-noisy diff pollute the file list it
// parses (see netlify-ignore.sh's separate stderr capture). The shim
// directory is tracked in `shimCleanups` so `afterEach` removes it even if
// the caller never reaches its own cleanup call.
function createGitDiffStderrWarningShim(): { env: ProcessEnv } {
  const realGitPath = locateRealGitBinary();
  const shimDir = mkdtempSync(join(tmpdir(), "git-shim-"));
  const shimPath = join(shimDir, "git");

  writeFileSync(
    shimPath,
    [
      "#!/bin/bash",
      'if [ "$1" = "diff" ]; then',
      '  echo "warning: inexact rename detection was skipped" >&2',
      "fi",
      `exec "${realGitPath}" "$@"`,
      "",
    ].join("\n"),
  );
  chmodSync(shimPath, 0o755);
  shimCleanups.push(() => rmSync(shimDir, { recursive: true, force: true }));

  return { env: { ...GIT_ENV, PATH: `${shimDir}:${GIT_ENV.PATH}` } };
}

// Puts a fake `git` ahead of the real one on PATH whose `git diff` prints a
// fixed two-file, NUL-delimited list with no trailing NUL after the final
// record (simulating a truncated write) and exits 0; every other git
// invocation still hands off to the real binary. Used to prove the script's
// `read -r -d '' file || [ -n "$file" ]` guard doesn't silently drop that
// final record — a real repo can't reliably produce this exact byte
// sequence on demand, so the diff output itself is faked here rather than
// exercised through a real commit.
function createTruncatedDiffOutputShim(): { env: ProcessEnv } {
  const realGitPath = locateRealGitBinary();
  const shimDir = mkdtempSync(join(tmpdir(), "git-shim-"));
  const shimPath = join(shimDir, "git");

  writeFileSync(
    shimPath,
    [
      "#!/bin/bash",
      'if [ "$1" = "diff" ]; then',
      "  printf 'post.md\\0file.txt'",
      "  exit 0",
      "fi",
      `exec "${realGitPath}" "$@"`,
      "",
    ].join("\n"),
  );
  chmodSync(shimPath, 0o755);
  shimCleanups.push(() => rmSync(shimDir, { recursive: true, force: true }));

  return { env: { ...GIT_ENV, PATH: `${shimDir}:${GIT_ENV.PATH}` } };
}

// Every test spawns several real processes (git, bash, shims) synchronously,
// which takes ~200ms alone but can pass vitest's 5s default when the full
// suite runs under heavy CPU load (e.g. the pre-push hook).
const SUBPROCESS_TEST_TIMEOUT_MS = 20_000;

describe("netlify-ignore.sh", { timeout: SUBPROCESS_TEST_TIMEOUT_MS }, () => {
  beforeEach(() => {
    repoDir = mkdtempSync(join(tmpdir(), "netlify-ignore-"));
    shimCleanups = [];
    runGit("init", "-q");
    runGit("config", "user.email", "test@example.com");
    runGit("config", "user.name", "Test");
  });

  afterEach(() => {
    rmSync(repoDir, { recursive: true, force: true });
    shimCleanups.forEach((cleanup) => cleanup());
  });

  it("builds when there is no parent commit to diff against", () => {
    commitFile("file.txt", "hello", "init");

    const { status, stdout } = runNetlifyIgnore();

    expect(status).toBe(1);
    expect(stdout).toContain("Could not compute diff");
  });

  it("builds when the diff succeeds but reports no changed files", () => {
    commitFile("file.txt", "hello", "init");
    runGit("commit", "-q", "--allow-empty", "-m", "empty commit");

    const { status, stdout } = runNetlifyIgnore();

    expect(status).toBe(1);
    expect(stdout).toContain("no changed files were reported");
  });

  it("builds when a non-markdown file changed", () => {
    commitFile("file.txt", "hello", "init");
    commitFile("file.txt", "hello world", "update");

    const { status, stdout } = runNetlifyIgnore();

    expect(status).toBe(1);
    expect(stdout).toContain("Non-markdown file changed: file.txt");
  });

  it("builds when a non-draft markdown file changed", () => {
    commitFile("file.txt", "hello", "init");
    commitFile("post.md", "---\ndraft: false\n---\nbody\n", "publish post");

    const { status, stdout } = runNetlifyIgnore();

    expect(status).toBe(1);
    expect(stdout).toContain("Non-draft markdown file changed: post.md");
  });

  it("builds when a non-draft post's body happens to contain a 'draft: true' line", () => {
    commitFile("file.txt", "hello", "init");
    commitFile(
      "post.md",
      "---\ndraft: false\n---\nexample config:\ndraft: true\n",
      "publish post with tricky body",
    );

    const { status, stdout } = runNetlifyIgnore();

    expect(status).toBe(1);
    expect(stdout).toContain("Non-draft markdown file changed: post.md");
  });

  it("builds when a markdown file has no frontmatter at all", () => {
    commitFile("file.txt", "hello", "init");
    commitFile("post.md", "just some text, no frontmatter\n", "add plain md");

    const { status, stdout } = runNetlifyIgnore();

    expect(status).toBe(1);
    expect(stdout).toContain("Non-draft markdown file changed: post.md");
  });

  it("builds when a markdown file was deleted", () => {
    commitFile("post.md", "---\ndraft: true\n---\nbody\n", "add draft");
    runGit("rm", "post.md");
    runGit("commit", "-q", "-m", "delete draft");

    const { status, stdout } = runNetlifyIgnore();

    expect(status).toBe(1);
    expect(stdout).toContain("Markdown file deleted: post.md");
  });

  it("builds when a draft markdown file changed alongside a non-markdown file", () => {
    commitFile("file.txt", "hello", "init");
    writeFileSync(join(repoDir, "post.md"), "---\ndraft: true\n---\nbody\n");
    writeFileSync(join(repoDir, "file.txt"), "hello world");
    runGit("add", ".");
    runGit("commit", "-q", "-m", "draft post plus source change");

    const { status, stdout } = runNetlifyIgnore();

    expect(status).toBe(1);
    expect(stdout).toContain("Non-markdown file changed: file.txt");
  });

  it("skips only when every changed file is a draft markdown file", () => {
    commitFile("file.txt", "hello", "init");
    writeFileSync(join(repoDir, "post.md"), "---\ndraft: true\n---\nbody\n");
    writeFileSync(join(repoDir, "post2.md"), "---\ndraft: true\n---\nbody\n");
    runGit("add", ".");
    runGit("commit", "-q", "-m", "add draft posts");

    const { status, stdout } = runNetlifyIgnore();

    expect(status).toBe(0);
    expect(stdout).toContain("Only draft markdown files changed");
  });

  it("classifies an accented markdown filename as markdown, not skipping the quoted path", () => {
    // Default git behavior reports non-ASCII paths octal-escaped and
    // wrapped in quotes, e.g. "caf\303\251.md" — a string that does not
    // end in a literal .md and so would be misclassified as non-markdown
    // without the script's -z flag (see netlify-ignore.sh).
    commitFile("file.txt", "hello", "init");
    commitFile(
      "café.md",
      "---\ndraft: true\n---\nbody\n",
      "add accented draft",
    );

    const { status, stdout } = runNetlifyIgnore();

    expect(status).toBe(0);
    expect(stdout).toContain("Only draft markdown files changed");
  });

  it("builds when a non-draft accented markdown filename changed", () => {
    commitFile("file.txt", "hello", "init");
    commitFile(
      "café.md",
      "---\ndraft: false\n---\nbody\n",
      "publish accented post",
    );

    const { status, stdout } = runNetlifyIgnore();

    expect(status).toBe(1);
    expect(stdout).toContain("Non-draft markdown file changed: café.md");
  });

  it("classifies a markdown filename containing a double quote as markdown", () => {
    // core.quotePath only governs non-ASCII bytes — git C-quotes a path
    // containing a double quote (or backslash, or control character)
    // regardless of that setting, so the fix has to stop quoting entirely
    // (via -z) rather than special-case accented characters.
    commitFile("file.txt", "hello", "init");
    commitFile(
      'say "hi".md',
      "---\ndraft: true\n---\nbody\n",
      "add quoted draft",
    );

    const { status, stdout } = runNetlifyIgnore();

    expect(status).toBe(0);
    expect(stdout).toContain("Only draft markdown files changed");
  });

  it("classifies a markdown filename containing a newline as markdown", () => {
    // A literal newline in a path is the case where -z matters for record
    // *splitting*, not just unescaping: a line-oriented `read` loop would
    // see this as two separate (and individually bogus) paths instead of
    // one real file.
    commitFile("file.txt", "hello", "init");
    commitFile(
      "two\nlines.md",
      "---\ndraft: true\n---\nbody\n",
      "add newline draft",
    );

    const { status, stdout } = runNetlifyIgnore();

    expect(status).toBe(0);
    expect(stdout).toContain("Only draft markdown files changed");
  });

  it("still processes the final diff record when it lacks a NUL terminator", () => {
    // Guards the `read -r -d '' file || [ -n "$file" ]` fallback: without
    // it, `read` hits EOF on an unterminated final record and discards it,
    // which would make this script fail toward skipping a real deploy
    // instead of its documented fail-safe default of building. Both files
    // must exist on disk for the shimmed diff list to reach the *.md check
    // on the (real) trailing record rather than tripping the deleted-file
    // check first.
    commitFile("post.md", "---\ndraft: true\n---\nbody\n", "add draft");
    commitFile("file.txt", "hello", "add source file");

    const { env } = createTruncatedDiffOutputShim();
    const { status, stdout } = runNetlifyIgnore(env);

    expect(status).toBe(1);
    expect(stdout).toContain("Non-markdown file changed: file.txt");
  });

  it("ignores a stderr warning from an otherwise successful diff", () => {
    commitFile("file.txt", "hello", "init");
    writeFileSync(join(repoDir, "post.md"), "---\ndraft: true\n---\nbody\n");
    runGit("add", "post.md");
    runGit("commit", "-q", "-m", "add draft");

    const { env } = createGitDiffStderrWarningShim();
    const { status, stdout } = runNetlifyIgnore(env);

    expect(status).toBe(0);
    expect(stdout).toContain("Only draft markdown files changed");
    expect(stdout).not.toContain("inexact rename detection");
  });
});

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const NETLIFY_CONFIG_PATH = resolve(process.cwd(), "netlify.toml");
const PACKAGE_JSON_PATH = resolve(process.cwd(), "package.json");
const GITIGNORE_PATH = resolve(process.cwd(), ".gitignore");
const PRECOMMIT_PATH = resolve(process.cwd(), ".husky/pre-commit");
const CI_WORKFLOW_PATH = resolve(process.cwd(), ".github/workflows/ci.yml");

// Accepts TOML basic ("...") and literal ('...') strings.
const COMMAND_PATTERN = /^\s*command\s*=\s*(["'])(.*?)\1\s*$/m;
const COMMAND_SEPARATOR = "&&";
const NPM_RUN_PREFIX = /^npm run /;
const BUILD_STEP = "npm run build";
const PRODUCTION_BUILD_STEP = "npm run build:production";

function sectionPattern(header: string) {
  const escapedHeader = header.replace(/[.[\]]/g, "\\$&");
  return new RegExp(
    `^${escapedHeader}\\s*$([\\s\\S]*?)(?=^\\[|(?![\\s\\S]))`,
    "m",
  );
}

function readSteps(header: string) {
  const config = readFileSync(NETLIFY_CONFIG_PATH, "utf8");
  const section = config.match(sectionPattern(header))?.[1];
  const command = section?.match(COMMAND_PATTERN)?.[2];
  if (!command) {
    throw new Error(`netlify.toml ${header} has no simple quoted command`);
  }
  return command.split(COMMAND_SEPARATOR).map((step) => step.trim());
}

function readPackageScripts() {
  return JSON.parse(readFileSync(PACKAGE_JSON_PATH, "utf8")).scripts;
}

describe("netlify build command", () => {
  it("builds previews and branch deploys without the production key", () => {
    const steps = readSteps("[build]");
    expect(steps).toContain(BUILD_STEP);
    expect(steps).not.toContain(PRODUCTION_BUILD_STEP);
  });

  it("builds production through build:production", () => {
    const steps = readSteps("[context.production]");
    expect(steps).toContain(PRODUCTION_BUILD_STEP);
    expect(steps).not.toContain(BUILD_STEP);
  });

  it("only runs steps that are defined npm scripts", () => {
    const scripts = readPackageScripts();
    const steps = [
      ...readSteps("[build]"),
      ...readSteps("[context.production]"),
    ];
    for (const step of steps) {
      expect(step).toMatch(NPM_RUN_PREFIX);
      expect(scripts).toHaveProperty([step.replace(NPM_RUN_PREFIX, "")]);
    }
  });
});

describe("dotenvx production build", () => {
  it("decrypts .env.production strictly and still runs the plain build", () => {
    const script = readPackageScripts()["build:production"];
    expect(script).toContain("dotenvx run --strict");
    expect(script).toContain("-f .env.production");
    expect(script).toContain(`-- ${BUILD_STEP}`);
  });

  it("keeps the resume check in the plain build", () => {
    expect(readPackageScripts().build).toContain("resume:pdf:check");
  });

  it("ignores .env.keys", () => {
    expect(readFileSync(GITIGNORE_PATH, "utf8")).toMatch(/^\.env\.keys$/m);
  });

  it("refuses plaintext env files in the pre-commit hook", () => {
    expect(readFileSync(PRECOMMIT_PATH, "utf8")).toContain(
      "npx dotenvx ext precommit",
    );
  });

  it("never gives CI the private key", () => {
    expect(readFileSync(CI_WORKFLOW_PATH, "utf8")).not.toContain(
      "DOTENV_PRIVATE_KEY",
    );
  });
});

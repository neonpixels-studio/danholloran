import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { parse } from "yaml";

const LIGHTHOUSE_WORKFLOW_PATH = ".github/workflows/lighthouse.yml";
const LIGHTHOUSE_JOB_KEY = "lighthouse";
const LIGHTHOUSE_SCRIPT_NAME = "lighthouse";
const LHCI_PACKAGE = "@lhci/cli";

type WorkflowStep = { name?: string; run?: string };
type Workflow = { jobs?: Record<string, { steps?: WorkflowStep[] }> };
type PackageJson = {
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function readJson(path: string): PackageJson {
  return JSON.parse(readFileSync(join(process.cwd(), path), "utf8"));
}

function readLighthouseRunCommands(): string[] {
  const filePath = join(process.cwd(), LIGHTHOUSE_WORKFLOW_PATH);
  const workflow = parse(readFileSync(filePath, "utf8")) as Workflow;
  const steps = workflow.jobs?.[LIGHTHOUSE_JOB_KEY]?.steps;
  if (!steps) {
    throw new Error(`Job "${LIGHTHOUSE_JOB_KEY}" not found`);
  }
  return steps.flatMap((step) => (step.run ? [step.run.trim()] : []));
}

describe("lighthouse workflow", () => {
  it("runs Lighthouse CI through the pinned npm script", () => {
    expect(readLighthouseRunCommands()).toContain(
      `npm run ${LIGHTHOUSE_SCRIPT_NAME}`,
    );
  });

  it("does not fetch the CLI with npx", () => {
    const fetchesWithNpx = readLighthouseRunCommands().some((command) =>
      command.includes(`npx ${LHCI_PACKAGE}`),
    );
    expect(fetchesWithNpx).toBe(false);
  });

  it("declares the CLI as a devDependency and the script invokes it", () => {
    const packageJson = readJson("package.json");
    expect(packageJson.devDependencies?.[LHCI_PACKAGE]).toBeDefined();
    expect(packageJson.scripts?.[LIGHTHOUSE_SCRIPT_NAME]).toBe("lhci autorun");
  });
});

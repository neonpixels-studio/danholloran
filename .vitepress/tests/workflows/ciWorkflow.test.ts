import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { parse } from "yaml";

const CI_WORKFLOW_PATH = ".github/workflows/ci.yml";
const CI_JOB_KEY = "ci";
const INSTALL_COMMAND = "npm ci";
const BUILD_COMMAND = "npm run build";

type WorkflowStep = { name?: string; run?: string };
type Workflow = { jobs: Record<string, { steps: WorkflowStep[] }> };

function readCiSteps(): WorkflowStep[] {
  const filePath = join(process.cwd(), CI_WORKFLOW_PATH);
  const workflow = parse(readFileSync(filePath, "utf8")) as Workflow;
  const job = workflow.jobs?.[CI_JOB_KEY];
  if (!job) {
    throw new Error(`Job "${CI_JOB_KEY}" not found in ${CI_WORKFLOW_PATH}`);
  }
  return job.steps;
}

function stepIndexRunning(steps: WorkflowStep[], command: string): number {
  return steps.findIndex((step) => step.run?.trim() === command);
}

// `.vitepress/config.ts` `buildEnd` throws on 404 template drift, feed
// generation errors, and variant manifest mismatches. Without a build in the
// main CI job those only surface in lighthouse.yml or Netlify.
describe("ci.yml main job", () => {
  it("runs a production build", () => {
    expect(stepIndexRunning(readCiSteps(), BUILD_COMMAND)).toBeGreaterThan(-1);
  });

  it("builds after dependencies are installed", () => {
    const steps = readCiSteps();
    const installIndex = stepIndexRunning(steps, INSTALL_COMMAND);
    const buildIndex = stepIndexRunning(steps, BUILD_COMMAND);
    expect(installIndex).toBeGreaterThan(-1);
    expect(buildIndex).toBeGreaterThan(installIndex);
  });
});

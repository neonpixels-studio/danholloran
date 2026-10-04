import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { parse } from "yaml";

const CI_WORKFLOW_PATH = ".github/workflows/ci.yml";
const CI_JOB_KEY = "ci";
const INSTALL_COMMAND = "npm ci";
const BUILD_COMMAND = "npm run build";

type GatingFields = {
  if?: string;
  "continue-on-error"?: boolean | string;
};
type WorkflowStep = GatingFields & { name?: string; run?: string };
type WorkflowJob = GatingFields & { steps?: WorkflowStep[] };
type Workflow = { jobs?: Record<string, WorkflowJob> };

function readCiJob(): WorkflowJob {
  const filePath = join(process.cwd(), CI_WORKFLOW_PATH);
  const workflow = parse(readFileSync(filePath, "utf8")) as Workflow;
  const job = workflow.jobs?.[CI_JOB_KEY];
  if (!job) {
    throw new Error(`Job "${CI_JOB_KEY}" not found in ${CI_WORKFLOW_PATH}`);
  }
  return job;
}

function readCiSteps(): WorkflowStep[] {
  const job = readCiJob();
  if (!job.steps) {
    throw new Error(`Job "${CI_JOB_KEY}" has no steps in ${CI_WORKFLOW_PATH}`);
  }
  return job.steps;
}

function stepIndexRunning(steps: WorkflowStep[], command: string): number {
  return steps.findIndex((step) => step.run?.trim() === command);
}

function findStepRunning(command: string): WorkflowStep {
  const steps = readCiSteps();
  const step = steps[stepIndexRunning(steps, command)];
  if (!step) {
    throw new Error(`No step runs "${command}" in ${CI_WORKFLOW_PATH}`);
  }
  return step;
}

function expectUngated(target: GatingFields) {
  expect(target["continue-on-error"]).toBeUndefined();
  expect(target.if).toBeUndefined();
}

// `.vitepress/config.ts` `buildEnd` throws on 404 template drift, feed
// generation errors, and variant manifest mismatches. Without a build in the
// main CI job those only surface in lighthouse.yml or Netlify.
describe("ci.yml main job", () => {
  it("runs a production build", () => {
    expect(findStepRunning(BUILD_COMMAND)).toBeDefined();
  });

  it("does not let the build step be skipped or ignored on failure", () => {
    expectUngated(findStepRunning(BUILD_COMMAND));
  });

  it("does not let the whole job be skipped or ignored on failure", () => {
    expectUngated(readCiJob());
  });

  it("builds after dependencies are installed", () => {
    const steps = readCiSteps();
    const installIndex = stepIndexRunning(steps, INSTALL_COMMAND);
    const buildIndex = stepIndexRunning(steps, BUILD_COMMAND);
    expect(installIndex).toBeGreaterThan(-1);
    expect(buildIndex).toBeGreaterThan(installIndex);
  });
});

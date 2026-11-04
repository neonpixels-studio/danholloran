import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { parse } from "yaml";

const CI_WORKFLOW_PATH = ".github/workflows/ci.yml";
const WORKFLOWS_DIRECTORY = ".github/workflows";
const LHCI_COMMAND = "npm run lighthouse";
const LIGHTHOUSE_JOB_KEY = "lighthouse";
const BUILD_COMMAND = "npm run build";
const BUILD_ARTIFACT_NAME = "site-build";
const BUILD_OUTPUT_DIRECTORY = ".vitepress/dist";
const LIGHTHOUSE_CONFIG_PATH = ".lighthouserc.json";
const REBUILD_PATTERN = /vitepress build|run build/;

type WorkflowStep = {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
};
type WorkflowJob = {
  name?: string;
  needs?: string | string[];
  uses?: string;
  steps?: WorkflowStep[];
};
type Workflow = {
  on?: Record<string, unknown>;
  jobs?: Record<string, WorkflowJob>;
};

function readWorkflow(path: string): Workflow {
  return (parse(readFileSync(join(process.cwd(), path), "utf8")) ??
    {}) as Workflow;
}

function readSteps(path: string, jobKey: string): WorkflowStep[] {
  const steps = readWorkflow(path).jobs?.[jobKey]?.steps;
  if (!steps) {
    throw new Error(`Job "${jobKey}" has no steps in ${path}`);
  }
  return steps;
}

function findStepUsing(steps: WorkflowStep[], action: string) {
  return steps.find((step) => step.uses?.startsWith(`${action}@`));
}

// The site is built once in ci.yml; Lighthouse downloads that artifact.
describe("ci.yml lighthouse job build reuse", () => {
  it("does not rebuild the site", () => {
    const steps = readSteps(CI_WORKFLOW_PATH, LIGHTHOUSE_JOB_KEY);
    const rebuilds = steps.filter((step) =>
      REBUILD_PATTERN.test(step.run ?? ""),
    );
    expect(rebuilds).toEqual([]);
  });

  it("downloads the build artifact CI uploads, into the directory lhci serves", () => {
    const download = findStepUsing(
      readSteps(CI_WORKFLOW_PATH, LIGHTHOUSE_JOB_KEY),
      "actions/download-artifact",
    );
    expect(download?.with?.name).toBe(BUILD_ARTIFACT_NAME);
    expect(download?.with?.path).toBe(BUILD_OUTPUT_DIRECTORY);

    const lighthouseConfig = JSON.parse(
      readFileSync(join(process.cwd(), LIGHTHOUSE_CONFIG_PATH), "utf8"),
    );
    expect(lighthouseConfig.ci.collect.staticDistDir).toBe(
      BUILD_OUTPUT_DIRECTORY,
    );

    const upload = findStepUsing(
      readSteps(CI_WORKFLOW_PATH, "ci"),
      "actions/upload-artifact",
    );
    expect(upload?.with?.name).toBe(BUILD_ARTIFACT_NAME);
    expect(upload?.with?.path).toBe(BUILD_OUTPUT_DIRECTORY);
    expect(upload?.with?.["if-no-files-found"]).toBe("error");
    expect(upload?.with?.["include-hidden-files"]).toBe(true);
  });

  it("uploads the artifact after the build step", () => {
    const steps = readSteps(CI_WORKFLOW_PATH, "ci");
    const buildIndex = steps.findIndex(
      (step) => step.run?.trim() === BUILD_COMMAND,
    );
    const uploadIndex = steps.findIndex((step) =>
      step.uses?.startsWith("actions/upload-artifact@"),
    );
    expect(buildIndex).toBeGreaterThan(-1);
    expect(uploadIndex).toBeGreaterThan(buildIndex);
  });

  it("is an inline job named exactly lighthouse, after the ci job", () => {
    const job = readWorkflow(CI_WORKFLOW_PATH).jobs?.[LIGHTHOUSE_JOB_KEY];
    expect(job?.uses).toBeUndefined();
    expect(job?.name).toBeUndefined();
    expect([job?.needs].flat()).toContain("ci");
  });

  it("defines the lighthouse job only in ci.yml", () => {
    const workflowFiles = readdirSync(
      join(process.cwd(), WORKFLOWS_DIRECTORY),
    ).filter((file) => /\.ya?ml$/.test(file));
    const filesWithLighthouseJob = workflowFiles.filter(
      (file) =>
        readWorkflow(`${WORKFLOWS_DIRECTORY}/${file}`).jobs?.[
          LIGHTHOUSE_JOB_KEY
        ],
    );
    expect(filesWithLighthouseJob).toEqual(["ci.yml"]);
  });

  it("installs dependencies and keeps the lhci autorun invocation", () => {
    const steps = readSteps(CI_WORKFLOW_PATH, LIGHTHOUSE_JOB_KEY);
    expect(steps.some((step) => step.run?.trim() === "npm ci")).toBe(true);
    expect(steps.some((step) => step.run?.trim() === LHCI_COMMAND)).toBe(true);
  });

  it("downloads the artifact before running lhci", () => {
    const steps = readSteps(CI_WORKFLOW_PATH, LIGHTHOUSE_JOB_KEY);
    const downloadIndex = steps.findIndex((step) =>
      step.uses?.startsWith("actions/download-artifact@"),
    );
    const lhciIndex = steps.findIndex(
      (step) => step.run?.trim() === LHCI_COMMAND,
    );
    expect(downloadIndex).toBeGreaterThan(-1);
    expect(lhciIndex).toBeGreaterThan(downloadIndex);
  });
});

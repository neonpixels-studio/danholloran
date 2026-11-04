import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { parse } from "yaml";

const CI_WORKFLOW_PATH = ".github/workflows/ci.yml";
const LIGHTHOUSE_WORKFLOW_PATH = ".github/workflows/lighthouse.yml";
const BUILD_COMMAND = "npm run build";
const BUILD_ARTIFACT_NAME = "site-build";
const BUILD_OUTPUT_DIRECTORY = ".vitepress/dist";

type WorkflowStep = {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
};
type WorkflowJob = {
  needs?: string | string[];
  uses?: string;
  steps?: WorkflowStep[];
};
type Workflow = {
  on?: Record<string, unknown>;
  jobs?: Record<string, WorkflowJob>;
};

function readWorkflow(path: string): Workflow {
  return parse(readFileSync(join(process.cwd(), path), "utf8")) as Workflow;
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
describe("lighthouse.yml build reuse", () => {
  it("does not rebuild the site", () => {
    const steps = readSteps(LIGHTHOUSE_WORKFLOW_PATH, "lighthouse");
    const rebuilds = steps.filter((step) => step.run?.includes(BUILD_COMMAND));
    expect(rebuilds).toEqual([]);
  });

  it("downloads the build artifact CI uploads, into the directory lhci serves", () => {
    const download = findStepUsing(
      readSteps(LIGHTHOUSE_WORKFLOW_PATH, "lighthouse"),
      "actions/download-artifact",
    );
    expect(download?.with?.name).toBe(BUILD_ARTIFACT_NAME);
    expect(download?.with?.path).toBe(BUILD_OUTPUT_DIRECTORY);

    const upload = findStepUsing(
      readSteps(CI_WORKFLOW_PATH, "ci"),
      "actions/upload-artifact",
    );
    expect(upload?.with?.name).toBe(BUILD_ARTIFACT_NAME);
    expect(upload?.with?.path).toBe(BUILD_OUTPUT_DIRECTORY);
  });

  it("only runs when called from ci.yml, never on its own events", () => {
    expect(
      Object.keys(readWorkflow(LIGHTHOUSE_WORKFLOW_PATH).on ?? {}),
    ).toEqual(["workflow_call"]);
  });

  it("is called from ci.yml after the ci job succeeds", () => {
    const job = readWorkflow(CI_WORKFLOW_PATH).jobs?.lighthouse;
    expect(job?.uses).toBe("./.github/workflows/lighthouse.yml");
    expect(job?.needs).toBe("ci");
  });
});

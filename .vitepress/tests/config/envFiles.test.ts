import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

// Reads variable names and the `encrypted:` prefix only; nothing is decrypted.
const ENV_EXAMPLE_PATH = resolve(process.cwd(), ".env.example");
const ENV_PRODUCTION_PATH = resolve(process.cwd(), ".env.production");
const PUBLIC_KEY_NAME = "DOTENV_PUBLIC_KEY_PRODUCTION";
const ENCRYPTED_VALUE_PATTERN = /^encrypted:/;
const ASSIGNMENT_PATTERN =
  /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.]*)\s*=\s*(.*?)\s*$/;

type Assignment = { name: string; value: string };

function isAssignmentLine(line: string) {
  const trimmed = line.trim();
  return trimmed !== "" && !trimmed.startsWith("#");
}

function parseAssignment(line: string): Assignment {
  const match = line.match(ASSIGNMENT_PATTERN);
  if (!match) {
    throw new Error(`Unrecognized line in env file: ${line.split("=")[0]}`);
  }
  return { name: match[1], value: match[2] };
}

function readAssignments(path: string): Assignment[] {
  return readFileSync(path, "utf8")
    .split("\n")
    .filter(isAssignmentLine)
    .map(parseAssignment);
}

function unquote(value: string) {
  return value.replace(/^(["'])(.*)\1$/, "$2");
}

function readNames(path: string) {
  return readAssignments(path).map((assignment) => assignment.name);
}

function secretAssignments() {
  return readAssignments(ENV_PRODUCTION_PATH).filter(
    (assignment) => assignment.name !== PUBLIC_KEY_NAME,
  );
}

describe("env files", () => {
  it("declares the same variable names in .env.example and .env.production", () => {
    const exampleNames = readNames(ENV_EXAMPLE_PATH).sort();
    const productionNames = secretAssignments()
      .map((assignment) => assignment.name)
      .sort();

    expect(productionNames.length).toBeGreaterThan(0);
    expect(exampleNames).toEqual(productionNames);
  });

  it("keeps .env.example free of values", () => {
    for (const assignment of readAssignments(ENV_EXAMPLE_PATH)) {
      expect(assignment.value, assignment.name).toBe("");
    }
  });

  it("encrypts every value in .env.production except the public key", () => {
    for (const assignment of secretAssignments()) {
      expect(unquote(assignment.value), assignment.name).toMatch(
        ENCRYPTED_VALUE_PATTERN,
      );
    }
  });

  it("includes the dotenvx public key in .env.production", () => {
    expect(readNames(ENV_PRODUCTION_PATH)).toContain(PUBLIC_KEY_NAME);
  });
});

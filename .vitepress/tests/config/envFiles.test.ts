import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

// Reads variable names and the `encrypted:` prefix only; nothing is decrypted.
const ENV_EXAMPLE_PATH = resolve(process.cwd(), ".env.example");
const ENV_PRODUCTION_PATH = resolve(process.cwd(), ".env.production");
const PUBLIC_KEY_NAME = "DOTENV_PUBLIC_KEY_PRODUCTION";
const ENCRYPTED_VALUE_PATTERN = /^encrypted:/;
const ASSIGNMENT_PATTERN = /^([A-Z][A-Z0-9_]*)=(.*)$/;

type Assignment = { name: string; value: string };

function readAssignments(path: string): Assignment[] {
  return readFileSync(path, "utf8")
    .split("\n")
    .map((line) => line.match(ASSIGNMENT_PATTERN))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => ({ name: match[1], value: match[2] }));
}

function unquote(value: string) {
  return value.replace(/^"(.*)"$/, "$1");
}

function secretAssignments() {
  return readAssignments(ENV_PRODUCTION_PATH).filter(
    (assignment) => assignment.name !== PUBLIC_KEY_NAME,
  );
}

describe("env files", () => {
  it("declares the same variable names in .env.example and .env.production", () => {
    const exampleNames = readAssignments(ENV_EXAMPLE_PATH)
      .map((assignment) => assignment.name)
      .sort();
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
    const names = readAssignments(ENV_PRODUCTION_PATH).map(
      (assignment) => assignment.name,
    );
    expect(names).toContain(PUBLIC_KEY_NAME);
  });
});

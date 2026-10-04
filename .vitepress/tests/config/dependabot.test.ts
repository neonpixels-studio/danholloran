import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { parse } from "yaml";

// Dependabot assigns a dependency to the first group whose patterns match it, so
// these tests mirror that rule against the real package.json to prove the coupled
// toolchain families stay together and are not swallowed by the catch-all group.
// Paths resolve from `process.cwd()` (the repo root vitest runs in).
const VALID_UPDATE_TYPES = ["major", "minor", "patch"];
const CATCH_ALL_GROUP = "npm-minor-patch";

type DependabotGroup = {
  patterns: string[];
  "update-types"?: string[];
};

type DependabotUpdate = {
  "package-ecosystem": string;
  groups?: Record<string, DependabotGroup>;
};

type DependabotConfig = {
  updates: DependabotUpdate[];
};

type PackageManifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

function readFromRoot(fileName: string): string {
  return readFileSync(join(process.cwd(), fileName), "utf8");
}

function readUpdate(ecosystem: string): DependabotUpdate {
  const config = parse(
    readFromRoot(".github/dependabot.yml"),
  ) as DependabotConfig;
  const update = config.updates.find(
    (candidate) => candidate["package-ecosystem"] === ecosystem,
  );
  if (!update) {
    throw new Error(`No dependabot update block for ${ecosystem}`);
  }
  return update;
}

function readNpmGroups(): Record<string, DependabotGroup> {
  return readUpdate("npm").groups ?? {};
}

function declaredPackageNames(): string[] {
  const manifest = JSON.parse(readFromRoot("package.json")) as PackageManifest;
  return [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
  ];
}

// Dependabot patterns only support `*` as a wildcard.
function matchesPattern(packageName: string, pattern: string): boolean {
  const escaped = pattern
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${escaped}$`).test(packageName);
}

function groupFor(
  packageName: string,
  groups: Record<string, DependabotGroup>,
) {
  return Object.keys(groups).find((groupName) =>
    groups[groupName].patterns.some((pattern) =>
      matchesPattern(packageName, pattern),
    ),
  );
}

describe("dependabot.yml groups", () => {
  it("groups every coupled toolchain package declared in package.json by family", () => {
    const groups = readNpmGroups();
    const expectedFamilies: Record<string, string> = {
      vitest: "vitest",
      "@vitest/ui": "vitest",
      eslint: "eslint",
      "@eslint/js": "eslint",
      "eslint-plugin-vue": "eslint",
      "eslint-config-prettier": "eslint",
      "@typescript-eslint/parser": "eslint",
      typescript: "eslint",
      vue: "vue",
      "vue-tsc": "vue",
      "@vue/test-utils": "vue",
      tailwindcss: "tailwindcss",
      "@tailwindcss/vite": "tailwindcss",
    };
    const declared = declaredPackageNames();

    for (const [packageName, family] of Object.entries(expectedFamilies)) {
      expect(declared, `${packageName} should be declared`).toContain(
        packageName,
      );
      expect(groupFor(packageName, groups), packageName).toBe(family);
    }
  });

  it("does not filter update types on coupled families so major bumps stay grouped", () => {
    const groups = readNpmGroups();

    for (const [groupName, group] of Object.entries(groups)) {
      if (groupName === CATCH_ALL_GROUP) {
        continue;
      }
      expect(group["update-types"], groupName).toBeUndefined();
    }
  });

  it("lists the catch-all last, limited to minor and patch, so it never takes a coupled package", () => {
    const groups = readNpmGroups();
    const groupNames = Object.keys(groups);
    const catchAll = groups[CATCH_ALL_GROUP];

    expect(groupNames.at(-1)).toBe(CATCH_ALL_GROUP);
    expect(catchAll.patterns).toEqual(["*"]);
    expect(catchAll["update-types"]).toEqual(["minor", "patch"]);
  });

  it("uses only update types Dependabot accepts", () => {
    const allGroups = [
      ...Object.values(readNpmGroups()),
      ...Object.values(readUpdate("github-actions").groups ?? {}),
    ];

    for (const group of allGroups) {
      for (const updateType of group["update-types"] ?? []) {
        expect(VALID_UPDATE_TYPES).toContain(updateType);
      }
    }
  });

  it("groups all github-actions updates together", () => {
    const groups = readUpdate("github-actions").groups ?? {};

    expect(groups["github-actions"]?.patterns).toEqual(["*"]);
  });
});

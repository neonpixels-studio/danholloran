import { join } from "path";
import { describe, it, expect } from "vitest";
import { findDistProblems } from "../../theme/utils/distArtifacts";

const DIST_DIRECTORY = join(process.cwd(), ".vitepress/dist");

// Runs after `npm run build` (see `npm run test:dist`): the generators are
// unit-tested in isolation, this proves buildEnd actually wired them in.
describe("built site output", () => {
  it("contains every expected artifact", () => {
    expect(findDistProblems(DIST_DIRECTORY)).toEqual([]);
  });
});

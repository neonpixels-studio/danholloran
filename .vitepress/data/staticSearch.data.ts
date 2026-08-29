import type { SearchItem } from "@typedefs";
import projects from "./projects";
import { buildStaticSearchItems } from "./searchIndex";

declare const data: SearchItem[];
export { data };

export default {
  // Refresh the search index in dev when the project source changes.
  watch: ["./projects.ts", "./skills.ts"],
  load(): SearchItem[] {
    return buildStaticSearchItems(projects);
  },
};

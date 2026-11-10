import MiniSearch from "minisearch";
import type { SearchItem } from "@typedefs";
import { data as postItems } from "../content/posts/search.data.ts";
import { data as staticItems } from "./staticSearch.data.ts";
import { mergeSearchIndex, SEARCH_PANEL_SIZE } from "./searchIndex.ts";

// AppSearch dynamic-imports this module the first time the panel opens. The
// post index and MiniSearch grow with every post, and loading them eagerly put
// them in every page's startup JS (and the index build in its hydration),
// which is what pushed /posts/ under the Lighthouse performance floor.
export type SearchEngine = {
  items: SearchItem[];
  search: (_query: string) => SearchItem[];
};

export function createSearchEngine(): SearchEngine {
  const items = mergeSearchIndex(staticItems, postItems);
  const index = new MiniSearch<SearchItem & { id: number }>({
    fields: ["title", "desc", "kw"],
    storeFields: ["type", "title", "desc", "href"],
    searchOptions: {
      boost: { title: 3, kw: 2 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
  index.addAll(items.map((item, id) => ({ ...item, id })));

  return {
    items,
    search: (query) =>
      index
        .search(query)
        .slice(0, SEARCH_PANEL_SIZE) as unknown as SearchItem[],
  };
}

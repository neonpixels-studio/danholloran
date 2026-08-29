import { describe, it, expect } from "vitest";
import realProjects from "@data/projects";
import {
  buildStaticSearchItems,
  mergeSearchIndex,
  projectToSearchItem,
  PROJECTS_ANCHOR,
} from "@data/searchIndex";
import { mockProjects, mockSearchItems } from "../__fixtures__/mockData";

describe("buildStaticSearchItems", () => {
  it("indexes the full set of static pages", () => {
    const pageHrefs = buildStaticSearchItems(mockProjects)
      .filter((item) => item.type === "page")
      .map((item) => item.href);
    expect(pageHrefs).toEqual([
      "/",
      "/resume",
      "/posts/",
      "/themes/grimicorn",
      "/themes/grimicorn-neon",
    ]);
  });

  it("emits a project-type item for every project", () => {
    const projectItems = buildStaticSearchItems(realProjects).filter(
      (item) => item.type === "project",
    );
    expect(projectItems.length).toBe(realProjects.length);
    expect(projectItems.map((item) => item.title)).toContain(
      realProjects[0].title,
    );
  });
});

describe("projectToSearchItem", () => {
  it("falls back to the projects anchor when a project has no url", () => {
    const item = projectToSearchItem({ ...mockProjects[0], url: undefined });
    expect(item.href).toBe(PROJECTS_ANCHOR);
  });

  it("falls back to the projects anchor for an empty url", () => {
    const item = projectToSearchItem({ ...mockProjects[0], url: "" });
    expect(item.href).toBe(PROJECTS_ANCHOR);
  });

  it("carries project skills into keywords so tech searches match", () => {
    const item = projectToSearchItem(mockProjects[0]);
    expect(item.kw).toContain(mockProjects[0].skills[0].name);
  });

  it("strips markdown link URLs from indexed keywords", () => {
    const item = projectToSearchItem({
      ...mockProjects[0],
      content: "Built with [Vue.js](https://vuejs.org) and care.",
    });
    expect(item.kw).toContain("Vue.js");
    expect(item.kw).not.toContain("https://vuejs.org");
  });

  it("strips image syntax and parenthesized link URLs without leaving junk", () => {
    const item = projectToSearchItem({
      ...mockProjects[0],
      content:
        "See ![diagram](/img/arch.png) and [EDI](https://en.wikipedia.org/wiki/Foo_(bar)) docs.",
    });
    expect(item.kw).toContain("diagram");
    expect(item.kw).toContain("EDI");
    expect(item.kw).not.toContain("wikipedia");
    expect(item.kw).not.toContain(")");
  });
});

describe("mergeSearchIndex", () => {
  it("keeps non-colliding static and post entries", () => {
    const staticItems = buildStaticSearchItems([]);
    const merged = mergeSearchIndex(staticItems, mockSearchItems);
    expect(merged.length).toBe(staticItems.length + mockSearchItems.length);
  });

  it("folds a project's title and keywords into a colliding post instead of dropping it", () => {
    const projectItem = projectToSearchItem({
      ...mockProjects[0],
      title: "Automation Platform",
      url: mockSearchItems[0].href,
    });
    const merged = mergeSearchIndex([projectItem], mockSearchItems);

    const entriesForHref = merged.filter(
      (item) => item.href === mockSearchItems[0].href,
    );
    expect(entriesForHref.length).toBe(1);
    const [survivor] = entriesForHref;
    expect(survivor.type).toBe("post");
    expect(survivor.kw).toContain("Automation Platform");
    expect(survivor.kw).toContain(mockSearchItems[0].kw);
  });
});

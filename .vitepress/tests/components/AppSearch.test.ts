import { describe, it, expect, vi, afterEach } from "vitest";
import { shallowMount, mount, VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import {
  mockSearchItems,
  mockStaticSearchItems,
} from "../__fixtures__/mockData";

import type { Ref } from "vue";

const mocks = vi.hoisted(() => ({
  routerGo: vi.fn(),
  isSearchOpen: null as Ref<boolean> | null,
}));

vi.mock("vitepress", () => ({
  useRouter: () => ({ go: mocks.routerGo }),
}));

vi.mock("@composables/useNavPanels.ts", async () => {
  const { ref } = await import("vue");
  mocks.isSearchOpen = ref(true);
  return {
    useNavPanels: () => ({
      isSearchOpen: mocks.isSearchOpen,
      openSearch: vi.fn(),
      closeAll: vi.fn(),
    }),
  };
});

vi.mock("@content/posts/search.data.ts", () => ({
  data: mockSearchItems,
}));

vi.mock("@data/staticSearch.data.ts", () => ({
  data: mockStaticSearchItems,
}));

import AppSearch from "@components/AppSearch.vue";

describe("AppSearch", () => {
  let wrapper: VueWrapper | null = null;

  function mountSearch(): VueWrapper {
    wrapper = mount(AppSearch, { global: { stubs: { Teleport: true } } });
    return wrapper;
  }

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    mocks.routerGo.mockClear();
    vi.unstubAllGlobals();
    if (mocks.isSearchOpen) {
      mocks.isSearchOpen.value = true;
    }
  });

  it("renders correctly", () => {
    wrapper = shallowMount(AppSearch, {
      global: { stubs: { Teleport: true } },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("exposes combobox/listbox ARIA semantics", () => {
    const search = mountSearch();

    const input = search.find("input");
    expect(input.attributes("role")).toBe("combobox");
    expect(input.attributes("aria-controls")).toBe(
      search.find('[role="listbox"]').attributes("id"),
    );
    expect(search.findAll('[role="option"]').length).toBeGreaterThan(0);
  });

  it("reflects the active result into aria-activedescendant + aria-selected on ArrowDown", async () => {
    const search = mountSearch();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    await nextTick();

    const activeDescendant = search
      .find("input")
      .attributes("aria-activedescendant");
    expect(activeDescendant).toBeTruthy();

    const activeOption = search.find('[aria-selected="true"]');
    expect(activeOption.exists()).toBe(true);
    expect(activeOption.attributes("id")).toBe(activeDescendant);
  });

  it("leaves no dangling aria-activedescendant when ArrowDown fires with no results", async () => {
    const search = mountSearch();

    await search.find("input").setValue("zzzznomatchquery");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    await nextTick();

    const input = search.find("input");
    expect(search.findAll('[role="option"]').length).toBe(0);
    expect(input.attributes("aria-activedescendant")).toBeUndefined();
    expect(input.attributes("aria-expanded")).toBe("false");
  });

  it("does not throw or navigate on ArrowDown + Enter when there are no results", async () => {
    const search = mountSearch();

    await search.find("input").setValue("zzzznomatchquery");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    await nextTick();

    expect(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    }).not.toThrow();
    expect(mocks.routerGo).not.toHaveBeenCalled();
  });

  it("navigates to the active result on ArrowDown + Enter", async () => {
    mountSearch();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    await nextTick();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(mocks.routerGo).toHaveBeenCalledTimes(1);
  });

  it("returns the Resume page when searching for a page keyword", async () => {
    const search = mountSearch();

    await search.find("input").setValue("resume");
    await nextTick();

    const options = search.findAll('[role="option"]');
    expect(options.length).toBeGreaterThan(0);
    const resumeOption = options.find((option) =>
      option.text().includes("Resume"),
    );
    expect(resumeOption).toBeTruthy();
    expect(resumeOption!.text()).toContain("page");
    expect(resumeOption!.attributes("href")).toBe("/resume");
  });

  it("returns a project when searching for a project name", async () => {
    const search = mountSearch();

    await search.find("input").setValue("Acme Project");
    await nextTick();

    const options = search.findAll('[role="option"]');
    expect(options.length).toBeGreaterThan(0);
    const projectOption = options.find((option) =>
      option.text().includes("Acme Project"),
    );
    expect(projectOption).toBeTruthy();
    expect(projectOption!.text()).toContain("project");
    expect(projectOption!.attributes("href")).toBe("https://acme.example");
  });

  it("navigates external project urls via window.location, not the SPA router", async () => {
    const location = { href: "" };
    vi.stubGlobal("location", location);

    const search = mountSearch();
    await search.find("input").setValue("Acme Project");
    await nextTick();
    const projectOption = search
      .findAll('[role="option"]')
      .find((option) => option.text().includes("Acme Project"));
    await projectOption!.trigger("click");

    expect(location.href).toBe("https://acme.example");
    expect(mocks.routerGo).not.toHaveBeenCalled();
  });

  it("folds a project that links to its own post into a single post result", async () => {
    const search = mountSearch();

    await search.find("input").setValue("collision");
    await nextTick();

    const options = search.findAll('[role="option"]');
    // The colliding project's keyword resolves to the post entry, not a
    // second option with the project's own title.
    expect(options.length).toBe(1);
    expect(options[0].text()).toContain("First Post");
    expect(options[0].text()).toContain("post");
    expect(options[0].text()).not.toContain("Duplicate Of First Post");
  });

  it("shows posts ahead of projects in the default empty-query panel", () => {
    const search = mountSearch();

    const optionHrefs = search
      .findAll('[role="option"]')
      .map((option) => option.attributes("href"));
    const postIndex = optionHrefs.indexOf("/posts/first-post");
    const projectIndex = optionHrefs.indexOf("https://acme.example");

    expect(postIndex).toBeGreaterThan(-1);
    expect(projectIndex).toBeGreaterThan(-1);
    expect(postIndex).toBeLessThan(projectIndex);
  });

  it("collapses aria-expanded when the search panel is closed", async () => {
    const search = mountSearch();
    mocks.isSearchOpen!.value = false;
    await nextTick();

    expect(search.find("input").attributes("aria-expanded")).toBe("false");
  });
});

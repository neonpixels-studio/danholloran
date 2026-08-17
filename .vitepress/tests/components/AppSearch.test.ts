import { describe, it, expect, vi, afterEach } from "vitest";
import { shallowMount, mount, VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import { mockSearchItems } from "../__fixtures__/mockData";

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

  it("collapses aria-expanded when the search panel is closed", async () => {
    const search = mountSearch();
    mocks.isSearchOpen!.value = false;
    await nextTick();

    expect(search.find("input").attributes("aria-expanded")).toBe("false");
  });
});

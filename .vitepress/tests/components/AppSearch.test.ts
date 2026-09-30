import { describe, it, expect, vi, afterEach } from "vitest";
import {
  shallowMount,
  mount,
  flushPromises,
  VueWrapper,
} from "@vue/test-utils";
import { nextTick } from "vue";
import {
  mockSearchItems,
  mockStaticSearchItems,
} from "../__fixtures__/mockData";
import { mockGtag, clearGtag } from "../helpers/gtag";

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
      // Mirrors the real closeAll(): flips isSearchOpen false, so tests can
      // exercise AppSearch's isSearchOpen watcher the same way production
      // reactivity does, not just the direct close()/Escape path.
      closeAll: vi.fn(() => {
        if (mocks.isSearchOpen) {
          mocks.isSearchOpen.value = false;
        }
      }),
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
    vi.useRealTimers();
    clearGtag();
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
    // Confirms the title is rendered through highlightMatch's v-html wiring,
    // not just plain text — the matched substring is wrapped in a real
    // <mark> element in the DOM.
    const titleHtml = resumeOption!.find(".font-semibold").html();
    expect(titleHtml).toContain("<mark");
    expect(resumeOption!.find(".font-semibold mark").text()).toBe("Resume");
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

  describe("dialog semantics + focus trap", () => {
    // Triggers are plain DOM nodes (not part of any wrapper), so they need
    // their own cleanup list rather than piggybacking on `wrapper`'s
    // afterEach. Tracking them here (rather than removing inline after each
    // assertion) means a failed expectation still leaves the DOM clean for
    // the next test.
    let triggers: HTMLButtonElement[] = [];

    function createTrigger(): HTMLButtonElement {
      const trigger = document.createElement("button");
      document.body.appendChild(trigger);
      trigger.focus();
      triggers.push(trigger);
      return trigger;
    }

    // Reuses the outer `wrapper` variable so the outer afterEach's
    // `wrapper?.unmount()` covers cleanup even when an assertion throws.
    function mountAttached(): VueWrapper {
      wrapper = mount(AppSearch, {
        attachTo: document.body,
        global: { stubs: { Teleport: true } },
      });
      return wrapper;
    }

    function panelElement(search: VueWrapper): HTMLElement {
      // `.get()` throws a clear "not found" error on its own, so the lookup
      // doubles as the existence check without a separate assertion here.
      return search.get('[role="dialog"]').element as HTMLElement;
    }

    function pressTab(shiftKey = false): KeyboardEvent {
      const event = new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey,
        cancelable: true,
      });
      document.dispatchEvent(event);
      return event;
    }

    afterEach(() => {
      triggers.forEach((trigger) => trigger.remove());
      triggers = [];
    });

    it("declares dialog/modal semantics on the overlay panel", () => {
      const search = mountSearch();

      const panel = search.find('[role="dialog"]');
      expect(panel.attributes("aria-modal")).toBe("true");
      expect(panel.attributes("aria-hidden")).toBe("false");
    });

    it("hides the panel from assistive tech while closed", async () => {
      const search = mountSearch();
      mocks.isSearchOpen!.value = false;
      await nextTick();

      expect(search.find('[role="dialog"]').attributes("aria-hidden")).toBe(
        "true",
      );
    });

    it("moves focus into the panel when it opens", async () => {
      createTrigger();
      mocks.isSearchOpen!.value = false;
      const search = mountAttached();

      mocks.isSearchOpen!.value = true;
      await flushPromises();

      expect(panelElement(search).contains(document.activeElement)).toBe(true);
      expect(document.activeElement).toBe(search.find("input").element);
    });

    it("restores focus to the trigger when it closes", async () => {
      const trigger = createTrigger();
      mocks.isSearchOpen!.value = false;
      const search = mountAttached();

      mocks.isSearchOpen!.value = true;
      await flushPromises();
      expect(document.activeElement).toBe(search.find("input").element);

      mocks.isSearchOpen!.value = false;
      await flushPromises();
      expect(document.activeElement).toBe(trigger);
    });

    it("does not throw restoring focus when the trigger was removed while open", async () => {
      const trigger = createTrigger();
      mocks.isSearchOpen!.value = false;
      mountAttached();

      mocks.isSearchOpen!.value = true;
      await flushPromises();
      trigger.remove();
      triggers = triggers.filter((candidate) => candidate !== trigger);

      mocks.isSearchOpen!.value = false;
      await flushPromises();

      // A detached previously-focused element can't be refocused, so the
      // trap falls back to document.body rather than leaving activeElement
      // stale or throwing.
      expect(document.activeElement).not.toBe(trigger);
      expect(document.activeElement).toBe(document.body);
    });

    it("traps Tab focus within the panel while open", async () => {
      createTrigger();
      mocks.isSearchOpen!.value = true;
      const search = mountAttached();
      await flushPromises();

      // The result options carry tabindex="-1" (roving activedescendant, not
      // real Tab order), so the only genuinely focusable controls here are
      // the input and the close button.
      const first = search.find("input").element as HTMLElement;
      const last = search.find('button[aria-label="Close search"]')
        .element as HTMLElement;

      first.focus();
      const shiftTab = pressTab(true);
      expect(shiftTab.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(last);

      const tab = pressTab();
      expect(tab.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(first);
    });

    it("does not intercept Tab moving between two panel-internal controls", async () => {
      createTrigger();
      mocks.isSearchOpen!.value = true;
      const search = mountAttached();
      await flushPromises();

      const first = search.find("input").element as HTMLElement;
      first.focus();

      // Only two focusable controls exist (input, close button); Tab off the
      // first isn't a wrap, so the trap must leave the browser default alone.
      const tab = pressTab();
      expect(tab.defaultPrevented).toBe(false);
    });

    it("pulls focus back into the panel if it escapes to outside content", async () => {
      const trigger = createTrigger();
      mocks.isSearchOpen!.value = true;
      const search = mountAttached();
      await flushPromises();

      trigger.focus();
      const tab = pressTab();
      expect(tab.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(search.find("input").element);
    });

    it("stops trapping Tab once the panel closes", async () => {
      createTrigger();
      mocks.isSearchOpen!.value = true;
      mountAttached();
      await flushPromises();

      mocks.isSearchOpen!.value = false;
      await flushPromises();

      const tab = pressTab();
      expect(tab.defaultPrevented).toBe(false);
    });

    it("moves focus into the panel when it mounts already open", async () => {
      createTrigger();
      mocks.isSearchOpen!.value = true;
      const search = mountAttached();
      await flushPromises();

      expect(document.activeElement).toBe(search.find("input").element);
    });

    it("stops trapping Tab once the panel unmounts while open", async () => {
      createTrigger();
      mocks.isSearchOpen!.value = true;
      mountAttached();
      await flushPromises();

      wrapper?.unmount();
      wrapper = null;

      const tab = pressTab();
      expect(tab.defaultPrevented).toBe(false);
    });
  });

  describe("analytics", () => {
    const QUERY_DEBOUNCE_MS = 500;

    it("fires search_query with the result count once typing settles", async () => {
      vi.useFakeTimers();
      const gtag = mockGtag();
      const search = mountSearch();

      await search.find("input").setValue("resume");
      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS);

      expect(gtag).toHaveBeenCalledTimes(1);
      expect(gtag).toHaveBeenCalledWith("event", "search_query", {
        query: "resume",
        results_shown: 1,
      });
    });

    it("fires search_no_results for a query with no matches", async () => {
      vi.useFakeTimers();
      const gtag = mockGtag();
      const search = mountSearch();

      await search.find("input").setValue("zzzznomatchquery");
      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS);

      expect(gtag).toHaveBeenCalledTimes(1);
      expect(gtag).toHaveBeenCalledWith("event", "search_no_results", {
        query: "zzzznomatchquery",
      });
    });

    it("debounces rapid typing into a single settled event", async () => {
      vi.useFakeTimers();
      const gtag = mockGtag();
      const search = mountSearch();
      const input = search.find("input");

      await input.setValue("r");
      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS / 2);
      await input.setValue("re");
      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS / 2);
      await input.setValue("resume");
      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS);

      expect(gtag).toHaveBeenCalledTimes(1);
      expect(gtag).toHaveBeenCalledWith("event", "search_query", {
        query: "resume",
        results_shown: 1,
      });
    });

    it("fires no query event while the panel sits at the default empty-query state", async () => {
      vi.useFakeTimers();
      const gtag = mockGtag();
      mountSearch();

      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS);

      expect(gtag).not.toHaveBeenCalled();
    });

    it("fires no query event once the query is cleared back to empty", async () => {
      vi.useFakeTimers();
      const gtag = mockGtag();
      const search = mountSearch();

      await search.find("input").setValue("resume");
      await search.find("input").setValue("");
      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS);

      expect(gtag).not.toHaveBeenCalled();
    });

    it("fires search_result_click with the query, href and type on a result click", async () => {
      // Stubbed like the "navigates external project urls" test above: this
      // result's href is external, so navigate() writes to window.location.
      const location = { href: "" };
      vi.stubGlobal("location", location);
      const gtag = mockGtag();
      const search = mountSearch();

      await search.find("input").setValue("Acme Project");
      await nextTick();
      const projectOption = search
        .findAll('[role="option"]')
        .find((option) => option.text().includes("Acme Project"));
      await projectOption!.trigger("click");

      expect(gtag).toHaveBeenCalledWith("event", "search_result_click", {
        query: "Acme Project",
        href: "https://acme.example",
        type: "project",
      });
    });

    it("flushes the pending search_query event on a fast click, instead of dropping it", async () => {
      // Regression test: close() (called from navigate()) used to reset
      // `query` to "" before the debounce timer fired, so a click landing
      // inside the debounce window silently dropped the settled-query event.
      vi.useFakeTimers();
      const location = { href: "" };
      vi.stubGlobal("location", location);
      const gtag = mockGtag();
      const search = mountSearch();

      await search.find("input").setValue("Acme Project");
      // No advanceTimersByTimeAsync — the click below lands well inside the
      // QUERY_DEBOUNCE_MS window, before the timer would otherwise fire.
      const projectOption = search
        .findAll('[role="option"]')
        .find((option) => option.text().includes("Acme Project"));
      await projectOption!.trigger("click");

      // "Acme Project" also fuzzy/prefix-matches the merged "First Post" kw
      // (see mockStaticSearchItems' "Duplicate Of First Post" collision
      // fixture), so the panel shows 2 results for this query.
      expect(gtag).toHaveBeenCalledTimes(2);
      // The settled-query event reports the funnel step that led to the
      // click, so it must reach analytics before search_result_click.
      expect(gtag.mock.calls[0]).toEqual([
        "event",
        "search_query",
        { query: "Acme Project", results_shown: 2 },
      ]);
      expect(gtag.mock.calls[1]).toEqual([
        "event",
        "search_result_click",
        {
          query: "Acme Project",
          href: "https://acme.example",
          type: "project",
        },
      ]);
    });

    it("flushes the pending search_no_results event on Escape, instead of dropping it", async () => {
      vi.useFakeTimers();
      const gtag = mockGtag();
      const search = mountSearch();

      await search.find("input").setValue("zzzznomatchquery");
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      // Escape's close() flips isSearchOpen, and the flush runs off that
      // watcher, not synchronously inside the keydown handler.
      await nextTick();

      expect(gtag).toHaveBeenCalledTimes(1);
      expect(gtag).toHaveBeenCalledWith("event", "search_no_results", {
        query: "zzzznomatchquery",
      });
    });

    it("flushes and clears the query when the panel closes via another nav panel, not just close()", async () => {
      // useNavPanels is a single-slot shared store: opening the mobile menu
      // flips isSearchOpen false without AppSearch's own close() running.
      vi.useFakeTimers();
      const gtag = mockGtag();
      const search = mountSearch();

      await search.find("input").setValue("zzzznomatchquery");
      mocks.isSearchOpen!.value = false;
      await nextTick();

      expect(gtag).toHaveBeenCalledTimes(1);
      expect(gtag).toHaveBeenCalledWith("event", "search_no_results", {
        query: "zzzznomatchquery",
      });
      expect((search.find("input").element as HTMLInputElement).value).toBe("");
    });

    it("does not double-count a settled query re-edited back to the same tracked value", async () => {
      vi.useFakeTimers();
      const gtag = mockGtag();
      const search = mountSearch();
      const input = search.find("input");

      await input.setValue("resume");
      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS);
      expect(gtag).toHaveBeenCalledTimes(1);

      // Trims back down to the identical already-tracked query.
      await input.setValue("resume ");
      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS);

      expect(gtag).toHaveBeenCalledTimes(1);
    });

    it("tracks the same query again as a fresh occurrence in a later search", async () => {
      vi.useFakeTimers();
      const gtag = mockGtag();
      const search = mountSearch();
      const input = search.find("input");

      await input.setValue("resume");
      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS);
      await input.setValue("");
      await input.setValue("resume");
      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS);

      expect(gtag).toHaveBeenCalledTimes(2);
    });

    it("redacts a query shaped like an email address or a long digit run", async () => {
      vi.useFakeTimers();
      const gtag = mockGtag();
      const search = mountSearch();

      await search.find("input").setValue("reader@example.com");
      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS);

      expect(gtag).toHaveBeenCalledWith("event", "search_no_results", {
        query: "[redacted]",
      });
    });

    it("redacts a phone-shaped query even with separators between the digits", async () => {
      vi.useFakeTimers();
      const gtag = mockGtag();
      const search = mountSearch();

      await search.find("input").setValue("(555) 123-4567");
      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS);

      expect(gtag).toHaveBeenCalledWith("event", "search_no_results", {
        query: "[redacted]",
      });
    });

    it("dedupes on the raw query, not the redacted value, so two distinct emails both track", async () => {
      vi.useFakeTimers();
      const gtag = mockGtag();
      const search = mountSearch();
      const input = search.find("input");

      await input.setValue("reader@example.com");
      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS);
      await input.setValue("other@example.org");
      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS);

      expect(gtag).toHaveBeenCalledTimes(2);
      expect(gtag).toHaveBeenNthCalledWith(1, "event", "search_no_results", {
        query: "[redacted]",
      });
      expect(gtag).toHaveBeenNthCalledWith(2, "event", "search_no_results", {
        query: "[redacted]",
      });
    });

    it("caps the tracked query at the GA4 param limit", async () => {
      vi.useFakeTimers();
      const gtag = mockGtag();
      const search = mountSearch();

      await search.find("input").setValue("z".repeat(150));
      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS);

      expect(gtag).toHaveBeenCalledWith("event", "search_no_results", {
        query: "z".repeat(100),
      });
    });

    it("trims surrounding whitespace off the tracked query", async () => {
      vi.useFakeTimers();
      const gtag = mockGtag();
      const search = mountSearch();

      await search.find("input").setValue("  resume  ");
      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS);

      expect(gtag).toHaveBeenCalledWith("event", "search_query", {
        query: "resume",
        results_shown: 1,
      });
    });

    it("fires search_result_click on ArrowDown + Enter selection", async () => {
      const gtag = mockGtag();
      mountSearch();

      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown" }),
      );
      await nextTick();
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

      // Empty-query panel leads with the Resume page (see
      // "shows posts ahead of projects in the default empty-query panel").
      expect(gtag).toHaveBeenCalledWith("event", "search_result_click", {
        query: "",
        href: "/resume",
        type: "page",
      });
    });

    it("fires no query event when the component unmounts mid-debounce", async () => {
      vi.useFakeTimers();
      const gtag = mockGtag();
      const search = mountSearch();

      await search.find("input").setValue("resume");
      search.unmount();
      wrapper = null;
      await vi.advanceTimersByTimeAsync(QUERY_DEBOUNCE_MS);

      expect(gtag).not.toHaveBeenCalled();
    });
  });
});

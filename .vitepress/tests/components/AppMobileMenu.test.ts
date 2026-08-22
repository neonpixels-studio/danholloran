import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  shallowMount,
  mount,
  flushPromises,
  type VueWrapper,
} from "@vue/test-utils";
import type { Ref } from "vue";
import { mockNavItems, mockSocialLinks } from "../__fixtures__/mockData";

const store = vi.hoisted(() => {
  return {} as {
    isMobileMenuOpen: Ref<boolean>;
    closeAll: ReturnType<typeof vi.fn>;
  };
});

vi.mock("vitepress", () => ({
  useRouter: () => ({ go: vi.fn() }),
}));

vi.mock("@composables/useMainNav.ts", async () => {
  const { computed } = await import("vue");
  return {
    useMainNav: () => ({
      navItems: computed(() => mockNavItems),
    }),
  };
});

vi.mock("@composables/useNavPanels.ts", async () => {
  const { ref } = await import("vue");
  store.isMobileMenuOpen = ref(false);
  // Mirror production: closing a panel clears the shared open state.
  store.closeAll = vi.fn(() => {
    store.isMobileMenuOpen.value = false;
  });
  return {
    useNavPanels: () => ({
      isMobileMenuOpen: store.isMobileMenuOpen,
      closeAll: store.closeAll,
    }),
  };
});

vi.mock("@data/socialLinks", () => ({ default: mockSocialLinks }));

import AppMobileMenu from "@components/AppMobileMenu.vue";

const mountOpts = { global: { stubs: { Teleport: true } } };

let wrapper: VueWrapper | null = null;

function createTrigger(): HTMLButtonElement {
  const trigger = document.createElement("button");
  document.body.appendChild(trigger);
  trigger.focus();
  return trigger;
}

function mountAttached(): VueWrapper {
  wrapper = mount(AppMobileMenu, { attachTo: document.body, ...mountOpts });
  return wrapper;
}

function menuElement(): HTMLElement {
  const menu = document.getElementById("mobileMenu");
  expect(menu).not.toBeNull();
  return menu as HTMLElement;
}

function closeButton(): HTMLElement {
  const button = menuElement().querySelector("button");
  expect(button).not.toBeNull();
  return button as HTMLElement;
}

describe("AppMobileMenu", () => {
  beforeEach(() => {
    store.isMobileMenuOpen.value = true;
    store.closeAll.mockClear();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    document.body.innerHTML = "";
    document.body.style.overflow = "";
    vi.restoreAllMocks();
  });

  it("renders correctly", () => {
    wrapper = shallowMount(AppMobileMenu, mountOpts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("moves focus to the close control when it opens", async () => {
    createTrigger();
    store.isMobileMenuOpen.value = false;
    mountAttached();

    store.isMobileMenuOpen.value = true;
    await flushPromises();

    expect(document.activeElement).toBe(closeButton());
  });

  it("restores focus to the trigger when it closes", async () => {
    const trigger = createTrigger();
    store.isMobileMenuOpen.value = false;
    mountAttached();

    store.isMobileMenuOpen.value = true;
    await flushPromises();
    expect(document.activeElement).toBe(closeButton());

    store.isMobileMenuOpen.value = false;
    await flushPromises();
    expect(document.activeElement).toBe(trigger);
  });

  it("traps Tab focus within the menu while open", async () => {
    createTrigger();
    mountAttached();
    await flushPromises();

    const links = menuElement().querySelectorAll<HTMLElement>("a[href]");
    expect(links.length).toBeGreaterThan(0);
    const first = closeButton();
    const last = links[links.length - 1];

    // Shift+Tab from the first control wraps to the last, staying trapped.
    first.focus();
    const shiftTab = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      cancelable: true,
    });
    document.dispatchEvent(shiftTab);
    expect(shiftTab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);

    // Tab from the last control wraps back to the first.
    const tab = new KeyboardEvent("keydown", { key: "Tab", cancelable: true });
    document.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it("stops trapping Tab once the menu closes", async () => {
    createTrigger();
    mountAttached();
    await flushPromises();

    store.isMobileMenuOpen.value = false;
    await flushPromises();

    const tab = new KeyboardEvent("keydown", { key: "Tab", cancelable: true });
    document.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(false);
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const trigger = createTrigger();
    store.isMobileMenuOpen.value = false;
    mountAttached();

    store.isMobileMenuOpen.value = true;
    await flushPromises();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await flushPromises();

    expect(store.closeAll).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(trigger);
  });

  it("ignores Escape while closed", () => {
    store.isMobileMenuOpen.value = false;
    wrapper = mount(AppMobileMenu, mountOpts);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(store.closeAll).not.toHaveBeenCalled();
  });

  it("closes when the close button is activated", async () => {
    wrapper = mount(AppMobileMenu, mountOpts);

    await wrapper.find("button").trigger("click");
    expect(store.closeAll).toHaveBeenCalledTimes(1);
  });

  it("closes when a nav link is activated", async () => {
    wrapper = mount(AppMobileMenu, mountOpts);

    await wrapper.find('a[href="/posts/"]').trigger("click");
    expect(store.closeAll).toHaveBeenCalledTimes(1);
  });

  it("closes when the backdrop is clicked", async () => {
    wrapper = mount(AppMobileMenu, mountOpts);

    await wrapper.find("#mobileMenu + div").trigger("click");
    expect(store.closeAll).toHaveBeenCalledTimes(1);
  });

  it("locks body scroll while open and restores it on close", async () => {
    store.isMobileMenuOpen.value = false;
    wrapper = mount(AppMobileMenu, mountOpts);
    expect(document.body.style.overflow).toBe("");

    store.isMobileMenuOpen.value = true;
    await flushPromises();
    expect(document.body.style.overflow).toBe("hidden");

    store.isMobileMenuOpen.value = false;
    await flushPromises();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on the desktop breakpoint and cleans up its listener", () => {
    let changeHandler: ((_event: MediaQueryListEvent) => void) | null = null;
    const query = {
      matches: false,
      addEventListener: (
        _event: string,
        handler: (_event: MediaQueryListEvent) => void,
      ) => {
        changeHandler = handler;
      },
      removeEventListener: vi.fn(),
    };
    vi.spyOn(window, "matchMedia").mockReturnValue(
      query as unknown as MediaQueryList,
    );

    wrapper = mount(AppMobileMenu, mountOpts);
    expect(changeHandler).not.toBeNull();

    // Shrinking below the breakpoint must not close (it would also close search).
    changeHandler!({ matches: false } as MediaQueryListEvent);
    expect(store.closeAll).not.toHaveBeenCalled();

    // Crossing into desktop closes the now-hidden menu.
    changeHandler!({ matches: true } as MediaQueryListEvent);
    expect(store.closeAll).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    wrapper = null;
    expect(query.removeEventListener).toHaveBeenCalledWith(
      "change",
      changeHandler,
    );
  });
});

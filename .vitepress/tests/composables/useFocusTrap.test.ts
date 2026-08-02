import { describe, it, expect } from "vitest";
import { defineComponent, ref, h } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { useFocusTrap, trapTarget } from "../../theme/composables/useFocusTrap";

function pressTab(shiftKey = false) {
  const event = new KeyboardEvent("keydown", {
    key: "Tab",
    shiftKey,
    cancelable: true,
  });
  document.dispatchEvent(event);
  return event;
}

function mountHarness(initialActive = false) {
  const active = ref(initialActive);
  const Harness = defineComponent({
    setup() {
      const container = ref<HTMLElement | null>(null);
      useFocusTrap(container, active);
      return () =>
        active.value
          ? h("div", { ref: container, tabindex: "-1" }, [
              h("button", { class: "first" }, "first"),
              h("button", { class: "last" }, "last"),
            ])
          : null;
    },
  });
  const wrapper = mount(Harness, { attachTo: document.body });
  return { wrapper, active };
}

// Keeps the container mounted while inactive so the `!isActive` guard is real.
function mountPersistentHarness() {
  const active = ref(false);
  const Harness = defineComponent({
    setup() {
      const container = ref<HTMLElement | null>(null);
      useFocusTrap(container, active);
      return () =>
        h("div", { ref: container, tabindex: "-1" }, [
          h("button", { class: "first" }, "first"),
        ]);
    },
  });
  const wrapper = mount(Harness, { attachTo: document.body });
  return { wrapper, active };
}

describe("useFocusTrap", () => {
  it("moves focus to the first focusable element on activation", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { wrapper, active } = mountHarness();
    active.value = true;
    await flushPromises();

    expect(document.activeElement).toBe(wrapper.find(".first").element);

    wrapper.unmount();
    trigger.remove();
  });

  it("moves focus in when mounted already active", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { wrapper } = mountHarness(true);
    await flushPromises();

    expect(document.activeElement).toBe(wrapper.find(".first").element);

    wrapper.unmount();
    trigger.remove();
  });

  it("wraps to the last element on Shift+Tab from the first", async () => {
    const { wrapper, active } = mountHarness();
    active.value = true;
    await flushPromises();

    (wrapper.find(".first").element as HTMLElement).focus();
    const event = pressTab(true);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(wrapper.find(".last").element);

    wrapper.unmount();
  });

  it("wraps to the first element on Tab from the last", async () => {
    const { wrapper, active } = mountHarness();
    active.value = true;
    await flushPromises();

    (wrapper.find(".last").element as HTMLElement).focus();
    const event = pressTab();
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(wrapper.find(".first").element);

    wrapper.unmount();
  });

  it("pulls focus back inside when it escapes the container", async () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);

    const { wrapper, active } = mountHarness();
    active.value = true;
    await flushPromises();

    outside.focus();
    const event = pressTab();
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(wrapper.find(".first").element);

    wrapper.unmount();
    outside.remove();
  });

  it("leaves Tab alone while inactive even with the container mounted", async () => {
    const outside = document.createElement("button");
    document.body.appendChild(outside);

    const { wrapper } = mountPersistentHarness();
    outside.focus();

    const event = pressTab();
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(outside);

    wrapper.unmount();
    outside.remove();
  });

  it("restores focus to the previously focused element on deactivation", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { wrapper, active } = mountHarness();
    active.value = true;
    await flushPromises();
    expect(document.activeElement).not.toBe(trigger);

    active.value = false;
    await flushPromises();
    expect(document.activeElement).toBe(trigger);

    wrapper.unmount();
    trigger.remove();
  });

  it("falls back to the body when the restore target is gone", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { wrapper, active } = mountHarness();
    active.value = true;
    await flushPromises();

    trigger.remove();
    active.value = false;
    await flushPromises();
    expect(document.activeElement).toBe(document.body);

    wrapper.unmount();
  });

  it("restores focus to the trigger when unmounted while active", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const { wrapper, active } = mountHarness();
    active.value = true;
    await flushPromises();
    expect(document.activeElement).not.toBe(trigger);

    wrapper.unmount();
    expect(document.activeElement).toBe(trigger);

    // The keydown listener is gone, so later Tab presses no longer steal focus.
    trigger.focus();
    const event = pressTab();
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(trigger);

    trigger.remove();
  });

  describe("trapTarget", () => {
    function makeContainer() {
      const container = document.createElement("div");
      const first = document.createElement("button");
      const last = document.createElement("button");
      container.append(first, last);
      document.body.appendChild(container);
      return { container, first, last };
    }

    it("returns the container itself when there is nothing focusable", () => {
      const container = document.createElement("div");
      expect(trapTarget(container, false, null)).toBe(container);
    });

    it("pulls to the first element on Tab when focus is outside", () => {
      const { container, first } = makeContainer();
      expect(trapTarget(container, false, document.body)).toBe(first);
      container.remove();
    });

    it("pulls to the last element on Shift+Tab when focus is outside", () => {
      const { container, last } = makeContainer();
      expect(trapTarget(container, true, document.body)).toBe(last);
      container.remove();
    });

    it("wraps last -> first on Tab", () => {
      const { container, first, last } = makeContainer();
      expect(trapTarget(container, false, last)).toBe(first);
      container.remove();
    });

    it("wraps first -> last on Shift+Tab", () => {
      const { container, first, last } = makeContainer();
      expect(trapTarget(container, true, first)).toBe(last);
      container.remove();
    });

    it("returns null when the browser default keeps focus inside", () => {
      const { container, first } = makeContainer();
      expect(trapTarget(container, false, first)).toBeNull();
      container.remove();
    });

    it("pulls off the container itself so Shift+Tab cannot escape", () => {
      const { container, last } = makeContainer();
      expect(trapTarget(container, true, container)).toBe(last);
      container.remove();
    });

    it("skips hidden and inert focusables", () => {
      const container = document.createElement("div");
      const hidden = document.createElement("button");
      hidden.setAttribute("hidden", "");
      const visible = document.createElement("button");
      container.append(hidden, visible);
      document.body.appendChild(container);

      expect(trapTarget(container, false, document.body)).toBe(visible);
      container.remove();
    });
  });

  it("ignores non-Tab keys", async () => {
    const { wrapper, active } = mountHarness();
    active.value = true;
    await flushPromises();

    (wrapper.find(".last").element as HTMLElement).focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(document.activeElement).toBe(wrapper.find(".last").element);

    wrapper.unmount();
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import PostLightbox from "@components/PostLightbox.vue";

const mountOpts = { global: { stubs: { Teleport: true, Transition: false } } };

describe("PostLightbox", () => {
  beforeEach(() => {
    document.body.style.overflow = "";
  });

  it("renders nothing when src is null", () => {
    const wrapper = mount(PostLightbox, {
      props: { src: null },
      ...mountOpts,
    });
    expect(wrapper.find("[role='dialog']").exists()).toBe(false);
  });

  it("renders the image and caption when src is provided", () => {
    const wrapper = mount(PostLightbox, {
      props: { src: "/images/posts/first-post.jpg", alt: "First Post" },
      ...mountOpts,
    });
    const image = wrapper.find("img");
    expect(image.attributes("src")).toBe("/images/posts/first-post.jpg");
    expect(image.attributes("alt")).toBe("First Post");
    expect(wrapper.find("figcaption").text()).toBe("First Post");
  });

  it("emits close when the backdrop is clicked", async () => {
    const wrapper = mount(PostLightbox, {
      props: { src: "/images/posts/first-post.jpg", alt: "First Post" },
      ...mountOpts,
    });
    await wrapper.find("[role='dialog']").trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("does not emit close when the image itself is clicked", async () => {
    const wrapper = mount(PostLightbox, {
      props: { src: "/images/posts/first-post.jpg", alt: "First Post" },
      ...mountOpts,
    });
    await wrapper.find("img").trigger("click");
    expect(wrapper.emitted("close")).toBeUndefined();
  });

  it("emits close when the close button is clicked", async () => {
    const wrapper = mount(PostLightbox, {
      props: { src: "/images/posts/first-post.jpg", alt: "First Post" },
      ...mountOpts,
    });
    await wrapper.find("button[aria-label='Close image']").trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("emits close when Escape is pressed", async () => {
    const wrapper = mount(PostLightbox, {
      props: { src: "/images/posts/first-post.jpg", alt: "First Post" },
      ...mountOpts,
    });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("locks body scroll while open and restores it on close", async () => {
    const wrapper = mount(PostLightbox, {
      props: { src: null },
      ...mountOpts,
    });
    expect(document.body.style.overflow).toBe("");

    await wrapper.setProps({ src: "/images/posts/first-post.jpg" });
    expect(document.body.style.overflow).toBe("hidden");

    await wrapper.setProps({ src: null });
    expect(document.body.style.overflow).toBe("");
  });

  it("moves focus into the lightbox on open", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const wrapper = mount(PostLightbox, {
      props: { src: null },
      attachTo: document.body,
      ...mountOpts,
    });

    await wrapper.setProps({ src: "/images/posts/first-post.jpg" });
    await flushPromises();

    const dialog = wrapper.find("[role='dialog']").element;
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).toBe(
      wrapper.find("button[aria-label='Close image']").element,
    );

    wrapper.unmount();
    trigger.remove();
  });

  it("traps Tab focus within the lightbox while open", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const wrapper = mount(PostLightbox, {
      props: { src: "/images/posts/first-post.jpg" },
      attachTo: document.body,
      ...mountOpts,
    });
    await flushPromises();

    const closeButton = wrapper.find(
      "button[aria-label='Close image']",
    ).element;

    // Focus escaping the dialog is pulled back onto the sole focusable control.
    trigger.focus();
    const tab = new KeyboardEvent("keydown", { key: "Tab", cancelable: true });
    document.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(closeButton);

    // Shift+Tab stays on the trapped control rather than leaking to the trigger.
    const shiftTab = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      cancelable: true,
    });
    document.dispatchEvent(shiftTab);
    expect(shiftTab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(closeButton);
    expect(document.activeElement).not.toBe(trigger);

    wrapper.unmount();
    trigger.remove();
  });

  it("restores focus to the trigger on close", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    const wrapper = mount(PostLightbox, {
      props: { src: null },
      attachTo: document.body,
      ...mountOpts,
    });

    await wrapper.setProps({ src: "/images/posts/first-post.jpg" });
    await flushPromises();
    expect(document.activeElement).not.toBe(trigger);

    await wrapper.setProps({ src: null });
    await flushPromises();
    expect(document.activeElement).toBe(trigger);

    wrapper.unmount();
    trigger.remove();
  });
});

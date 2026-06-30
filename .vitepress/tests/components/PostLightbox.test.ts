import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
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
});

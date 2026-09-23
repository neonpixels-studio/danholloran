import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import ResponsiveImage from "@components/ResponsiveImage.vue";

describe("ResponsiveImage", () => {
  it("renders a picture with avif/webp sources and an original-image fallback", () => {
    const wrapper = mount(ResponsiveImage, {
      props: {
        src: "/images/posts/some-post.jpg",
        variant: "thumb",
        sizes: "(max-width: 767px) 100vw, 320px",
      },
      attrs: { alt: "Some post thumbnail", class: "h-full w-full" },
    });

    expect(wrapper.html()).toMatchSnapshot();
  });

  it("forwards non-prop attrs (class, alt, listeners) to the <img>, not <picture>", () => {
    let clicked = false;
    const wrapper = mount(ResponsiveImage, {
      props: {
        src: "/images/posts/some-post.jpg",
        variant: "hero",
        sizes: "(max-width: 767px) 100vw, 720px",
      },
      attrs: {
        alt: "Some post hero",
        class: "cursor-zoom-in",
        onClick: () => {
          clicked = true;
        },
      },
    });

    const picture = wrapper.find("picture");
    const img = wrapper.find("img");
    expect(picture.classes()).not.toContain("cursor-zoom-in");
    expect(img.classes()).toContain("cursor-zoom-in");
    expect(img.attributes("alt")).toBe("Some post hero");

    img.trigger("click");
    expect(clicked).toBe(true);
  });

  it("points the fallback <img> at the original, unprocessed src", () => {
    const wrapper = mount(ResponsiveImage, {
      props: {
        src: "/images/posts/some-post.jpg",
        variant: "hero",
        sizes: "100vw",
      },
    });

    expect(wrapper.find("img").attributes("src")).toBe(
      "/images/posts/some-post.jpg",
    );
  });

  it("renders a plain <img> with no <picture> for a src no variants were generated for", () => {
    const wrapper = mount(ResponsiveImage, {
      props: {
        src: "/images/posts/legacy-screenshot.gif",
        variant: "thumb",
        sizes: "320px",
      },
      attrs: { alt: "Legacy screenshot" },
    });

    expect(wrapper.find("picture").exists()).toBe(false);
    const img = wrapper.find("img");
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBe("/images/posts/legacy-screenshot.gif");
    expect(img.attributes("alt")).toBe("Legacy screenshot");
  });
});

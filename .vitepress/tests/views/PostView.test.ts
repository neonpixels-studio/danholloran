import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockResume, mockPosts } from "../__fixtures__/mockData";

vi.mock("@data/resume.ts", () => ({
  default: mockResume,
}));

import PostView from "@views/PostView.vue";
import PostLightbox from "@components/PostLightbox.vue";

describe("PostView", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(PostView, {
      props: {
        post: mockPosts[0],
        posts: mockPosts,
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("renders with prev and next navigation when post is mid-list", () => {
    const [first, second] = mockPosts;
    const threePosts = [
      first,
      second,
      {
        ...second,
        url: "/posts/third",
        frontmatter: {
          ...second.frontmatter,
          slug: "third",
          title: "Third Post",
        },
      },
    ];
    const wrapper = shallowMount(PostView, {
      props: {
        post: threePosts[1],
        posts: threePosts,
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("shows the finance disclaimer for finance posts", () => {
    const financePost = {
      ...mockPosts[0],
      frontmatter: { ...mockPosts[0].frontmatter, topic: "finance" },
    };
    const wrapper = shallowMount(PostView, {
      props: { post: financePost, posts: [financePost] },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("hides the finance disclaimer for non-finance posts", () => {
    const wrapper = shallowMount(PostView, {
      props: { post: mockPosts[0], posts: mockPosts },
    });
    expect(wrapper.find("aside[aria-label='Disclaimer']").exists()).toBe(false);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("opens the lightbox with the hero image when it is clicked", async () => {
    const wrapper = shallowMount(PostView, {
      props: { post: mockPosts[0], posts: mockPosts },
    });
    expect(wrapper.findComponent(PostLightbox).props("src")).toBe(null);

    await wrapper
      .find(`img[src='${mockPosts[0].frontmatter.image}']`)
      .trigger("click");

    const lightbox = wrapper.findComponent(PostLightbox);
    expect(lightbox.props("src")).toBe(mockPosts[0].frontmatter.image);
    expect(lightbox.props("alt")).toBe(mockPosts[0].frontmatter.title);
  });

  it("closes the lightbox when PostLightbox emits close", async () => {
    const wrapper = shallowMount(PostView, {
      props: { post: mockPosts[0], posts: mockPosts },
    });
    await wrapper
      .find(`img[src='${mockPosts[0].frontmatter.image}']`)
      .trigger("click");
    expect(wrapper.findComponent(PostLightbox).props("src")).toBe(
      mockPosts[0].frontmatter.image,
    );

    wrapper.findComponent(PostLightbox).vm.$emit("close");
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(PostLightbox).props("src")).toBe(null);
  });

  it("prioritizes the hero image and reserves its space without lazy loading", () => {
    const wrapper = shallowMount(PostView, {
      props: { post: mockPosts[0], posts: mockPosts },
    });
    const hero = wrapper.find(`img[src='${mockPosts[0].frontmatter.image}']`);

    // Hero is the LCP: prioritize its fetch and never defer it.
    expect(hero.attributes("fetchpriority")).toBe("high");
    expect(hero.attributes("loading")).toBeUndefined();
    // The aspect-video wrapper reserves the hero's box before it loads, so the
    // hero needs no intrinsic width/height to avoid CLS.
    expect(hero.element.parentElement?.className).toContain("aspect-video");
  });

  it("exposes the hero image as a keyboard-operable control", () => {
    const wrapper = shallowMount(PostView, {
      props: { post: mockPosts[0], posts: mockPosts },
    });
    const hero = wrapper.find(`img[src='${mockPosts[0].frontmatter.image}']`);

    expect(hero.attributes("role")).toBe("button");
    expect(hero.attributes("tabindex")).toBe("0");
    expect(hero.attributes("aria-label")).toBe(
      `Zoom image: ${mockPosts[0].frontmatter.title}`,
    );
  });

  it("opens the lightbox when Enter is pressed on the hero image", async () => {
    const wrapper = shallowMount(PostView, {
      props: { post: mockPosts[0], posts: mockPosts },
    });
    expect(wrapper.findComponent(PostLightbox).props("src")).toBe(null);

    await wrapper
      .find(`img[src='${mockPosts[0].frontmatter.image}']`)
      .trigger("keydown", { key: "Enter" });

    const lightbox = wrapper.findComponent(PostLightbox);
    expect(lightbox.props("src")).toBe(mockPosts[0].frontmatter.image);
    expect(lightbox.props("alt")).toBe(mockPosts[0].frontmatter.title);
  });

  it("opens the lightbox when Space is pressed on the hero image", async () => {
    const wrapper = shallowMount(PostView, {
      props: { post: mockPosts[0], posts: mockPosts },
    });

    await wrapper
      .find(`img[src='${mockPosts[0].frontmatter.image}']`)
      .trigger("keydown", { key: " " });

    expect(wrapper.findComponent(PostLightbox).props("src")).toBe(
      mockPosts[0].frontmatter.image,
    );
  });

  it("makes in-body images keyboard-operable and zoomable", async () => {
    const post = {
      ...mockPosts[0],
      html: '<p>Body</p><img src="/images/posts/inline.jpg" alt="Inline diagram" />',
    };
    const wrapper = shallowMount(PostView, {
      props: { post, posts: mockPosts },
    });

    const inlineImage = wrapper.find("article img");
    expect(inlineImage.attributes("role")).toBe("button");
    expect(inlineImage.attributes("tabindex")).toBe("0");
    expect(inlineImage.attributes("aria-label")).toBe(
      "Zoom image: Inline diagram",
    );

    await inlineImage.trigger("keydown", { key: "Enter" });

    const lightbox = wrapper.findComponent(PostLightbox);
    // happy-dom resolves img.src to an absolute URL, so match the path suffix.
    expect(lightbox.props("src")).toContain("/images/posts/inline.jpg");
    expect(lightbox.props("alt")).toBe("Inline diagram");
  });

  it("does not make linked in-body images zoom controls", async () => {
    const post = {
      ...mockPosts[0],
      html: '<a href="/x"><img src="/images/posts/linked.jpg" alt="Linked" /></a>',
    };
    const wrapper = shallowMount(PostView, {
      props: { post, posts: mockPosts },
    });

    const linkedImage = wrapper.find("article img");
    expect(linkedImage.attributes("role")).toBeUndefined();
    expect(linkedImage.attributes("tabindex")).toBeUndefined();

    await linkedImage.trigger("keydown", { key: "Enter" });
    expect(wrapper.findComponent(PostLightbox).props("src")).toBe(null);
  });

  it("labels a lone empty-alt image with the generic zoom label", () => {
    const post = {
      ...mockPosts[0],
      html: '<img src="/images/posts/decorative.jpg" alt="" />',
    };
    const wrapper = shallowMount(PostView, {
      props: { post, posts: mockPosts },
    });

    const image = wrapper.find("article img");
    expect(image.attributes("role")).toBe("button");
    expect(image.attributes("tabindex")).toBe("0");
    expect(image.attributes("aria-label")).toBe("Zoom image");
  });

  it("distinguishes multiple empty-alt images with positional labels", () => {
    const post = {
      ...mockPosts[0],
      html:
        '<img src="/images/posts/a.jpg" alt="" />' +
        '<img src="/images/posts/b.jpg" alt="" />',
    };
    const wrapper = shallowMount(PostView, {
      props: { post, posts: mockPosts },
    });

    const images = wrapper.findAll("article img");
    expect(images[0].attributes("aria-label")).toBe("Zoom image 1 of 2");
    expect(images[1].attributes("aria-label")).toBe("Zoom image 2 of 2");
  });

  it("labels a mixed set so empty-alt images are not falsely numbered", () => {
    const post = {
      ...mockPosts[0],
      html:
        '<img src="/images/posts/chart.jpg" alt="Chart" />' +
        '<img src="/images/posts/decorative.jpg" alt="" />',
    };
    const wrapper = shallowMount(PostView, {
      props: { post, posts: mockPosts },
    });

    const images = wrapper.findAll("article img");
    expect(images[0].attributes("aria-label")).toBe("Zoom image: Chart");
    // Only one generic control exists, so it must not claim "1 of 2".
    expect(images[1].attributes("aria-label")).toBe("Zoom image");
  });

  it("leaves images that already declare role or tabindex untouched", () => {
    const post = {
      ...mockPosts[0],
      html: '<img src="/images/posts/x.jpg" alt="Chart" tabindex="-1" />',
    };
    const wrapper = shallowMount(PostView, {
      props: { post, posts: mockPosts },
    });

    const image = wrapper.find("article img");
    expect(image.attributes("role")).toBeUndefined();
    expect(image.attributes("aria-haspopup")).toBeUndefined();
    expect(image.attributes("tabindex")).toBe("-1");
  });

  it("does not let an author-labeled empty-alt image inflate positional counts", () => {
    const post = {
      ...mockPosts[0],
      html:
        '<img src="/images/posts/a.jpg" alt="" aria-label="Site map" />' +
        '<img src="/images/posts/b.jpg" alt="" />',
    };
    const wrapper = shallowMount(PostView, {
      props: { post, posts: mockPosts },
    });

    const images = wrapper.findAll("article img");
    expect(images[0].attributes("aria-label")).toBe("Site map");
    // Only one generic control exists, so it must not claim "1 of 2".
    expect(images[1].attributes("aria-label")).toBe("Zoom image");
  });

  it("marks in-body zoom images as opening a dialog", () => {
    const post = {
      ...mockPosts[0],
      html: '<img src="/images/posts/inline.jpg" alt="Inline diagram" />',
    };
    const wrapper = shallowMount(PostView, {
      props: { post, posts: mockPosts },
    });

    expect(wrapper.find("article img").attributes("aria-haspopup")).toBe(
      "dialog",
    );
  });

  it("prevents the default Space action on the hero image", () => {
    const wrapper = shallowMount(PostView, {
      props: { post: mockPosts[0], posts: mockPosts },
    });

    const hero = wrapper.find(
      `img[src='${mockPosts[0].frontmatter.image}']`,
    ).element;
    const event = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true,
    });
    hero.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("preserves an author-provided aria-label on an in-body image", () => {
    const post = {
      ...mockPosts[0],
      html: '<img src="/images/posts/x.jpg" alt="Diagram" aria-label="Custom label" />',
    };
    const wrapper = shallowMount(PostView, {
      props: { post, posts: mockPosts },
    });

    expect(wrapper.find("article img").attributes("aria-label")).toBe(
      "Custom label",
    );
  });

  it("prevents the default Space action so the page does not scroll", async () => {
    const post = {
      ...mockPosts[0],
      html: '<img src="/images/posts/inline.jpg" alt="Inline diagram" />',
    };
    const wrapper = shallowMount(PostView, {
      props: { post, posts: mockPosts },
    });

    const image = wrapper.find("article img").element;
    const event = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true,
    });
    image.dispatchEvent(event);
    await wrapper.vm.$nextTick();

    expect(event.defaultPrevented).toBe(true);
    // preventDefault alone is not enough — the control must also open.
    expect(wrapper.findComponent(PostLightbox).props("src")).toContain(
      "/images/posts/inline.jpg",
    );
  });

  it("ignores keys other than Enter and Space on in-body images", async () => {
    const post = {
      ...mockPosts[0],
      html: '<img src="/images/posts/inline.jpg" alt="Inline diagram" />',
    };
    const wrapper = shallowMount(PostView, {
      props: { post, posts: mockPosts },
    });

    await wrapper.find("article img").trigger("keydown", { key: "a" });
    expect(wrapper.findComponent(PostLightbox).props("src")).toBe(null);
  });

  it("re-enriches in-body images after the post changes", async () => {
    const wrapper = shallowMount(PostView, {
      props: { post: mockPosts[0], posts: mockPosts },
    });

    const nextPost = {
      ...mockPosts[1],
      html: '<img src="/images/posts/next.jpg" alt="Next diagram" />',
    };
    await wrapper.setProps({ post: nextPost });

    const inlineImage = wrapper.find("article img");
    expect(inlineImage.attributes("role")).toBe("button");
    expect(inlineImage.attributes("tabindex")).toBe("0");
  });

  it("links each tag to /posts?tag=TAG", () => {
    const wrapper = shallowMount(PostView, {
      props: {
        post: mockPosts[0],
        posts: mockPosts,
      },
    });
    const tagLinks = wrapper.findAll("a[href^='/posts?tag=']");
    expect(tagLinks).toHaveLength(mockPosts[0].frontmatter.tags.length);
    tagLinks.forEach((link, i) => {
      expect(link.attributes("href")).toBe(
        `/posts?tag=${mockPosts[0].frontmatter.tags[i]}`,
      );
    });
  });
});

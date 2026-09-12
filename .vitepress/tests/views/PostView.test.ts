import { describe, it, expect, vi } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { mockResume, mockPosts } from "../__fixtures__/mockData";

vi.mock("@data/resume.ts", () => ({
  default: mockResume,
}));

import PostView from "@views/PostView.vue";
import PostLightbox from "@components/PostLightbox.vue";
import { toFilterSlug } from "@utils/archive";

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

  // Zoom-control attributes (role/tabindex/aria-haspopup/aria-label) are now
  // baked into post.html at markdown build time (markdownZoomImages.ts), so
  // this fixture pre-declares them as the real pipeline would; PostView's
  // job is only wiring the click/keydown interaction on top.
  it("opens the lightbox when Enter is pressed on an operable in-body image", async () => {
    const post = {
      ...mockPosts[0],
      html:
        "<p>Body</p>" +
        '<img src="/images/posts/inline.jpg" alt="Inline diagram" ' +
        'role="button" tabindex="0" aria-haspopup="dialog" ' +
        'aria-label="Zoom image: Inline diagram" />',
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

  // Since attribute enrichment now happens at build time, "the post changes"
  // just re-renders the incoming html as-is — verify the click delegation
  // (bound once on the article container) still routes interaction to the
  // new post's images rather than being stuck on the old one.
  it("routes interaction to the new post's in-body images after the post changes", async () => {
    const wrapper = shallowMount(PostView, {
      props: { post: mockPosts[0], posts: mockPosts },
    });

    const nextPost = {
      ...mockPosts[1],
      html:
        '<img src="/images/posts/next.jpg" alt="Next diagram" ' +
        'role="button" tabindex="0" aria-haspopup="dialog" ' +
        'aria-label="Zoom image: Next diagram" />',
    };
    await wrapper.setProps({ post: nextPost });

    const inlineImage = wrapper.find("article img");
    await inlineImage.trigger("keydown", { key: "Enter" });

    const lightbox = wrapper.findComponent(PostLightbox);
    expect(lightbox.props("src")).toContain("/images/posts/next.jpg");
    expect(lightbox.props("alt")).toBe("Next diagram");
  });

  it("links each tag to its crawlable tag archive route", () => {
    const wrapper = shallowMount(PostView, {
      props: {
        post: mockPosts[0],
        posts: mockPosts,
      },
    });
    const tagLinks = wrapper.findAll("a[href^='/posts/tag/']");
    expect(tagLinks).toHaveLength(mockPosts[0].frontmatter.tags.length);
    tagLinks.forEach((link, i) => {
      expect(link.attributes("href")).toBe(
        `/posts/tag/${toFilterSlug(mockPosts[0].frontmatter.tags[i])}`,
      );
    });
  });

  it("renders a route-less tag as plain text, not a dead link", () => {
    const post = {
      ...mockPosts[0],
      frontmatter: { ...mockPosts[0].frontmatter, tags: ["→", "react"] },
    };
    const wrapper = shallowMount(PostView, {
      props: { post, posts: mockPosts },
    });
    // The unroutable tag has no /posts/tag/ link, the routable one does.
    expect(wrapper.findAll("a[href^='/posts/tag/']")).toHaveLength(1);
    expect(wrapper.html()).toContain("#→");
    expect(wrapper.html()).not.toContain('href="/posts/tag/"');
  });
});

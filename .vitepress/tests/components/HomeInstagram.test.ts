import { describe, it, expect, vi, afterEach } from "vitest";
import { shallowMount, mount } from "@vue/test-utils";
import { createSSRApp, nextTick } from "vue";
import { renderToString } from "vue/server-renderer";
import { mockInstagramPosts, mockSocialLinks } from "../__fixtures__/mockData";

vi.mock("@content/instagram/instagram.data.ts", () => ({
  data: mockInstagramPosts,
}));

vi.mock("@data/socialLinks.ts", () => ({
  default: mockSocialLinks,
}));

vi.mock("@utils/formatDate", () => ({
  formatPostDate: () => "January 1, 2025",
}));

import HomeInstagram from "@components/HomeInstagram.vue";

describe("HomeInstagram", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders correctly", () => {
    // html() is read before the post-mount flush, so this snapshots the
    // SSR-matching index-0 state; Math.random is pinned as a guard in case a
    // flush is ever introduced.
    vi.spyOn(Math, "random").mockReturnValue(0);
    const wrapper = shallowMount(HomeInstagram);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("renders a stable first image on the server so client hydration matches", async () => {
    // A value that would pick a non-zero index if Math.random were used during render.
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const html = await renderToString(createSSRApp(HomeInstagram));

    // SSR must pick images[0] deterministically, never a random image, or Vue
    // reports a hydration mismatch when the client picks a different one.
    expect(html).toContain("/images/instagram/photo1-a.jpg");
    expect(html).not.toContain("/images/instagram/photo1-b.jpg");
    expect(html).toContain("/images/instagram/photo2-a.jpg");
    expect(html).not.toContain("/images/instagram/photo2-b.jpg");
  });

  it("hydrates the server markup without a mismatch warning", async () => {
    // Server and client see different Math.random values, mimicking two separate
    // JS executions. A component that picks the image during render would diverge
    // and log a hydration mismatch; picking after mount stays in sync.
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    const container = document.createElement("div");
    container.innerHTML = await renderToString(createSSRApp(HomeInstagram));

    randomSpy.mockReturnValue(0.99);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    createSSRApp(HomeInstagram).mount(container);
    await nextTick();

    // Assert on message content so an unrelated Vue dev warning doesn't fail this.
    const logged = [...errorSpy.mock.calls, ...warnSpy.mock.calls]
      .flat()
      .join(" ");
    expect(logged).not.toContain("Hydration");
  });

  it("swaps to a randomly picked image after mount", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const wrapper = mount(HomeInstagram);
    await nextTick();

    // onMounted randomizes each post's pick independently; with random pinned
    // high every tile lands on its own last image.
    expect(wrapper.html()).toContain("/images/instagram/photo1-b.jpg");
    expect(wrapper.html()).not.toContain("/images/instagram/photo1-a.jpg");
    expect(wrapper.html()).toContain("/images/instagram/photo2-b.jpg");
    expect(wrapper.html()).not.toContain("/images/instagram/photo2-a.jpg");
  });
});

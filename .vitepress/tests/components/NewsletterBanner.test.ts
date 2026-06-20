import { describe, it, expect, vi } from "vitest";
import { ref } from "vue";
import { shallowMount } from "@vue/test-utils";

vi.mock("@composables/useNewsletter", () => ({
  useNewsletter: () => ({
    email: ref(""),
    status: ref("idle"),
    errorMessage: ref(""),
    subscribe: vi.fn(),
  }),
}));

import NewsletterBanner from "@components/NewsletterBanner.vue";

describe("NewsletterBanner", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(NewsletterBanner);
    expect(wrapper.html()).toMatchSnapshot();
  });
});

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

import NewsletterTerminal from "@components/NewsletterTerminal.vue";

describe("NewsletterTerminal", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(NewsletterTerminal);
    expect(wrapper.html()).toMatchSnapshot();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";
import { shallowMount } from "@vue/test-utils";
import type { NewsletterStatus } from "../../theme/composables/useNewsletter";

const newsletterState = {
  email: ref(""),
  status: ref<NewsletterStatus>("idle"),
  errorMessage: ref(""),
  isSubscribedAddress: ref(false),
  subscribe: vi.fn(),
};

vi.mock("@composables/useNewsletter", () => ({
  useNewsletter: () => newsletterState,
}));

import NewsletterTerminal from "@components/NewsletterTerminal.vue";

function resetNewsletterState() {
  newsletterState.email.value = "";
  newsletterState.status.value = "idle";
  newsletterState.errorMessage.value = "";
  newsletterState.isSubscribedAddress.value = false;
  newsletterState.subscribe.mockClear();
}

describe("NewsletterTerminal", () => {
  beforeEach(resetNewsletterState);

  it("renders correctly", () => {
    const wrapper = shallowMount(NewsletterTerminal);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("leaves the email field enabled and hides the run button once the entered address is subscribed", () => {
    newsletterState.status.value = "success";
    newsletterState.isSubscribedAddress.value = true;

    const wrapper = shallowMount(NewsletterTerminal);

    const input = wrapper.find("input#email_address");
    expect(input.exists()).toBe(true);
    expect(input.attributes("disabled")).toBeUndefined();
    expect(wrapper.find('button[type="submit"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("subscribed — check your inbox");
  });

  it("shows the run button again and hides the confirmation when the visitor edits to a new address after success", () => {
    newsletterState.status.value = "success";
    newsletterState.isSubscribedAddress.value = false;

    const wrapper = shallowMount(NewsletterTerminal);

    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain("subscribed — check your inbox");
  });

  it("disables the field and button while a request is in flight", () => {
    newsletterState.status.value = "loading";

    const wrapper = shallowMount(NewsletterTerminal);

    expect(
      wrapper.find("input#email_address").attributes("disabled"),
    ).toBeDefined();
    expect(
      wrapper.find('button[type="submit"]').attributes("disabled"),
    ).toBeDefined();
  });

  it("renders the failure message when the request errors", () => {
    newsletterState.status.value = "error";
    newsletterState.errorMessage.value = "network error — please try again.";

    const wrapper = shallowMount(NewsletterTerminal);

    expect(wrapper.text()).toContain("network error — please try again.");
    expect(wrapper.text()).not.toContain("subscribed — check your inbox");
  });
});

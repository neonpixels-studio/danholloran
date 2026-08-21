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

import NewsletterBanner from "@components/NewsletterBanner.vue";

function resetNewsletterState() {
  newsletterState.email.value = "";
  newsletterState.status.value = "idle";
  newsletterState.errorMessage.value = "";
  newsletterState.isSubscribedAddress.value = false;
  newsletterState.subscribe.mockClear();
}

describe("NewsletterBanner", () => {
  beforeEach(resetNewsletterState);

  it("renders correctly", () => {
    const wrapper = shallowMount(NewsletterBanner);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("leaves the live region unpadded while it holds no message", () => {
    const wrapper = shallowMount(NewsletterBanner);

    expect(wrapper.get('[aria-live="polite"]').classes()).not.toContain("pb-6");
  });

  it("keeps the email field editable and hides the button once the entered address is subscribed", () => {
    newsletterState.status.value = "success";
    newsletterState.isSubscribedAddress.value = true;

    const wrapper = shallowMount(NewsletterBanner);

    const input = wrapper.find("input#email_address");
    expect(input.exists()).toBe(true);
    expect(input.attributes("disabled")).toBeUndefined();
    expect(wrapper.find('button[type="submit"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("Almost there");
    expect(wrapper.get('[aria-live="polite"]').classes()).toContain("pb-6");
  });

  it("shows the form button again and hides the confirmation when the visitor edits to a new address after success", () => {
    newsletterState.status.value = "success";
    newsletterState.isSubscribedAddress.value = false;

    const wrapper = shallowMount(NewsletterBanner);

    expect(wrapper.find("input#email_address").exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain("Almost there");
  });

  it("disables the field and button while a request is in flight", () => {
    newsletterState.status.value = "loading";

    const wrapper = shallowMount(NewsletterBanner);

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

    const wrapper = shallowMount(NewsletterBanner);

    expect(wrapper.text()).toContain("network error — please try again.");
    expect(wrapper.text()).not.toContain("Almost there");
  });
});

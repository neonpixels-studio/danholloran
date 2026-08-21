import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import NewsletterBanner from "@components/NewsletterBanner.vue";
import NewsletterTerminal from "@components/NewsletterTerminal.vue";

// Drives the real composable (no useNewsletter mock) so a disagreement between
// the components and the composable — the exact regression this feature guards
// against — fails here even when the flag-driven unit tests stay green.

const VALID_EMAIL = "reader@example.com";
const SECOND_EMAIL = "second@example.com";

function stubOkFetch() {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue({ ok: true } as Response);
}

describe("newsletter form editable after success", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["NewsletterBanner", NewsletterBanner],
    ["NewsletterTerminal", NewsletterTerminal],
  ])(
    "%s re-opens the submit control and re-POSTs when the visitor edits to a new address after success",
    async (_name, component) => {
      const fetchSpy = stubOkFetch();
      const wrapper = mount(component);

      await wrapper.find("input#email_address").setValue(VALID_EMAIL);
      await wrapper.find("form").trigger("submit");
      await flushPromises();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(wrapper.find('button[type="submit"]').exists()).toBe(false);

      await wrapper.find("input#email_address").setValue(SECOND_EMAIL);
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true);

      await wrapper.find("form").trigger("submit");
      await flushPromises();
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    },
  );

  it.each([
    ["NewsletterBanner", NewsletterBanner],
    ["NewsletterTerminal", NewsletterTerminal],
  ])(
    "%s does not re-POST when the visitor re-types an already-subscribed address",
    async (_name, component) => {
      const fetchSpy = stubOkFetch();
      const wrapper = mount(component);

      await wrapper.find("input#email_address").setValue(VALID_EMAIL);
      await wrapper.find("form").trigger("submit");
      await flushPromises();

      await wrapper.find("input#email_address").setValue(SECOND_EMAIL);
      await wrapper.find("input#email_address").setValue(VALID_EMAIL);
      expect(wrapper.find('button[type="submit"]').exists()).toBe(false);

      // Enter still fires implicit submit even with the button gone; the
      // composable guard must swallow it rather than re-POST.
      await wrapper.find("form").trigger("submit");
      await flushPromises();
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    },
  );
});

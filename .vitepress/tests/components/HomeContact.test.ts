import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, shallowMount } from "@vue/test-utils";

vi.mock("@data/resume", () => ({
  default: {},
  CURRENT_LOCATION: "Reno, NV",
}));

import HomeContact from "@components/HomeContact.vue";

describe("HomeContact", () => {
  it("renders correctly", () => {
    const wrapper = shallowMount(HomeContact);
    expect(wrapper.html()).toMatchSnapshot();
  });

  describe("required field validation", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchMock = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    async function fill(
      wrapper: ReturnType<typeof mount>,
      { name = "", email = "", message = "" } = {},
    ) {
      await wrapper.find('input[name="name"]').setValue(name);
      await wrapper.find('input[name="email"]').setValue(email);
      await wrapper.find('textarea[name="message"]').setValue(message);
    }

    async function submit(wrapper: ReturnType<typeof mount>) {
      await wrapper.find("form").trigger("submit.prevent");
      // allow the (potential) async fetch handler to settle
      await Promise.resolve();
      await wrapper.vm.$nextTick();
    }

    it("does not submit when all fields are empty", async () => {
      const wrapper = mount(HomeContact);
      await submit(wrapper);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(wrapper.find("#contactStatus").text()).toBe(
        "Please fill in all fields before sending.",
      );
      expect(wrapper.find("#contactStatus").classes()).toContain(
        "text-red-500",
      );
    });

    it("does not submit when the name is missing", async () => {
      const wrapper = mount(HomeContact);
      await fill(wrapper, { email: "a@b.com", message: "Hello there" });
      await submit(wrapper);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(wrapper.find("#contactStatus").text()).toBe(
        "Please fill in all fields before sending.",
      );
    });

    it("does not submit when the email is missing", async () => {
      const wrapper = mount(HomeContact);
      await fill(wrapper, { name: "Dan", message: "Hello there" });
      await submit(wrapper);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(wrapper.find("#contactStatus").text()).toBe(
        "Please fill in all fields before sending.",
      );
    });

    it("does not submit when the message is missing", async () => {
      const wrapper = mount(HomeContact);
      await fill(wrapper, { name: "Dan", email: "a@b.com" });
      await submit(wrapper);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(wrapper.find("#contactStatus").text()).toBe(
        "Please fill in all fields before sending.",
      );
    });

    it("does not submit when fields contain only whitespace", async () => {
      const wrapper = mount(HomeContact);
      await fill(wrapper, { name: "   ", email: "  ", message: "   " });
      await submit(wrapper);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(wrapper.find("#contactStatus").text()).toBe(
        "Please fill in all fields before sending.",
      );
    });

    it("submits when all fields are filled in", async () => {
      const wrapper = mount(HomeContact);
      await fill(wrapper, {
        name: "Dan",
        email: "a@b.com",
        message: "Hello there",
      });
      await submit(wrapper);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe("/");
      const params = new URLSearchParams(options.body as string);
      expect(params.get("name")).toBe("Dan");
      expect(params.get("email")).toBe("a@b.com");
      expect(params.get("message")).toBe("Hello there");
      expect(wrapper.find("#contactStatus").text()).toBe(
        "Message sent — I'll be in touch soon.",
      );
    });

    it("trims surrounding whitespace from submitted values", async () => {
      const wrapper = mount(HomeContact);
      await fill(wrapper, {
        name: "  Dan  ",
        email: "  a@b.com  ",
        message: "  Hello there  ",
      });
      await submit(wrapper);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const params = new URLSearchParams(
        fetchMock.mock.calls[0][1].body as string,
      );
      expect(params.get("name")).toBe("Dan");
      expect(params.get("email")).toBe("a@b.com");
      expect(params.get("message")).toBe("Hello there");
    });
  });
});

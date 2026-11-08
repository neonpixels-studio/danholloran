import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import PostAlertMessage from "@components/PostAlertMessage.vue";

describe("PostAlertMessage", () => {
  it("renders the message as an accessible note", () => {
    const wrapper = mount(PostAlertMessage, {
      props: { message: "This project is no longer maintained." },
    });
    expect(wrapper.attributes("role")).toBe("note");
    expect(wrapper.text()).toBe("This project is no longer maintained.");
    expect(wrapper.html()).toMatchSnapshot();
  });

  it("renders nothing without a message", () => {
    const wrapper = mount(PostAlertMessage);
    expect(wrapper.find("aside").exists()).toBe(false);
  });

  it("renders nothing for a whitespace-only message", () => {
    const wrapper = mount(PostAlertMessage, { props: { message: "   " } });
    expect(wrapper.find("aside").exists()).toBe(false);
  });

  it("renders nothing for a non-string message", () => {
    const wrapper = mount(PostAlertMessage, {
      props: { message: true as unknown as string },
    });
    expect(wrapper.find("aside").exists()).toBe(false);
  });
});

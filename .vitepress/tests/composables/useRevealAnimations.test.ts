// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createApp, defineComponent } from "vue";
import { useRevealAnimations } from "../../composables/useRevealAnimations";

const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

type ObserverCallback = (
  _entries: IntersectionObserverEntry[],
  _observer: IntersectionObserver,
) => void;
type ObserverOptions = { threshold?: number | number[]; rootMargin?: string };

type IOInstance = {
  cb: ObserverCallback;
  options?: ObserverOptions;
};
let ioInstances: IOInstance[] = [];

class MockIntersectionObserver {
  cb: ObserverCallback;
  options?: ObserverOptions;
  observe = mockObserve;
  unobserve = mockUnobserve;
  disconnect = mockDisconnect;

  constructor(cb: ObserverCallback, options?: ObserverOptions) {
    this.cb = cb;
    this.options = options;
    ioInstances.push(this);
  }
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

function withSetup(composable: () => void) {
  const app = createApp(
    defineComponent({
      setup() {
        composable();
        return () => null;
      },
    }),
  );
  app.mount(document.createElement("div"));
  return app;
}

describe("useRevealAnimations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ioInstances = [];
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("creates two IntersectionObserver instances on mount", () => {
    withSetup(useRevealAnimations);
    expect(ioInstances).toHaveLength(2);
  });

  it("passes correct options to the main observer", () => {
    withSetup(useRevealAnimations);
    expect(ioInstances[0].options).toEqual({
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px",
    });
  });

  it("passes correct options to the accent-line observer", () => {
    withSetup(useRevealAnimations);
    expect(ioInstances[1].options).toEqual({ threshold: 0.5 });
  });

  it("observes .reveal, .reveal-left, .reveal-right, .stagger elements via the main observer", () => {
    document.body.innerHTML = `
      <div class="reveal"></div>
      <div class="reveal-left"></div>
      <div class="reveal-right"></div>
      <div class="stagger"></div>
    `;
    withSetup(useRevealAnimations);
    expect(mockObserve).toHaveBeenCalledTimes(4);
  });

  it("observes .accent-line elements via the line observer", () => {
    document.body.innerHTML = `
      <div class="accent-line"></div>
      <div class="accent-line"></div>
    `;
    withSetup(useRevealAnimations);
    expect(mockObserve).toHaveBeenCalledTimes(2);
  });

  it("does not call observe when no matching elements exist", () => {
    withSetup(useRevealAnimations);
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it('adds "in" class and unobserves the element when intersecting', () => {
    withSetup(useRevealAnimations);
    const el = document.createElement("div");
    ioInstances[0].cb(
      [{ isIntersecting: true, target: el } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(el.classList.contains("in")).toBe(true);
    expect(mockUnobserve).toHaveBeenCalledWith(el);
  });

  it('does not add "in" class or unobserve when not intersecting', () => {
    withSetup(useRevealAnimations);
    const el = document.createElement("div");
    ioInstances[0].cb(
      [{ isIntersecting: false, target: el } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(el.classList.contains("in")).toBe(false);
    expect(mockUnobserve).not.toHaveBeenCalled();
  });

  it("disconnects both observers on unmount", () => {
    const app = withSetup(useRevealAnimations);
    app.unmount();
    expect(mockDisconnect).toHaveBeenCalledTimes(2);
  });
});

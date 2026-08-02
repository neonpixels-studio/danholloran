import { watch, onMounted, onUnmounted, nextTick, type Ref } from "vue";

const FOCUSABLE_SELECTOR = [
  "a[href]:not([tabindex='-1'])",
  "button:not([disabled]):not([tabindex='-1'])",
  "input:not([disabled]):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "iframe",
  "summary",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function isReachable(element: HTMLElement): boolean {
  return !element.hasAttribute("hidden") && !element.closest("[inert]");
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(isReachable);
}

/**
 * Given the container and the direction of travel, returns the element a Tab
 * press should move focus to in order to stay trapped, or null when the browser
 * default is already safe. Pure so it can be unit-tested in isolation.
 *
 * Elements are taken in DOM order; positive `tabindex` ordering is not honored.
 */
export function trapTarget(
  container: HTMLElement,
  shiftKey: boolean,
  activeElement: Element | null,
): HTMLElement | null {
  const focusable = getFocusable(container);
  if (!focusable.length) {
    return container;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const currentIndex = focusable.indexOf(activeElement as HTMLElement);
  if (currentIndex === -1) {
    return shiftKey ? last : first;
  }
  if (shiftKey && currentIndex === 0) {
    return last;
  }
  if (!shiftKey && currentIndex === focusable.length - 1) {
    return first;
  }
  return null;
}

/**
 * Traps keyboard focus inside `container` while `isActive` is true: focus moves
 * in on activation, Tab/Shift+Tab cycle within the container, and focus is
 * restored to the previously-focused element on deactivation.
 *
 * `container` should itself be focusable (e.g. `tabindex="-1"`) so focus has a
 * home when it holds no focusable descendants.
 */
export function useFocusTrap(
  container: Ref<HTMLElement | null>,
  isActive: Readonly<Ref<boolean>>,
) {
  let previouslyFocused: HTMLElement | null = null;

  function activate() {
    const element = container.value;
    if (!element) {
      return;
    }
    previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = getFocusable(element);
    const target = focusable[0] ?? element;
    target.focus();
  }

  function restore() {
    const target = previouslyFocused;
    previouslyFocused = null;
    if (target?.isConnected) {
      target.focus();
      return;
    }
    document.body.focus();
  }

  function onKeydown(event: KeyboardEvent) {
    if (!isActive.value || event.key !== "Tab") {
      return;
    }
    const element = container.value;
    if (!element) {
      return;
    }
    const target = trapTarget(element, event.shiftKey, document.activeElement);
    if (!target) {
      return;
    }
    event.preventDefault();
    target.focus();
  }

  watch(isActive, async (active) => {
    if (!active) {
      restore();
      return;
    }
    await nextTick();
    if (!isActive.value) {
      return;
    }
    activate();
  });

  onMounted(() => {
    document.addEventListener("keydown", onKeydown);
    if (isActive.value) {
      activate();
    }
  });
  onUnmounted(() => {
    document.removeEventListener("keydown", onKeydown);
    if (isActive.value) {
      restore();
    }
  });
}

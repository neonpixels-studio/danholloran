import { FIRST_PAGE_SIZE } from "./archive";

export const STAGGER_STEP_MS = 60;

// One .td-<ms> class per step lives in style.css, enough for a full first
// page (the largest page); later cards would otherwise lose their delay.
export const MAX_STAGGER_INDEX = FIRST_PAGE_SIZE - 1;

export function staggerDelayClass(index: number): string {
  const step = Math.min(Math.max(index, 0), MAX_STAGGER_INDEX);
  return `td-${step * STAGGER_STEP_MS}`;
}

import type { GrimicornToolKind } from "@typedefs";

/**
 * Icon paths for each tool kind, shared by every Grimicorn theme download
 * page so a new tool kind only needs an icon defined once.
 */
export const GRIMICORN_TOOL_ICON_PATHS: Record<GrimicornToolKind, string> = {
  editor:
    '<path d="M3 3h12v10H3z" /><path d="M3 6h12" /><path d="M5.5 4.5h.01" />',
  terminal:
    '<path d="M3 3h12v10H3z" /><path d="M5.5 6.5l2 2-2 2" stroke-linejoin="round" /><path d="M9 10.5h3" />',
  git: '<circle cx="5" cy="5" r="1.6" /><circle cx="5" cy="13" r="1.6" /><circle cx="13" cy="9" r="1.6" /><path d="M5 6.6v4.8M6.5 5h4.4a1.6 1.6 0 0 1 1.6 1.6V8" />',
  notes:
    '<path d="M4 2.5h7L14 6v9.5H4z" /><path d="M11 2.5V6h3" /><path d="M6.5 9h5M6.5 11.5h5" />',
  agent:
    '<path d="M9 2.5l5 2.8v5.4L9 13.5 4 10.7V5.3z" stroke-linejoin="round" /><circle cx="9" cy="8" r="1.7" />',
  highlighter:
    '<path d="M6.5 6L3.5 9l3 3" stroke-linejoin="round" /><path d="M11.5 6l3 3-3 3" stroke-linejoin="round" /><path d="M10 4.5l-2 9" />',
};

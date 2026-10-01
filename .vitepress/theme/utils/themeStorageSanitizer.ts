import { STORAGE_KEY, THEMES } from "../composables/useAppearance";

// VitePress's blocking #check-dark-mode script treats any stored value other
// than "auto"/"dark" as light, while readStored() treats an invalid value as
// "auto". Dropping an invalid value before that script runs makes both agree
// (auto) and avoids a light-to-dark flash on mount (#422).
// Storage can be blocked (private mode, sandboxed iframe); this blocking script
// must never throw and stop the page from rendering.
export function buildThemeSanitizeScript(): string {
  const key = JSON.stringify(STORAGE_KEY);
  const legalValues = JSON.stringify(THEMES);
  return `;(() => {
  try {
    const stored = localStorage.getItem(${key})
    if (stored !== null && !${legalValues}.includes(stored)) {
      localStorage.removeItem(${key})
    }
  } catch {}
})()`;
}

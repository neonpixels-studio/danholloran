// VitePress hands these to vueuse's useDark. Its default (disableTransition:
// true) creates a <style> element at runtime to suppress transitions while the
// `dark` class flips, which the hashed CSP cannot cover (style-src-elem).
// Accepted tradeoff: the theme's own toggle (useAppearance.ts) already flips
// the class without suppressing transitions, so nothing new animates; do not
// switch this back to the default.
export const APPEARANCE_OPTIONS = { disableTransition: false };

// VitePress hands these to vueuse's useDark. Its default (disableTransition:
// true) creates a <style> element at runtime to suppress transitions while the
// `dark` class flips, which the hashed CSP cannot cover (style-src-elem).
export const APPEARANCE_OPTIONS = { disableTransition: false };

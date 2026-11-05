// VitePress hardcodes a render-blocking <link> to vp-icons.css into every
// page's <head>. That file only holds the default theme's social-link icon
// masks, which this custom theme never uses, so it's empty yet still costs a
// blocking round trip (~300ms in Lighthouse's mobile simulation).

export const ICONS_STYLESHEET_FILE = "vp-icons.css";

const ICONS_STYLESHEET_LINK = `<link rel="preload stylesheet" href="/${ICONS_STYLESHEET_FILE}" as="style">`;

// Throws rather than passing the page through untouched, so a VitePress
// template change can't quietly bring the blocking request back.
export function removeIconsStylesheetLink(html: string): string {
  if (!html.includes(ICONS_STYLESHEET_LINK)) {
    throw new Error(
      `Expected VitePress's ${ICONS_STYLESHEET_FILE} <link> in the page head; its template changed, so update iconsStylesheet.ts.`,
    );
  }
  return html.replace(ICONS_STYLESHEET_LINK, "");
}

// Guards the removal above: if a page ever starts using VitePress social
// icons, the stylesheet has real content and dropping its <link> would break
// them.
export function assertIconsStylesheetEmpty(css: string): void {
  if (css.trim() === "") {
    return;
  }
  throw new Error(
    `${ICONS_STYLESHEET_FILE} is no longer empty, but its <link> is stripped from every page. Remove removeIconsStylesheetLink from config.ts or stop using VitePress social icons.`,
  );
}

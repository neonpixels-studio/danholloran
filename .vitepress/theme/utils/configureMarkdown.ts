import type { MarkdownRenderer } from "vitepress";
import {
  applyMarkdownImageHints,
  readLocalImageDimensions,
} from "./markdownImageHints";
import { applyMarkdownZoomImageHints } from "./markdownZoomImages";

// The site's markdown.config wiring, extracted out of config.ts so tests can
// import it directly. config.ts has its own top-level side effects (reading
// the Shiki theme files via `new URL(..., import.meta.url)`), which resolve
// differently — and throw — under a test runner's module loader; this module
// has none, so exercising the exact production wiring in a test doesn't
// require importing all of config.ts along with it.
export function configureMarkdown(md: MarkdownRenderer): void {
  applyMarkdownImageHints(md, readLocalImageDimensions);
  applyMarkdownZoomImageHints(md);
}

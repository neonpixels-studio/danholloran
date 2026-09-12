import { createContentLoader } from "vitepress";
import type { InstagramContentItem } from "@typedefs";
import { INSTAGRAM_GLOB, transformInstagram } from "./transformInstagram.ts";

// VitePress rewrites this module at build time to add the `data` export
// below; nothing here checks it against what `transform` actually returns,
// so this declaration is the only contract consumers get.
declare const data: InstagramContentItem[];
export { data };

export default createContentLoader(INSTAGRAM_GLOB, {
  transform: transformInstagram,
});

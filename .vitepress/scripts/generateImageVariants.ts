// Entry point for `npm run images`, run with Node's built-in type stripping
// (no bundler), which is why the imports it pulls in use explicit .ts
// extensions.
import { generateImageVariants } from "../theme/utils/generateImageVariants.ts";

const { encoded, removed } = await generateImageVariants();

console.log(
  `Image variants: encoded ${encoded.length} image(s), removed ${removed.length} orphaned file(s).`,
);

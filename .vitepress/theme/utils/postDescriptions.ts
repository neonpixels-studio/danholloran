import { coerceFrontmatterString, parseFrontmatter } from "./frontmatter";

// Google truncates meta descriptions around 155-160 characters.
export const MAX_DESCRIPTION_LENGTH = 160;

// Same coercion the site applies when it renders the description, so the
// check measures what visitors and crawlers actually get. "" means missing.
export function readDescription(markdown: string): string {
  return coerceFrontmatterString(parseFrontmatter(markdown).data.description);
}

export function isDescriptionTooLong(description: string): boolean {
  return description.length > MAX_DESCRIPTION_LENGTH;
}

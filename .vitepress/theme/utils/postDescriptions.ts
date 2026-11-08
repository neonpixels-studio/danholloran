import { parse } from "yaml";

// Google truncates meta descriptions around 155-160 characters.
export const MAX_DESCRIPTION_LENGTH = 160;

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

export function readDescription(markdown: string): string | undefined {
  const match = markdown.match(FRONTMATTER);
  if (!match) {
    return undefined;
  }
  const description = parse(match[1])?.description;
  return typeof description === "string" ? description : undefined;
}

export function isDescriptionTooLong(
  description: string | undefined,
  maxLength: number = MAX_DESCRIPTION_LENGTH,
): boolean {
  return (description?.length ?? 0) > maxLength;
}

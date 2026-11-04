const FENCED_CODE_BLOCK =
  /^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[ \t]*$/gm;
const EMPTY_ALT_IMAGE = /!\[\s*\]\(/;

export interface EmptyAltImage {
  line: number;
  text: string;
}

// Blank out fenced code (keeping newlines) so examples that show markdown
// image syntax are not flagged and reported line numbers stay accurate.
function maskFencedCode(markdown: string): string {
  return markdown.replace(FENCED_CODE_BLOCK, (block) =>
    block.replace(/[^\n]/g, " "),
  );
}

export function findEmptyAltImages(markdown: string): EmptyAltImage[] {
  return maskFencedCode(markdown)
    .split("\n")
    .map((text, index) => ({ line: index + 1, text: text.trim() }))
    .filter((entry) => EMPTY_ALT_IMAGE.test(entry.text));
}

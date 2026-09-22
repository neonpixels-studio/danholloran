// AppSearch renders titles/descriptions through v-html so the search-term
// match can be wrapped in a <mark> element. Both fields are content-derived
// (post frontmatter, project copy) rather than sanitized HTML, so every piece
// of surrounding text must be escaped before it reaches the template —
// otherwise a title/description containing markup becomes an XSS surface via
// v-html. Escaping happens on each slice BEFORE the <mark> wrapper is
// concatenated in, so only the wrapper itself is real HTML.
//
// The match is located with a plain case-insensitive indexOf, not a
// user-built RegExp, so there's no special-regex-character injection surface
// to guard against here.
const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);
}

const MARK_OPEN =
  '<mark class="bg-accent-dim text-on-accent-dim rounded-[2px] px-0.5">';
const MARK_CLOSE = "</mark>";

/**
 * Escapes `text` and wraps the first case-insensitive occurrence of `query`
 * in a `<mark>` element. Safe to render via `v-html` — every non-markup
 * character is HTML-escaped before the `<mark>` wrapper is added.
 */
export function highlightMatch(text: string, query: string): string {
  if (!query) {
    return escapeHtml(text);
  }
  const loweredText = text.toLowerCase();
  const loweredQuery = query.toLowerCase();
  // toLowerCase() can change a string's length for some Unicode characters
  // (e.g. "İ" lowercases to two code units), which would desync the index
  // found here from the original `text` it's about to slice. That's rare
  // enough to just skip highlighting rather than risk slicing mid-character.
  if (loweredText.length !== text.length) {
    return escapeHtml(text);
  }
  const matchIndex = loweredText.indexOf(loweredQuery);
  if (matchIndex < 0) {
    return escapeHtml(text);
  }
  const matchEnd = matchIndex + query.length;
  return (
    escapeHtml(text.slice(0, matchIndex)) +
    MARK_OPEN +
    escapeHtml(text.slice(matchIndex, matchEnd)) +
    MARK_CLOSE +
    escapeHtml(text.slice(matchEnd))
  );
}

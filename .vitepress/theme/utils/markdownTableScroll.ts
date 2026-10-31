import type { MarkdownRenderer } from "vitepress";

const TABLE_SCROLL_OPEN = '<div class="table-scroll">\n';
const TABLE_SCROLL_CLOSE = "</div>\n";

// A scrolling `display: block` table shrink-wraps its columns, leaving a gap
// beside narrow tables. Scrolling a wrapper instead lets the table stay a real
// table that fills the column.
export function applyMarkdownTableScroll(md: MarkdownRenderer): void {
  md.renderer.rules.table_open = (tokens, index, options, _env, self) =>
    TABLE_SCROLL_OPEN + self.renderToken(tokens, index, options);
  md.renderer.rules.table_close = (tokens, index, options, _env, self) =>
    self.renderToken(tokens, index, options) + TABLE_SCROLL_CLOSE;
}

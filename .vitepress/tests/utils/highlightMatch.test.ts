import { describe, it, expect } from "vitest";
import { escapeHtml, highlightMatch } from "../../theme/utils/highlightMatch";

// Mirrors the markup highlightMatch itself produces, kept as a literal
// (not imported) so a test still fails if the markup changes by accident.
const MARK_OPEN =
  '<mark class="bg-accent-dim text-on-accent-dim rounded-[2px] px-0.5">';
const MARK_CLOSE = "</mark>";

describe("escapeHtml", () => {
  it("escapes all five HTML-significant characters", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });

  it("leaves plain text unchanged", () => {
    expect(escapeHtml("First Post")).toBe("First Post");
  });
});

describe("highlightMatch", () => {
  it("escapes an HTML-bearing title with no query, executing no markup", () => {
    const title = '<img src=x onerror="alert(1)">';

    const result = highlightMatch(title, "");

    expect(result).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(result).not.toContain("<img");
  });

  it("escapes an HTML-bearing description around a matched query, preserving only the <mark> wrapper", () => {
    const description = '<script>alert("xss")</script> first post';

    const result = highlightMatch(description, "first");

    expect(result).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; " +
        `${MARK_OPEN}first${MARK_CLOSE} post`,
    );
    // The only literal "<" and ">" left are the intended <mark> tags.
    expect(result.match(/<(?!\/?mark)/gi)).toBeNull();
  });

  it("matches case-insensitively while preserving the original casing in the output", () => {
    const result = highlightMatch("First Post", "FIRST");

    expect(result).toBe(`${MARK_OPEN}First${MARK_CLOSE} Post`);
  });

  it("returns the escaped string unchanged when the query does not match", () => {
    const result = highlightMatch("<b>bold</b> title", "zzz");

    expect(result).toBe("&lt;b&gt;bold&lt;/b&gt; title");
  });

  it("treats special-regex characters in the query as literal text, not a pattern", () => {
    const result = highlightMatch("cost: $5 (approx.)", "$5 (approx.)");

    expect(result).toBe(`cost: ${MARK_OPEN}$5 (approx.)${MARK_CLOSE}`);
  });

  it("skips highlighting rather than mis-slicing when lowercasing changes the string length", () => {
    // "İ" (U+0130) lowercases to a two-code-unit "i̇", which would desync a
    // lowercased match index from the original string's slice points.
    const result = highlightMatch("İstanbul", "stanbul");

    expect(result).toBe("İstanbul");
    expect(result).not.toContain("<mark");
  });

  it("wraps the full multi-code-unit lowered form of a query that expands on lowercasing", () => {
    // "İ" (U+0130) lowercases to "i" + combining dot above (U+0307), two code
    // units. The match end must be measured in the lowered query's units, not
    // the original query's, or the combining mark gets sliced outside <mark>.
    const result = highlightMatch("i̇stanbul", "İ");

    expect(result).toBe(`${MARK_OPEN}i̇${MARK_CLOSE}stanbul`);
  });

  it("escapes HTML characters that fall inside the matched span, not just around it", () => {
    const result = highlightMatch("use <b> tags", "<b>");

    expect(result).toBe(`use ${MARK_OPEN}&lt;b&gt;${MARK_CLOSE} tags`);
  });
});

import { describe, it, expect } from "vitest";
import { escapeHtml, highlightMatch } from "../../theme/utils/highlightMatch";

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
        '<mark class="bg-accent-dim text-on-accent-dim rounded-[2px] px-0.5">first</mark> post',
    );
    // The only literal "<" and ">" left are the intended <mark> tags.
    expect(result.match(/<(?!\/?mark)/gi)).toBeNull();
  });

  it("matches case-insensitively while preserving the original casing in the output", () => {
    const result = highlightMatch("First Post", "FIRST");

    expect(result).toBe(
      '<mark class="bg-accent-dim text-on-accent-dim rounded-[2px] px-0.5">First</mark> Post',
    );
  });

  it("returns the escaped string unchanged when the query does not match", () => {
    const result = highlightMatch("<b>bold</b> title", "zzz");

    expect(result).toBe("&lt;b&gt;bold&lt;/b&gt; title");
  });

  it("treats special-regex characters in the query as literal text, not a pattern", () => {
    const result = highlightMatch("cost: $5 (approx.)", "$5 (approx.)");

    expect(result).toBe(
      'cost: <mark class="bg-accent-dim text-on-accent-dim rounded-[2px] px-0.5">$5 (approx.)</mark>',
    );
  });
});

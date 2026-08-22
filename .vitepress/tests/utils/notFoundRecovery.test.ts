import { describe, it, expect } from "vitest";
import {
  buildNotFoundRecoveryHtml,
  injectNotFoundRecovery,
} from "../../theme/utils/notFoundRecovery";
import { SITE_URL } from "../../theme/utils/constants";

describe("buildNotFoundRecoveryHtml", () => {
  it("wraps the recovery block in <noscript> so JS visitors never see it", () => {
    const html = buildNotFoundRecoveryHtml();

    expect(html.startsWith("<noscript>")).toBe(true);
    expect(html.endsWith("</noscript>")).toBe(true);
  });

  it("links to the key recovery destinations, including the agent-facing files", () => {
    const html = buildNotFoundRecoveryHtml();

    expect(html).toContain('href="/"');
    expect(html).toContain('href="/posts/"');
    expect(html).toContain('href="/resume"');
    expect(html).toContain('href="/feed.xml"');
    expect(html).toContain('href="/sitemap.xml"');
    expect(html).toContain('href="/llms.txt"');
  });

  it("names the 404 status and points at the site root", () => {
    const html = buildNotFoundRecoveryHtml();

    expect(html).toContain("404");
    expect(html).toContain(SITE_URL);
  });

  it("builds the links as a <ul> of <li>, not stacked paragraphs", () => {
    const html = buildNotFoundRecoveryHtml();

    expect(html).toContain("<ul>");
    expect(html).toContain("<li><a");
  });
});

describe("injectNotFoundRecovery", () => {
  it("splices the recovery block in just before </body>", () => {
    const input = '<html><body><div id="app"></div></body></html>';

    const output = injectNotFoundRecovery(input);

    expect(output).toContain("<noscript>");
    expect(output.indexOf("<noscript>")).toBeLessThan(
      output.indexOf("</body>"),
    );
  });

  it("returns the HTML unchanged when there is no closing body tag", () => {
    const input = '<html><div id="app"></div></html>';

    expect(injectNotFoundRecovery(input)).toBe(input);
  });
});

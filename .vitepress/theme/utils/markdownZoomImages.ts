import type { MarkdownRenderer } from "vitepress";

// PostView used to grant in-body <img> elements role="button", tabindex="0",
// and aria-haspopup="dialog" client-side (onMounted + a watcher on
// post.html), so the static HTML shipped inert — a keyboard/AT user landing
// before hydration finished saw plain, non-interactive images. This module
// hooks the same markdown-it image rule applyMarkdownImageHints installs
// (both are wired together in .vitepress/config.ts's markdown.config) to
// bake the zoom-control semantics into the rendered HTML at build time
// instead, so the control is operable in the pre-hydration markup. PostView
// still owns *opening* the lightbox (click/keydown delegation on the article
// container), since that behavior is inherently client-side.
//
// Positional "N of M" labels distinguish otherwise-identical alt-less images
// for AT users. Computing them requires knowing the whole document's count
// up front, but the renderer visits one image at a time, so this module
// walks the token tree twice: a core rule (after inline parsing, so every
// image token's final children exist) counts how many alt-less, unlabeled
// images the document has, then the render-rule pass hands each one its
// position in that count. `env` is the same object markdown-it threads from
// core state through to the renderer, so it carries state between the two
// passes.
//
// This markdown.config hook runs for every markdown file the site renders
// (index.md, resume.md, themes/*.md, feed generation, every post), but only
// PostView's <article> has a click/keydown handler ready to open the
// lightbox — an aria-haspopup="dialog" control with nothing listening is
// worse than no control. VitePress's bundled frontmatter core rule populates
// `env.frontmatter` from the file's YAML block even when the caller passes
// no env at all (createContentLoader's `md.render(src)` call — the path that
// produces post.html — passes none), so gating on the Post-only `topic`
// field scopes this to post bodies specifically. `topic` alone (not also
// `date`) is deliberate: loadPublishedPosts.ts documents that an undated
// post is legitimate (e.g. some travel entries), and an unquoted YAML date
// parses as a `Date` object rather than a string anyway — `topic` has
// neither risk and no other page or content type in this repo sets it.
//
// An image token's `alt` attr is still the empty placeholder markdown-it
// seeds at parse time — the real text is only written into attrs by the
// base image render rule, deeper in the delegation chain than this module
// runs. Alt text here is instead resolved via an injected resolver backed by
// markdown-it's own Renderer#renderInlineAsText (the exact function the base
// rule itself uses), rather than a hand-rolled reimplementation that would
// drift from markdown-it's actual token handling.
//
// A linked image's click is a navigation, not a zoom — those are left alone
// entirely, mirroring the client behavior this replaces. This site enables
// markdown-it-attrs (VitePress's default), so an author can write
// `![x](/a.png){tabindex="-1"}` to opt an image out by hand; such an image is
// excluded from the generic count too, so it doesn't consume a position
// number that then goes unused. A raw HTML anchor wrapping an image
// (`<a href="/x">![y](z.png)</a>`) on a single line is also detected, but one
// that spans multiple blocks (the anchor tags as their own paragraphs, the
// image in between) is not — a narrow, undisclosed-elsewhere gap flagged as
// a follow-up rather than fixed here, since nothing in this site's current
// content does that and markdown link syntax is the natural way to write it.
// Images written as raw <img> HTML inside markdown arrive as html tokens
// rather than image tokens (see markdownImageHints.ts's own note on this),
// so — like the dimension hints — they are not enriched; this module warns
// at build time when it sees one in a post, since that image would
// otherwise silently lose keyboard access with nothing surfacing the gap.

const ZOOM_LABEL = "Zoom image";

const ROLE_ATTRIBUTE = "role";
const TABINDEX_ATTRIBUTE = "tabindex";
const ARIA_LABEL_ATTRIBUTE = "aria-label";
const ARIA_HASPOPUP_ATTRIBUTE = "aria-haspopup";
const ROLE_BUTTON = "button";
const OPERABLE_TABINDEX = "0";
const HASPOPUP_DIALOG = "dialog";

const IMAGE_TOKEN_TYPE = "image";
const INLINE_TOKEN_TYPE = "inline";
const LINK_OPEN_TYPE = "link_open";
const LINK_CLOSE_TYPE = "link_close";
const HTML_INLINE_TOKEN_TYPE = "html_inline";
const HTML_BLOCK_TOKEN_TYPE = "html_block";
const RAW_IMG_TAG_PATTERN = /<img[\s>]/i;

// Raw HTML anchors mixed into markdown (`<a href="/x">![y](z.png)</a>`)
// arrive as html_inline tokens rather than link_open/link_close, but they
// wrap a click target exactly the same way.
const HTML_ANCHOR_OPEN_PATTERN = /^<a[\s>]/i;
const HTML_ANCHOR_CLOSE_PATTERN = /^<\/a\s*>/i;

// Namespaced so this module's build-pass state can't collide with another
// markdown-it plugin's use of the same env object.
const GENERIC_TOTAL_ENV_KEY = "zoomImageGenericTotal";
const GENERIC_POSITION_ENV_KEY = "zoomImageGenericPosition";
const CORE_RULE_NAME = "zoom_image_generic_total";

// Positional suffix keeps decorative (empty-alt) images distinguishable to AT
// instead of collapsing them all into an identical "Zoom image" stop.
// position/total are 0 for an image that isn't part of the generic count.
export function zoomLabelFor(alt: string, position = 0, total = 0): string {
  if (alt.trim()) {
    return `${ZOOM_LABEL}: ${alt}`;
  }
  if (position > 0 && total > 1) {
    return `${ZOOM_LABEL} ${position} of ${total}`;
  }
  return ZOOM_LABEL;
}

// The slice of a markdown-it Token this module needs: attribute read/write
// (mirroring markdownImageHints.ts's ImageToken) plus `type`/`content`/
// `children` for walking sibling and child tokens. Declaring it locally lets
// tests drive the logic with a lightweight fake token instead of a full
// markdown-it instance.
export interface ZoomToken {
  type: string;
  content: string;
  children: ZoomToken[] | null;
  attrIndex(_name: string): number;
  attrGet(_name: string): string | null;
  attrSet(_name: string, _value: string): void;
}

// Resolves an image token's rendered alt text from its child tokens. Backed
// in production by markdown-it's own Renderer#renderInlineAsText so this
// module never has to re-derive markdown-it's token-handling rules itself;
// injected so tests can drive the logic with a trivial fake.
export type AltTextResolver = (_children: ZoomToken[] | null) => string;

function isPostFrontmatter(frontmatter: unknown): boolean {
  if (!frontmatter || typeof frontmatter !== "object") {
    return false;
  }
  const record = frontmatter as Record<string, unknown>;
  return typeof record.topic === "string";
}

function postLabelFor(frontmatter: Record<string, unknown>): string {
  if (typeof frontmatter.slug === "string") {
    return frontmatter.slug;
  }
  if (typeof frontmatter.title === "string") {
    return frontmatter.title;
  }
  return "unknown post";
}

function warnIfRawImgTag(token: ZoomToken, postLabel: string): void {
  if (!RAW_IMG_TAG_PATTERN.test(token.content)) {
    return;
  }
  console.warn(
    `markdownZoomImages: "${postLabel}" has a raw <img> tag in its markdown ` +
      "body; only ![]() markdown image syntax gets zoom-control keyboard " +
      "access, so this image stays mouse-only.",
  );
}

// Raw <img> HTML in a post's body silently loses keyboard access (see the
// module doc comment above) — warn loudly rather than let it pass unnoticed,
// mirroring this codebase's fail-loud convention for silent content gaps.
// html_block tokens are top-level siblings in the token stream; html_inline
// ones live inside an "inline" block's children — both are checked.
function warnAboutRawImgTags(
  blockTokens: ZoomToken[],
  postLabel: string,
): void {
  for (const blockToken of blockTokens) {
    if (blockToken.type === HTML_BLOCK_TOKEN_TYPE) {
      warnIfRawImgTag(blockToken, postLabel);
    }
    if (blockToken.type === INLINE_TOKEN_TYPE && blockToken.children) {
      blockToken.children
        .filter((child) => child.type === HTML_INLINE_TOKEN_TYPE)
        .forEach((child) => warnIfRawImgTag(child, postLabel));
    }
  }
}

function hasAuthorDefinedControl(token: ZoomToken): boolean {
  // A pre-existing role or tabindex means the author defined the semantics
  // themselves (or opted out via markdown-it-attrs curly-brace syntax);
  // treat it as spoken for rather than build a half-overridden control.
  return (
    token.attrIndex(ROLE_ATTRIBUTE) >= 0 ||
    token.attrIndex(TABINDEX_ATTRIBUTE) >= 0
  );
}

function isGenericImage(token: ZoomToken, alt: string): boolean {
  if (hasAuthorDefinedControl(token)) {
    return false;
  }
  return !alt.trim() && token.attrIndex(ARIA_LABEL_ATTRIBUTE) < 0;
}

function isLinkOpener(token: ZoomToken): boolean {
  if (token.type === LINK_OPEN_TYPE) {
    return true;
  }
  return (
    token.type === HTML_INLINE_TOKEN_TYPE &&
    HTML_ANCHOR_OPEN_PATTERN.test(token.content)
  );
}

function isLinkCloser(token: ZoomToken): boolean {
  if (token.type === LINK_CLOSE_TYPE) {
    return true;
  }
  return (
    token.type === HTML_INLINE_TOKEN_TYPE &&
    HTML_ANCHOR_CLOSE_PATTERN.test(token.content)
  );
}

// An in-body image is a link's click target (a navigation) when an opener
// precedes it in the same inline block with no matching closer yet — walk
// the preceding siblings tracking nesting depth.
function isInsideLink(siblings: ZoomToken[], index: number): boolean {
  let depth = 0;
  for (let position = 0; position < index; position++) {
    if (isLinkOpener(siblings[position])) {
      depth++;
      continue;
    }
    if (isLinkCloser(siblings[position])) {
      depth = Math.max(0, depth - 1);
    }
  }
  return depth > 0;
}

function countGenericInBlock(
  siblings: ZoomToken[],
  resolveAlt: AltTextResolver,
): number {
  let count = 0;
  siblings.forEach((sibling, index) => {
    if (sibling.type !== IMAGE_TOKEN_TYPE) {
      return;
    }
    if (isInsideLink(siblings, index)) {
      return;
    }
    if (isGenericImage(sibling, resolveAlt(sibling.children))) {
      count++;
    }
  });
  return count;
}

// Pre-scans the whole document's image tokens to count how many alt-less,
// unlabeled in-body images will need a positional "N of M" label, so the
// render pass (which sees one image at a time) can hand out stable numbers
// without knowing the rest of the document.
export function countGenericZoomImages(
  blockTokens: ZoomToken[],
  resolveAlt: AltTextResolver,
): number {
  let total = 0;
  for (const blockToken of blockTokens) {
    if (blockToken.type !== INLINE_TOKEN_TYPE || !blockToken.children) {
      continue;
    }
    total += countGenericInBlock(blockToken.children, resolveAlt);
  }
  return total;
}

function setZoomImageAttributes(token: ZoomToken, label: string): void {
  if (hasAuthorDefinedControl(token)) {
    return;
  }
  token.attrSet(ROLE_ATTRIBUTE, ROLE_BUTTON);
  token.attrSet(TABINDEX_ATTRIBUTE, OPERABLE_TABINDEX);
  token.attrSet(ARIA_HASPOPUP_ATTRIBUTE, HASPOPUP_DIALOG);
  if (token.attrIndex(ARIA_LABEL_ATTRIBUTE) < 0) {
    token.attrSet(ARIA_LABEL_ATTRIBUTE, label);
  }
}

function nextGenericPosition(env: Record<string, unknown>): number {
  const current = env[GENERIC_POSITION_ENV_KEY];
  const next = (typeof current === "number" ? current : 0) + 1;
  env[GENERIC_POSITION_ENV_KEY] = next;
  return next;
}

function totalGenericZoomImages(env: Record<string, unknown>): number {
  const total = env[GENERIC_TOTAL_ENV_KEY];
  return typeof total === "number" ? total : 0;
}

// Decorate a single in-body image token with zoom-control semantics, unless
// it is wrapped in a link (its click is a navigation, not a zoom).
export function setMarkdownZoomImageHints(
  siblings: ZoomToken[],
  index: number,
  env: Record<string, unknown>,
  resolveAlt: AltTextResolver,
): void {
  if (isInsideLink(siblings, index)) {
    return;
  }
  const token = siblings[index];
  const alt = resolveAlt(token.children);
  const position = isGenericImage(token, alt) ? nextGenericPosition(env) : 0;
  const total = totalGenericZoomImages(env);
  setZoomImageAttributes(token, zoomLabelFor(alt, position, total));
}

// Real markdown-it Token[], derived from the renderer's own method rather
// than importing markdown-it's types directly — ZoomToken deliberately holds
// only the slice this module needs (see its doc comment above), but the real
// renderInlineAsText still expects its native, fuller Token shape.
type RendererTokens = Parameters<
  MarkdownRenderer["renderer"]["renderInlineAsText"]
>[0];

function asRendererTokens(children: ZoomToken[] | null): RendererTokens {
  return (children ?? []) as unknown as RendererTokens;
}

// Wrap markdown-it's image renderer so every rendered in-body post image
// carries zoom-control semantics, chaining after any earlier wrapper (e.g.
// applyMarkdownImageHints's lazy/decoding/dimension hints) so both sets of
// attributes land regardless of registration order.
export function applyMarkdownZoomImageHints(md: MarkdownRenderer): void {
  md.core.ruler.push(CORE_RULE_NAME, (state) => {
    // md.parse()/parseInline() (unlike render()) never default env to {},
    // so a caller invoking either directly leaves state.env undefined.
    if (!state.env || !isPostFrontmatter(state.env.frontmatter)) {
      return;
    }
    const resolveAlt: AltTextResolver = (children) =>
      state.md.renderer.renderInlineAsText(
        asRendererTokens(children),
        state.md.options,
        state.env,
      );
    state.env[GENERIC_TOTAL_ENV_KEY] = countGenericZoomImages(
      state.tokens,
      resolveAlt,
    );
    // Reset per document in case the caller ever reuses one env object
    // across multiple render() calls — the position count must never leak
    // across documents.
    state.env[GENERIC_POSITION_ENV_KEY] = 0;
    warnAboutRawImgTags(
      state.tokens,
      postLabelFor(state.env.frontmatter as Record<string, unknown>),
    );
  });

  const renderImage = md.renderer.rules.image!;
  md.renderer.rules.image = (tokens, index, options, env, self) => {
    if (!env || !isPostFrontmatter(env.frontmatter)) {
      return renderImage(tokens, index, options, env, self);
    }
    const resolveAlt: AltTextResolver = (children) =>
      self.renderInlineAsText(asRendererTokens(children), options, env);
    setMarkdownZoomImageHints(tokens, index, env, resolveAlt);
    return renderImage(tokens, index, options, env, self);
  };
}

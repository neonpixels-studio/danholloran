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
// An image token's `alt` attr is still the empty placeholder markdown-it
// seeds at parse time — the real text is only written into attrs by the
// base image render rule, deeper in the delegation chain than this module
// runs. So alt text here is resolved straight from the token's children
// (mirroring markdown-it's own Renderer#renderInlineAsText), the same
// source the base rule itself reads from.
//
// A linked image's click is a navigation, not a zoom — those are left alone
// entirely, mirroring the client behavior this replaces. Images written as
// raw <img> HTML inside markdown arrive as html tokens rather than image
// tokens (see markdownImageHints.ts's own note on this), so — like the
// dimension hints — they are not enriched; every in-body image in this
// site's posts uses markdown image syntax.

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
const TEXT_TOKEN_TYPE = "text";
const SOFTBREAK_TOKEN_TYPE = "softbreak";

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

// Reconstructs an image's rendered alt text from its child tokens, mirroring
// markdown-it's own Renderer#renderInlineAsText (text + nested image + a
// softbreak as a newline; every other inline token, e.g. emphasis markers,
// contributes no text of its own).
function resolveAltText(children: ZoomToken[] | null): string {
  if (!children) {
    return "";
  }
  let text = "";
  for (const child of children) {
    if (child.type === TEXT_TOKEN_TYPE) {
      text += child.content;
    } else if (child.type === IMAGE_TOKEN_TYPE) {
      text += resolveAltText(child.children);
    } else if (child.type === SOFTBREAK_TOKEN_TYPE) {
      text += "\n";
    }
  }
  return text;
}

function isGenericImage(token: ZoomToken, alt: string): boolean {
  return !alt.trim() && token.attrIndex(ARIA_LABEL_ATTRIBUTE) < 0;
}

// An in-body image is a link's click target (a navigation) when a link_open
// precedes it in the same inline block with no matching link_close yet —
// walk the preceding siblings tracking nesting depth.
function isInsideLink(siblings: ZoomToken[], index: number): boolean {
  let depth = 0;
  for (let position = 0; position < index; position++) {
    if (siblings[position].type === LINK_OPEN_TYPE) {
      depth++;
      continue;
    }
    if (siblings[position].type === LINK_CLOSE_TYPE) {
      depth = Math.max(0, depth - 1);
    }
  }
  return depth > 0;
}

function countGenericInBlock(siblings: ZoomToken[]): number {
  let count = 0;
  siblings.forEach((sibling, index) => {
    if (sibling.type !== IMAGE_TOKEN_TYPE) {
      return;
    }
    if (isInsideLink(siblings, index)) {
      return;
    }
    if (isGenericImage(sibling, resolveAltText(sibling.children))) {
      count++;
    }
  });
  return count;
}

// Pre-scans the whole document's image tokens to count how many alt-less,
// unlabeled in-body images will need a positional "N of M" label, so the
// render pass (which sees one image at a time) can hand out stable numbers
// without knowing the rest of the document.
export function countGenericZoomImages(blockTokens: ZoomToken[]): number {
  let total = 0;
  for (const blockToken of blockTokens) {
    if (blockToken.type !== INLINE_TOKEN_TYPE || !blockToken.children) {
      continue;
    }
    total += countGenericInBlock(blockToken.children);
  }
  return total;
}

function setZoomImageAttributes(token: ZoomToken, label: string): void {
  // A pre-existing role or tabindex means the author defined the semantics
  // themselves; bail wholesale rather than build a half-overridden control.
  if (
    token.attrIndex(ROLE_ATTRIBUTE) >= 0 ||
    token.attrIndex(TABINDEX_ATTRIBUTE) >= 0
  ) {
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
): void {
  if (isInsideLink(siblings, index)) {
    return;
  }
  const token = siblings[index];
  const alt = resolveAltText(token.children);
  const position = isGenericImage(token, alt) ? nextGenericPosition(env) : 0;
  const total = totalGenericZoomImages(env);
  setZoomImageAttributes(token, zoomLabelFor(alt, position, total));
}

// Wrap markdown-it's image renderer so every rendered in-body image carries
// zoom-control semantics, chaining after any earlier wrapper (e.g.
// applyMarkdownImageHints's lazy/decoding/dimension hints) so both sets of
// attributes land regardless of registration order.
export function applyMarkdownZoomImageHints(md: MarkdownRenderer): void {
  md.core.ruler.push(CORE_RULE_NAME, (state) => {
    state.env[GENERIC_TOTAL_ENV_KEY] = countGenericZoomImages(state.tokens);
    // Reset per document in case the caller ever reuses one env object
    // across multiple render() calls — the position count must never leak
    // across documents.
    state.env[GENERIC_POSITION_ENV_KEY] = 0;
  });

  const renderImage = md.renderer.rules.image!;
  md.renderer.rules.image = (tokens, index, options, env, self) => {
    setMarkdownZoomImageHints(tokens, index, env);
    return renderImage(tokens, index, options, env, self);
  };
}

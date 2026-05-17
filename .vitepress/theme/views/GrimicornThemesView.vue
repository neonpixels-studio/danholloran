<script setup lang="ts">
import { ref, onMounted } from "vue";

const codeAreaRef = ref<HTMLElement | null>(null);
const gutterRef = ref<HTMLElement | null>(null);
const currentVariant = ref("dark");

const THEMES: { dark: any; light: any } = { dark: null, light: null };

const THEME_PATHS = {
  dark: "https://raw.githubusercontent.com/grimicorn/grimicorn-themes/refs/heads/main/themes/grimicorn-dark.color-theme.json",
  light:
    "https://raw.githubusercontent.com/grimicorn/grimicorn-themes/refs/heads/main/themes/grimicorn-light.color-theme.json",
};

async function loadThemes() {
  const [dark, light] = await Promise.all([
    fetch(THEME_PATHS.dark).then((r) => r.json()),
    fetch(THEME_PATHS.light).then((r) => r.json()),
  ]);
  THEMES.dark = dark;
  THEMES.light = light;
}

const TOKEN_MAP: Record<string, string> = {
  Comments: "comment",
  Keywords: "keyword",
  Operators: "operator",
  Functions: "function",
  Strings: "string",
  "String Escape": "escape",
  "Types & Classes": "type",
  "Constants & Numbers": "number",
  Variables: "variable",
  "Object Properties": "property",
  Punctuation: "punctuation",
  "HTML Attributes": "attr",
  "CSS Properties": "css-prop",
  "CSS Values": "css-val",
  "CSS Selectors": "css-sel",
  "Markdown Heading": "md-heading",
  "Markdown Bold": "md-bold",
  "Markdown Italic": "md-italic",
  "Markdown Link": "md-link",
  "Markdown Code": "md-code",
  Decorators: "decorator",
  Invalid: "invalid",
};

function applyTheme(variant: string) {
  const theme = THEMES[variant as "dark" | "light"];
  const root = document.documentElement;

  for (const [k, v] of Object.entries(theme.colors)) {
    root.style.setProperty("--" + k.replace(/\./g, "-"), v as string);
  }

  let styleEl = document.getElementById("tok") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "tok";
    document.head.appendChild(styleEl);
  }
  let css = "";
  for (const rule of theme.tokenColors) {
    const cls = TOKEN_MAP[rule.name];
    if (!cls) continue;
    const { foreground: fg, fontStyle: fs } = rule.settings;
    let d = fg ? `color:${fg};` : "";
    if (fs === "italic") d += "font-style:italic;";
    else if (fs === "bold") d += "font-weight:bold;";
    else if (fs === "") d += "font-style:normal;font-weight:normal;";
    if (d) css += `.tok-${cls}{${d}}`;
  }
  styleEl.textContent = css;

  document.getElementById("badge-modified")!.style.color =
    theme.colors["gitDecoration.modifiedResourceForeground"];
  document.getElementById("badge-added")!.style.color =
    theme.colors["gitDecoration.addedResourceForeground"];
  document.getElementById("untracked-item")!.style.color =
    theme.colors["gitDecoration.untrackedResourceForeground"];
  ["dot-error", "sb-error"].forEach(
    (id) =>
      ((document.getElementById(id) as HTMLElement).style.background =
        theme.colors["editorError.foreground"]),
  );
  ["dot-warn", "sb-warn"].forEach(
    (id) =>
      ((document.getElementById(id) as HTMLElement).style.background =
        theme.colors["editorWarning.foreground"]),
  );
  (document.getElementById("dot-info") as HTMLElement).style.background =
    theme.colors["editorInfo.foreground"];

  currentVariant.value = variant;
  renderCode();
}

const sp = (c: string, t: string) => `<span class="tok-${c}">${t}</span>`;
const p = (t: string) => sp("punctuation", t);
const kw = (t: string) => sp("keyword", t);
const fn = (t: string) => sp("function", t);
const st = (t: string) => sp("string", t);
const nm = (t: string) => sp("number", t);
const ty = (t: string) => sp("type", t);
const vr = (t: string) => sp("variable", t);
const pr = (t: string) => sp("property", t);
const op = (t: string) => sp("operator", t);
const cm = (t: string) => sp("comment", t);
const dc = (t: string) => sp("decorator", t);
const iv = (t: string) => sp("invalid", t);
const es = (t: string) => sp("escape", t);

const LINES = [
  cm("// Grimicorn Theme — token preview"),
  kw("import") +
    " " +
    p("{") +
    " " +
    ty("ThemeBuilder") +
    p(",") +
    " " +
    ty("ColorMap") +
    " " +
    p("}") +
    " " +
    kw("from") +
    " " +
    st("'./colors'") +
    p(";"),
  "",
  cm("/** @param name  Theme identifier */"),
  dc("@injectable"),
  kw("export") + " " + kw("class") + " " + ty("ThemeBuilder") + " " + p("{"),
  "  " +
    kw("private") +
    " " +
    pr("palette") +
    p(":") +
    " " +
    ty("ColorMap") +
    p(";"),
  "",
  "  " +
    fn("constructor") +
    p("(") +
    kw("private") +
    " " +
    kw("readonly") +
    " " +
    vr("name") +
    p(":") +
    " " +
    ty("string") +
    p(") {"),
  "    " +
    kw("this") +
    p(".") +
    pr("palette") +
    " " +
    op("=") +
    " " +
    kw("new") +
    " " +
    ty("Map") +
    p("();"),
  "  " + p("}"),
  "",
  "  " +
    fn("set") +
    p("(") +
    vr("token") +
    p(":") +
    " " +
    ty("string") +
    p(",") +
    " " +
    vr("hex") +
    p(":") +
    " " +
    ty("string") +
    p("):") +
    " " +
    ty("this") +
    " " +
    p("{"),
  "    " +
    kw("if") +
    " " +
    p("(!") +
    p("/") +
    st("^#[0-9a-fA-F]{6}$") +
    p("/") +
    p(".") +
    fn("test") +
    p("(") +
    vr("hex") +
    p("))"),
  "      " +
    kw("throw") +
    " " +
    kw("new") +
    " " +
    ty("Error") +
    p("(`") +
    iv("Invalid hex") +
    es(": ${") +
    vr("hex") +
    es("}") +
    p("`);"),
  "    " +
    kw("this") +
    p(".") +
    pr("palette") +
    p(".") +
    fn("set") +
    p("(") +
    vr("token") +
    p(",") +
    " " +
    vr("hex") +
    p(");"),
  "    " + kw("return") + " " + kw("this") + p(";"),
  "  " + p("}"),
  "",
  "  " +
    fn("build") +
    p("():") +
    " " +
    ty("Record") +
    p("<") +
    ty("string") +
    p(",") +
    " " +
    ty("string") +
    p("> {"),
  "    " +
    kw("const") +
    " " +
    vr("LIMIT") +
    " " +
    op("=") +
    " " +
    nm("256") +
    p(";"),
  "    " +
    kw("if") +
    " " +
    p("(") +
    kw("this") +
    p(".") +
    pr("palette") +
    p(".") +
    pr("size") +
    " " +
    op(">") +
    " " +
    vr("LIMIT") +
    p(")"),
  "      " +
    kw("throw") +
    " " +
    kw("new") +
    " " +
    ty("Error") +
    p("(") +
    st("'Too many tokens'") +
    p(");"),
  "    " +
    kw("return") +
    " " +
    ty("Object") +
    p(".") +
    fn("fromEntries") +
    p("(") +
    kw("this") +
    p(".") +
    pr("palette") +
    p(");"),
  "  " + p("}"),
  p("}"),
  "",
  cm("// Build the Grimicorn palette"),
  kw("const") +
    " " +
    vr("theme") +
    " " +
    op("=") +
    " " +
    kw("new") +
    " " +
    ty("ThemeBuilder") +
    p("(") +
    st("'Grimicorn Dark'") +
    p(")"),
  "  " +
    p(".") +
    fn("set") +
    p("(") +
    st("'keyword'") +
    p(",") +
    " " +
    st("'#83AFE5'") +
    p(")") +
    "  " +
    cm("// blue"),
  "  " +
    p(".") +
    fn("set") +
    p("(") +
    st("'function'") +
    p(",") +
    " " +
    st("'#9A93E1'") +
    p(")") +
    "  " +
    cm("// purple"),
  "  " +
    p(".") +
    fn("set") +
    p("(") +
    st("'string'") +
    p(",") +
    " " +
    st("'#A9CE93'") +
    p(")") +
    "  " +
    cm("// green"),
  "  " +
    p(".") +
    fn("set") +
    p("(") +
    st("'number'") +
    p(",") +
    " " +
    nm("0x80C1CA") +
    p(")") +
    "  " +
    cm("// teal"),
  "  " + p(".") + fn("build") + p("();"),
  "",
  vr("console") + p(".") + fn("log") + p("(") + vr("theme") + p(");"),
  kw("export default") + " " + vr("theme") + p(";"),
];

function renderCode() {
  const ca = codeAreaRef.value;
  const g = gutterRef.value;
  if (!ca || !g) return;
  ca.innerHTML = "";
  g.innerHTML = "";
  LINES.forEach((line, i) => {
    const span = document.createElement("span");
    span.className =
      "px-4 whitespace-pre block hover:bg-[var(--editor-lineHighlightBackground)]";
    if (i === 13) span.style.background = "var(--editor-selectionBackground)";
    span.innerHTML = line || " ";
    ca.appendChild(span);
    const ln = document.createElement("div");
    ln.style.lineHeight = "22px";
    if (i === 13) ln.style.color = "var(--editorLineNumber-activeForeground)";
    ln.textContent = String(i + 1);
    g.appendChild(ln);
  });
}

onMounted(async () => {
  try {
    await loadThemes();
    applyTheme("dark");
  } catch (err: any) {
    document.body.innerHTML = `<div style="padding:2rem;font-family:monospace;color:#DD9787;background:#3C4C55"><strong>Could not load theme files.</strong><br><br>${err.message}</div>`;
  }
});
</script>

<template>
  <div
    class="relative flex h-screen flex-col overflow-hidden [font-family:'Segoe_UI',system-ui,sans-serif]"
  >
    <div
      class="absolute top-0.5 right-2 z-10 flex overflow-hidden rounded bg-black/20"
    >
      <button
        class="cursor-pointer border-0 px-3 py-1 text-[11px]"
        :class="
          currentVariant === 'dark'
            ? 'bg-[var(--tab-activeBorderTop)] font-bold text-black'
            : 'bg-transparent text-[#aaa]'
        "
        @click="applyTheme('dark')"
      >
        Dark
      </button>
      <button
        class="cursor-pointer border-0 px-3 py-1 text-[11px]"
        :class="
          currentVariant === 'light'
            ? 'bg-[var(--tab-activeBorderTop)] font-bold text-black'
            : 'bg-transparent text-[#aaa]'
        "
        @click="applyTheme('light')"
      >
        Light
      </button>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <div
        class="w-[190px] min-w-[190px] overflow-y-auto bg-[var(--sideBar-background)] text-[var(--sideBar-foreground)] [border-right:1px_solid_var(--sideBar-border)]"
      >
        <div
          class="px-3 pt-[10px] pb-[6px] text-[10px] tracking-[1px] uppercase opacity-60"
        >
          Grimicorn
        </div>
        <div
          class="flex cursor-pointer justify-between px-3 py-[3px] text-[13px] hover:bg-[var(--list-hoverBackground)]"
        >
          <span>📁 src</span>
        </div>
        <div
          class="flex cursor-pointer justify-between bg-[var(--list-activeSelectionBackground)] px-3 py-[3px] text-[13px] text-[var(--list-activeSelectionForeground)]"
        >
          <span>&nbsp;&nbsp;📄 theme.ts</span
          ><span id="badge-modified" class="text-[10px]">M</span>
        </div>
        <div
          class="flex cursor-pointer justify-between px-3 py-[3px] text-[13px] hover:bg-[var(--list-hoverBackground)]"
        >
          <span>&nbsp;&nbsp;📄 colors.ts</span
          ><span id="badge-added" class="text-[10px]">A</span>
        </div>
        <div
          class="flex cursor-pointer justify-between px-3 py-[3px] text-[13px] hover:bg-[var(--list-hoverBackground)]"
        >
          <span>📁 test</span>
        </div>
        <div
          class="flex cursor-pointer justify-between px-3 py-[3px] text-[13px] hover:bg-[var(--list-hoverBackground)]"
        >
          <span>&nbsp;&nbsp;📄 index.spec.ts</span>
        </div>
        <div
          class="flex cursor-pointer justify-between px-3 py-[3px] text-[13px] hover:bg-[var(--list-hoverBackground)]"
        >
          <span>📄 package.json</span>
        </div>
        <div
          id="untracked-item"
          class="flex cursor-pointer justify-between px-3 py-[3px] text-[13px] hover:bg-[var(--list-hoverBackground)]"
        >
          <span>📄 notes.md</span><span class="text-[10px]">U</span>
        </div>
        <br />
        <div
          class="px-3 pt-[10px] pb-[6px] text-[10px] tracking-[1px] uppercase opacity-60"
        >
          Problems
        </div>
        <div
          class="flex cursor-pointer justify-between px-3 py-[3px] text-[13px] hover:bg-[var(--list-hoverBackground)]"
        >
          <span
            ><span
              id="dot-error"
              class="inline-block h-2 w-2 rounded-full"
            ></span
            >&nbsp;1 error</span
          >
        </div>
        <div
          class="flex cursor-pointer justify-between px-3 py-[3px] text-[13px] hover:bg-[var(--list-hoverBackground)]"
        >
          <span
            ><span
              id="dot-warn"
              class="inline-block h-2 w-2 rounded-full"
            ></span
            >&nbsp;2 warnings</span
          >
        </div>
        <div
          class="flex cursor-pointer justify-between px-3 py-[3px] text-[13px] hover:bg-[var(--list-hoverBackground)]"
        >
          <span
            ><span
              id="dot-info"
              class="inline-block h-2 w-2 rounded-full"
            ></span
            >&nbsp;info</span
          >
        </div>
      </div>

      <div class="flex flex-1 flex-col overflow-hidden">
        <div
          class="flex shrink-0 bg-[var(--editorGroupHeader-tabsBackground)] [border-bottom:1px_solid_var(--tab-border)]"
        >
          <div
            class="cursor-pointer bg-[var(--tab-activeBackground)] px-4 py-[7px] text-xs text-[var(--tab-activeForeground)] [border-bottom:2px_solid_var(--tab-activeBorderTop)] [border-right:1px_solid_var(--tab-border)]"
          >
            theme.ts
          </div>
          <div
            class="cursor-pointer bg-[var(--tab-inactiveBackground)] px-4 py-[7px] text-xs text-[var(--tab-inactiveForeground)] [border-right:1px_solid_var(--tab-border)]"
          >
            colors.ts
          </div>
        </div>
        <div class="flex flex-1 overflow-hidden">
          <div
            ref="gutterRef"
            class="w-12 shrink-0 bg-[var(--editor-background)] pt-[14px] pr-[10px] text-right [font-family:'Operator_Mono_Lig','Fira_Code',monospace] text-[13px] leading-[22px] text-[var(--editorLineNumber-foreground)] select-none"
          ></div>
          <div
            ref="codeAreaRef"
            class="flex-1 overflow-y-auto bg-[var(--editor-background)] pt-[14px] [font-family:'Operator_Mono_Lig','Fira_Code',monospace] text-[13px] leading-[22px] text-[var(--editor-foreground)]"
          ></div>
        </div>
      </div>
    </div>

    <div
      class="flex h-[22px] shrink-0 items-center gap-[14px] bg-[var(--statusBar-background)] px-3 text-[11px] text-[var(--statusBar-foreground)]"
    >
      <span>⎇ main</span><span>TypeScript</span
      ><span>Operator Mono Lig 16</span>
      <span
        ><span id="sb-error" class="inline-block h-2 w-2 rounded-full"></span> 1
        &nbsp;<span
          id="sb-warn"
          class="inline-block h-2 w-2 rounded-full"
        ></span>
        2</span
      >
    </div>
  </div>
</template>

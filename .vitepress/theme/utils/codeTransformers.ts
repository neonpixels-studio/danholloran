export const injectThemeBgTransformer = {
  name: "inject-theme-bg",
  pre(node: { properties: { style?: string | unknown } }) {
    const existing =
      typeof node.properties.style === "string" ? node.properties.style : "";
    node.properties.style = `--shiki-light-bg:#FDFDFD;--shiki-dark-bg:#3C4C55;${existing}`;
  },
};

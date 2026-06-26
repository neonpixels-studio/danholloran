export interface GrimicornHue {
  role: string;
  dark: string;
  light: string;
  usage: string;
}

export type GrimicornToolKind =
  | "editor"
  | "terminal"
  | "git"
  | "notes"
  | "agent"
  | "highlighter";

export interface GrimicornToolFile {
  label: string;
  href: string;
  download: string;
}

export interface GrimicornTool {
  name: string;
  kind: GrimicornToolKind;
  featured?: boolean;
  desc: string;
  files: GrimicornToolFile[];
  install: string;
  docs: string;
}

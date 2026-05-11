export interface NavItem {
  label: string;
  link: string;
  isActive: () => boolean;
}

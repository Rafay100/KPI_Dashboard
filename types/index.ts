export interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: MenuItem[];
}

export interface User {
  name: string;
  email: string;
  avatar?: string;
}

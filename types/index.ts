export interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
}

export interface User {
  name: string;
  email: string;
  avatar?: string;
}

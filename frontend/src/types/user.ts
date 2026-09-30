export interface User {
  id: string;
  name: string;
  email: string;
  plan?: string;
  role?: string;
  created_at?: string;
}

export interface UserPreference {
  design_style?: string;
  color_palette?: string;
  budget_range?: string;
  preferred_materials?: string[];
}

export interface AuthSession {
  user: User;
  token?: string;
}

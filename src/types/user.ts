export type Role = 'SuperAdmin' | 'Admin' | 'Manager' | 'Support' | 'ContentEditor' | 'Finance';
export type UserStatus = 'active' | 'suspended';

export interface User {
  role: Role;
  id: string;
  name: string;
  phone: string;
  password?: string;
  isVerified: boolean;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
}
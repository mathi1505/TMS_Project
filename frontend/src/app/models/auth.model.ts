export type Role = 'ADMIN' | 'STAFF';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  fullName: string;
  role: Role;
}

export interface CurrentUser {
  username: string;
  fullName: string;
  role: Role;
}

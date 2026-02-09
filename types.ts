export interface Credential {
  id?: number;
  tool: string;
  link: string;
  username: string;
  password?: string;
  ldap: boolean;
  description: string;
}

export interface AuthResponse {
  token: string;
  message?: string;
}

export interface ApiError {
  message: string;
}

export type SortField = 'tool' | 'username' | 'link';
export type SortOrder = 'asc' | 'desc';

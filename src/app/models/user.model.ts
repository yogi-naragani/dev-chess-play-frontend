export interface User {
  id: number;
  username: string;
  email: string;
  userType: string;
  createdAt: string;
  first_name: string;
  last_name: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

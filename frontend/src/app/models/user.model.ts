export type UserType = 'admin' | 'instructor' | 'student';
export type UserStatus = 'online' | 'offline';

export interface User {
  id: string;
  username: string;
  email: string;
  userType: UserType;
  createdAt: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  rating?: number;
  puzzleRating?: number;
  status?: UserStatus;
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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

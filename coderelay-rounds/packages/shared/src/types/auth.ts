import { UserRole } from '../constants/roles.js';

export interface UserSession {
  userId: string;
  username: string;
  role: UserRole;
  teamId?: string;
  memberId?: string;
  displayName?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserSession;
}

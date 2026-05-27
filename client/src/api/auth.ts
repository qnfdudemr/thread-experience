import apiClient from './client';
import type { AuthTokens, LoginRequest, SignupRequest, User } from '../types';

export const authApi = {
  signup: (data: SignupRequest) =>
    apiClient.post<User>('/auth/signup', data),

  login: (data: LoginRequest) =>
    apiClient.post<AuthTokens>('/auth/login', data),

  demo: (nickname: string) =>
    apiClient.post<AuthTokens & { nickname: string; groupId: string | null; discussionId: string | null }>('/auth/demo', { nickname }),

  refresh: (refreshToken: string) =>
    apiClient.post<{ accessToken: string }>('/auth/refresh', { refreshToken }),

  checkNickname: (nickname: string) =>
    apiClient.get<{ available: boolean }>(`/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`),
};

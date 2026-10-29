import type { LoginInput, PublicUser, RegisterInput } from '@dsa/shared';
import { http } from '../../lib/http';

type ApiSuccess<T> = { success: true; data: T };

export async function register(input: RegisterInput): Promise<PublicUser> {
  const { data } = await http.post<ApiSuccess<{ user: PublicUser }>>(
    '/api/v1/auth/register',
    input,
  );
  return data.data.user;
}

export async function login(input: LoginInput): Promise<PublicUser> {
  const { data } = await http.post<ApiSuccess<{ user: PublicUser }>>('/api/v1/auth/login', input);
  return data.data.user;
}

export async function logout(): Promise<void> {
  await http.post('/api/v1/auth/logout');
}

export async function fetchMe(): Promise<PublicUser> {
  const { data } = await http.get<ApiSuccess<{ user: PublicUser }>>('/api/v1/auth/me');
  return data.data.user;
}

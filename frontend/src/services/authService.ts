// ─── Auth Service ────────────────────────────────────────────────────────────

import { get, post, put } from './http';
import type {
  UserProfile,
  SignInPayload,
  SignUpPayload,
  PasswordResetRequestResult,
  ConfirmPasswordResetPayload,
  PreferencesResponse,
} from '../types/auth';

export async function signUp(payload: SignUpPayload): Promise<UserProfile> {
  const data = await post<{ user: UserProfile }>('/auth/register/', payload);
  return data.user;
}

export async function signIn(payload: SignInPayload): Promise<UserProfile> {
  const data = await post<{ user: UserProfile }>('/auth/login/', payload);
  return data.user;
}

export async function signOut(): Promise<void> {
  await post('/auth/logout/');
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const data = await get<{ user: UserProfile | null }>('/auth/me/');
    return data.user ?? null;
  } catch (err) {
    if (err instanceof Error && 'status' in err && (err as { status: number }).status === 401) {
      return null;
    }
    throw err;
  }
}

export async function requestPasswordReset(email: string): Promise<PasswordResetRequestResult> {
  return post<PasswordResetRequestResult>('/auth/password/reset/', { email });
}

export async function confirmPasswordReset(payload: ConfirmPasswordResetPayload): Promise<UserProfile> {
  const data = await post<{ user: UserProfile }>('/auth/password/reset/confirm/', payload);
  return data.user;
}

export async function updateProfile(data: { name?: string; email?: string }): Promise<UserProfile> {
  const result = await put<{ user: UserProfile }>('/auth/profile/', data);
  return result.user;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return post('/auth/password/change/', { currentPassword, newPassword });
}

export async function fetchPreferences(): Promise<PreferencesResponse> {
  return get<PreferencesResponse>('/preferences/');
}

export async function updatePreferences(prefs: { preferredModel?: string; theme?: string }): Promise<PreferencesResponse> {
  return put<PreferencesResponse>('/preferences/update/', prefs);
}

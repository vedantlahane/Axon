// ─── Auth Types ──────────────────────────────────────────────────────────────

export interface UserProfile {
  id: number;
  email: string;
  name: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload extends SignInPayload {
  name: string;
}

export interface PasswordResetRequestResult {
  message: string;
  resetToken?: string | null;
}

export interface ConfirmPasswordResetPayload {
  token: string;
  password: string;
}

export interface UserPreferences {
  preferredModel: string;
  theme: string;
  updatedAt: string;
}

export interface PreferencesResponse {
  preferences: UserPreferences;
}

export type AuthModalMode = 'signin' | 'signup' | 'forgot' | 'reset';

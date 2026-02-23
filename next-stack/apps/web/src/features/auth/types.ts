export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  refreshExpiresAt: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
  createdAt: string;
};

export type AuthResponse = {
  user: AuthUser;
  tokens: AuthTokens;
  emailVerification?: {
    required: boolean;
    status: string;
    previewToken?: string;
  };
};

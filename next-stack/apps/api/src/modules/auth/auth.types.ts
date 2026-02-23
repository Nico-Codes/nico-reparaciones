export type AuthenticatedUser = {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

export type RequestWithUser = {
  headers?: Record<string, unknown>;
  user?: AuthenticatedUser;
};

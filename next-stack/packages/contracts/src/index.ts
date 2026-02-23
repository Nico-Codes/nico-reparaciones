import { z } from 'zod';

export const healthResponseSchema = z.object({
  ok: z.boolean(),
  service: z.string(),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(190),
  password: z.string().min(8).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(190),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(300),
  password: z.string().min(8).max(128),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(20).max(300),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20).max(400),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const bootstrapAdminSchema = z.object({
  setupKey: z.string().min(6),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(190),
  password: z.string().min(8).max(128),
});

export type BootstrapAdminInput = z.infer<typeof bootstrapAdminSchema>;

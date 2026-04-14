import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    name: 'Juan Perez',
    email: 'juan@example.com',
    googleSubject: null,
    passwordHash: null,
    role: 'USER',
    emailVerified: true,
    emailVerifiedAt: new Date('2026-04-14T10:00:00.000Z'),
    createdAt: new Date('2026-04-14T10:00:00.000Z'),
    updatedAt: new Date('2026-04-14T10:00:00.000Z'),
    ...overrides,
  };
}

function createService() {
  const usersService = {
    findByEmail: vi.fn(),
    findByGoogleSubject: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    toPublicUser: vi.fn((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    })),
  };

  const prisma = {
    user: {
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn().mockResolvedValue({ id: 'refresh-1' }),
    },
    appSetting: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue(null),
    },
  };

  const mailService = {
    sendTemplate: vi.fn(),
  };

  const jwtService = new JwtService({ secret: 'jwt-access-secret-for-tests-1234567890' });
  const service = new AuthService(usersService as never, jwtService as never, prisma as never, mailService as never);

  return {
    service,
    usersService,
    prisma,
  };
}

describe('AuthService Google login', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    process.env.JWT_ACCESS_SECRET = 'jwt-access-secret-for-tests-1234567890';
    process.env.GOOGLE_OAUTH_ENABLED = '1';
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';
    process.env.API_URL = 'http://localhost:3001';
    process.env.WEB_URL = 'http://localhost:5174';
  });

  it('creates a new USER account from Google when email does not exist', async () => {
    const { service, usersService } = createService();
    const createdUser = buildUser({ id: 'google-user-1', googleSubject: 'google-sub-1' });
    usersService.findByGoogleSubject.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(createdUser);

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ access_token: 'google-access-token' }))
      .mockResolvedValueOnce(
        jsonResponse({
          sub: 'google-sub-1',
          email: 'juan@example.com',
          email_verified: true,
          name: 'Juan Perez',
        }),
      );

    const startUrl = await service.createGoogleAuthorizationUrl('/orders/123');
    const state = new URL(startUrl).searchParams.get('state');
    const redirectUrl = await service.handleGoogleCallback({ code: 'oauth-code', state: state ?? '' });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'juan@example.com',
        googleSubject: 'google-sub-1',
        role: 'USER',
        passwordHash: null,
        emailVerified: true,
      }),
    );
    expect(redirectUrl).toContain('/auth/google/callback#result=');
  });

  it('links an existing USER by email when Google subject was not linked yet', async () => {
    const { service, usersService, prisma } = createService();
    const existingUser = buildUser({ id: 'user-local-1', emailVerified: false, emailVerifiedAt: null });
    const linkedUser = buildUser({ id: 'user-local-1', googleSubject: 'google-sub-2' });
    usersService.findByGoogleSubject.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue(existingUser);
    prisma.user.update.mockResolvedValue(linkedUser);

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ access_token: 'google-access-token' }))
      .mockResolvedValueOnce(
        jsonResponse({
          sub: 'google-sub-2',
          email: 'juan@example.com',
          email_verified: true,
          name: 'Juan Perez',
        }),
      );

    const startUrl = await service.createGoogleAuthorizationUrl('/checkout');
    const state = new URL(startUrl).searchParams.get('state');
    await service.handleGoogleCallback({ code: 'oauth-code', state: state ?? '' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-local-1' },
        data: expect.objectContaining({
          googleSubject: 'google-sub-2',
          emailVerified: true,
        }),
      }),
    );
  });

  it('reuses an existing USER linked by googleSubject', async () => {
    const { service, usersService, prisma } = createService();
    const linkedUser = buildUser({ id: 'user-google-1', googleSubject: 'google-sub-3', emailVerified: false, emailVerifiedAt: null });
    const verifiedUser = buildUser({ id: 'user-google-1', googleSubject: 'google-sub-3', emailVerified: true });
    usersService.findByGoogleSubject.mockResolvedValue(linkedUser);
    usersService.findByEmail.mockResolvedValue(null);
    prisma.user.update.mockResolvedValue(verifiedUser);

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ access_token: 'google-access-token' }))
      .mockResolvedValueOnce(
        jsonResponse({
          sub: 'google-sub-3',
          email: 'juan@example.com',
          email_verified: true,
          name: 'Juan Perez',
        }),
      );

    const startUrl = await service.createGoogleAuthorizationUrl('/store');
    const state = new URL(startUrl).searchParams.get('state');
    await service.handleGoogleCallback({ code: 'oauth-code', state: state ?? '' });

    expect(usersService.findByGoogleSubject).toHaveBeenCalledWith('google-sub-3');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-google-1' },
        data: expect.objectContaining({
          emailVerified: true,
        }),
      }),
    );
  });

  it('rejects Google login when the matched email belongs to an ADMIN', async () => {
    const { service, usersService } = createService();
    usersService.findByGoogleSubject.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue(buildUser({ role: 'ADMIN', email: 'admin@example.com' }));

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ access_token: 'google-access-token' }))
      .mockResolvedValueOnce(
        jsonResponse({
          sub: 'google-sub-admin',
          email: 'admin@example.com',
          email_verified: true,
          name: 'Admin',
        }),
      );

    const startUrl = await service.createGoogleAuthorizationUrl('/store');
    const state = new URL(startUrl).searchParams.get('state');

    await expect(service.handleGoogleCallback({ code: 'oauth-code', state: state ?? '' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects Google login when Google does not return a verified email', async () => {
    const { service } = createService();

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ access_token: 'google-access-token' }))
      .mockResolvedValueOnce(
        jsonResponse({
          sub: 'google-sub-3',
          email: 'juan@example.com',
          email_verified: false,
          name: 'Juan Perez',
        }),
      );

    const startUrl = await service.createGoogleAuthorizationUrl('/store');
    const state = new URL(startUrl).searchParams.get('state');

    await expect(service.handleGoogleCallback({ code: 'oauth-code', state: state ?? '' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects Google login when state is invalid', async () => {
    const { service } = createService();

    await expect(service.handleGoogleCallback({ code: 'oauth-code', state: 'invalid-state-token' })).rejects.toThrow(
      BadRequestException,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('completes Google login from a short-lived result token', async () => {
    const { service, usersService } = createService();
    const user = buildUser({ id: 'google-user-2', googleSubject: 'google-sub-2' });
    usersService.findById.mockResolvedValue(user);

    const resultToken = await (service as any).buildGoogleResultToken('google-user-2', '/orders');
    const response = await service.completeGoogleLogin({ resultToken });

    expect(response.user.email).toBe('juan@example.com');
    expect(response.tokens.accessToken).toBeTruthy();
    expect(response.tokens.refreshToken).toBeTruthy();
  });

  it('rejects Google login completion when result token is invalid', async () => {
    const { service } = createService();

    await expect(service.completeGoogleLogin({ resultToken: 'invalid-result-token' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

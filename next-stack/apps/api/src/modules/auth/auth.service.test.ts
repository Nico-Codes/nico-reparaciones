import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { generateKeyPairSync, sign } from 'node:crypto';
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
    appleSubject: null,
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
    findByAppleSubject: vi.fn(),
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

function encodeBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function createAppleIdToken(input: {
  privateKeyPem: string;
  kid: string;
  clientId: string;
  subject: string;
  email?: string;
  emailVerified?: boolean;
}) {
  const header = encodeBase64Url(JSON.stringify({ alg: 'RS256', kid: input.kid, typ: 'JWT' }));
  const payload = encodeBase64Url(
    JSON.stringify({
      iss: 'https://appleid.apple.com',
      aud: input.clientId,
      exp: Math.floor(Date.now() / 1000) + 600,
      iat: Math.floor(Date.now() / 1000),
      sub: input.subject,
      ...(input.email ? { email: input.email } : {}),
      ...(typeof input.emailVerified === 'boolean' ? { email_verified: input.emailVerified ? 'true' : 'false' } : {}),
    }),
  );
  const signingInput = `${header}.${payload}`;
  const signature = sign('RSA-SHA256', Buffer.from(signingInput), input.privateKeyPem);
  return `${signingInput}.${encodeBase64Url(signature)}`;
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

describe('AuthService Apple login', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    process.env.JWT_ACCESS_SECRET = 'jwt-access-secret-for-tests-1234567890';
    process.env.APPLE_SIGNIN_ENABLED = '1';
    process.env.APPLE_CLIENT_ID = 'com.nico.web';
    process.env.APPLE_TEAM_ID = 'TEAM123456';
    process.env.APPLE_KEY_ID = 'APPLEKEY1';
    process.env.API_URL = 'http://localhost:3001';
    process.env.WEB_URL = 'http://localhost:5174';
  });

  it('creates a new USER account from Apple when email does not exist', async () => {
    const { service, usersService } = createService();
    const createdUser = buildUser({ id: 'apple-user-1', appleSubject: 'apple-sub-1' });
    usersService.findByAppleSubject.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(createdUser);

    const clientSecretKeyPair = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    process.env.APPLE_PRIVATE_KEY = clientSecretKeyPair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
    const appleKeyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const publicJwk = appleKeyPair.publicKey.export({ format: 'jwk' }) as Record<string, string>;
    const idToken = createAppleIdToken({
      privateKeyPem: appleKeyPair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(),
      kid: process.env.APPLE_KEY_ID!,
      clientId: process.env.APPLE_CLIENT_ID!,
      subject: 'apple-sub-1',
      email: 'juan@example.com',
      emailVerified: true,
    });

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ id_token: idToken }))
      .mockResolvedValueOnce(jsonResponse({ keys: [{ ...publicJwk, kid: process.env.APPLE_KEY_ID, alg: 'RS256', use: 'sig' }] }));

    const startUrl = await service.createAppleAuthorizationUrl('/orders/123');
    const state = new URL(startUrl).searchParams.get('state');
    const redirectUrl = await service.handleAppleCallback({ code: 'apple-code', state: state ?? '' });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'juan@example.com',
        appleSubject: 'apple-sub-1',
        role: 'USER',
        passwordHash: null,
        emailVerified: true,
      }),
    );
    expect(redirectUrl).toContain('/auth/apple/callback#result=');
  });

  it('links an existing USER by email when Apple subject was not linked yet', async () => {
    const { service, usersService, prisma } = createService();
    const existingUser = buildUser({ id: 'user-local-1', emailVerified: false, emailVerifiedAt: null });
    const linkedUser = buildUser({ id: 'user-local-1', appleSubject: 'apple-sub-2' });
    usersService.findByAppleSubject.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue(existingUser);
    prisma.user.update.mockResolvedValue(linkedUser);

    const clientSecretKeyPair = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    process.env.APPLE_PRIVATE_KEY = clientSecretKeyPair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
    const appleKeyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const publicJwk = appleKeyPair.publicKey.export({ format: 'jwk' }) as Record<string, string>;
    const idToken = createAppleIdToken({
      privateKeyPem: appleKeyPair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(),
      kid: process.env.APPLE_KEY_ID!,
      clientId: process.env.APPLE_CLIENT_ID!,
      subject: 'apple-sub-2',
      email: 'juan@example.com',
      emailVerified: true,
    });

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ id_token: idToken }))
      .mockResolvedValueOnce(jsonResponse({ keys: [{ ...publicJwk, kid: process.env.APPLE_KEY_ID, alg: 'RS256', use: 'sig' }] }));

    const startUrl = await service.createAppleAuthorizationUrl('/checkout');
    const state = new URL(startUrl).searchParams.get('state');
    await service.handleAppleCallback({ code: 'apple-code', state: state ?? '' });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-local-1' },
        data: expect.objectContaining({
          appleSubject: 'apple-sub-2',
          emailVerified: true,
        }),
      }),
    );
  });

  it('reuses an existing USER linked by appleSubject', async () => {
    const { service, usersService, prisma } = createService();
    const linkedUser = buildUser({ id: 'user-apple-1', appleSubject: 'apple-sub-3', emailVerified: false, emailVerifiedAt: null });
    const verifiedUser = buildUser({ id: 'user-apple-1', appleSubject: 'apple-sub-3', emailVerified: true });
    usersService.findByAppleSubject.mockResolvedValue(linkedUser);
    prisma.user.update.mockResolvedValue(verifiedUser);

    const clientSecretKeyPair = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    process.env.APPLE_PRIVATE_KEY = clientSecretKeyPair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
    const appleKeyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const publicJwk = appleKeyPair.publicKey.export({ format: 'jwk' }) as Record<string, string>;
    const idToken = createAppleIdToken({
      privateKeyPem: appleKeyPair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(),
      kid: process.env.APPLE_KEY_ID!,
      clientId: process.env.APPLE_CLIENT_ID!,
      subject: 'apple-sub-3',
      email: 'juan@example.com',
      emailVerified: true,
    });

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ id_token: idToken }))
      .mockResolvedValueOnce(jsonResponse({ keys: [{ ...publicJwk, kid: process.env.APPLE_KEY_ID, alg: 'RS256', use: 'sig' }] }));

    const startUrl = await service.createAppleAuthorizationUrl('/store');
    const state = new URL(startUrl).searchParams.get('state');
    await service.handleAppleCallback({ code: 'apple-code', state: state ?? '' });

    expect(usersService.findByAppleSubject).toHaveBeenCalledWith('apple-sub-3');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-apple-1' },
        data: expect.objectContaining({
          emailVerified: true,
        }),
      }),
    );
  });

  it('rejects Apple login when the matched email belongs to an ADMIN', async () => {
    const { service, usersService } = createService();
    usersService.findByAppleSubject.mockResolvedValue(null);
    usersService.findByEmail.mockResolvedValue(buildUser({ role: 'ADMIN', email: 'admin@example.com' }));

    const clientSecretKeyPair = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    process.env.APPLE_PRIVATE_KEY = clientSecretKeyPair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
    const appleKeyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const publicJwk = appleKeyPair.publicKey.export({ format: 'jwk' }) as Record<string, string>;
    const idToken = createAppleIdToken({
      privateKeyPem: appleKeyPair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(),
      kid: process.env.APPLE_KEY_ID!,
      clientId: process.env.APPLE_CLIENT_ID!,
      subject: 'apple-sub-admin',
      email: 'admin@example.com',
      emailVerified: true,
    });

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ id_token: idToken }))
      .mockResolvedValueOnce(jsonResponse({ keys: [{ ...publicJwk, kid: process.env.APPLE_KEY_ID, alg: 'RS256', use: 'sig' }] }));

    const startUrl = await service.createAppleAuthorizationUrl('/store');
    const state = new URL(startUrl).searchParams.get('state');

    await expect(service.handleAppleCallback({ code: 'apple-code', state: state ?? '' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects Apple login when state is invalid', async () => {
    const { service } = createService();

    await expect(service.handleAppleCallback({ code: 'apple-code', state: 'invalid-state-token' })).rejects.toThrow(
      BadRequestException,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('completes Apple login from a short-lived result token', async () => {
    const { service, usersService } = createService();
    const clientSecretKeyPair = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    process.env.APPLE_PRIVATE_KEY = clientSecretKeyPair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
    const user = buildUser({ id: 'apple-user-2', appleSubject: 'apple-sub-2' });
    usersService.findById.mockResolvedValue(user);

    const resultToken = await (service as any).buildAppleResultToken('apple-user-2', '/orders');
    const response = await service.completeAppleLogin({ resultToken });

    expect(response.user.email).toBe('juan@example.com');
    expect(response.tokens.accessToken).toBeTruthy();
    expect(response.tokens.refreshToken).toBeTruthy();
  });

  it('rejects Apple login completion when result token is invalid', async () => {
    const { service } = createService();
    const clientSecretKeyPair = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    process.env.APPLE_PRIVATE_KEY = clientSecretKeyPair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();

    await expect(service.completeAppleLogin({ resultToken: 'invalid-result-token' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('fails on first Apple login when the provider does not return an email', async () => {
    const { service, usersService } = createService();
    usersService.findByAppleSubject.mockResolvedValue(null);

    const clientSecretKeyPair = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    process.env.APPLE_PRIVATE_KEY = clientSecretKeyPair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
    const appleKeyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const publicJwk = appleKeyPair.publicKey.export({ format: 'jwk' }) as Record<string, string>;
    const idToken = createAppleIdToken({
      privateKeyPem: appleKeyPair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(),
      kid: process.env.APPLE_KEY_ID!,
      clientId: process.env.APPLE_CLIENT_ID!,
      subject: 'apple-sub-no-email',
    });

    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ id_token: idToken }))
      .mockResolvedValueOnce(jsonResponse({ keys: [{ ...publicJwk, kid: process.env.APPLE_KEY_ID, alg: 'RS256', use: 'sig' }] }));

    const startUrl = await service.createAppleAuthorizationUrl('/store');
    const state = new URL(startUrl).searchParams.get('state');

    await expect(service.handleAppleCallback({ code: 'apple-code', state: state ?? '' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('reports provider availability from the current server config', () => {
    const { service } = createService();
    const clientSecretKeyPair = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    process.env.APPLE_PRIVATE_KEY = clientSecretKeyPair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
    process.env.GOOGLE_OAUTH_ENABLED = '1';
    process.env.GOOGLE_CLIENT_ID = 'google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';

    expect(service.getAvailableSocialProviders()).toEqual({
      google: true,
      apple: true,
    });

    process.env.APPLE_SIGNIN_ENABLED = '0';

    expect(service.getAvailableSocialProviders()).toEqual({
      google: true,
      apple: false,
    });
  });
});

import { describe, expect, it, vi } from 'vitest';
import { AdminBrandAssetsService } from './admin-brand-assets.service.js';

describe('AdminBrandAssetsService', () => {
  function createPrismaMock() {
    const brandAssetVersion = {
      updateMany: vi.fn((args) => ({ action: 'updateMany', args })),
      create: vi.fn((args) => ({ action: 'create', args })),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      update: vi.fn((args) => ({ action: 'update', args })),
    };
    const appSetting = {
      findUnique: vi.fn().mockResolvedValue(null),
    };

    return {
      brandAssetVersion,
      appSetting,
      $transaction: vi.fn().mockResolvedValue([]),
    };
  }

  it('stores uploaded assets through the storage adapter and persists the setting', async () => {
    const assetStorage = {
      validateUpload: vi.fn().mockReturnValue({ ext: 'png', buffer: Buffer.from('logo') }),
      writePublicAsset: vi.fn().mockResolvedValue(undefined),
      toPublicUrl: vi.fn((path: string) => `/${path}`),
    };
    const adminSettingsService = {
      upsertSingleSetting: vi.fn().mockResolvedValue(undefined),
    };
    const prisma = createPrismaMock();

    const service = new AdminBrandAssetsService(assetStorage as any, adminSettingsService as any, prisma as any);
    const result = await service.uploadBrandAsset('logo_principal', {
      originalname: 'logo.png',
      mimetype: 'image/png',
      size: 128,
      buffer: Buffer.from('logo'),
    });

    expect(assetStorage.validateUpload).toHaveBeenCalled();
    expect(assetStorage.writePublicAsset).toHaveBeenCalledWith(
      expect.stringMatching(/^brand-assets\/identity\/logo_principal\/[a-z0-9]+-logo-principal\.png$/),
      Buffer.from('logo'),
    );
    expect(prisma.brandAssetVersion.updateMany).toHaveBeenCalledWith({ where: { slot: 'logo_principal' }, data: { isActive: false } });
    expect(prisma.brandAssetVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slot: 'logo_principal',
          isActive: true,
          source: 'upload',
          originalName: 'logo.png',
        }),
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const persistedPath = (adminSettingsService.upsertSingleSetting.mock.calls[0]?.[1] as string | undefined) ?? '';
    expect(adminSettingsService.upsertSingleSetting).toHaveBeenCalledWith(
      'brand_asset.logo_principal.path',
      persistedPath,
      'branding_assets',
      'brand_asset.logo_principal.path',
      'text',
    );
    expect(persistedPath).toMatch(/^brand-assets\/identity\/logo_principal\/[a-z0-9]+-logo-principal\.png$/);
    expect(result).toMatchObject({
      ok: true,
      slot: 'logo_principal',
      settingKey: 'brand_asset.logo_principal.path',
      path: persistedPath,
    });
  });

  it('registers a default version when resetting a brand asset without deleting history', async () => {
    const assetStorage = {
      toPublicUrl: vi.fn().mockReturnValue('/brand/logo.png'),
    };
    const adminSettingsService = {
      upsertSingleSetting: vi.fn().mockResolvedValue(undefined),
    };
    const prisma = createPrismaMock();

    const service = new AdminBrandAssetsService(assetStorage as any, adminSettingsService as any, prisma as any);
    const result = await service.resetBrandAsset('logo_principal');

    expect(prisma.brandAssetVersion.updateMany).toHaveBeenCalledWith({ where: { slot: 'logo_principal' }, data: { isActive: false } });
    expect(prisma.brandAssetVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slot: 'logo_principal',
          path: 'brand/logo.png',
          isActive: true,
          source: 'default',
        }),
      }),
    );
    expect(adminSettingsService.upsertSingleSetting).toHaveBeenCalledWith(
      'brand_asset.logo_principal.path',
      'brand/logo.png',
      'branding_assets',
      'brand_asset.logo_principal.path',
      'text',
    );
    expect(result.resetToDefault).toBe(true);
  });

  it('activates a previous version and updates the public setting', async () => {
    const assetStorage = {
      toPublicUrl: vi.fn((path: string) => `/${path}`),
    };
    const adminSettingsService = {
      upsertSingleSetting: vi.fn().mockResolvedValue(undefined),
    };
    const prisma = createPrismaMock();
    prisma.brandAssetVersion.findUnique.mockResolvedValue({
      id: 'version_1',
      slot: 'logo_principal',
      path: 'brand-assets/identity/logo_principal/old-logo.png',
    });

    const service = new AdminBrandAssetsService(assetStorage as any, adminSettingsService as any, prisma as any);
    const result = await service.activateBrandAssetVersion('logo_principal', 'version_1');

    expect(prisma.brandAssetVersion.updateMany).toHaveBeenCalledWith({ where: { slot: 'logo_principal' }, data: { isActive: false } });
    expect(prisma.brandAssetVersion.update).toHaveBeenCalledWith({ where: { id: 'version_1' }, data: { isActive: true } });
    expect(adminSettingsService.upsertSingleSetting).toHaveBeenCalledWith(
      'brand_asset.logo_principal.path',
      'brand-assets/identity/logo_principal/old-logo.png',
      'branding_assets',
      'brand_asset.logo_principal.path',
      'text',
    );
    expect(result).toMatchObject({ activatedVersionId: 'version_1' });
  });
});

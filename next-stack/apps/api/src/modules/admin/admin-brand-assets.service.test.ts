import { describe, expect, it, vi } from 'vitest';
import { AdminBrandAssetsService } from './admin-brand-assets.service.js';

describe('AdminBrandAssetsService', () => {
  it('stores uploaded assets through the storage adapter and persists the setting', async () => {
    const assetStorage = {
      validateUpload: vi.fn().mockReturnValue({ ext: 'png', buffer: Buffer.from('logo') }),
      writePublicAsset: vi.fn().mockResolvedValue('brand-assets/identity/logo-principal.png'),
      toPublicUrl: vi.fn().mockReturnValue('/brand-assets/identity/logo-principal.png'),
    };
    const adminSettingsService = {
      upsertSingleSetting: vi.fn().mockResolvedValue(undefined),
    };

    const service = new AdminBrandAssetsService(assetStorage as any, adminSettingsService as any);
    const result = await service.uploadBrandAsset('logo_principal', {
      originalname: 'logo.png',
      mimetype: 'image/png',
      size: 128,
      buffer: Buffer.from('logo'),
    });

    expect(assetStorage.validateUpload).toHaveBeenCalled();
    expect(assetStorage.writePublicAsset).toHaveBeenCalledWith('brand-assets/identity/logo-principal.png', Buffer.from('logo'));
    expect(adminSettingsService.upsertSingleSetting).toHaveBeenCalledWith(
      'brand_asset.logo_principal.path',
      'brand-assets/identity/logo-principal.png',
      'branding_assets',
      'brand_asset.logo_principal.path',
      'text',
    );
    expect(result).toMatchObject({
      ok: true,
      slot: 'logo_principal',
      settingKey: 'brand_asset.logo_principal.path',
      path: 'brand-assets/identity/logo-principal.png',
    });
  });

  it('removes all supported file variants when resetting a brand asset', async () => {
    const assetStorage = {
      deletePublicAsset: vi.fn().mockResolvedValue(undefined),
      toPublicUrl: vi.fn().mockReturnValue('/brand/logo.png'),
    };
    const adminSettingsService = {
      upsertSingleSetting: vi.fn().mockResolvedValue(undefined),
    };

    const service = new AdminBrandAssetsService(assetStorage as any, adminSettingsService as any);
    const result = await service.resetBrandAsset('logo_principal');

    expect(assetStorage.deletePublicAsset).toHaveBeenCalledTimes(5);
    expect(adminSettingsService.upsertSingleSetting).toHaveBeenCalledWith(
      'brand_asset.logo_principal.path',
      'brand/logo.png',
      'branding_assets',
      'brand_asset.logo_principal.path',
      'text',
    );
    expect(result.resetToDefault).toBe(true);
  });
});

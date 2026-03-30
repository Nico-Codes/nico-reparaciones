import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PublicAssetStorageService, type BufferedUploadFile } from '../../common/storage/public-asset-storage.service.js';
import { BRAND_ASSET_SLOTS } from './app-settings.registry.js';
import { AdminSettingsService } from './admin-settings.service.js';

@Injectable()
export class AdminBrandAssetsService {
  constructor(
    @Inject(PublicAssetStorageService) private readonly assetStorage: PublicAssetStorageService,
    @Inject(AdminSettingsService) private readonly adminSettingsService: AdminSettingsService,
  ) {}

  async uploadBrandAsset(slot: string, file: BufferedUploadFile) {
    const spec = BRAND_ASSET_SLOTS[slot as keyof typeof BRAND_ASSET_SLOTS];
    if (!spec) throw new BadRequestException('Slot de asset no soportado');

    const { ext, buffer } = this.assetStorage.validateUpload(file, spec.allowedExts as readonly string[], spec.maxKb);
    const relPath = `brand-assets/identity/${spec.fileBase}.${ext}`;
    await this.assetStorage.writePublicAsset(relPath, buffer);
    await this.adminSettingsService.upsertSingleSetting(spec.settingKey, relPath, 'branding_assets', spec.settingKey, 'text');

    return {
      ok: true,
      slot,
      settingKey: spec.settingKey,
      path: relPath,
      url: this.toApiAssetUrl(relPath),
      file: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    };
  }

  async resetBrandAsset(slot: string) {
    const spec = BRAND_ASSET_SLOTS[slot as keyof typeof BRAND_ASSET_SLOTS];
    if (!spec) throw new BadRequestException('Slot de asset no soportado');

    for (const ext of spec.allowedExts as readonly string[]) {
      await this.assetStorage.deletePublicAsset(`brand-assets/identity/${spec.fileBase}.${ext}`);
    }

    await this.adminSettingsService.upsertSingleSetting(
      spec.settingKey,
      spec.defaultPath || '',
      'branding_assets',
      spec.settingKey,
      'text',
    );

    return {
      ok: true,
      slot,
      settingKey: spec.settingKey,
      path: spec.defaultPath || '',
      url: spec.defaultPath ? this.toApiAssetUrl(spec.defaultPath) : null,
      resetToDefault: true,
    };
  }

  private toApiAssetUrl(rawPath: string) {
    const relativeUrl = this.assetStorage.toPublicUrl(rawPath);
    if (!relativeUrl || /^https?:\/\//i.test(relativeUrl)) return relativeUrl;
    const base = ((process.env.API_URL ?? '').trim() || 'http://127.0.0.1:3001').replace(/\/+$/, '');
    return `${base}${relativeUrl}`;
  }
}

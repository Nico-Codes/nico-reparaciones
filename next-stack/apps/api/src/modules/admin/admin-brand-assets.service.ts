import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PublicAssetStorageService, type BufferedUploadFile } from '../../common/storage/public-asset-storage.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BRAND_ASSET_SLOTS } from './app-settings.registry.js';
import { AdminSettingsService } from './admin-settings.service.js';

@Injectable()
export class AdminBrandAssetsService {
  constructor(
    @Inject(PublicAssetStorageService) private readonly assetStorage: PublicAssetStorageService,
    @Inject(AdminSettingsService) private readonly adminSettingsService: AdminSettingsService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async uploadBrandAsset(slot: string, file: BufferedUploadFile) {
    const spec = BRAND_ASSET_SLOTS[slot as keyof typeof BRAND_ASSET_SLOTS];
    if (!spec) throw new BadRequestException('Slot de asset no soportado');

    const { ext, buffer } = this.assetStorage.validateUpload(file, spec.allowedExts as readonly string[], spec.maxKb);
    const relPath = `brand-assets/identity/${slot}/${Date.now().toString(36)}-${spec.fileBase}.${ext}`;
    await this.assetStorage.writePublicAsset(relPath, buffer);
    await this.prisma.$transaction([
      this.prisma.brandAssetVersion.updateMany({ where: { slot }, data: { isActive: false } }),
      this.prisma.brandAssetVersion.create({
        data: {
          slot,
          path: relPath,
          originalName: file.originalname ?? null,
          mimeType: file.mimetype ?? null,
          size: Math.max(file.size ?? 0, buffer.byteLength),
          isActive: true,
          source: 'upload',
        },
      }),
    ]);
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

    await this.prisma.$transaction([
      this.prisma.brandAssetVersion.updateMany({ where: { slot }, data: { isActive: false } }),
      this.prisma.brandAssetVersion.create({
        data: {
          slot,
          path: spec.defaultPath || '',
          originalName: spec.defaultPath ? 'Por defecto' : null,
          mimeType: null,
          size: null,
          isActive: true,
          source: 'default',
        },
      }),
    ]);
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

  async listBrandAssetVersions(slot: string) {
    const spec = BRAND_ASSET_SLOTS[slot as keyof typeof BRAND_ASSET_SLOTS];
    if (!spec) throw new BadRequestException('Slot de asset no soportado');

    const [setting, versions] = await Promise.all([
      this.prisma.appSetting.findUnique({ where: { key: spec.settingKey } }),
      this.prisma.brandAssetVersion.findMany({
        where: { slot },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const activePath = (setting?.value ?? spec.defaultPath ?? '').trim();
    const hasActiveVersion = versions.some((version) => version.isActive);
    const defaultVersion = {
      id: 'default',
      slot,
      path: spec.defaultPath || '',
      url: spec.defaultPath ? this.toApiAssetUrl(spec.defaultPath) : null,
      originalName: 'Por defecto',
      mimeType: null,
      size: null,
      source: 'default',
      isActive: activePath === (spec.defaultPath || '') && !hasActiveVersion,
      createdAt: null,
    };

    return {
      slot,
      settingKey: spec.settingKey,
      defaultPath: spec.defaultPath || '',
      activePath,
      items: [
        defaultVersion,
        ...versions.map((version) => ({
          id: version.id,
          slot: version.slot,
          path: version.path,
          url: version.path ? this.toApiAssetUrl(version.path) : null,
          originalName: version.originalName,
          mimeType: version.mimeType,
          size: version.size,
          source: version.source,
          isActive: version.isActive,
          createdAt: version.createdAt.toISOString(),
        })),
      ],
    };
  }

  async activateBrandAssetVersion(slot: string, versionId: string) {
    const spec = BRAND_ASSET_SLOTS[slot as keyof typeof BRAND_ASSET_SLOTS];
    if (!spec) throw new BadRequestException('Slot de asset no soportado');

    if (versionId === 'default') {
      return this.resetBrandAsset(slot);
    }

    const version = await this.prisma.brandAssetVersion.findUnique({ where: { id: versionId } });
    if (!version || version.slot !== slot) throw new BadRequestException('Version de asset no encontrada');

    await this.prisma.$transaction([
      this.prisma.brandAssetVersion.updateMany({ where: { slot }, data: { isActive: false } }),
      this.prisma.brandAssetVersion.update({ where: { id: version.id }, data: { isActive: true } }),
    ]);
    await this.adminSettingsService.upsertSingleSetting(spec.settingKey, version.path, 'branding_assets', spec.settingKey, 'text');

    return {
      ok: true,
      slot,
      settingKey: spec.settingKey,
      path: version.path,
      url: this.toApiAssetUrl(version.path),
      activatedVersionId: version.id,
    };
  }

  private toApiAssetUrl(rawPath: string) {
    const relativeUrl = this.assetStorage.toPublicUrl(rawPath);
    if (!relativeUrl || /^https?:\/\//i.test(relativeUrl)) return relativeUrl;
    const base = ((process.env.API_URL ?? '').trim() || 'http://127.0.0.1:3001').replace(/\/+$/, '');
    return `${base}${relativeUrl}`;
  }
}

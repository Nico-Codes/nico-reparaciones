import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type BufferedUploadFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer | Uint8Array;
};

@Injectable()
export class PublicAssetStorageService {
  validateUpload(file: BufferedUploadFile, allowedExts: readonly string[], maxKb: number) {
    const ext = this.detectFileExt(file.originalname);
    if (!ext || !allowedExts.includes(ext)) {
      throw new BadRequestException(`Formato no permitido. Permitidos: ${allowedExts.join(', ')}`);
    }

    const buffer = this.ensureBufferedFile(file);
    const size = Math.max(file.size ?? 0, buffer.byteLength);
    if (size > maxKb * 1024) {
      throw new BadRequestException(`Archivo supera el maximo (${maxKb} KB)`);
    }

    return { ext, buffer };
  }

  buildTimestampedProductImagePath(productId: string, ext: string) {
    return `products/${productId}-${Date.now().toString(36)}.${ext}`;
  }

  async writePublicAsset(relativePath: string, buffer: Buffer | Uint8Array) {
    const relPath = this.normalizeRelativePath(relativePath);
    const absPath = path.join(this.resolvePublicRoot(), ...relPath.split('/'));
    await mkdir(path.dirname(absPath), { recursive: true });
    await writeFile(absPath, Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer));
    return relPath;
  }

  async writeStorageAsset(relativePath: string, buffer: Buffer | Uint8Array) {
    const relPath = this.normalizeStorageRelativePath(relativePath);
    if (!relPath) throw new BadRequestException('Ruta de storage invalida');
    await this.writePublicAsset(`storage/${relPath}`, buffer);
    return relPath;
  }

  async deletePublicAsset(relativePath?: string | null) {
    const relPath = this.normalizeRelativePath(relativePath);
    const absPath = path.join(this.resolvePublicRoot(), ...relPath.split('/'));
    try {
      await unlink(absPath);
    } catch {
      // ignore missing files
    }
  }

  async deleteStorageAsset(rawPath?: string | null) {
    const relPath = this.normalizeStorageRelativePath(rawPath);
    if (!relPath) return;
    await this.deletePublicAsset(`storage/${relPath}`);
  }

  toPublicUrl(rawPath?: string | null) {
    const value = (rawPath ?? '').trim();
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    return `/${this.normalizeRelativePath(value)}`;
  }

  toStorageUrl(rawPath?: string | null) {
    const value = (rawPath ?? '').trim();
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/')) return value;
    const relPath = this.normalizeStorageRelativePath(value);
    if (!relPath) return null;
    return `/storage/${relPath}`;
  }

  detectFileExt(filename: string) {
    const ext = path.extname(filename ?? '').replace('.', '').trim().toLowerCase();
    return ext || null;
  }

  private ensureBufferedFile(file: BufferedUploadFile) {
    if (Buffer.isBuffer(file.buffer)) return file.buffer;
    if (file.buffer instanceof Uint8Array) return Buffer.from(file.buffer);
    throw new BadRequestException('Archivo invalido');
  }

  private resolvePublicRoot() {
    const envCandidates = [process.env.WEB_PUBLIC_DIR, process.env.APP_WEB_PUBLIC_DIR].filter(
      (value): value is string => Boolean(value && value.trim()),
    );
    const cwd = process.cwd();
    const candidates = [
      ...envCandidates.map((value) => path.resolve(value)),
      path.resolve(cwd, 'apps/web/public'),
      path.resolve(cwd, '../web/public'),
      path.resolve(cwd, '../../apps/web/public'),
    ];

    const found = candidates.find((candidate) => existsSync(candidate));
    if (!found) throw new Error('No se pudo resolver apps/web/public');
    return found;
  }

  private normalizeRelativePath(rawPath?: string | null) {
    const value = (rawPath ?? '').trim().replace(/\\/g, '/').replace(/^\/+/, '');
    if (!value || value.includes('..')) throw new BadRequestException('Ruta de asset invalida');
    return value;
  }

  private normalizeStorageRelativePath(rawPath?: string | null) {
    const value = (rawPath ?? '').trim();
    if (!value || /^https?:\/\//i.test(value)) return null;

    let normalized = value.replace(/\\/g, '/').replace(/^\/+/, '');
    if (normalized.startsWith('storage/')) normalized = normalized.slice('storage/'.length);
    if (normalized.startsWith('products/')) normalized = normalized.slice('products/'.length);
    if (!normalized || normalized.includes('..')) return null;
    return `products/${normalized}`;
  }
}

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
    const normalizedAllowedExts = allowedExts.map((value) => value.trim().toLowerCase()).filter(Boolean);
    if (!ext || !normalizedAllowedExts.includes(ext)) {
      throw new BadRequestException(`Formato no permitido. Permitidos: ${allowedExts.join(', ')}`);
    }

    const buffer = this.ensureBufferedFile(file);
    const size = Math.max(file.size ?? 0, buffer.byteLength);
    if (size > maxKb * 1024) {
      throw new BadRequestException(`Archivo supera el maximo (${maxKb} KB)`);
    }

    const safeBuffer = this.assertUploadContentMatchesExtension(buffer, ext);

    return { ext, buffer: safeBuffer };
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

  private assertUploadContentMatchesExtension(buffer: Buffer, ext: string) {
    if (ext === 'png' && this.hasBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
      return buffer;
    }
    if ((ext === 'jpg' || ext === 'jpeg') && this.hasBytes(buffer, [0xff, 0xd8, 0xff])) {
      return buffer;
    }
    if (ext === 'webp' && this.isWebp(buffer)) {
      return buffer;
    }
    if (ext === 'ico' && this.hasBytes(buffer, [0x00, 0x00, 0x01, 0x00])) {
      return buffer;
    }
    if (ext === 'pdf' && this.hasBytes(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
      return buffer;
    }
    if (ext === 'svg') {
      return this.validateSvg(buffer);
    }

    throw new BadRequestException('El contenido del archivo no coincide con el formato declarado');
  }

  private validateSvg(buffer: Buffer) {
    if (buffer.includes(0)) {
      throw new BadRequestException('SVG invalido');
    }

    const text = buffer.toString('utf8').trim();
    if (!/<svg[\s>]/i.test(text) || /<html[\s>]/i.test(text)) {
      throw new BadRequestException('SVG invalido');
    }

    const unsafePatterns = [
      /<script\b/i,
      /<foreignObject\b/i,
      /<iframe\b/i,
      /<object\b/i,
      /<embed\b/i,
      /\son[a-z]+\s*=/i,
      /javascript\s*:/i,
      /data\s*:\s*text\/html/i,
      /<!doctype\b/i,
      /<!entity\b/i,
      /<image\b[^>]+(?:href|xlink:href)\s*=\s*["']\s*https?:/i,
    ];
    if (unsafePatterns.some((pattern) => pattern.test(text))) {
      throw new BadRequestException('SVG contiene contenido no permitido');
    }

    return Buffer.from(text, 'utf8');
  }

  private hasBytes(buffer: Buffer, bytes: readonly number[]) {
    if (buffer.byteLength < bytes.length) return false;
    return bytes.every((byte, index) => buffer[index] === byte);
  }

  private isWebp(buffer: Buffer) {
    if (buffer.byteLength < 12) return false;
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
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

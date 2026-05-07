import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PublicAssetStorageService } from './public-asset-storage.service.js';

const createdDirs: string[] = [];
const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const jpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00]);
const webpBuffer = Buffer.from('RIFF0000WEBPvp8 ', 'ascii');
const safeSvgBuffer = Buffer.from('<svg viewBox="0 0 24 24"><path d="M1 1h2"/></svg>', 'utf8');

async function createPublicRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'nico-public-assets-'));
  createdDirs.push(root);
  process.env.WEB_PUBLIC_DIR = root;
  delete process.env.APP_WEB_PUBLIC_DIR;
  return root;
}

afterEach(async () => {
  delete process.env.WEB_PUBLIC_DIR;
  delete process.env.APP_WEB_PUBLIC_DIR;
  while (createdDirs.length > 0) {
    const dir = createdDirs.pop();
    if (dir) await rm(dir, { recursive: true, force: true });
  }
});

describe('PublicAssetStorageService', () => {
  it('writes and removes storage assets inside the configured public root', async () => {
    const root = await createPublicRoot();
    const service = new PublicAssetStorageService();
    const relativePath = service.buildTimestampedProductImagePath('prod-1', 'png');

    const savedPath = await service.writeStorageAsset(relativePath, Buffer.from('demo-image'));
    const absolutePath = path.join(root, 'storage', ...savedPath.split('/'));

    expect(savedPath).toBe(relativePath);
    expect(existsSync(absolutePath)).toBe(true);
    expect(await readFile(absolutePath, 'utf8')).toBe('demo-image');
    expect(service.toStorageUrl(relativePath)).toBe(`/storage/${relativePath}`);

    await service.deleteStorageAsset(relativePath);

    expect(existsSync(absolutePath)).toBe(false);
  });

  it('rejects uploads with invalid extensions', () => {
    const service = new PublicAssetStorageService();

    expect(() =>
      service.validateUpload(
        { originalname: 'logo.exe', mimetype: 'application/octet-stream', size: 10, buffer: Buffer.from('x') },
        ['png', 'jpg'],
        128,
      ),
    ).toThrowError(/Formato no permitido/);
  });

  it('accepts known safe image signatures', () => {
    const service = new PublicAssetStorageService();

    expect(
      service.validateUpload({ originalname: 'image.png', mimetype: 'image/png', size: pngBuffer.byteLength, buffer: pngBuffer }, ['png'], 128)
        .ext,
    ).toBe('png');
    expect(
      service.validateUpload({ originalname: 'image.jpg', mimetype: 'image/jpeg', size: jpgBuffer.byteLength, buffer: jpgBuffer }, ['jpg'], 128)
        .ext,
    ).toBe('jpg');
    expect(
      service.validateUpload({ originalname: 'image.webp', mimetype: 'image/webp', size: webpBuffer.byteLength, buffer: webpBuffer }, ['webp'], 128)
        .ext,
    ).toBe('webp');
    expect(
      service.validateUpload({ originalname: 'icon.svg', mimetype: 'image/svg+xml', size: safeSvgBuffer.byteLength, buffer: safeSvgBuffer }, ['svg'], 128)
        .ext,
    ).toBe('svg');
  });

  it('rejects extension spoofing', () => {
    const service = new PublicAssetStorageService();

    expect(() =>
      service.validateUpload(
        { originalname: 'image.png', mimetype: 'image/png', size: 18, buffer: Buffer.from('<html>fake</html>') },
        ['png'],
        128,
      ),
    ).toThrowError(/contenido del archivo/);
  });

  it('rejects unsafe SVG uploads', () => {
    const service = new PublicAssetStorageService();

    expect(() =>
      service.validateUpload(
        {
          originalname: 'icon.svg',
          mimetype: 'image/svg+xml',
          size: 64,
          buffer: Buffer.from('<svg><script>alert(1)</script></svg>'),
        },
        ['svg'],
        128,
      ),
    ).toThrowError(/SVG contiene contenido no permitido/);
    expect(() =>
      service.validateUpload(
        {
          originalname: 'icon.svg',
          mimetype: 'image/svg+xml',
          size: 64,
          buffer: Buffer.from('<svg onload="alert(1)"><path d="M0 0"/></svg>'),
        },
        ['svg'],
        128,
      ),
    ).toThrowError(/SVG contiene contenido no permitido/);
  });
});

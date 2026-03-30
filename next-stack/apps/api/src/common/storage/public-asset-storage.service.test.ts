import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PublicAssetStorageService } from './public-asset-storage.service.js';

const createdDirs: string[] = [];

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
});

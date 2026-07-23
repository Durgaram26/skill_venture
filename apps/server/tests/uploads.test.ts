import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { saveListingImage } from '../src/modules/uploads/uploads.service.js';

describe('saveListingImage', () => {
  const tinyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );

  it('writes a listing cover and returns a public path', async () => {
    const result = await saveListingImage({
      mimeType: 'image/png',
      data: tinyPng.toString('base64'),
      fileName: 'preview-cover.png',
    });

    expect(result.url).toMatch(/^\/uploads\/listings\/preview-cover-[a-f0-9]+\.png$/);
    const diskPath = path.resolve(
      process.cwd(),
      '../client/public',
      result.url.replace(/^\//, ''),
    );
    const stat = await fs.stat(diskPath);
    expect(stat.size).toBe(tinyPng.length);
    await fs.unlink(diskPath);
  });

  it('rejects oversized payloads', async () => {
    const big = Buffer.alloc(5 * 1024 * 1024 + 1, 1);
    await expect(
      saveListingImage({
        mimeType: 'image/jpeg',
        data: big.toString('base64'),
      }),
    ).rejects.toMatchObject({ code: 'IMAGE_TOO_LARGE' });
  });
});

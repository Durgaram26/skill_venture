import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppError } from '../../utils/AppError.js';
import type { ListingImageUploadInput } from './uploads.validation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '../../../../client/public/uploads/listings');
const MAX_BYTES = 5 * 1024 * 1024;

const EXT: Record<ListingImageUploadInput['mimeType'], string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export async function saveListingImage(input: ListingImageUploadInput) {
  let buffer: Buffer;
  try {
    buffer = Buffer.from(input.data, 'base64');
  } catch {
    throw new AppError('Invalid image data', 400, 'INVALID_IMAGE');
  }

  if (!buffer.length) {
    throw new AppError('Image file is empty', 400, 'INVALID_IMAGE');
  }
  if (buffer.length > MAX_BYTES) {
    throw new AppError('Image must be 5 MB or smaller', 400, 'IMAGE_TOO_LARGE');
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const base =
    input.fileName
      ?.replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .slice(0, 40) || 'cover';
  const fileName = `${base}-${crypto.randomBytes(6).toString('hex')}${EXT[input.mimeType]}`;
  const diskPath = path.join(UPLOAD_DIR, fileName);

  await fs.writeFile(diskPath, buffer);

  return {
    url: `/uploads/listings/${fileName}`,
    fileName,
    size: buffer.length,
  };
}

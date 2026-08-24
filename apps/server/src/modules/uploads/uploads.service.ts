import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { AppError } from '../../utils/AppError.js';
import type { ListingImageUploadInput, ProfileImageUploadInput } from './uploads.validation.js';

// In serverless environments (Netlify Functions) only /tmp is writable.
// In local dev the uploads land in the client's public dir via the dev server.
// The server is commonly started from either the repository root or apps/server.
const CLIENT_PUBLIC_DIR =
  path.basename(process.cwd()) === 'server'
    ? path.resolve(process.cwd(), '../client/public')
    : path.resolve(process.cwd(), 'apps/client/public');
const LISTING_UPLOAD_DIR =
  process.env.NODE_ENV === 'production'
    ? '/tmp/uploads/listings'
    : path.join(CLIENT_PUBLIC_DIR, 'uploads/listings');
const PROFILE_UPLOAD_DIR =
  process.env.NODE_ENV === 'production'
    ? '/tmp/uploads/profiles'
    : path.join(CLIENT_PUBLIC_DIR, 'uploads/profiles');
const MAX_BYTES = 5 * 1024 * 1024;

const EXT: Record<ListingImageUploadInput['mimeType'], string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export async function saveListingImage(input: ListingImageUploadInput) {
  return saveImage(input, LISTING_UPLOAD_DIR, 'cover', 'listings');
}

export async function saveProfileImage(input: ProfileImageUploadInput) {
  return saveImage(input, PROFILE_UPLOAD_DIR, 'profile', 'profiles');
}

async function saveImage(
  input: ListingImageUploadInput | ProfileImageUploadInput,
  uploadDir: string,
  fallbackBase: string,
  publicFolder: string,
) {
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

  await fs.mkdir(uploadDir, { recursive: true });

  const base =
    input.fileName
      ?.replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .slice(0, 40) || fallbackBase;
  const fileName = `${base}-${crypto.randomBytes(6).toString('hex')}${EXT[input.mimeType]}`;
  const diskPath = path.join(uploadDir, fileName);

  await fs.writeFile(diskPath, buffer);

  return {
    url: `/uploads/${publicFolder}/${fileName}`,
    fileName,
    size: buffer.length,
  };
}

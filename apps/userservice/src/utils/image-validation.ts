import { fileTypeFromBuffer } from 'file-type';
import { ImageValidationResult } from '../types';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 4000;
const MIN_DIMENSION = 50;

export async function validateImageFile(
  buffer: Buffer,
): Promise<ImageValidationResult> {
  if (buffer.length === 0) {
    return { isValid: false, error: 'File is empty' };
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    };
  }

  const fileType = await fileTypeFromBuffer(buffer);

  if (!fileType) {
    return { isValid: false, error: 'Unable to detect file type' };
  }

  if (!ALLOWED_MIME_TYPES.includes(fileType.mime)) {
    return {
      isValid: false,
      error: `File type ${fileType.mime} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  if (!ALLOWED_EXTENSIONS.some((ext) => fileType.ext === ext.replace('.', ''))) {
    return {
      isValid: false,
      error: `File extension .${fileType.ext} is not allowed`,
    };
  }

  try {
    const sharp = await import('sharp');
    const metadata = await sharp.default(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      return { isValid: false, error: 'Unable to read image dimensions' };
    }

    if (
      metadata.width > MAX_DIMENSION ||
      metadata.height > MAX_DIMENSION
    ) {
      return {
        isValid: false,
        error: `Image dimensions exceed ${MAX_DIMENSION}x${MAX_DIMENSION}px limit`,
      };
    }

    if (
      metadata.width < MIN_DIMENSION ||
      metadata.height < MIN_DIMENSION
    ) {
      return {
        isValid: false,
        error: `Image dimensions must be at least ${MIN_DIMENSION}x${MIN_DIMENSION}px`,
      };
    }

    return {
      isValid: true,
      mimeType: fileType.mime,
      width: metadata.width,
      height: metadata.height,
    };
  } catch (error: any) {
    return {
      isValid: false,
      error: `Image validation failed: ${error.message}`,
    };
  }
}

export async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  const sharp = await import('sharp');
  return sharp
    .default(buffer)
    .resize(400, 400, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();
}

import { v2 as cloudinary } from 'cloudinary';
import { ServerConfig } from '../config';
import { logger } from '@hyperlocal/shared/logger';
import { UploadResult, UploadOptions } from '../types';

cloudinary.config({
  cloud_name: ServerConfig.CLOUDINARY_CLOUD_NAME,
  api_key: ServerConfig.CLOUDINARY_API_KEY,
  api_secret: ServerConfig.CLOUDINARY_API_SECRET,
  secure: true,
});

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function uploadImage(
  fileBuffer: Buffer,
  options: UploadOptions,
): Promise<UploadResult> {
  const {
    folder = 'avatars',
    userId,
    transformation,
    retryCount = 0,
  } = options;

  const defaultTransformation = [
    { width: 400, height: 400, crop: 'fill', gravity: 'face' },
    { quality: 'auto:good' },
    { format: 'auto' },
    { fetch_format: 'auto' },
  ];

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `hyperlocal/${folder}`,
        public_id: `user_${userId}_${Date.now()}`,
        resource_type: 'image',
        transformation: transformation || defaultTransformation,
        overwrite: false,
        invalidate: true,
        timeout: 60000,
      },
      async (error, result) => {
        if (error) {
          if (retryCount < MAX_RETRIES) {
            logger.warn('Cloudinary upload failed, retrying', {
              error: error.message,
              retryCount: retryCount + 1,
              userId,
            });

            await sleep(RETRY_DELAY_MS * (retryCount + 1));

            try {
              const retryResult = await uploadImage(fileBuffer, {
                ...options,
                retryCount: retryCount + 1,
              });
              resolve(retryResult);
            } catch (retryError) {
              reject(retryError);
            }
          } else {
            logger.error('Cloudinary upload failed after max retries', {
              error: error.message,
              userId,
            });
            reject(error);
          }
        } else if (result) {
          resolve({
            url: result.url,
            publicId: result.public_id,
            secureUrl: result.secure_url,
          });
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      },
    );

    uploadStream.on('error', (streamError) => {
      logger.error('Cloudinary upload stream error', {
        error: streamError.message,
        userId,
      });
      reject(streamError);
    });

    uploadStream.end(fileBuffer);
  });
}

export async function deleteImage(
  publicId: string,
  retryCount: number = 0,
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      timeout: 30000,
    });
  } catch (error: unknown) {
    if (retryCount < MAX_RETRIES) {
      logger.warn('Cloudinary delete failed, retrying', {
        error: error.message,
        publicId,
        retryCount: retryCount + 1,
      });

      await sleep(RETRY_DELAY_MS * (retryCount + 1));
      return deleteImage(publicId, retryCount + 1);
    }
    throw error;
  }
}

export function extractPublicIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const versionIndex = pathParts.findIndex((part) => /^v\d+$/.test(part));
    const publicIdParts = versionIndex !== -1
      ? pathParts.slice(versionIndex + 1)
      : pathParts.slice(-2);

    const publicId = publicIdParts
      .join('/')
      .replace(/\.[^/.]+$/, '');

    return publicId || null;
  } catch {
    return null;
  }
}

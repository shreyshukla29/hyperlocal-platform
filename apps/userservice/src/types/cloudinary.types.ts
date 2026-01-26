export interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
}

export interface UploadOptions {
  folder?: string;
  userId: string;
  transformation?: any[];
  retryCount?: number;
}


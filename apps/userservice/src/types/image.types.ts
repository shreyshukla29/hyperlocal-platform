export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  mimeType?: string;
  width?: number;
  height?: number;
}


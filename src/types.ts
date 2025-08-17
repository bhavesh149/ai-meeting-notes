// Common types and utilities

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
  statusCode?: number;
}

// Utility function to create standardized API responses
export function createApiResponse<T>(
  data?: T,
  message?: string,
  success: boolean = true
): ApiResponse<T> {
  return {
    success,
    data,
    message,
  };
}

export function createApiError(
  error: string,
  message?: string,
  statusCode: number = 500,
  details?: any
): ApiError {
  return {
    error,
    message,
    details,
    statusCode,
  };
}

// Environment variable helpers
export function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

export function getOptionalEnvVar(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}

// Database utility types
export type CreateSummaryData = {
  transcript: string;
  prompt: string;
  model: string;
  aiSummary: string;
  tokensIn?: number;
  tokensOut?: number;
  status?: string;
  userId?: string;
};

export type UpdateSummaryData = {
  editedSummary?: string;
  aiSummary?: string;
  tokensIn?: number;
  tokensOut?: number;
  status?: string;
};

export type CreateShareData = {
  summaryId: string;
  recipients: string[];
  subject?: string;
  bodyHtml: string;
};

// File upload types
export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// Email types
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

// Logger utility
export function createLogger(name: string) {
  return {
    info: (obj: any, message?: string) => console.log(`[${name}] INFO:`, message, obj),
    warn: (obj: any, message?: string) => console.warn(`[${name}] WARN:`, message, obj),
    error: (obj: any, message?: string) => console.error(`[${name}] ERROR:`, message, obj),
    debug: (obj: any, message?: string) => console.debug(`[${name}] DEBUG:`, message, obj),
  };
}

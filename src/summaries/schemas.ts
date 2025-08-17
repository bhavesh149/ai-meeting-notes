import { z } from 'zod';

// Summary Generation Schema
export const generateSummarySchema = z.object({
  transcript: z.string().min(10, 'Transcript must be at least 10 characters long'),
  prompt: z.string().min(5, 'Prompt must be at least 5 characters long'),
  model: z.string().optional().default('llama3-70b-8192'),
});

export type GenerateSummaryInput = z.infer<typeof generateSummarySchema>;

// Summary Update Schema
export const updateSummarySchema = z.object({
  editedSummary: z.string().min(1, 'Edited summary cannot be empty'),
});

export type UpdateSummaryInput = z.infer<typeof updateSummarySchema>;

// Share Summary Schema
export const shareSummarySchema = z.object({
  recipients: z.array(z.string().email('Invalid email address')).min(1, 'At least one recipient is required'),
  subject: z.string().optional(),
});

export type ShareSummaryInput = z.infer<typeof shareSummarySchema>;

// Query Parameters Schema
export const listSummariesQuerySchema = z.object({
  page: z.string().transform(val => Math.max(1, parseInt(val) || 1)),
  limit: z.string().transform(val => Math.min(100, Math.max(1, parseInt(val) || 10))),
  userId: z.string().optional(),
});

export type ListSummariesQuery = z.infer<typeof listSummariesQuerySchema>;

// Params Schema
export const summaryParamsSchema = z.object({
  id: z.string().min(1, 'Summary ID is required'),
});

export type SummaryParams = z.infer<typeof summaryParamsSchema>;

// File Upload Schema
export const fileUploadSchema = z.object({
  originalname: z.string(),
  mimetype: z.literal('text/plain'),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'), // 10MB limit
  buffer: z.instanceof(Buffer),
});

export type FileUpload = z.infer<typeof fileUploadSchema>;

// Response Schemas
export const summaryResponseSchema = z.object({
  id: z.string(),
  transcript: z.string(),
  prompt: z.string(),
  aiSummary: z.string(),
  editedSummary: z.string().nullable(),
  model: z.string(),
  tokensIn: z.number().nullable(),
  tokensOut: z.number().nullable(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string().nullable(),
});

export type SummaryResponse = z.infer<typeof summaryResponseSchema>;

export const listSummariesResponseSchema = z.object({
  summaries: z.array(summaryResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export type ListSummariesResponse = z.infer<typeof listSummariesResponseSchema>;

export const generateSummaryResponseSchema = z.object({
  id: z.string(),
  aiSummary: z.string(),
  tokensIn: z.number(),
  tokensOut: z.number(),
  model: z.string(),
});

export type GenerateSummaryResponse = z.infer<typeof generateSummaryResponseSchema>;

export const shareSummaryResponseSchema = z.object({
  success: z.boolean(),
  shareId: z.string(),
  recipients: z.array(z.string()),
  subject: z.string(),
  messageId: z.string().optional(),
});

export type ShareSummaryResponse = z.infer<typeof shareSummaryResponseSchema>;

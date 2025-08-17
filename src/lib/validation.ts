import { z } from 'zod'

export const createSummarySchema = z.object({
  transcript: z.string().min(10, 'Transcript must be at least 10 characters long'),
  prompt: z.string().min(5, 'Prompt must be at least 5 characters long'),
  model: z.string().optional().default('llama3-70b-8192'),
})

export const updateSummarySchema = z.object({
  editedSummary: z.string().min(1, 'Summary cannot be empty'),
})

export const shareSummarySchema = z.object({
  recipients: z.array(z.string().email('Invalid email address')).min(1, 'At least one recipient is required'),
  subject: z.string().optional(),
})

export type CreateSummaryForm = z.infer<typeof createSummarySchema>
export type UpdateSummaryForm = z.infer<typeof updateSummarySchema>
export type ShareSummaryForm = z.infer<typeof shareSummarySchema>

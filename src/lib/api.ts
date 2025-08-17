import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
export interface Summary {
  id: string
  transcript: string
  prompt: string
  aiSummary: string
  editedSummary?: string | null
  model: string
  tokensIn?: number | null
  tokensOut?: number | null
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
  userId?: string | null
  shares?: Share[]
  _count?: {
    shares: number
  }
}

export interface Share {
  id: string
  summaryId: string
  recipients: string[]
  subject?: string | null
  bodyHtml: string
  createdAt: string
}

export interface CreateSummaryData {
  transcript: string
  prompt: string
  model?: string
}

export interface UpdateSummaryData {
  editedSummary: string
}

export interface ShareSummaryData {
  recipients: string[]
  subject?: string
}

export interface PaginatedResponse<T> {
  summaries: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// API Functions
export const summariesApi = {
  // Get all summaries
  getAll: async (page = 1, limit = 10): Promise<PaginatedResponse<Summary>> => {
    const response = await api.get(`/summaries?page=${page}&limit=${limit}`)
    return response.data
  },

  // Get single summary
  getById: async (id: string): Promise<Summary> => {
    const response = await api.get(`/summaries/${id}`)
    return response.data
  },

  // Create summary with JSON
  create: async (data: CreateSummaryData): Promise<{ id: string; aiSummary: string; tokensIn: number; tokensOut: number; model: string }> => {
    const response = await api.post('/summaries/generate', data)
    return response.data
  },

  // Create summary with file upload
  createWithFile: async (file: File, prompt: string, model = 'llama3-70b-8192'): Promise<{ id: string; aiSummary: string; tokensIn: number; tokensOut: number; model: string }> => {
    const formData = new FormData()
    formData.append('transcript', file)
    formData.append('prompt', prompt)
    formData.append('model', model)

    const response = await api.post('/summaries/generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Update summary
  update: async (id: string, data: UpdateSummaryData): Promise<Summary> => {
    const response = await api.patch(`/summaries/${id}`, data)
    return response.data
  },

  // Share summary
  share: async (id: string, data: ShareSummaryData): Promise<{ success: boolean; shareId: string; recipients: string[]; subject: string; messageId?: string }> => {
    const response = await api.post(`/summaries/${id}/share`, data)
    return response.data
  },

  // Delete summary
  delete: async (id: string): Promise<{ success: boolean; message: string; deletedId: string }> => {
    const response = await api.delete(`/summaries/${id}`)
    return response.data
  },
}

export default api

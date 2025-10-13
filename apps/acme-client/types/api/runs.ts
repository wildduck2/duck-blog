// Processing Runs API Types

export interface ProcessingRun {
  id: string
  name: string
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed'
  progress_percent: number
  recipe_id: string
  module_id?: string
  input_quantities: Record<string, number>
  estimated_outputs?: Record<string, number>
  created_at: string
  started_at?: string
  completed_at?: string
  updated_at: string
  error_message?: string
  logs?: RunLog[]
  steps?: RunStep[]
}

export interface RunLog {
  id: string
  run_id: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  timestamp: string
  metadata?: Record<string, any>
}

export interface RunStep {
  id: string
  run_id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  started_at?: string
  completed_at?: string
  error_message?: string
}

export interface CreateRunRequest {
  name: string
  recipe_id: string
  module_id?: string
  input_quantities: Record<string, number>
  estimated_outputs?: Record<string, number>
}

export interface RunFilters {
  status?: 'queued' | 'running' | 'paused' | 'completed' | 'failed'
  module_id?: string
  recipe_id?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}

export interface RunsListResponse {
  items: ProcessingRun[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_previous: boolean
  }
}

export interface RunActionResponse {
  success: boolean
  message?: string
  run?: ProcessingRun
}

// Socket Events
export interface SocketRunProgress {
  id: string
  progress_percent: number
}

export interface SocketRunQueued {
  id: string
  name: string
}

export interface SocketRunStarted {
  id: string
  name: string
  started_at?: string
}

export interface SocketRunCompleted {
  id: string
  completed_at?: string
}

export interface SocketRunFailed {
  id: string
  error_message?: string
}

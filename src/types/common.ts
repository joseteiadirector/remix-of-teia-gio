/**
 * Common types used across the application
 */

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'pending' | 'in_progress' | 'completed' | 'failed';
export type DataSource = 'manual' | 'google_analytics' | 'google_search_console' | 'api';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

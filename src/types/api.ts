/**
 * API request and response types
 */

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface ApiSuccessResponse<T = any> {
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  code?: string;
  status: number;
  details?: any;
}

export interface ConnectionStatus {
  service: string;
  connected: boolean;
  message?: string;
  lastChecked?: string;
}

export interface ConnectionResults {
  gsc: ConnectionStatus;
  ga4: ConnectionStatus;
  openrouter: ConnectionStatus;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
}

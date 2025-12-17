/**
 * URL Analysis types
 */

import { BaseEntity, Priority, Status } from './common';

export type TaskPriority = Priority;
export type TaskStatus = Status;
export type TaskCategory = 'geo' | 'seo' | 'technical' | 'content' | 'performance';

export interface Task extends BaseEntity {
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  estimated_impact: number;
  estimated_effort?: string;
  analysis_id?: string;
  completed_at?: string;
  assigned_to?: string;
}

export interface UrlAnalysis extends BaseEntity {
  url: string;
  user_id: string;
  brand_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  geo_score?: number;
  seo_score?: number;
  performance_score?: number;
  accessibility_score?: number;
  technical_issues?: any[];
  recommendations?: Recommendation[];
  competitors?: string[];
  metadata?: Record<string, any>;
  analysis_duration_ms?: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: TaskCategory;
  impact: 'low' | 'medium' | 'high';
  effort: 'easy' | 'moderate' | 'complex';
  implemented?: boolean;
}

export interface CompetitorAnalysis {
  url: string;
  brand_name?: string;
  geo_score?: number;
  seo_score?: number;
  traffic_estimate?: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

export interface MonitoringSchedule extends BaseEntity {
  user_id: string;
  url: string;
  brand_id?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  last_run_at?: string;
  next_run_at?: string;
  notify_on_change?: boolean;
  threshold?: number;
}

/**
 * Insights and AI-related types
 */

import { BaseEntity } from './common';

export type InsightCategory = 
  | 'geo'
  | 'seo'
  | 'content'
  | 'performance'
  | 'competitor'
  | 'trend';

export type InsightPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AIInsight extends BaseEntity {
  brand_id?: string;
  category: InsightCategory;
  title: string;
  description: string;
  priority: InsightPriority;
  actionable: boolean;
  impact_score?: number;
  confidence_score?: number;
  recommendations?: string[];
  metadata?: Record<string, any>;
  expires_at?: string;
  viewed?: boolean;
}

export interface ScheduledReport extends BaseEntity {
  user_id: string;
  brand_ids: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_week?: number;
  time?: string;
  enabled: boolean;
  last_sent_at?: string;
  next_send_at?: string;
  recipients?: string[];
}

export interface GeneratedReport extends BaseEntity {
  user_id: string;
  brand_id?: string;
  report_type: 'geo' | 'seo' | 'full';
  title: string;
  content: any;
  format: 'pdf' | 'json' | 'html';
  file_url?: string;
  file_size?: number;
  generation_time_ms?: number;
}

export interface ReportData {
  brand_name: string;
  period: string;
  geo_score?: number;
  seo_score?: number;
  metrics: Record<string, any>;
  insights: AIInsight[];
  recommendations: string[];
}

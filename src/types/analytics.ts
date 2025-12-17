/**
 * Analytics and metrics types
 */

import { BaseEntity } from './common';

export interface AnalyticsMetric extends BaseEntity {
  brand_id: string;
  metric_type: string;
  value: number;
  date: string;
  metadata?: Record<string, any>;
}

export interface SeoMetrics extends BaseEntity {
  brand_id: string;
  url: string;
  page_speed_score?: number;
  accessibility_score?: number;
  seo_score?: number;
  best_practices_score?: number;
  performance_score?: number;
  indexed_pages?: number;
  broken_links?: number;
  meta_description?: string;
  title_tag?: string;
  canonical_url?: string;
  structured_data?: any;
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

export interface ChartData {
  name: string;
  value: number;
  fill?: string;
  label?: string;
}

export interface SyncResult {
  success: boolean;
  message?: string;
  records_synced?: number;
  errors?: string[];
}

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
}

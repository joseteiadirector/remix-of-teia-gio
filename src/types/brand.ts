/**
 * Brand-related types
 */

import { BaseEntity, DataSource } from './common';

export interface Brand extends BaseEntity {
  name: string;
  description?: string;
  url: string;
  user_id: string;
  logo_url?: string;
  industry?: string;
  target_audience?: string;
  keywords?: string[];
  competitors?: string[];
  data_source?: DataSource;
  is_primary?: boolean;
}

export interface GeoScore extends BaseEntity {
  brand_id: string;
  overall_score: number;
  visibility_score: number;
  sentiment_score: number;
  authority_score: number;
  relevance_score: number;
  trend_score: number;
  week_start: string;
  variation?: number;
}

export interface BrandMetrics {
  brand_id: string;
  mentions_count: number;
  positive_mentions: number;
  negative_mentions: number;
  neutral_mentions: number;
  total_reach: number;
  engagement_rate: number;
  sentiment_average: number;
}

export interface BrandComparison {
  brand_id: string;
  brand_name: string;
  geo_score: number;
  seo_score?: number;
  visibility: number;
  sentiment: number;
  authority: number;
  trend?: string;
}

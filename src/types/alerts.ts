/**
 * Alerts and notifications types
 */

import { BaseEntity, Priority } from './common';

export type AlertType = 
  | 'score_drop'
  | 'score_increase'
  | 'competitor_activity'
  | 'keyword_rank_change'
  | 'mention_spike'
  | 'negative_sentiment'
  | 'system';

export type AlertPriority = Priority;

export interface Alert extends BaseEntity {
  user_id: string;
  brand_id?: string;
  alert_type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  read: boolean;
  archived?: boolean;
  action_url?: string;
  metadata?: Record<string, any>;
}

export interface AlertConfig {
  user_id: string;
  alert_type: AlertType;
  enabled: boolean;
  threshold?: number;
  notify_email?: boolean;
  notify_in_app?: boolean;
  brands?: string[];
}

export interface AlertHistory extends Alert {
  acknowledged_at?: string;
  resolved_at?: string;
}

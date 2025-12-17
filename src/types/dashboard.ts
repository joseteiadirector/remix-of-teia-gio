/**
 * Dashboard and widget types
 */

export type WidgetType = 
  | 'score-card'
  | 'trends-chart'
  | 'mentions-chart'
  | 'alerts-card'
  | 'brands-overview'
  | 'weekly-variation'
  | 'predictions'
  | 'ai-analytics';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  order: number;
  visible: boolean;
  settings?: Record<string, any>;
}

export interface DashboardConfig {
  user_id: string;
  widgets: Widget[];
  layout?: 'grid' | 'list';
  theme?: 'light' | 'dark' | 'auto';
}

export interface DashboardWidgetProps {
  title: string;
  description?: string;
  icon?: any;
  value?: string | number;
  trend?: number;
  loading?: boolean;
  error?: string;
  className?: string;
}

export interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  icon?: any;
  color?: string;
  description?: string;
}

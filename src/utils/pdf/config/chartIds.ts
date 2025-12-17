/**
 * IDs Padronizados de Charts
 * TODOS os charts da plataforma devem usar estes IDs
 * NUNCA criar IDs ad-hoc nos componentes
 */

export const CHART_IDS = {
  // GEO Scores
  GEO_PILLARS_CHART: 'geo-pillars-chart',
  GEO_EVOLUTION_CHART: 'geo-evolution-chart',
  GEO_MENTIONS_CHART: 'geo-mentions-chart',
  GEO_RADAR_CHART: 'geo-radar-chart',
  GEO_METRICS_CHART: 'geo-metrics-chart',
  GEO_CHART: 'geo-chart',
  
  // SEO Scores
  SEO_METRICS_CHART: 'seo-metrics-chart',
  SEO_EVOLUTION_CHART: 'seo-evolution-chart',
  SEO_TRAFFIC_CHART: 'seo-traffic-chart',
  SEO_CHART: 'seo-chart',
  SEO_TRENDS: 'seo-trends',
  SEO_PERFORMANCE: 'seo-performance',
  
  // IGO Dashboard
  IGO_BRANDS_COMPARISON: 'igo-brands-comparison-chart',
  IGO_EVOLUTION_CHART: 'igo-evolution-chart',
  IGO_METRICS_RADAR: 'igo-metrics-radar-chart',
  IGO_COMPARISON_CHART: 'igo-comparison-chart',
  METRICS_RADAR: 'metrics-radar',
  
  // CPI Dashboard
  CPI_GAUGE_CHART: 'cpi-gauge-chart',
  CPI_METRICS_CHART: 'cpi-metrics-chart',
  CPI_CONSENSUS_CHART: 'cpi-consensus-chart',
  CPI_GAUGE: 'cpi-gauge',
  CONVERGENCE_CHART: 'convergence-chart',
  CONSENSUS_RADAR: 'consensus-radar',
  
  // LLM Mentions
  LLM_MENTIONS_HEATMAP: 'llm-mentions-heatmap',
  LLM_PROVIDERS_CHART: 'llm-providers-chart',
  
  // Dashboard Widgets & Combined
  DASHBOARD_UNIFIED_SCORE: 'dashboard-unified-score-widget',
  DASHBOARD_TRENDS: 'dashboard-trends-widget',
  DASHBOARD_MENTIONS: 'dashboard-mentions-widget',
  COMBINED_METRICS: 'combined-metrics',
} as const;

export type ChartId = typeof CHART_IDS[keyof typeof CHART_IDS];

/**
 * Valida se um ID de chart existe na configuração
 */
export function isValidChartId(id: string): id is ChartId {
  return Object.values(CHART_IDS).includes(id as ChartId);
}

/**
 * Retorna todos os IDs de uma categoria
 */
export function getChartIdsByCategory(category: 'geo' | 'seo' | 'igo' | 'cpi' | 'llm' | 'dashboard'): ChartId[] {
  const prefix = category.toUpperCase();
  return Object.entries(CHART_IDS)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value);
}

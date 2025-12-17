/**
 * Sistema Unificado de PDF Export - Tipos Compartilhados
 * Garante consistência entre todas as seções de PDF
 */

export interface PDFMetadata {
  title: string;
  brandName: string;
  period?: string;
  generatedAt: Date;
}

export interface ChartCapture {
  id: string;
  dataUrl: string | null;
  width?: number;
  height?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GEOPillarData {
  name: string;
  value: number;
  variation?: number;
}

export interface KAPIMetrics {
  ice: number;
  gap: number;
  cpi: number;
  stability: number;
}

export interface SEOMetrics {
  organic_traffic: number;
  total_clicks: number;
  total_impressions: number;
  ctr: number;
  avg_position: number;
  seo_score: number;
}

export interface LLMMention {
  provider: string;
  query: string;
  mentioned: boolean;
  confidence: number;
  answer_excerpt?: string;
}

export interface PDFSection {
  title: string;
  generate: (doc: any, yPosition: number) => Promise<number>;
}

export interface ExportDataGEO {
  brandName: string;
  brandDomain: string;
  geoScore: number;
  pillars: GEOPillarData[];
  mentions: LLMMention[];
  period?: string;
  kapiMetrics?: KAPIMetrics;
}

export interface ExportDataSEO {
  brandName: string;
  seoScore: number;
  metrics: SEOMetrics;
  period?: string;
}

export interface ExportDataIGO {
  brandName: string;
  brands: Array<{
    name: string;
    metrics: KAPIMetrics;
  }>;
  period?: string;
}

export interface ExportDataCPI {
  brandName: string;
  cpiMetrics: {
    cpi: number;
    ice: number;
    gap: number;
    stability: number;
  };
  llmConsensus: Array<{
    provider: string;
    mentions: number;
    confidence: number;
    sentiment?: number;
  }>;
  convergenceData?: Array<{
    timestamp: string;
    openai: number;
    claude: number;
    gemini: number;
    perplexity: number;
  }>;
  coherenceMatrix?: Array<{
    llm: string;
    openai: number;
    claude: number;
    gemini: number;
    perplexity: number;
  }>;
  period?: string;
}

export interface ExportDataScientific {
  brandName: string;
  period?: string;
  kapiMetrics: {
    ice: number;
    gap: number;
    cpi: number;
    consensus: number;
  };
  llmAnalysis: Array<{
    provider: string;
    confidence: number;
    coverage: number;
  }>;
  hypotheses: Array<{
    id: string;
    title: string;
    description: string;
    status: 'validated' | 'rejected' | 'pending';
    confidence: number;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
  }>;
}

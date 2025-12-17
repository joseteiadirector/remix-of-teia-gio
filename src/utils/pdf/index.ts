/**
 * Sistema Unificado de PDF Export - Entry Point
 * Exporta todas as funções e tipos necessários
 */

// Core
export { PDFGenerator } from './core/pdfGenerator';
export { captureChart, captureMultipleCharts, captureChartsByCategory, isChartCaptured, getValidCaptures } from './core/chartCapture';
export { validateGEOData, validateSEOData, validateIGOData, validateCPIData } from './core/dataValidator';

// Sections
export { createGEOSection } from './sections/geoSection';
export { createSEOSection } from './sections/seoSection';
export { createIGOSection } from './sections/igoSection';
export { createCPISection } from './sections/cpiSection';

// PDFShift Generators
export { generateGEOHTML, generateSEOHTML, generateIGOHTML, generateCPIHTML, generateGovernanceHTML } from './pdfshift-generator';
export type { ExportDataGovernance } from './pdfshift-generator';

// Unified Exports (USANDO PDFShift) - Updated with LLM Mentions and KPIs
export { exportGEOReport, exportSEOReport, exportIGOReport, exportCPIReport, exportCombinedReport, exportLLMMentionsReport, exportKPIsReport } from './unified-exports';

// Config
export { CHART_IDS, isValidChartId, getChartIdsByCategory } from './config/chartIds';

// Types
export type {
  PDFMetadata,
  ChartCapture,
  ValidationResult,
  GEOPillarData,
  KAPIMetrics,
  SEOMetrics,
  LLMMention,
  PDFSection,
  ExportDataGEO,
  ExportDataSEO,
  ExportDataIGO,
  ExportDataCPI,
} from './types';
export type { ChartId } from './config/chartIds';

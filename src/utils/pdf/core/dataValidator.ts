/**
 * Validação Robusta de Dados para PDF Export
 * Garante que NENHUM PDF seja gerado com dados vazios ou inválidos
 */

import { ValidationResult, ExportDataGEO, ExportDataSEO, ExportDataIGO, ExportDataCPI } from '../types';
import { logger } from '@/utils/logger';

/**
 * Valida dados de exportação GEO
 */
export function validateGEOData(data: ExportDataGEO): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validações críticas (bloqueiam export)
  if (!data.brandName || data.brandName.trim() === '') {
    errors.push('Nome da marca não pode estar vazio');
  }

  if (typeof data.geoScore !== 'number' || isNaN(data.geoScore)) {
    errors.push('GEO Score inválido ou ausente');
  }

  if (!Array.isArray(data.pillars) || data.pillars.length === 0) {
    errors.push('Pilares GEO não encontrados');
  } else {
    data.pillars.forEach((pillar, index) => {
      if (typeof pillar.value !== 'number' || isNaN(pillar.value)) {
        errors.push(`Pilar ${index + 1} tem valor inválido`);
      }
    });
  }

  // Validações de warning (não bloqueiam, mas alertam)
  if (!Array.isArray(data.mentions) || data.mentions.length === 0) {
    warnings.push('Nenhuma menção LLM encontrada');
  }

  if (data.kapiMetrics) {
    const { ice, gap, cpi, stability } = data.kapiMetrics;
    if ([ice, gap, cpi, stability].some(v => typeof v !== 'number' || isNaN(v))) {
      warnings.push('Algumas métricas KAPI estão ausentes ou inválidas');
    }
  }

  const isValid = errors.length === 0;

  if (!isValid) {
    logger.error('Validação GEO falhou', { errors, warnings, data });
  } else if (warnings.length > 0) {
    logger.warn('Validação GEO com avisos', { warnings, data });
  }

  return { isValid, errors, warnings };
}

/**
 * Valida dados de exportação SEO
 */
export function validateSEOData(data: ExportDataSEO): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.brandName || data.brandName.trim() === '') {
    errors.push('Nome da marca não pode estar vazio');
  }

  if (typeof data.seoScore !== 'number' || isNaN(data.seoScore)) {
    errors.push('SEO Score inválido ou ausente');
  }

  if (!data.metrics) {
    errors.push('Métricas SEO não encontradas');
  } else {
    const requiredMetrics = ['organic_traffic', 'total_clicks', 'total_impressions', 'ctr', 'avg_position'];
    requiredMetrics.forEach(metric => {
      const value = data.metrics[metric as keyof typeof data.metrics];
      if (typeof value !== 'number' || isNaN(value)) {
        warnings.push(`Métrica ${metric} inválida ou ausente`);
      }
    });
  }

  const isValid = errors.length === 0;

  if (!isValid) {
    logger.error('Validação SEO falhou', { errors, warnings, data });
  } else if (warnings.length > 0) {
    logger.warn('Validação SEO com avisos', { warnings, data });
  }

  return { isValid, errors, warnings };
}

/**
 * Valida dados de exportação IGO
 */
export function validateIGOData(data: ExportDataIGO): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.brandName || data.brandName.trim() === '') {
    errors.push('Nome da marca não pode estar vazio');
  }

  if (!Array.isArray(data.brands) || data.brands.length === 0) {
    errors.push('Nenhuma marca encontrada para comparação');
  } else {
    data.brands.forEach((brand, index) => {
      if (!brand.name) {
        errors.push(`Marca ${index + 1} sem nome`);
      }
      if (!brand.metrics) {
        errors.push(`Marca ${brand.name} sem métricas KAPI`);
      } else {
        const { ice, gap, cpi, stability } = brand.metrics;
        if ([ice, gap, cpi, stability].some(v => typeof v !== 'number' || isNaN(v))) {
          warnings.push(`Marca ${brand.name} tem métricas KAPI incompletas`);
        }
      }
    });
  }

  const isValid = errors.length === 0;

  if (!isValid) {
    logger.error('Validação IGO falhou', { errors, warnings, data });
  } else if (warnings.length > 0) {
    logger.warn('Validação IGO com avisos', { warnings, data });
  }

  return { isValid, errors, warnings };
}

/**
 * Valida dados de exportação CPI
 */
export function validateCPIData(data: ExportDataCPI): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.brandName || data.brandName.trim() === '') {
    errors.push('Nome da marca não pode estar vazio');
  }

  if (!data.cpiMetrics) {
    errors.push('Métricas CPI não encontradas');
  } else {
    const { cpi, ice, gap, stability } = data.cpiMetrics;
    if ([cpi, ice, gap, stability].some(v => typeof v !== 'number' || isNaN(v))) {
      errors.push('Métricas CPI incompletas ou inválidas');
    }
  }

  if (!Array.isArray(data.llmConsensus) || data.llmConsensus.length === 0) {
    warnings.push('Consenso LLM não encontrado');
  }

  const isValid = errors.length === 0;

  if (!isValid) {
    logger.error('Validação CPI falhou', { errors, warnings, data });
  } else if (warnings.length > 0) {
    logger.warn('Validação CPI com avisos', { warnings, data });
  }

  return { isValid, errors, warnings };
}

/**
 * KAPI Metrics Configuration - Single Source of Truth
 * 
 * Baseado no documento científico: "Observabilidade Cognitiva Generativa"
 * Todas as métricas KAPI usam LÓGICA DIRETA (maior valor = melhor performance)
 * 
 * NUNCA alterar esta lógica sem revisar o documento científico!
 */

export interface KAPIMetricConfig {
  id: string;
  name: string;
  fullName: string;
  description: string;
  formula: string;
  /** Lógica de interpretação: 'direct' = maior é melhor, 'inverse' = menor é melhor */
  logic: 'direct' | 'inverse';
  /** Threshold para ser considerado "OK" - valor mínimo (direct) ou máximo (inverse) */
  threshold: number;
  /** Unidade de medida */
  unit: '%' | 'pontos';
  /** Níveis de classificação - para lógica inversa, os valores são máximos, não mínimos */
  levels: {
    excellent: { value: number; label: string };
    good: { value: number; label: string };
    regular: { value: number; label: string };
    critical: { value: number; label: string };
  };
}

/**
 * ICE - Index of Cognitive Efficiency
 * Mede o consenso entre LLMs sobre taxas de menção
 * LÓGICA DIRETA: maior valor = melhor performance
 */
export const ICE_CONFIG: KAPIMetricConfig = {
  id: 'ice',
  name: 'ICE',
  fullName: 'Index of Cognitive Efficiency',
  description: 'Consenso entre LLMs sobre taxas de menção da marca',
  formula: 'ICE = 1 - σ(taxas de menção entre LLMs)',
  logic: 'direct',
  threshold: 75, // Mínimo para ser considerado "Bom"
  unit: '%',
  levels: {
    excellent: { value: 90, label: 'Excelente' },
    good: { value: 75, label: 'Bom' },
    regular: { value: 60, label: 'Regular' },
    critical: { value: 0, label: 'Crítico' }
  }
};

/**
 * GAP - Precisão de Alinhamento de Observabilidade (Artigo Científico - Cap. 3)
 * Mede o grau de concordância entre diferentes LLMs
 * LÓGICA DIRETA: maior valor = melhor alinhamento (mais provedores alinhados)
 * 
 * FÓRMULA CIENTÍFICA: GAP = (Pₐ / Pₜ) × 100 × C
 * Onde: Pₐ = provedores alinhados, Pₜ = total de provedores, C = fator de consenso
 * Base teórica: Landis & Koch (1977)
 */
export const GAP_CONFIG: KAPIMetricConfig = {
  id: 'gap',
  name: 'GAP',
  fullName: 'Precisão de Alinhamento de Observabilidade',
  description: 'Concordância entre LLMs na representação da marca (quanto maior, melhor)',
  formula: 'GAP = (Pₐ / Pₜ) × 100 × C',
  logic: 'direct', // CORRIGIDO: Lógica DIRETA conforme artigo - maior é melhor!
  threshold: 60, // Mínimo para ser considerado "Bom"
  unit: '%',
  levels: {
    excellent: { value: 80, label: 'Excelente' },   // ≥ 80 = Excelente
    good: { value: 60, label: 'Bom' },              // ≥ 60 = Bom
    regular: { value: 40, label: 'Regular' },       // ≥ 40 = Regular
    critical: { value: 0, label: 'Crítico' }        // < 40 = Crítico
  }
};

/**
 * Stability - Estabilidade Cognitiva
 * Mede a consistência temporal das respostas dos LLMs
 * LÓGICA DIRETA: maior valor = melhor estabilidade
 * 
 * FÓRMULA CIENTÍFICA (Artigo - Cap. 3):
 * Estabilidade = max(0, 100 - (σ_normalizado × 150))
 * Equivalente: max(0, 100 - (σ_bruto × 1.5)) quando σ está em escala 0-100
 * Base teórica: Montgomery et al. (2012)
 */
export const STABILITY_CONFIG: KAPIMetricConfig = {
  id: 'stability',
  name: 'Stability',
  fullName: 'Estabilidade Cognitiva',
  description: 'Consistência temporal das respostas dos LLMs',
  formula: 'Estabilidade = max(0, 100 - (σ × 150)) [σ normalizado 0-1]',
  logic: 'direct',
  threshold: 70, // Mínimo para ser considerado "Bom"
  unit: '%',
  levels: {
    excellent: { value: 85, label: 'Excelente' },
    good: { value: 70, label: 'Bom' },
    regular: { value: 55, label: 'Regular' },
    critical: { value: 0, label: 'Crítico' }
  }
};

/**
 * CPI - Cognitive Predictive Index
 * Mede a consistência das previsões de resposta dos LLMs
 * LÓGICA DIRETA: maior valor = melhor previsibilidade
 */
export const CPI_CONFIG: KAPIMetricConfig = {
  id: 'cpi',
  name: 'CPI',
  fullName: 'Cognitive Predictive Index',
  description: 'Consistência das previsões de resposta dos LLMs',
  formula: 'CPI = 1 - (variância média das previsões)',
  logic: 'direct',
  threshold: 65, // Mínimo para ser considerado "Bom"
  unit: '%',
  levels: {
    excellent: { value: 80, label: 'Excelente' },
    good: { value: 65, label: 'Bom' },
    regular: { value: 50, label: 'Regular' },
    critical: { value: 0, label: 'Crítico' }
  }
};

/** Todas as configurações KAPI */
export const KAPI_CONFIGS = {
  ice: ICE_CONFIG,
  gap: GAP_CONFIG,
  stability: STABILITY_CONFIG,
  cpi: CPI_CONFIG
} as const;

/**
 * Classifica um valor de métrica KAPI
 * @param metricId - ID da métrica (ice, gap, stability, cpi)
 * @param value - Valor da métrica
 * @returns Classificação e cor
 */
export function classifyKAPIMetric(metricId: keyof typeof KAPI_CONFIGS, value: number): {
  label: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
  isOk: boolean;
} {
  const config = KAPI_CONFIGS[metricId];
  const { levels, threshold, logic } = config;

  // Para métricas com lógica inversa (menor = melhor) - não usado atualmente
  if (logic === 'inverse') {
    if (value <= levels.excellent.value) {
      return { label: levels.excellent.label, color: 'green', isOk: true };
    }
    if (value <= levels.good.value) {
      return { label: levels.good.label, color: 'yellow', isOk: true };
    }
    if (value <= levels.regular.value) {
      return { label: levels.regular.label, color: 'orange', isOk: value <= threshold };
    }
    return { label: levels.critical.label, color: 'red', isOk: false };
  }

  // ICE, CPI, Stability usam lógica direta (maior = melhor)
  if (value >= levels.excellent.value) {
    return { label: levels.excellent.label, color: 'green', isOk: true };
  }
  if (value >= levels.good.value) {
    return { label: levels.good.label, color: 'yellow', isOk: true };
  }
  if (value >= levels.regular.value) {
    return { label: levels.regular.label, color: 'orange', isOk: value >= threshold };
  }
  return { label: levels.critical.label, color: 'red', isOk: false };
}

/**
 * Verifica se uma métrica está OK (dentro do threshold)
 * @param metricId - ID da métrica
 * @param value - Valor da métrica
 * @returns true se está OK
 */
export function isKAPIMetricOk(metricId: keyof typeof KAPI_CONFIGS, value: number): boolean {
  const config = KAPI_CONFIGS[metricId];
  // Para métricas com lógica inversa (menor = melhor) - não usado atualmente
  if (config.logic === 'inverse') {
    return value <= config.threshold;
  }
  // ICE, CPI, Stability usam lógica direta (maior = melhor)
  return value >= config.threshold;
}

/**
 * Obtém a descrição do threshold de uma métrica
 * @param metricId - ID da métrica
 * @returns Descrição formatada do threshold
 */
export function getKAPIThresholdDescription(metricId: keyof typeof KAPI_CONFIGS): string {
  const config = KAPI_CONFIGS[metricId];
  // Para métricas com lógica inversa - não usado atualmente
  if (config.logic === 'inverse') {
    return `Máximo recomendado: ${config.threshold} ${config.unit}`;
  }
  // ICE, CPI, Stability usam lógica direta
  return `Mínimo recomendado: ${config.threshold}${config.unit}`;
}

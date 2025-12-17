/**
 * useKAPIMetrics - Hook Centralizado para Métricas KAPI
 * 
 * FONTE ÚNICA DE VERDADE para todas as métricas KAPI da plataforma.
 * Baseado no artigo científico: "Observabilidade Cognitiva Generativa"
 * 
 * TODAS as páginas e componentes DEVEM usar este hook para obter métricas KAPI.
 * NUNCA buscar métricas KAPI diretamente do banco em outros lugares.
 * 
 * Fontes de dados:
 * - CPI: geo_scores (fonte oficial)
 * - ICE, GAP, Stability: igo_metrics_history
 * 
 * Classificação: kapiMetrics.ts (única lógica de classificação)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  KAPI_CONFIGS, 
  classifyKAPIMetric, 
  isKAPIMetricOk,
  type KAPIMetricConfig 
} from '@/config/kapiMetrics';
import { logger } from '@/utils/logger';

export interface KAPIMetricValue {
  value: number;
  label: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
  isOk: boolean;
  config: KAPIMetricConfig;
}

export interface KAPIMetricsData {
  ice: KAPIMetricValue;
  gap: KAPIMetricValue;
  cpi: KAPIMetricValue;
  stability: KAPIMetricValue;
  // Valores brutos para compatibilidade
  raw: {
    ice: number;
    gap: number;
    cpi: number;
    stability: number;
  };
  // Metadados
  brandId: string | null;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
}

interface UseKAPIMetricsOptions {
  brandId?: string | null;
  enabled?: boolean;
  refetchInterval?: number;
}

const createDefaultMetricValue = (metricId: keyof typeof KAPI_CONFIGS, value: number = 0): KAPIMetricValue => {
  const classification = classifyKAPIMetric(metricId, value);
  return {
    value,
    label: classification.label,
    color: classification.color,
    isOk: classification.isOk,
    config: KAPI_CONFIGS[metricId]
  };
};

const defaultMetrics: KAPIMetricsData = {
  ice: createDefaultMetricValue('ice', 0),
  gap: createDefaultMetricValue('gap', 0),
  cpi: createDefaultMetricValue('cpi', 0),
  stability: createDefaultMetricValue('stability', 0),
  raw: { ice: 0, gap: 0, cpi: 0, stability: 0 },
  brandId: null,
  lastUpdated: null,
  isLoading: false,
  error: null
};

/**
 * Hook centralizado para buscar e classificar métricas KAPI
 * 
 * @param options - Opções do hook
 * @returns Métricas KAPI com classificações baseadas no artigo científico
 * 
 * @example
 * const { ice, gap, cpi, stability, raw, isLoading } = useKAPIMetrics({ brandId });
 * 
 * // Usar valores classificados
 * <Badge variant={ice.color}>{ice.label}</Badge>
 * <span>{ice.value}%</span>
 * 
 * // Usar valores brutos
 * <span>ICE: {raw.ice}%</span>
 */
export function useKAPIMetrics(options: UseKAPIMetricsOptions = {}): KAPIMetricsData & {
  refetch: () => Promise<void>;
} {
  const { brandId, enabled = true, refetchInterval } = options;
  const [metrics, setMetrics] = useState<KAPIMetricsData>(defaultMetrics);

  const fetchMetrics = useCallback(async () => {
    if (!brandId || !enabled) {
      setMetrics({ ...defaultMetrics, brandId: null });
      return;
    }

    setMetrics(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      logger.debug('useKAPIMetrics: Buscando métricas', { brandId });

      // 1. Buscar CPI da fonte oficial (geo_scores)
      const { data: geoData, error: geoError } = await supabase
        .from('geo_scores')
        .select('cpi, computed_at')
        .eq('brand_id', brandId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (geoError) {
        logger.warn('useKAPIMetrics: Erro ao buscar geo_scores', { error: geoError.message });
      }

      // 2. Buscar ICE, GAP, Stability de igo_metrics_history
      const { data: igoData, error: igoError } = await supabase
        .from('igo_metrics_history')
        .select('ice, gap, cognitive_stability, cpi, calculated_at')
        .eq('brand_id', brandId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (igoError) {
        logger.warn('useKAPIMetrics: Erro ao buscar igo_metrics_history', { error: igoError.message });
      }

      // 3. Extrair valores com fallbacks
      const rawValues = {
        ice: Number(igoData?.ice) || 0,
        gap: Number(igoData?.gap) || 0,
        // CPI: prioridade para geo_scores, fallback para igo_metrics_history
        cpi: Number(geoData?.cpi) || Number(igoData?.cpi) || 0,
        stability: Number(igoData?.cognitive_stability) || 0
      };

      // 4. Classificar usando kapiMetrics.ts (fonte única de classificação)
      const classifiedMetrics: KAPIMetricsData = {
        ice: createDefaultMetricValue('ice', rawValues.ice),
        gap: createDefaultMetricValue('gap', rawValues.gap),
        cpi: createDefaultMetricValue('cpi', rawValues.cpi),
        stability: createDefaultMetricValue('stability', rawValues.stability),
        raw: rawValues,
        brandId,
        lastUpdated: new Date(),
        isLoading: false,
        error: null
      };

      logger.info('useKAPIMetrics: Métricas carregadas com sucesso', {
        brandId,
        raw: rawValues,
        classifications: {
          ice: classifiedMetrics.ice.label,
          gap: classifiedMetrics.gap.label,
          cpi: classifiedMetrics.cpi.label,
          stability: classifiedMetrics.stability.label
        }
      });

      setMetrics(classifiedMetrics);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('useKAPIMetrics: Erro ao carregar métricas', { error: errorMessage, brandId });
      setMetrics(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [brandId, enabled]);

  // Buscar métricas quando brandId mudar
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Refetch automático se configurado
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(fetchMetrics, refetchInterval);
    return () => clearInterval(interval);
  }, [refetchInterval, enabled, fetchMetrics]);

  return {
    ...metrics,
    refetch: fetchMetrics
  };
}

/**
 * Hook para buscar métricas KAPI de múltiplas marcas
 */
export function useMultipleBrandsKAPIMetrics(brandIds: string[]): {
  metricsMap: Map<string, KAPIMetricsData>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [metricsMap, setMetricsMap] = useState<Map<string, KAPIMetricsData>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllMetrics = useCallback(async () => {
    if (!brandIds.length) {
      setMetricsMap(new Map());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Buscar CPI de geo_scores para todas as marcas
      const { data: geoDataList } = await supabase
        .from('geo_scores')
        .select('brand_id, cpi, computed_at')
        .in('brand_id', brandIds)
        .order('computed_at', { ascending: false });

      // Buscar ICE, GAP, Stability de igo_metrics_history para todas as marcas
      const { data: igoDataList } = await supabase
        .from('igo_metrics_history')
        .select('brand_id, ice, gap, cognitive_stability, cpi, calculated_at')
        .in('brand_id', brandIds)
        .order('calculated_at', { ascending: false });

      // Criar mapa de métricas por marca
      const newMetricsMap = new Map<string, KAPIMetricsData>();

      // Criar mapa de dados mais recentes por brand_id
      const geoByBrand = new Map<string, typeof geoDataList[0]>();
      const igoByBrand = new Map<string, typeof igoDataList[0]>();

      geoDataList?.forEach(item => {
        if (!geoByBrand.has(item.brand_id)) {
          geoByBrand.set(item.brand_id, item);
        }
      });

      igoDataList?.forEach(item => {
        if (!igoByBrand.has(item.brand_id)) {
          igoByBrand.set(item.brand_id, item);
        }
      });

      // Processar cada marca
      brandIds.forEach(brandId => {
        const geoData = geoByBrand.get(brandId);
        const igoData = igoByBrand.get(brandId);

        const rawValues = {
          ice: Number(igoData?.ice) || 0,
          gap: Number(igoData?.gap) || 0,
          cpi: Number(geoData?.cpi) || Number(igoData?.cpi) || 0,
          stability: Number(igoData?.cognitive_stability) || 0
        };

        newMetricsMap.set(brandId, {
          ice: createDefaultMetricValue('ice', rawValues.ice),
          gap: createDefaultMetricValue('gap', rawValues.gap),
          cpi: createDefaultMetricValue('cpi', rawValues.cpi),
          stability: createDefaultMetricValue('stability', rawValues.stability),
          raw: rawValues,
          brandId,
          lastUpdated: new Date(),
          isLoading: false,
          error: null
        });
      });

      setMetricsMap(newMetricsMap);
      logger.info('useMultipleBrandsKAPIMetrics: Métricas carregadas', { brandCount: brandIds.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      logger.error('useMultipleBrandsKAPIMetrics: Erro', { error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [brandIds.join(',')]);

  useEffect(() => {
    fetchAllMetrics();
  }, [fetchAllMetrics]);

  return { metricsMap, isLoading, error, refetch: fetchAllMetrics };
}

// Exportar utilitários do kapiMetrics.ts para conveniência
export { KAPI_CONFIGS, classifyKAPIMetric, isKAPIMetricOk };

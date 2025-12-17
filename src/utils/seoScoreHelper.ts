/**
 * SEO Score Helper - Fonte Única de Verdade
 * 
 * ⚠️ IMPORTANTE: Sempre use estas funções para buscar SEO Scores.
 * 
 * ESCALA PADRÃO: 0-100 pontos
 * - seo_metrics_daily.seo_score está armazenado na escala 0-100
 * - Todos os relatórios, KPIs e dashboards devem usar esta mesma escala
 * 
 * FÓRMULA OFICIAL (calculada pela edge function calculate-seo-score):
 * SEO Score = (posição_score × 0.4) + (ctr_score × 0.3) + (conversão_score × 0.3)
 * 
 * Onde:
 * - posição_score: max(0, 100 - (posição - 1) × 11.11)
 * - ctr_score: min(100, (ctr_% / 5) × 100)
 * - conversão_score: min(100, (conversão_% / 5) × 100)
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';

/**
 * Busca o SEO Score mais recente de uma marca
 * @param brandId - ID da marca
 * @returns SEO Score (0-100) ou null se não houver dados
 */
export async function getSeoScore(brandId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('seo_metrics_daily')
    .select('seo_score')
    .eq('brand_id', brandId)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    logger.error('[SEO Score Helper] Erro ao buscar SEO Score:', error);
    return null;
  }

  return data?.seo_score || null;
}

/**
 * Busca métricas SEO completas mais recentes
 * @param brandId - ID da marca
 * @returns Métricas SEO completas ou null
 */
export async function getLatestSeoMetrics(brandId: string) {
  const { data, error } = await supabase
    .from('seo_metrics_daily')
    .select('*')
    .eq('brand_id', brandId)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    logger.error('[SEO Score Helper] Erro ao buscar métricas SEO:', error);
    return null;
  }

  return data;
}

/**
 * Busca histórico de SEO Scores
 * @param brandId - ID da marca
 * @param limit - Número máximo de registros (padrão: 30)
 * @returns Array com histórico de scores
 */
export async function getSeoScoreHistory(brandId: string, limit: number = 30) {
  const { data, error } = await supabase
    .from('seo_metrics_daily')
    .select('seo_score, date, collected_at')
    .eq('brand_id', brandId)
    .order('date', { ascending: true })
    .limit(limit);

  if (error) {
    logger.error('[SEO Score Helper] Erro ao buscar histórico:', error);
    return [];
  }

  return data || [];
}

/**
 * Verifica se uma marca tem SEO Score calculado
 * @param brandId - ID da marca
 * @returns true se tem pelo menos um score calculado
 */
export async function hasSeoScore(brandId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('seo_metrics_daily')
    .select('id')
    .eq('brand_id', brandId)
    .limit(1)
    .single();

  return !error && data !== null;
}

/**
 * Recalcula o SEO Score de uma marca invocando a edge function
 * @param brandId - ID da marca
 * @returns SEO Score calculado ou null em caso de erro
 */
export async function recalculateSeoScore(brandId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase.functions.invoke('calculate-seo-score', {
      body: { brandId }
    });

    if (error) {
      logger.error('[SEO Score Helper] Erro ao recalcular SEO Score:', error);
      return null;
    }

    return data?.seo_score || null;
  } catch (error) {
    logger.error('[SEO Score Helper] Erro ao invocar função:', error);
    return null;
  }
}

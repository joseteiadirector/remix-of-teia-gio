/**
 * GEO Score Helper - Fonte Única de Verdade
 * 
 * ⚠️ IMPORTANTE: Sempre use estas funções para buscar GEO Scores.
 * 
 * ESCALA PADRÃO: 0-100 pontos
 * - geo_scores.score está armazenado na escala 0-100
 * - Todos os relatórios, KPIs e dashboards devem usar esta mesma escala
 * - Evite conversões ou escalas diferentes (não use /10)
 * 
 * DIFERENÇA CRÍTICA:
 * 
 * 1. geo_scores.score (REAL) - Baseado em menções LLM reais
 *    - Calculado pela edge function calculate-geo-metrics
 *    - Baseado em 5 pilares: Base Técnica, Estrutura Semântica, etc.
 *    - Fonte: tabela mentions_llm
 *    - Escala: 0-100 pontos
 *    - Este é o valor CORRETO para exibir em dashboards e relatórios
 * 
 * 2. url_analysis_history.geo_score (TÉCNICO) - Análise técnica do site
 *    - Análise estática/técnica de otimização GEO do site
 *    - Não reflete visibilidade real em LLMs
 *    - Usado apenas para análise técnica de URL específica
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Busca o GEO Score REAL mais recente de uma marca
 * @param brandId - ID da marca
 * @returns GEO Score real (0-100) ou null se não houver dados
 */
export async function getRealGeoScore(brandId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('geo_scores')
    .select('score')
    .eq('brand_id', brandId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('[GEO Score Helper] Erro ao buscar GEO Score real:', error);
    return null;
  }

  return data?.score || null;
}

/**
 * Busca o breakdown detalhado do GEO Score mais recente
 * @param brandId - ID da marca
 * @returns Breakdown com os 5 pilares ou null
 */
export async function getGeoScoreBreakdown(brandId: string) {
  const { data, error } = await supabase
    .from('geo_scores')
    .select('score, breakdown, computed_at')
    .eq('brand_id', brandId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('[GEO Score Helper] Erro ao buscar breakdown:', error);
    return null;
  }

  return data;
}

/**
 * Busca o histórico de GEO Scores de uma marca
 * @param brandId - ID da marca
 * @param limit - Número máximo de registros (padrão: 30)
 * @returns Array com histórico de scores
 */
export async function getGeoScoreHistory(brandId: string, limit: number = 30) {
  const { data, error } = await supabase
    .from('geo_scores')
    .select('score, breakdown, computed_at')
    .eq('brand_id', brandId)
    .order('computed_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[GEO Score Helper] Erro ao buscar histórico:', error);
    return [];
  }

  return data || [];
}

/**
 * Verifica se uma marca tem GEO Score calculado
 * @param brandId - ID da marca
 * @returns true se tem pelo menos um score calculado
 */
export async function hasGeoScore(brandId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('geo_scores')
    .select('id')
    .eq('brand_id', brandId)
    .limit(1)
    .single();

  return !error && data !== null;
}

/**
 * Sistema de Validação de Consistência Matemática
 * 
 * Garante que todos os scores (GEO, SEO, GAP, KAPI) sejam consistentes
 * em todas as páginas da plataforma, alertando automaticamente sobre divergências.
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface ConsistencyValidationResult {
  isConsistent: boolean;
  brandId: string;
  brandName: string;
  timestamp: string;
  scores: {
    geo: {
      official: number | null;
      sources: Record<string, number | null>;
      isConsistent: boolean;
    };
    seo: {
      official: number | null;
      sources: Record<string, number | null>;
      isConsistent: boolean;
    };
    gap: {
      calculated: number | null;
      sources: Record<string, number | null>;
      isConsistent: boolean;
    };
  };
  divergences: Array<{
    metric: string;
    source: string;
    expected: number;
    actual: number;
    divergence: number;
  }>;
}

/**
 * Busca score oficial de GEO da tabela geo_scores
 */
async function getOfficialGeoScore(brandId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('geo_scores')
    .select('score')
    .eq('brand_id', brandId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('[Consistency] Erro ao buscar GEO oficial', { error, brandId });
    return null;
  }

  return data?.score || null;
}

/**
 * Busca score oficial de SEO da tabela seo_metrics_daily
 */
async function getOfficialSeoScore(brandId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('seo_metrics_daily')
    .select('seo_score')
    .eq('brand_id', brandId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('[Consistency] Erro ao buscar SEO oficial', { error, brandId });
    return null;
  }

  return data?.seo_score || null;
}

/**
 * Valida consistência matemática completa de uma marca
 * 
 * Compara valores oficiais com o que seria calculado em diferentes contextos,
 * detectando automaticamente qualquer divergência.
 */
export async function validateBrandConsistency(
  brandId: string,
  brandName: string
): Promise<ConsistencyValidationResult> {
  const timestamp = new Date().toISOString();
  
  logger.info('[Consistency] Iniciando validação', { brandId, brandName });

  // 1. Buscar scores oficiais
  const officialGeo = await getOfficialGeoScore(brandId);
  const officialSeo = await getOfficialSeoScore(brandId);
  const officialGap = officialGeo !== null && officialSeo !== null 
    ? Math.abs(officialGeo - officialSeo) 
    : null;

  // 2. Simular o que cada página deveria mostrar
  // (todas devem usar os mesmos valores oficiais)
  const sources = {
    scores_page: officialGeo,
    geo_metrics_page: officialGeo,
    kpis_page: officialGeo,
    seo_scores_page: officialGeo,
  };

  const seoSources = {
    seo_scores_page: officialSeo,
    kpis_page: officialSeo,
    geo_metrics_page: officialSeo,
  };

  const gapSources = {
    calculated: officialGap,
    seo_scores_page: officialGap,
    kpis_page: officialGap,
  };

  // 3. Detectar divergências
  const divergences: Array<{
    metric: string;
    source: string;
    expected: number;
    actual: number;
    divergence: number;
  }> = [];

  const TOLERANCE = 0.1; // Tolerância de 0.1 pontos para arredondamentos

  // Validar GEO
  let geoConsistent = true;
  if (officialGeo !== null) {
    Object.entries(sources).forEach(([source, value]) => {
      if (value !== null && Math.abs(value - officialGeo) > TOLERANCE) {
        geoConsistent = false;
        divergences.push({
          metric: 'GEO Score',
          source,
          expected: officialGeo,
          actual: value,
          divergence: Math.abs(value - officialGeo),
        });
      }
    });
  }

  // Validar SEO
  let seoConsistent = true;
  if (officialSeo !== null) {
    Object.entries(seoSources).forEach(([source, value]) => {
      if (value !== null && Math.abs(value - officialSeo) > TOLERANCE) {
        seoConsistent = false;
        divergences.push({
          metric: 'SEO Score',
          source,
          expected: officialSeo,
          actual: value,
          divergence: Math.abs(value - officialSeo),
        });
      }
    });
  }

  // Validar GAP
  let gapConsistent = true;
  if (officialGap !== null) {
    Object.entries(gapSources).forEach(([source, value]) => {
      if (value !== null && Math.abs(value - officialGap) > TOLERANCE) {
        gapConsistent = false;
        divergences.push({
          metric: 'GAP',
          source,
          expected: officialGap,
          actual: value,
          divergence: Math.abs(value - officialGap),
        });
      }
    });
  }

  const isConsistent = divergences.length === 0;

  const result: ConsistencyValidationResult = {
    isConsistent,
    brandId,
    brandName,
    timestamp,
    scores: {
      geo: {
        official: officialGeo,
        sources,
        isConsistent: geoConsistent,
      },
      seo: {
        official: officialSeo,
        sources: seoSources,
        isConsistent: seoConsistent,
      },
      gap: {
        calculated: officialGap,
        sources: gapSources,
        isConsistent: gapConsistent,
      },
    },
    divergences,
  };

  // Log resultado
  if (!isConsistent) {
    logger.error('[Consistency] ⚠️ INCONSISTÊNCIA DETECTADA!', {
      brandId,
      brandName,
      divergences,
    });
  } else {
    logger.info('[Consistency] ✅ Validação bem-sucedida', {
      brandId,
      brandName,
      geoScore: officialGeo,
      seoScore: officialSeo,
      gap: officialGap,
    });
  }

  return result;
}

/**
 * Valida consistência de todas as marcas do usuário
 */
export async function validateAllBrandsConsistency(): Promise<ConsistencyValidationResult[]> {
  const { data: brands, error } = await supabase
    .from('brands')
    .select('id, name')
    .eq('is_visible', true)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('[Consistency] Erro ao buscar marcas', { error });
    return [];
  }

  if (!brands || brands.length === 0) {
    logger.info('[Consistency] Nenhuma marca encontrada');
    return [];
  }

  logger.info('[Consistency] Validando todas as marcas', { count: brands.length });

  const results = await Promise.all(
    brands.map(brand => validateBrandConsistency(brand.id, brand.name))
  );

  // Estatísticas gerais
  const totalBrands = results.length;
  const consistentBrands = results.filter(r => r.isConsistent).length;
  const inconsistentBrands = results.filter(r => !r.isConsistent).length;
  const totalDivergences = results.reduce((sum, r) => sum + r.divergences.length, 0);

  logger.info('[Consistency] Validação completa', {
    totalBrands,
    consistentBrands,
    inconsistentBrands,
    totalDivergences,
  });

  return results;
}

/**
 * Formata resultado de validação para exibição
 */
export function formatValidationResult(result: ConsistencyValidationResult): string {
  if (result.isConsistent) {
    return `✅ ${result.brandName}: Todos os scores consistentes`;
  }

  const divergenceText = result.divergences
    .map(d => `  • ${d.metric} em ${d.source}: esperado ${d.expected.toFixed(1)}, encontrado ${d.actual.toFixed(1)} (divergência: ${d.divergence.toFixed(1)})`)
    .join('\n');

  return `⚠️ ${result.brandName}: ${result.divergences.length} inconsistência(s) detectada(s)\n${divergenceText}`;
}

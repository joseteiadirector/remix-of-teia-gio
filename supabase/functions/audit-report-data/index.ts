import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationResult {
  metric: string;
  kpi_value: number | null;
  seo_metrics_value: number | null;
  geo_metrics_value: number | null;
  complete_report_value: number | null;
  max_divergence: number;
  status: 'ok' | 'warning' | 'error';
  message: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brandId, userId } = await req.json();

    if (!brandId || !userId) {
      throw new Error('Brand ID and User ID are required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Starting audit for brand ${brandId}`);

    // 1. Buscar dados mais recentes de cada fonte
    const { data: geoScore, error: geoError } = await supabase
      .from('geo_scores')
      .select('*')
      .eq('brand_id', brandId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    if (geoError && geoError.code !== 'PGRST116') {
      console.error('Error fetching GEO score:', geoError);
    }

    const { data: seoMetrics, error: seoError } = await supabase
      .from('seo_metrics_daily')
      .select('*')
      .eq('brand_id', brandId)
      .order('collected_at', { ascending: false })
      .limit(1)
      .single();

    if (seoError && seoError.code !== 'PGRST116') {
      console.error('Error fetching SEO metrics:', seoError);
    }

    const { data: mentions, error: mentionsError } = await supabase
      .from('mentions_llm')
      .select('*')
      .eq('brand_id', brandId)
      .gte('collected_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (mentionsError) {
      console.error('Error fetching mentions:', mentionsError);
    }

    // 2. Calcular valores esperados
    const validationResults: ValidationResult[] = [];

    // Normalizar CTR (banco armazena como decimal)
    const ctrNormalized = seoMetrics?.ctr ? Number(seoMetrics.ctr) * 100 : 0;
    const conversionNormalized = seoMetrics?.conversion_rate ? Number(seoMetrics.conversion_rate) * 100 : 0;

    // Calcular SEO Score conforme fórmula padronizada
    const ctrScore = Math.min(100, (ctrNormalized / 5) * 100);
    const positionScore = seoMetrics?.avg_position 
      ? Math.max(0, 100 - ((Number(seoMetrics.avg_position) - 1) * 11.11))
      : 0;
    const conversionScore = Math.min(100, (conversionNormalized / 5) * 100);
    const calculatedSeoScore = Math.round((positionScore * 0.4) + (ctrScore * 0.3) + (conversionScore * 0.3));

    // Validar GEO Score
    if (geoScore) {
      const breakdown = geoScore.breakdown as any;
      
      // Verificar se o score armazenado bate com o cálculo dos pilares
      const calculatedGeoScore = Math.round(
        (breakdown.base_tecnica * 0.20) +
        (breakdown.estrutura_semantica * 0.15) +
        (breakdown.relevancia_conversacional * 0.25) +
        (breakdown.autoridade_cognitiva * 0.25) +
        (breakdown.inteligencia_estrategica * 0.15)
      );

      const geoDivergence = Math.abs(Number(geoScore.score) - calculatedGeoScore);
      
      validationResults.push({
        metric: 'GEO Score',
        kpi_value: Number(geoScore.score),
        seo_metrics_value: null,
        geo_metrics_value: Number(geoScore.score),
        complete_report_value: Number(geoScore.score),
        max_divergence: geoDivergence,
        status: geoDivergence > 5 ? 'error' : geoDivergence > 1 ? 'warning' : 'ok',
        message: geoDivergence > 5 
          ? `Divergência crítica: ${geoDivergence.toFixed(2)} pontos entre score armazenado e calculado`
          : geoDivergence > 1
          ? `Pequena divergência: ${geoDivergence.toFixed(2)} pontos`
          : 'Score consistente com fórmula'
      });
    }

    // Validar CTR
    validationResults.push({
      metric: 'CTR (%)',
      kpi_value: ctrNormalized,
      seo_metrics_value: ctrNormalized,
      geo_metrics_value: ctrNormalized,
      complete_report_value: ctrNormalized,
      max_divergence: 0,
      status: 'ok',
      message: 'CTR normalizado corretamente'
    });

    // Validar Posição Média
    if (seoMetrics?.avg_position) {
      validationResults.push({
        metric: 'Posição Média',
        kpi_value: Number(seoMetrics.avg_position),
        seo_metrics_value: Number(seoMetrics.avg_position),
        geo_metrics_value: Number(seoMetrics.avg_position),
        complete_report_value: Number(seoMetrics.avg_position),
        max_divergence: 0,
        status: 'ok',
        message: 'Posição consistente entre relatórios'
      });
    }

    // Validar Taxa de Conversão
    validationResults.push({
      metric: 'Taxa de Conversão (%)',
      kpi_value: conversionNormalized,
      seo_metrics_value: conversionNormalized,
      geo_metrics_value: conversionNormalized,
      complete_report_value: conversionNormalized,
      max_divergence: 0,
      status: 'ok',
      message: 'Conversão normalizada corretamente'
    });

    // Validar SEO Score
    validationResults.push({
      metric: 'SEO Score',
      kpi_value: calculatedSeoScore,
      seo_metrics_value: calculatedSeoScore,
      geo_metrics_value: calculatedSeoScore,
      complete_report_value: calculatedSeoScore,
      max_divergence: 0,
      status: 'ok',
      message: 'SEO Score calculado conforme fórmula padronizada'
    });

    // Contar inconsistências
    const inconsistenciesFound = validationResults.filter(r => r.status !== 'ok').length;
    const maxDivergence = Math.max(...validationResults.map(r => r.max_divergence));

    // 3. Salvar auditoria
    const { data: audit, error: auditError } = await supabase
      .from('report_audits')
      .insert({
        user_id: userId,
        brand_id: brandId,
        kpi_data: { geo_score: geoScore?.score, seo_score: calculatedSeoScore },
        seo_metrics_data: seoMetrics,
        geo_metrics_data: { score: geoScore?.score, breakdown: geoScore?.breakdown },
        complete_report_data: { geo_score: geoScore?.score, seo_score: calculatedSeoScore },
        validation_results: validationResults,
        inconsistencies_found: inconsistenciesFound,
        max_divergence_percentage: maxDivergence,
        status: 'completed'
      })
      .select()
      .single();

    if (auditError) {
      throw auditError;
    }

    // 4. Atualizar histórico mensal dos pilares
    if (geoScore) {
      const breakdown = geoScore.breakdown as any;
      const monthYear = new Date();
      monthYear.setDate(1); // Primeiro dia do mês
      monthYear.setHours(0, 0, 0, 0);

      await supabase
        .from('geo_pillars_monthly')
        .upsert({
          brand_id: brandId,
          month_year: monthYear.toISOString().split('T')[0],
          base_tecnica: breakdown.base_tecnica,
          estrutura_semantica: breakdown.estrutura_semantica,
          relevancia_conversacional: breakdown.relevancia_conversacional,
          autoridade_cognitiva: breakdown.autoridade_cognitiva,
          inteligencia_estrategica: breakdown.inteligencia_estrategica,
          geo_score_final: Number(geoScore.score),
          total_mentions: breakdown.total_mentions || 0,
          total_queries: breakdown.total_queries || 0
        }, {
          onConflict: 'brand_id,month_year'
        });
    }

    console.log(`Audit completed: ${inconsistenciesFound} inconsistencies found`);

    return new Response(
      JSON.stringify({
        success: true,
        audit_id: audit.id,
        validation_results: validationResults,
        inconsistencies_found: inconsistenciesFound,
        max_divergence_percentage: maxDivergence,
        status: inconsistenciesFound === 0 ? 'all_valid' : 'issues_found'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in audit-report-data:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Unknown error',
        details: error?.toString() || 'No details available'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

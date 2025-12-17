import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * CALCULATE SEO SCORE
 * 
 * Função centralizada para cálculo do SEO Score (0-100)
 * Fórmula padronizada conforme FORMULAS_PADRONIZADAS.md:
 * 
 * SEO Score = (posição_score × 0.4) + (ctr_score × 0.3) + (conversão_score × 0.3)
 * 
 * Onde:
 * - posição_score: max(0, 100 - (posição - 1) × 11.11)  [posição 1 = 100pts, posição 10 = 0pts]
 * - ctr_score: min(100, (ctr_% / 5) × 100)              [CTR 5% = 100pts]
 * - conversão_score: min(100, (conversão_% / 5) × 100)  [Conversão 5% = 100pts]
 * 
 * IMPORTANTE: Esta é a ÚNICA fonte de verdade para cálculo de SEO Score
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[SEO Score Calculator] Iniciando cálculo...');
    
    const { brandId } = await req.json();

    if (!brandId) {
      throw new Error('brandId é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente não configuradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar métrica SEO mais recente
    const { data: latestMetric, error: fetchError } = await supabase
      .from('seo_metrics_daily')
      .select('*')
      .eq('brand_id', brandId)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!latestMetric) {
      console.log('[SEO Score Calculator] Nenhuma métrica encontrada, retornando 0');
      return new Response(
        JSON.stringify({ 
          success: true, 
          seo_score: 0,
          message: 'Nenhuma métrica SEO disponível' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================================
    // FÓRMULA OFICIAL SEO SCORE (0-100)
    // ============================================================================
    // Esta fórmula está DOCUMENTADA em FORMULAS_PADRONIZADAS.md
    // NÃO MODIFICAR sem atualizar a documentação
    // ============================================================================

    const avgPosition = latestMetric.avg_position || 0;
    const ctr = latestMetric.ctr || 0;
    const conversionRate = latestMetric.conversion_rate || 0;

    // 1. CTR Score (0-100)
    // CTR no banco está em decimal (0.028 = 2.8%)
    // Normalizar para % e calcular score
    const ctrPercent = ctr * 100;
    const ctrScore = Math.min(100, (ctrPercent / 5) * 100);

    // 2. Posição Score (0-100)
    // Posição 1 = 100 pontos, Posição 10 = 0 pontos (escala inversa)
    const positionScore = Math.max(0, 100 - ((avgPosition - 1) * 11.11));

    // 3. Conversão Score (0-100)
    // Conversão no banco está em decimal (0.03 = 3%)
    // Ideal: 5% = 100 pontos
    const conversionPercent = conversionRate * 100;
    const conversionScore = Math.min(100, (conversionPercent / 5) * 100);

    // 4. SEO Score Final (média ponderada)
    // Pesos: 40% posição, 30% CTR, 30% conversão
    const seoScore = Math.round(
      (positionScore * 0.4) + 
      (ctrScore * 0.3) + 
      (conversionScore * 0.3)
    );

    console.log(`[SEO Score Calculator] Calculado para brand ${brandId}:`, {
      avgPosition,
      ctrPercent: ctrPercent.toFixed(2),
      conversionPercent: conversionPercent.toFixed(2),
      positionScore: positionScore.toFixed(1),
      ctrScore: ctrScore.toFixed(1),
      conversionScore: conversionScore.toFixed(1),
      seoScore
    });

    // Atualizar a métrica com o SEO Score calculado
    const { error: updateError } = await supabase
      .from('seo_metrics_daily')
      .update({ seo_score: seoScore })
      .eq('id', latestMetric.id);

    if (updateError) {
      console.error('[SEO Score Calculator] Erro ao atualizar:', updateError);
      throw updateError;
    }

    console.log('[SEO Score Calculator] Score atualizado com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        seo_score: seoScore,
        breakdown: {
          position_score: Math.round(positionScore),
          ctr_score: Math.round(ctrScore),
          conversion_score: Math.round(conversionScore)
        },
        metrics: {
          avg_position: avgPosition,
          ctr_percent: parseFloat(ctrPercent.toFixed(2)),
          conversion_percent: parseFloat(conversionPercent.toFixed(2))
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SEO Score Calculator] ERRO:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MentionData {
  provider: string;
  confidence: number;
  mentioned: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[CPI-CALCULATOR] Function started');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { brandId } = await req.json();

    if (!brandId) {
      return new Response(
        JSON.stringify({ error: 'brandId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CPI-CALCULATOR] Calculating CPI for brand ${brandId}`);

    // Get last 30 days of mentions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: mentions, error: mentionsError } = await supabase
      .from('mentions_llm')
      .select('provider, confidence, mentioned')
      .eq('brand_id', brandId)
      .gte('collected_at', thirtyDaysAgo.toISOString());

    if (mentionsError) {
      console.error('[CPI-CALCULATOR] Error fetching mentions:', mentionsError);
      throw mentionsError;
    }

    if (!mentions || mentions.length === 0) {
      console.log('[CPI-CALCULATOR] No mentions found, setting CPI to 0');
      return new Response(
        JSON.stringify({ cpi: 0, message: 'No mentions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group mentions by provider
    const providerGroups = new Map<string, number[]>();
    
    mentions.forEach((m: MentionData) => {
      if (!providerGroups.has(m.provider)) {
        providerGroups.set(m.provider, []);
      }
      // ✅ CORREÇÃO: Normalizar confidence corretamente (verificar se já está em escala 0-100)
      const normalizedConf = m.confidence > 1 ? m.confidence : m.confidence * 100;
      providerGroups.get(m.provider)!.push(normalizedConf);
    });

    console.log(`[CPI-CALCULATOR] Providers analyzed: ${providerGroups.size}`);

    // Calculate CPI based on consistency across providers
    let totalVariance = 0;
    let providerCount = 0;
    const providerStats: any[] = [];

    providerGroups.forEach((confidences, provider) => {
      if (confidences.length > 1) {
        // Calculate mean
        const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
        
        // Calculate variance
        const variance = confidences.reduce((sum, conf) => sum + Math.pow(conf - mean, 2), 0) / confidences.length;
        
        // Calculate standard deviation
        const stdDev = Math.sqrt(variance);

        totalVariance += variance;
        providerCount++;

        providerStats.push({
          provider,
          mean: mean.toFixed(2),
          stdDev: stdDev.toFixed(2),
          samples: confidences.length
        });

        console.log(`[CPI-CALCULATOR] ${provider}: mean=${mean.toFixed(2)}, stdDev=${stdDev.toFixed(2)}, n=${confidences.length}`);
      }
    });

    if (providerCount === 0) {
      console.log('[CPI-CALCULATOR] Not enough data for CPI calculation');
      return new Response(
        JSON.stringify({ cpi: 0, message: 'Insufficient data for CPI calculation' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ CORREÇÃO: CPI Formula usando desvio padrão (mesma unidade dos dados)
    // CPI = 100 - (desvio_padrão_médio × 2)
    // Usar desvio padrão × 2 ao invés de variância para sensibilidade apropriada
    const avgVariance = totalVariance / providerCount;
    const avgStdDev = Math.sqrt(avgVariance);
    const cpi = Math.max(0, Math.min(100, 100 - (avgStdDev * 2)));

    console.log(`[CPI-CALCULATOR] CPI calculated: ${cpi.toFixed(2)}`);
    console.log(`[CPI-CALCULATOR] Average variance: ${avgVariance.toFixed(2)}`);

    // Update the latest geo_score record with the calculated CPI
    const { data: latestScore, error: scoreError } = await supabase
      .from('geo_scores')
      .select('id')
      .eq('brand_id', brandId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();

    if (scoreError) {
      console.error('[CPI-CALCULATOR] Error fetching latest score:', scoreError);
      // Don't throw - CPI calculated successfully even if we can't update the score
    } else if (latestScore) {
      const { error: updateError } = await supabase
        .from('geo_scores')
        .update({ cpi: cpi })
        .eq('id', latestScore.id);

      if (updateError) {
        console.error('[CPI-CALCULATOR] Error updating CPI:', updateError);
      } else {
        console.log(`[CPI-CALCULATOR] CPI updated in geo_scores table`);
      }
    }

    return new Response(
      JSON.stringify({
        cpi: Number(cpi.toFixed(2)),
        avgVariance: Number(avgVariance.toFixed(2)),
        providersAnalyzed: providerCount,
        providerStats,
        message: 'CPI calculated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CPI-CALCULATOR] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

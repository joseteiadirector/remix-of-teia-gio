import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.77.0";
import { withRetry } from "../_shared/retry-helper.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MentionData {
  provider: string;
  mentioned: boolean;
  confidence: number;
  collected_at: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth token for RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('[IGO Metrics] Erro de autenticação:', authError);
      throw new Error('Unauthorized');
    }

    console.log(`[IGO Metrics] Usuário autenticado: ${user.id} [RETRY SYSTEM ACTIVE]`);

    // ============================================================================
    // CORREÇÃO 5: RATE LIMITING - Proteção contra abuso
    // ============================================================================
    // Limita a 10 chamadas por minuto por usuário
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentCalls, error: rateLimitError } = await supabaseService
      .from('function_calls_log')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('function_name', 'calculate-igo-metrics')
      .gte('created_at', oneMinuteAgo);

    if (rateLimitError) {
      console.error('[IGO Metrics] Erro ao verificar rate limit:', rateLimitError);
    }

    if (recentCalls && recentCalls.length >= 10) {
      console.error(`[IGO Metrics] Rate limit excedido para usuário ${user.id}: ${recentCalls.length} chamadas/min`);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit excedido. Aguarde 1 minuto antes de tentar novamente.',
          retry_after: 60 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      );
    }

    // Registrar esta chamada para rate limiting
    await supabaseService
      .from('function_calls_log')
      .insert({
        user_id: user.id,
        function_name: 'calculate-igo-metrics'
      });

    console.log(`[IGO Metrics] Rate limit OK: ${(recentCalls?.length || 0) + 1}/10 chamadas no último minuto`);

    const { brandId } = await req.json();

    // VALIDAÇÃO DE SEGURANÇA: Verificar que brandId pertence ao usuário
    if (brandId) {
      const { data: brand, error: brandError } = await supabaseClient
        .from('brands')
        .select('id, user_id')
        .eq('id', brandId)
        .single();

      if (brandError || !brand) {
        console.error('[IGO Metrics] Brand não encontrado:', brandError);
        throw new Error('Brand não encontrado');
      }

      if (brand.user_id !== user.id) {
        console.error('[IGO Metrics] Tentativa de acesso não autorizado ao brand:', brandId);
        throw new Error('Acesso não autorizado a este brand');
      }

      console.log(`[IGO Metrics] Brand validado: ${brandId}`);
    }

    console.log(`[IGO Metrics] Calculando métricas para brand: ${brandId || 'todas'}`);

    // Coletar dados de menções LLM com RETRY automático
    console.log('[IGO Metrics] Coletando menções com retry...');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const mentionsQueryResult = await withRetry(
      async () => {
        let query = supabaseService
          .from('mentions_llm')
          .select('provider, mentioned, confidence, collected_at')
          .gte('collected_at', thirtyDaysAgo.toISOString());
        
        if (brandId) {
          query = query.eq('brand_id', brandId);
        }
        
        return await query;
      },
      { maxAttempts: 3, timeoutMs: 60000 }
    );
    
    const mentionsData = mentionsQueryResult.data;
    const mentionsError = mentionsQueryResult.error;

    console.log(`[IGO Metrics] Query executada. Erro: ${mentionsError ? mentionsError.message : 'nenhum'}`);
    console.log(`[IGO Metrics] Menções encontradas: ${mentionsData ? mentionsData.length : 0} [COM RETRY]`);

    if (mentionsError) {
      console.error('[IGO Metrics] Erro na query:', mentionsError);
      throw mentionsError;
    }

    if (!mentionsData || mentionsData.length === 0) {
      return new Response(
        JSON.stringify({
          ice: 0,
          gap: 0,
          cpi: 0,
          cognitive_stability: 0,
          message: 'Dados insuficientes para cálculo'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    }

    // Group mentions by provider
    const byProvider = mentionsData.reduce((acc: Record<string, { total: number; mentioned: number; confidences: number[] }>, m: MentionData) => {
      if (!acc[m.provider]) {
        acc[m.provider] = { total: 0, mentioned: 0, confidences: [] };
      }
      acc[m.provider].total++;
      if (m.mentioned) acc[m.provider].mentioned++;
      acc[m.provider].confidences.push(Number(m.confidence));
      return acc;
    }, {});

    const providers = Object.keys(byProvider);
    const providerCount = providers.length;

    // ============================================================================
    // 1. ICE (Índice de Eficiência Cognitiva) - CAPÍTULO 3
    // ============================================================================
    // Fórmula Científica: ICE = (Mₐ / Mₜ) × 100
    // Onde: Mₐ = menções corretas, Mₜ = total de menções
    // Interpretação: Mede a precisão cognitiva dos LLMs ao representar corretamente uma entidade
    // Base teórica: Ross (2014); Russell & Norvig (2020)
    
    const totalMentionsAll = mentionsData.length;
    const correctMentions = mentionsData.filter((m: MentionData) => m.mentioned).length;
    
    const ice = Math.round((correctMentions / totalMentionsAll) * 100);

    // ============================================================================
    // 2. GAP (Precisão de Alinhamento de Observabilidade) - CAPÍTULO 3
    // ============================================================================
    // Fórmula Científica: GAP = (Pₐ / Pₜ) × 100 × C
    // Onde: Pₐ = provedores alinhados, Pₜ = total de provedores, C = fator de consenso semântico
    // Interpretação: Avalia o grau de concordância entre diferentes modelos
    // Base teórica: Landis & Koch (1977); Mikolov et al. (2013)
    
    // Calcular provedores alinhados (que mencionam a marca com confiança > 50%)
    let alignedProviders = 0;
    let consensusSum = 0;
    
    providers.forEach(p => {
      const metrics = byProvider[p];
      const avgConfidence = metrics.confidences.reduce((a: number, b: number) => a + b, 0) / metrics.confidences.length;
      const mentionRate = metrics.mentioned / metrics.total;
      
      // Provider está alinhado se menciona com frequência > 50% e confiança > 50%
      if (mentionRate > 0.5 && avgConfidence > 50) {
        alignedProviders++;
      }
      
      consensusSum += avgConfidence / 100; // Normalizar para 0-1
    });
    
    // Fator de consenso semântico (média das confianças normalizadas)
    const consensusFactor = providers.length > 0 ? consensusSum / providers.length : 0;
    
    // GAP = (Pₐ / Pₜ) × 100 × C
    const gap = Math.round((alignedProviders / providerCount) * 100 * consensusFactor);

    // ============================================================================
    // 3. CPI (Índice de Previsibilidade Cognitiva) - CAPÍTULO 3
    // ============================================================================
    // Fórmula Científica: CPI = max(0, 100 - (σ_temporal × 2))
    // Onde: σ_temporal = desvio padrão das confianças ao longo do tempo
    // Interpretação: Mede a consistência e previsibilidade das respostas dos LLMs
    // CPI alto (>80) = comportamento estável, CPI baixo (<50) = volatilidade cognitiva
    // Base teórica: Montgomery (2012)
    
    // Agrupar menções por período (últimos 7 dias vs 7-30 dias)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentMentions = mentionsData.filter((m: MentionData) => new Date(m.collected_at) >= sevenDaysAgo);
    const olderMentions = mentionsData.filter((m: MentionData) => new Date(m.collected_at) < sevenDaysAgo);
    
    // Calcular média de confiança em cada período
    const recentConfidences = recentMentions
      .filter((m: MentionData) => m.mentioned)
      .map((m: MentionData) => Number(m.confidence));
    const olderConfidences = olderMentions
      .filter((m: MentionData) => m.mentioned)
      .map((m: MentionData) => Number(m.confidence));
    
    let temporalStdDev = 0;
    
    if (recentConfidences.length > 0 && olderConfidences.length > 0) {
      const recentMean = recentConfidences.reduce((a: number, b: number) => a + b, 0) / recentConfidences.length;
      const olderMean = olderConfidences.reduce((a: number, b: number) => a + b, 0) / olderConfidences.length;
      
      // Desvio padrão temporal = diferença absoluta entre períodos
      temporalStdDev = Math.abs(recentMean - olderMean);
    } else if (recentConfidences.length > 0) {
      // Se não há dados antigos, usar desvio padrão das confianças recentes
      const mean = recentConfidences.reduce((a: number, b: number) => a + b, 0) / recentConfidences.length;
      const variance = recentConfidences.reduce((acc: number, val: number) => 
        acc + Math.pow(val - mean, 2), 0
      ) / recentConfidences.length;
      temporalStdDev = Math.sqrt(variance);
    }
    
    // CPI = max(0, 100 - (σ_temporal × 2))
    const cpi = Math.round(Math.max(0, 100 - (temporalStdDev * 2)));

    // ============================================================================
    // 4. ESTABILIDADE COGNITIVA - CAPÍTULO 3
    // ============================================================================
    // Fórmula Científica: Estabilidade = max(0, 100 - (σ × 150))
    // Onde: σ = desvio padrão das confianças dos LLMs
    // Interpretação: Mede a consistência estatística das respostas dos LLMs ao longo do tempo
    // Quanto menor o desvio padrão, maior a estabilidade cognitiva
    // Base teórica: Montgomery et al. (2012)
    
    // Coletar todas as confianças das menções (usar dados já filtrados)
    const allMentionConfidences = mentionsData
      .filter((m: MentionData) => m.mentioned && m.confidence > 0)
      .map((m: MentionData) => Number(m.confidence));
    
    let stability = 100; // Estabilidade perfeita como baseline
    let confidenceStdDev = 0;
    
    if (allMentionConfidences.length > 1) {
      // Calcular desvio padrão das confianças
      const meanConf = allMentionConfidences.reduce((a: number, b: number) => a + b, 0) / allMentionConfidences.length;
      const varianceConf = allMentionConfidences.reduce((acc: number, val: number) => 
        acc + Math.pow(val - meanConf, 2), 0
      ) / allMentionConfidences.length;
      confidenceStdDev = Math.sqrt(varianceConf);
      
      // Estabilidade = max(0, 100 - (σ × 150))
      // Fator 150 amplifica o impacto do desvio padrão (normalizado para escala 0-100)
      stability = Math.round(Math.max(0, 100 - (confidenceStdDev * 1.5)));
    } else if (allMentionConfidences.length === 1) {
      // Com apenas 1 confiança, estabilidade é alta mas não perfeita
      stability = 85;
    }
    // else: sem confianças = manter 100% (sem dados para avaliar instabilidade)

    // Confidence interval (baseado no desvio padrão temporal para CPI)
    const confidenceInterval = Math.round(temporalStdDev / 2); // ±% em relação à média

    console.log(`[IGO Metrics] Calculado: ICE=${ice}, GAP=${gap}, CPI=${cpi}, Estabilidade=${stability}%`);

    const resultData = {
      ice,
      gap,
      cpi,
      cognitive_stability: stability,
      confidence_interval: confidenceInterval,
      metadata: {
        providers_analyzed: providerCount,
        total_mentions: mentionsData.length,
        positive_mentions: mentionsData.filter((m: MentionData) => m.mentioned).length,
        avg_confidence: allMentionConfidences.length > 0 
          ? Math.round(allMentionConfidences.reduce((a: number, b: number) => a + b, 0) / allMentionConfidences.length)
          : 0,
        temporal_std_dev: Math.round(temporalStdDev * 100) / 100,
        confidence_std_dev: Math.round(confidenceStdDev * 100) / 100,
        consensus_rate: Math.round(consensusFactor * 100),
        calculated_at: new Date().toISOString(),
      }
    };

    // Salvar no histórico se for de uma brand específica
    if (brandId) {
      try {
        const { error: insertError } = await supabaseClient
          .from('igo_metrics_history')
          .insert({
            brand_id: brandId,
            ice,
            gap,
            cpi,
            cognitive_stability: stability,
            confidence_interval: confidenceInterval,
            metadata: resultData.metadata,
            calculated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('[IGO Metrics] Erro ao salvar histórico:', insertError);
        } else {
          console.log('[IGO Metrics] Histórico salvo com sucesso');
        }
      } catch (err) {
        console.error('[IGO Metrics] Exceção ao salvar histórico:', err);
      }
    }

    return new Response(
      JSON.stringify(resultData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('[IGO Metrics] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});

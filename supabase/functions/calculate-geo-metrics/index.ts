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
  answer_excerpt: string | null;
  query: string;
  collected_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[GEO Metrics] Iniciando cálculo com RETRY automático...');
    
    const { brandId, userId } = await req.json();
    console.log(`[GEO Metrics] Recebido brandId: ${brandId}, userId: ${userId}`);

    if (!brandId || !userId) {
      console.error('[GEO Metrics] Parâmetros faltando:', { brandId, userId });
      throw new Error('brandId and userId are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[GEO Metrics] Variáveis de ambiente faltando');
      throw new Error('Missing environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`[GEO Metrics] Cliente Supabase criado. Calculando métricas para brand ${brandId}`);

    // Buscar todas as menções com RETRY automático
    console.log('[GEO Metrics] Buscando menções com proteção de retry...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Aplicar RETRY na busca de menções
    const mentionsQuery = await withRetry(
      async () => {
        const result = await supabase
          .from('mentions_llm')
          .select('*')
          .eq('brand_id', brandId)
          .gte('collected_at', thirtyDaysAgo.toISOString())
          .order('collected_at', { ascending: false });
        return result;
      },
      { maxAttempts: 3, timeoutMs: 60000 }
    );
    
    const mentions = mentionsQuery.data;
    const mentionsError = mentionsQuery.error;

    if (mentionsError) {
      console.error('[GEO Metrics] Error fetching mentions:', mentionsError);
      throw new Error(`Failed to fetch mentions: ${mentionsError.message}`);
    }

    const mentionsCount = mentions?.length || 0;
    console.log(`[GEO Metrics] ${mentionsCount} menções encontradas`);
    
    // Se não houver menções, retornar valores zerados ao invés de falhar
    if (mentionsCount === 0) {
      console.warn(`[GEO Metrics] ⚠️ Nenhuma menção encontrada para brand ${brandId}. Retornando valores zerados.`);
      
      const zeroBreakdown = {
        base_tecnica: 0,
        estrutura_semantica: 0,
        relevancia_conversacional: 0,
        autoridade_cognitiva: 0,
        inteligencia_estrategica: 0,
        total_mentions: 0,
        total_queries: 0,
        mention_rate: 0,
        top3_rate: 0,
        avg_confidence: 0,
        topic_coverage: 0,
        health_status: 'no_data',
        last_check: new Date().toISOString()
      };
      
      await supabase
        .from('geo_scores')
        .insert({
          brand_id: brandId,
          score: 0,
          cpi: 0,
          breakdown: zeroBreakdown,
          computed_at: new Date().toISOString()
        });
      
      return new Response(
        JSON.stringify({
          success: true,
          geo_score: 0,
          cpi_score: 0,
          metrics: zeroBreakdown,
          warning: 'No mentions found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================================================
    // CÁLCULO OFICIAL DOS 5 PILARES GEO (0-100 cada)
    // ============================================================================
    // ⚠️ ATENÇÃO: Esta é a ÚNICA fonte de verdade para o cálculo do GEO Score
    // ⚠️ NÃO MODIFICAR estas fórmulas sem atualizar a documentação
    // ⚠️ Ambas as telas (GeoMetrics e Scores) dependem deste cálculo
    // ============================================================================
    
    const totalMentions = mentions?.filter(m => m.mentioned).length || 0;
    const totalQueries = mentions?.length || 0;
    const mentionRate = totalQueries > 0 ? (totalMentions / totalQueries) : 0;

    // 1. BASE TÉCNICA (0-100) - Infraestrutura e dados estruturados
    // Baseado em: presença de dados estruturados e metadados
    const baseTecnica = Math.min(100, Math.round(
      (mentionRate * 80) + // Taxa de menção ponderada
      (totalQueries > 50 ? 20 : (totalQueries / 50) * 20) // Volume de queries
    ));

    // 2. ESTRUTURA SEMÂNTICA (0-100) - Qualidade do conteúdo e contexto
    const uniqueTopics = new Set(
      mentions?.filter(m => m.mentioned).map(m => m.query.toLowerCase().trim()) || []
    );
    const topicDiversity = Math.min(100, (uniqueTopics.size / 20) * 100); // Max 20 tópicos diferentes
    const estruturaSemantica = Math.round(topicDiversity);

    // 3. RELEVÂNCIA CONVERSACIONAL (0-100) - Frequência e contexto nas respostas
    const top3Mentions = mentions?.filter(m => m.mentioned && m.confidence > 70).length || 0;
    const top3Rate = totalQueries > 0 ? (top3Mentions / totalQueries) : 0;
    const relevanciaConversacional = Math.round(top3Rate * 100);

    // 4. AUTORIDADE COGNITIVA (0-100) - Confiança e credibilidade
    const mentionsWithConfidence = mentions?.filter(m => m.mentioned && m.confidence > 0) || [];
    const avgConfidence = mentionsWithConfidence.length > 0
      ? mentionsWithConfidence.reduce((sum, m) => sum + m.confidence, 0) / mentionsWithConfidence.length
      : 0;
    const autoridadeCognitiva = Math.round(avgConfidence);

    // 5. INTELIGÊNCIA ESTRATÉGICA (0-100) - Consistência e evolução
    let consistency = 100;
    if (mentionsWithConfidence.length > 1) {
      const mean = avgConfidence;
      const variance = mentionsWithConfidence.reduce((sum, m) => {
        return sum + Math.pow(m.confidence - mean, 2);
      }, 0) / mentionsWithConfidence.length;
      const stdDev = Math.sqrt(variance);
      // ============================================================================
      // ESTABILIDADE COGNITIVA - Fórmula do Artigo Científico (Capítulo 3)
      // ============================================================================
      // Fórmula Original: Estabilidade = max(0, 100 - (σ × 150))
      // Onde σ está em escala 0-1. Como nosso stdDev está em escala 0-100,
      // usamos σ × 1.5 (equivalente matemático: 150/100 = 1.5)
      // Base teórica: Montgomery et al. (2012)
      // ============================================================================
      consistency = Math.max(0, Math.min(100, Math.round(100 - (stdDev * 1.5))));
    }

    // Evolução temporal
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentMentions = mentions?.filter(m => 
      m.mentioned && new Date(m.collected_at) >= sevenDaysAgo
    ).length || 0;

    const previousMentions = mentions?.filter(m => 
      m.mentioned && 
      new Date(m.collected_at) >= fourteenDaysAgo &&
      new Date(m.collected_at) < sevenDaysAgo
    ).length || 0;

    const growthRate = previousMentions > 0 ? (recentMentions - previousMentions) / previousMentions : 0;
    const evolutionScore = Math.min(100, 50 + (growthRate * 100)); // Centro em 50, cresce com evolução positiva

    const inteligenciaEstrategica = Math.round((consistency * 0.6) + (evolutionScore * 0.4));

    // ============================================================================
    // CPI SCORE - Cognitive Predictive Index (Consistência Multi-LLM)
    // ============================================================================
    // Mede a consistência ENTRE diferentes LLMs (não dentro de um único LLM)
    // Quanto menor a variância entre LLMs diferentes, maior o CPI
    let cpiScore = 0;
    
    // Agrupar menções por provider
    const providerConfidences = new Map<string, number[]>();
    mentions?.forEach(m => {
      if (m.mentioned && m.confidence > 0) {
        if (!providerConfidences.has(m.provider)) {
          providerConfidences.set(m.provider, []);
        }
        // CORREÇÃO CRÍTICA: Normalização robusta de confidence para escala 0-100
        // Garante que valores já em escala 0-100 não sejam multiplicados novamente
        let normalizedConf = m.confidence;
        if (normalizedConf <= 1) {
          // Confidence em escala 0-1 → converter para 0-100
          normalizedConf = normalizedConf * 100;
        }
        // Garantir limites 0-100 mesmo com dados inconsistentes
        normalizedConf = Math.max(0, Math.min(100, normalizedConf));
        providerConfidences.get(m.provider)!.push(normalizedConf);
      }
    });

    // Calcular média de cada provider
    const providerAvgs: number[] = [];
    providerConfidences.forEach((confidences) => {
      if (confidences.length > 0) {
        const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length;
        providerAvgs.push(avg);
      }
    });

    // CPI: quanto menor a variância ENTRE providers, maior a consistência
    if (providerAvgs.length >= 2) {
      const overallMean = providerAvgs.reduce((a, b) => a + b, 0) / providerAvgs.length;
      const interProviderVariance = providerAvgs.reduce((sum, avg) => {
        return sum + Math.pow(avg - overallMean, 2);
      }, 0) / providerAvgs.length;
      const interProviderStdDev = Math.sqrt(interProviderVariance);
      
      // CPI: 100 quando desvio padrão é 0, decresce conforme aumenta
      // Penaliza desvios > 20 pontos significativamente
      cpiScore = Math.round(Math.max(0, 100 - (interProviderStdDev * 2)));
    } else if (providerAvgs.length === 1) {
      // Com apenas 1 provider, usa a própria consistência interna
      cpiScore = Math.round(consistency);
    }

    // === FALLBACK: Se CPI resultou em 0 mas há menções, buscar último CPI válido ===
    if (cpiScore === 0 && totalMentions > 0) {
      console.log('[GEO Metrics] CPI calculado como 0, buscando último valor válido...');
      const { data: lastValidScore } = await supabase
        .from('geo_scores')
        .select('cpi')
        .eq('brand_id', brandId)
        .gt('cpi', 0)
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (lastValidScore?.cpi && lastValidScore.cpi > 0) {
        cpiScore = lastValidScore.cpi;
        console.log(`[GEO Metrics] Usando CPI anterior: ${cpiScore}`);
      } else {
        // Se não há CPI anterior, calcular baseado na confidence média
        cpiScore = Math.round(avgConfidence);
        console.log(`[GEO Metrics] Usando confidence média como CPI: ${cpiScore}`);
      }
    }

    // ============================================================================
    // GEO SCORE FINAL (média ponderada dos 5 pilares)
    // ============================================================================
    // Fórmula: (BT×0.2) + (ES×0.15) + (RC×0.25) + (AC×0.25) + (IE×0.15) = 100%
    // Esta fórmula está DOCUMENTADA e PROTEGIDA - não modificar sem aprovação
    // ============================================================================
    const finalGeoScore = Math.round(
      (baseTecnica * 0.2) +              // 20% - Base Técnica
      (estruturaSemantica * 0.15) +      // 15% - Estrutura Semântica
      (relevanciaConversacional * 0.25) + // 25% - Relevância Conversacional
      (autoridadeCognitiva * 0.25) +     // 25% - Autoridade Cognitiva
      (inteligenciaEstrategica * 0.15)   // 15% - Inteligência Estratégica
    );

    // === BREAKDOWN COM OS 5 PILARES ===
    const breakdown = {
      base_tecnica: baseTecnica,
      estrutura_semantica: estruturaSemantica,
      relevancia_conversacional: relevanciaConversacional,
      autoridade_cognitiva: autoridadeCognitiva,
      inteligencia_estrategica: inteligenciaEstrategica,
      // Métricas adicionais
      total_mentions: totalMentions,
      total_queries: totalQueries,
      mention_rate: Math.round(mentionRate * 100),
      top3_rate: Math.round(top3Rate * 100),
      avg_confidence: Math.round(avgConfidence),
      topic_coverage: uniqueTopics.size
    };

    // === SEMPRE CRIAR NOVO REGISTRO (histórico) ===
    const { error: insertError } = await supabase
      .from('geo_scores')
      .insert({
        brand_id: brandId,
        score: finalGeoScore,
        cpi: cpiScore,
        breakdown,
        computed_at: new Date().toISOString()
      });

    if (insertError) throw insertError;

    console.log(`[GEO Metrics] Score calculado: ${finalGeoScore}, CPI: ${cpiScore}`);

    return new Response(
      JSON.stringify({
        success: true,
        geo_score: finalGeoScore,
        cpi_score: cpiScore,
        metrics: breakdown
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GEO Metrics] ERRO CRÍTICO:', error);
    console.error('[GEO Metrics] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

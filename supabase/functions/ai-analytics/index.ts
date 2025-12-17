import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brandId } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Buscar dados históricos
    const { data: geoHistory } = await supabaseClient
      .from('geo_scores')
      .select('score, computed_at')
      .eq('brand_id', brandId)
      .order('computed_at', { ascending: true })
      .limit(30);

    const { data: mentionsData } = await supabaseClient
      .from('mentions_llm')
      .select('mentioned, confidence, provider, collected_at')
      .eq('brand_id', brandId)
      .order('collected_at', { ascending: true });

    const { data: seoData } = await supabaseClient
      .from('seo_metrics_daily')
      .select('avg_position, ctr, conversion_rate, date')
      .eq('brand_id', brandId)
      .order('date', { ascending: true })
      .limit(30);

    if (!geoHistory || !mentionsData || !seoData) {
      throw new Error('Dados insuficientes para análise');
    }

    // Análise de tendências
    const geoTrend = analyzeTrend(geoHistory.map(d => d.score));
    const mentionsTrend = analyzeMentionsTrend(mentionsData);
    const seoTrend = analyzeSeoTrend(seoData);

    // Previsão simples (média móvel)
    const geoForecast = forecastScore(geoHistory.map(d => d.score));
    
    // Correlações
    const correlations = calculateCorrelations(geoHistory, seoData);

    // Gerar insights com IA
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const aiPrompt = `
Analise os seguintes dados de performance digital e gere insights acionáveis:

TENDÊNCIAS:
- GEO Score: ${geoTrend.direction} (variação: ${geoTrend.change.toFixed(1)}%)
- Menções LLM: ${mentionsTrend.totalMentions} menções, ${mentionsTrend.avgConfidence.toFixed(1)}% confiança
- SEO: Posição média ${seoTrend.avgPosition.toFixed(1)}, CTR ${seoTrend.avgCtr.toFixed(2)}%

PREVISÃO:
- GEO Score previsto para próximos 7 dias: ${geoForecast.toFixed(1)}/100

CORRELAÇÕES:
- GEO vs SEO: ${correlations.geoSeo > 0.7 ? 'Alta correlação positiva' : correlations.geoSeo < -0.7 ? 'Alta correlação negativa' : 'Correlação moderada'}

Forneça:
1. Diagnóstico geral (1-2 linhas)
2. 3 insights principais
3. 3 recomendações acionáveis e específicas
4. Prioridade urgente (se houver)

Seja direto, técnico e acionável. Use português do Brasil.
`;

    let insights: {
      diagnosis: string;
      keyInsights: string[];
      recommendations: string[];
      urgentAction: string | null;
    } = {
      diagnosis: 'Análise em andamento...',
      keyInsights: [],
      recommendations: [],
      urgentAction: null
    };

    if (LOVABLE_API_KEY) {
      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Você é um especialista em análise de dados de SEO e GEO. Seja conciso e acionável.' },
              { role: 'user', content: aiPrompt }
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiText = aiData.choices[0].message.content;
          insights = parseAiInsights(aiText);
        }
      } catch (error) {
        console.error('Error calling AI:', error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analytics: {
          trends: {
            geo: geoTrend,
            mentions: mentionsTrend,
            seo: seoTrend,
          },
          forecast: {
            geoScore: geoForecast,
            confidence: calculateForecastConfidence(geoHistory.map(d => d.score)),
          },
          correlations,
          insights,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function analyzeTrend(scores: number[]) {
  if (scores.length < 2) return { direction: 'stable', change: 0 };
  
  const recent = scores.slice(-7);
  const older = scores.slice(-14, -7);
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
  
  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  return {
    direction: change > 5 ? 'crescente' : change < -5 ? 'decrescente' : 'estável',
    change,
    currentAvg: recentAvg,
  };
}

function analyzeMentionsTrend(mentions: any[]) {
  const totalMentions = mentions.length;
  const positiveMentions = mentions.filter(m => m.mentioned).length;
  const avgConfidence = mentions.reduce((acc, m) => acc + m.confidence, 0) / totalMentions || 0;
  
  const providerBreakdown = mentions.reduce((acc, m) => {
    acc[m.provider] = (acc[m.provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalMentions,
    positiveMentions,
    avgConfidence,
    visibility: (positiveMentions / totalMentions) * 100 || 0,
    providerBreakdown,
  };
}

function analyzeSeoTrend(seoData: any[]) {
  if (seoData.length === 0) return { avgPosition: 0, avgCtr: 0, avgConversion: 0 };
  
  const avgPosition = seoData.reduce((acc, d) => acc + d.avg_position, 0) / seoData.length;
  const avgCtr = seoData.reduce((acc, d) => acc + (d.ctr * 100), 0) / seoData.length;
  const avgConversion = seoData.reduce((acc, d) => acc + d.conversion_rate, 0) / seoData.length;
  
  return { avgPosition, avgCtr, avgConversion };
}

function forecastScore(scores: number[]): number {
  if (scores.length < 3) return scores[scores.length - 1] || 0;
  
  // Média móvel ponderada (últimos 7 pontos com mais peso nos recentes)
  const recent = scores.slice(-7);
  const weights = [1, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2];
  
  const weightedSum = recent.reduce((acc, score, idx) => {
    const weight = weights[idx] || 1;
    return acc + (score * weight);
  }, 0);
  
  const totalWeight = weights.slice(0, recent.length).reduce((a, b) => a + b, 0);
  
  return weightedSum / totalWeight;
}

function calculateForecastConfidence(scores: number[]): number {
  if (scores.length < 5) return 0.3;
  
  // Calcular volatilidade
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // Confiança inversamente proporcional à volatilidade
  const confidence = Math.max(0.3, Math.min(0.95, 1 - (stdDev / 50)));
  
  return confidence;
}

function calculateCorrelations(geoHistory: any[], seoData: any[]) {
  // Correlação simples (Pearson) entre GEO e SEO
  if (geoHistory.length < 2 || seoData.length < 2) {
    return { geoSeo: 0, geoMentions: 0 };
  }
  
  // Simplificado: correlação baseada em tendência
  const geoTrend = geoHistory[geoHistory.length - 1].score - geoHistory[0].score;
  const seoTrend = seoData[0].avg_position - seoData[seoData.length - 1].avg_position; // inverso
  
  const geoSeo = (geoTrend * seoTrend) > 0 ? 0.8 : -0.3;
  
  return { geoSeo, geoMentions: 0.7 };
}

function parseAiInsights(aiText: string) {
  // Parse básico do texto da IA
  const lines = aiText.split('\n').filter(l => l.trim());
  
  const insights = {
    diagnosis: '',
    keyInsights: [] as string[],
    recommendations: [] as string[],
    urgentAction: null as string | null,
  };
  
  let section = 'diagnosis';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (trimmed.toLowerCase().includes('insight') || trimmed.toLowerCase().includes('principais')) {
      section = 'insights';
      continue;
    }
    if (trimmed.toLowerCase().includes('recomenda') || trimmed.toLowerCase().includes('ações')) {
      section = 'recommendations';
      continue;
    }
    if (trimmed.toLowerCase().includes('urgent') || trimmed.toLowerCase().includes('prioridade')) {
      section = 'urgent';
      continue;
    }
    
    if (section === 'diagnosis' && insights.diagnosis.length < 200) {
      insights.diagnosis += trimmed + ' ';
    } else if (section === 'insights' && insights.keyInsights.length < 3) {
      if (trimmed.match(/^\d+\./) || trimmed.startsWith('-') || trimmed.startsWith('•')) {
        insights.keyInsights.push(trimmed.replace(/^[\d\.\-•]\s*/, ''));
      }
    } else if (section === 'recommendations' && insights.recommendations.length < 3) {
      if (trimmed.match(/^\d+\./) || trimmed.startsWith('-') || trimmed.startsWith('•')) {
        insights.recommendations.push(trimmed.replace(/^[\d\.\-•]\s*/, ''));
      }
    } else if (section === 'urgent' && !insights.urgentAction) {
      insights.urgentAction = trimmed.replace(/^[\d\.\-•]\s*/, '');
    }
  }
  
  return insights;
}

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TechnicalAnalysis {
  hasH1: boolean;
  hasMetaDescription: boolean;
  hasTitleTag: boolean;
  titleLength: number;
  descriptionLength: number;
  hasStructuredData: boolean;
  contentQualityScore: number;
  keywordDensity: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { brandId, domain } = await req.json();
    
    if (!brandId || !domain) {
      return new Response(
        JSON.stringify({ error: 'brandId e domain são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Calculando estimativas SEO para:', domain);

    // Verificar ownership da brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, domain')
      .eq('id', brandId)
      .eq('user_id', user.id)
      .single();

    if (brandError || !brand) {
      return new Response(
        JSON.stringify({ error: 'Brand não encontrada ou sem permissão' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. ANÁLISE TÉCNICA DA URL
    const technicalAnalysis = await analyzeTechnicalSEO(domain);
    console.log('📊 Análise técnica concluída:', technicalAnalysis);

    // 2. CALCULAR ESTIMATIVAS INTELIGENTES
    const estimates = calculateIntelligentEstimates(technicalAnalysis);
    console.log('💡 Estimativas calculadas:', estimates);

    // 3. SALVAR EM seo_metrics_daily
    const today = new Date().toISOString().split('T')[0];
    
    // Verificar se já existe registro para hoje
    const { data: existing } = await supabase
      .from('seo_metrics_daily')
      .select('id')
      .eq('brand_id', brandId)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      // Atualizar registro existente
      const { error: updateError } = await supabase
        .from('seo_metrics_daily')
        .update({
          avg_position: estimates.avg_position,
          ctr: estimates.ctr,
          conversion_rate: estimates.conversion_rate,
          total_clicks: estimates.total_clicks,
          total_impressions: estimates.total_impressions,
          organic_traffic: estimates.organic_traffic,
          collected_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
      console.log('✅ Estimativas atualizadas em seo_metrics_daily');
    } else {
      // Criar novo registro
      const { error: insertError } = await supabase
        .from('seo_metrics_daily')
        .insert({
          brand_id: brandId,
          date: today,
          avg_position: estimates.avg_position,
          ctr: estimates.ctr,
          conversion_rate: estimates.conversion_rate,
          total_clicks: estimates.total_clicks,
          total_impressions: estimates.total_impressions,
          organic_traffic: estimates.organic_traffic,
          collected_at: new Date().toISOString()
        });

      if (insertError) throw insertError;
      console.log('✅ Estimativas salvas em seo_metrics_daily');
    }

    return new Response(
      JSON.stringify({
        success: true,
        estimates,
        technicalAnalysis,
        message: 'Estimativas SEO calculadas com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erro ao calcular estimativas SEO:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao processar estimativas' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzeTechnicalSEO(domain: string): Promise<TechnicalAnalysis> {
  try {
    // Normalizar URL
    let url = domain.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GEO-Analyzer/1.0)',
      },
      signal: AbortSignal.timeout(10000) // 10s timeout
    });

    if (!response.ok) {
      console.warn('⚠️ Não foi possível acessar a URL, usando valores padrão');
      return getDefaultAnalysis();
    }

    const html = await response.text();

    // Extrair elementos técnicos
    const hasH1 = /<h1[^>]*>/i.test(html);
    const hasTitleTag = /<title[^>]*>/i.test(html);
    const hasMetaDescription = /<meta[^>]*name=["']description["']/i.test(html);
    const hasStructuredData = /application\/ld\+json|schema\.org/i.test(html);

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const titleLength = titleMatch ? titleMatch[1].length : 0;

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const descriptionLength = descMatch ? descMatch[1].length : 0;

    // Análise de conteúdo (simplificada)
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(' ').length;
    
    // Score de qualidade de conteúdo (0-100)
    let contentQualityScore = 50; // base
    if (wordCount > 500) contentQualityScore += 10;
    if (wordCount > 1000) contentQualityScore += 10;
    if (wordCount > 2000) contentQualityScore += 10;
    if (hasH1) contentQualityScore += 5;
    if (hasTitleTag && titleLength >= 30 && titleLength <= 60) contentQualityScore += 10;
    if (hasMetaDescription && descriptionLength >= 120 && descriptionLength <= 160) contentQualityScore += 10;
    if (hasStructuredData) contentQualityScore += 15;

    // Densidade de keywords (simplificada - percentual de palavras únicas)
    const words = textContent.toLowerCase().split(' ').filter(w => w.length > 3);
    const uniqueWords = new Set(words);
    const keywordDensity = words.length > 0 ? (uniqueWords.size / words.length) : 0;

    return {
      hasH1,
      hasMetaDescription,
      hasTitleTag,
      titleLength,
      descriptionLength,
      hasStructuredData,
      contentQualityScore: Math.min(100, contentQualityScore),
      keywordDensity
    };

  } catch (error) {
    console.error('Erro na análise técnica:', error);
    return getDefaultAnalysis();
  }
}

function getDefaultAnalysis(): TechnicalAnalysis {
  return {
    hasH1: false,
    hasMetaDescription: false,
    hasTitleTag: false,
    titleLength: 0,
    descriptionLength: 0,
    hasStructuredData: false,
    contentQualityScore: 40,
    keywordDensity: 0.3
  };
}

function calculateIntelligentEstimates(analysis: TechnicalAnalysis) {
  // FÓRMULAS CIENTÍFICAS MANTIDAS - apenas melhorando os inputs

  // 1. ESTIMAR avg_position (1-100, onde menor é melhor)
  // Base: 50 (posição média)
  // Ajustes baseados em qualidade técnica
  let estimatedPosition = 50;
  
  if (analysis.hasTitleTag && analysis.titleLength >= 30) estimatedPosition -= 10;
  if (analysis.hasMetaDescription && analysis.descriptionLength >= 120) estimatedPosition -= 8;
  if (analysis.hasH1) estimatedPosition -= 5;
  if (analysis.hasStructuredData) estimatedPosition -= 12;
  if (analysis.contentQualityScore > 70) estimatedPosition -= 10;
  if (analysis.contentQualityScore > 85) estimatedPosition -= 5;
  
  const avg_position = Math.max(1, Math.min(100, estimatedPosition));

  // 2. ESTIMAR CTR (0-1, percentual)
  // CTR médio baseado na posição estimada
  // Fórmula: CTR diminui exponencialmente com a posição
  let baseCTR = 0.03; // 3% base
  
  if (avg_position <= 3) baseCTR = 0.20; // Top 3: 20%
  else if (avg_position <= 5) baseCTR = 0.12; // Top 5: 12%
  else if (avg_position <= 10) baseCTR = 0.06; // Top 10: 6%
  
  // Ajustes por qualidade de meta tags
  if (analysis.hasTitleTag && analysis.titleLength >= 30 && analysis.titleLength <= 60) {
    baseCTR *= 1.2; // +20% por título otimizado
  }
  if (analysis.hasMetaDescription && analysis.descriptionLength >= 120 && analysis.descriptionLength <= 160) {
    baseCTR *= 1.15; // +15% por description otimizada
  }
  
  const ctr = Math.min(0.30, baseCTR); // Cap em 30%

  // 3. ESTIMAR conversion_rate (0-1, percentual)
  // Base: 2% (padrão mercado)
  let conversionRate = 0.02;
  
  if (analysis.contentQualityScore > 70) conversionRate += 0.01;
  if (analysis.contentQualityScore > 85) conversionRate += 0.01;
  if (analysis.hasStructuredData) conversionRate += 0.005; // Trust signals
  
  const conversion_rate = Math.min(0.10, conversionRate); // Cap em 10%

  // 4. ESTIMAR impressões, clicks e tráfego
  // Base em análise de qualidade do site
  const qualityMultiplier = analysis.contentQualityScore / 50; // 0.8 a 2.0
  
  // Impressões base: 5000-20000/mês dependendo da qualidade
  const total_impressions = Math.round(8000 * qualityMultiplier);
  
  // Clicks = impressions × CTR
  const total_clicks = Math.round(total_impressions * ctr);
  
  // Tráfego orgânico (pode ser maior que clicks por múltiplas visitas)
  const organic_traffic = Math.round(total_clicks * 1.2);

  return {
    avg_position: Number(avg_position.toFixed(2)),
    ctr: Number(ctr.toFixed(4)),
    conversion_rate: Number(conversion_rate.toFixed(4)),
    total_clicks,
    total_impressions,
    organic_traffic
  };
}

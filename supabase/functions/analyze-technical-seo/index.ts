import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { calculateIntelligentEstimates } from '../_shared/intelligent-estimates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TechnicalAnalysis {
  performance: {
    loadTime: number;
    score: number;
  };
  seo: {
    title: string;
    titleLength: number;
    description: string;
    descriptionLength: number;
    h1Count: number;
    h2Count: number;
    imageCount: number;
    imagesWithoutAlt: number;
    score: number;
  };
  mobile: {
    hasViewport: boolean;
    score: number;
  };
  security: {
    https: boolean;
    score: number;
  };
  structure: {
    hasRobotsTxt: boolean;
    hasSitemap: boolean;
    score: number;
  };
  overallScore: number;
}

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TEIABot/1.0; +https://teia.studio)',
      },
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function analyzeTechnicalSEO(domain: string): Promise<TechnicalAnalysis> {
  console.log(`[Technical SEO] Analisando ${domain}...`);
  
  const url = domain.startsWith('http') ? domain : `https://${domain}`;
  const startTime = Date.now();
  
  try {
    // Fetch página principal
    const response = await fetchWithTimeout(url);
    const loadTime = Date.now() - startTime;
    const html = await response.text();
    
    // Parse HTML básico
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const viewportMatch = html.match(/<meta[^>]*name=["']viewport["']/i);
    
    const h1Matches = html.match(/<h1[^>]*>/gi);
    const h2Matches = html.match(/<h2[^>]*>/gi);
    const imgMatches = html.match(/<img[^>]*>/gi);
    const imgsWithoutAlt = html.match(/<img(?![^>]*alt=)[^>]*>/gi);
    
    // Verificar robots.txt
    let hasRobotsTxt = false;
    try {
      const robotsResponse = await fetchWithTimeout(`${url}/robots.txt`, 5000);
      hasRobotsTxt = robotsResponse.ok;
    } catch (e) {
      console.log('[Technical SEO] Robots.txt não encontrado');
    }
    
    // Verificar sitemap
    let hasSitemap = false;
    try {
      const sitemapResponse = await fetchWithTimeout(`${url}/sitemap.xml`, 5000);
      hasSitemap = sitemapResponse.ok;
    } catch (e) {
      console.log('[Technical SEO] Sitemap não encontrado');
    }
    
    // Calcular scores
    const title = titleMatch ? titleMatch[1] : '';
    const titleLength = title.length;
    const description = descMatch ? descMatch[1] : '';
    const descriptionLength = description.length;
    const h1Count = h1Matches ? h1Matches.length : 0;
    const h2Count = h2Matches ? h2Matches.length : 0;
    const imageCount = imgMatches ? imgMatches.length : 0;
    const imagesWithoutAlt = imgsWithoutAlt ? imgsWithoutAlt.length : 0;
    
    // Performance Score (baseado em load time)
    let performanceScore = 100;
    if (loadTime > 3000) performanceScore = 60;
    else if (loadTime > 2000) performanceScore = 75;
    else if (loadTime > 1000) performanceScore = 90;
    
    // SEO Score
    let seoScore = 100;
    if (!title || titleLength < 30 || titleLength > 60) seoScore -= 15;
    if (!description || descriptionLength < 120 || descriptionLength > 160) seoScore -= 15;
    if (h1Count !== 1) seoScore -= 10;
    if (h1Count === 0) seoScore -= 20;
    if (imageCount > 0 && imagesWithoutAlt > imageCount * 0.3) seoScore -= 20;
    
    // Mobile Score
    const mobileScore = viewportMatch ? 100 : 40;
    
    // Security Score
    const securityScore = url.startsWith('https') ? 100 : 0;
    
    // Structure Score
    let structureScore = 50;
    if (hasRobotsTxt) structureScore += 25;
    if (hasSitemap) structureScore += 25;
    
    // Overall Score
    const overallScore = Math.round(
      (performanceScore * 0.25) +
      (seoScore * 0.35) +
      (mobileScore * 0.15) +
      (securityScore * 0.15) +
      (structureScore * 0.10)
    );
    
    console.log(`[Technical SEO] Análise concluída: ${overallScore}/100`);
    
    return {
      performance: {
        loadTime,
        score: performanceScore,
      },
      seo: {
        title,
        titleLength,
        description,
        descriptionLength,
        h1Count,
        h2Count,
        imageCount,
        imagesWithoutAlt,
        score: seoScore,
      },
      mobile: {
        hasViewport: !!viewportMatch,
        score: mobileScore,
      },
      security: {
        https: url.startsWith('https'),
        score: securityScore,
      },
      structure: {
        hasRobotsTxt,
        hasSitemap,
        score: structureScore,
      },
      overallScore,
    };
  } catch (error) {
    console.error('[Technical SEO] Erro:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, brandId, userId } = await req.json();
    
    if (!domain) {
      throw new Error('Domain é obrigatório');
    }
    
    console.log(`[Technical SEO] Iniciando análise para ${domain}`);
    
    const analysis = await analyzeTechnicalSEO(domain);
    
    // Se brandId fornecido, salvar métricas no banco
    if (brandId && userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Buscar análise de IA se disponível para estimativas mais inteligentes
      const { data: aiAnalysis } = await supabase
        .from('url_analysis_history')
        .select('overall_score, seo_score, geo_score, analysis_data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log('[Technical SEO] Análise de IA encontrada:', !!aiAnalysis);
      
      // Calcular estimativas inteligentes
      const estimates = calculateIntelligentEstimates(analysis, aiAnalysis || undefined);
      
      const metrics = {
        brand_id: brandId,
        date: today,
        total_impressions: estimates.total_impressions,
        total_clicks: estimates.total_clicks,
        avg_position: estimates.avg_position,
        ctr: estimates.ctr, // Já em decimal
        organic_traffic: estimates.organic_traffic,
        conversion_rate: estimates.conversion_rate, // Já em decimal
        collected_at: new Date().toISOString(),
      };
      
      console.log('[Technical SEO] Salvando métricas inteligentes:', metrics);
      
      const { error: insertError } = await supabase
        .from('seo_metrics_daily')
        .upsert(metrics, { onConflict: 'brand_id,date' });
      
      if (insertError) {
        console.error('[Technical SEO] Erro ao salvar:', insertError);
      } else {
        console.log('[Technical SEO] Métricas salvas com sucesso (confiança:', estimates.confidence_level, ')');
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Technical SEO] Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

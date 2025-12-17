import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase for authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT token
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

    const { url, brandId, saveAsInsight } = await req.json();
    
    // Comprehensive input validation
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format and prevent SSRF
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
      
      // Comprehensive SSRF protection
      const hostname = parsedUrl.hostname.toLowerCase();
      
      // Block internal/private networks - IPv4
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        /^127\./.test(hostname) ||
        /^10\./.test(hostname) ||
        /^192\.168\./.test(hostname) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
        /^169\.254\./.test(hostname)
      ) {
        throw new Error('Access to internal networks is not allowed');
      }
      
      // Block IPv6 internal addresses
      if (
        hostname === '::1' ||
        hostname === '[::1]' ||
        /^::ffff:127/.test(hostname) ||
        /^fe80:/i.test(hostname) ||
        /^fc00:/i.test(hostname) ||
        /^fd00:/i.test(hostname)
      ) {
        throw new Error('Access to internal IPv6 networks is not allowed');
      }
      
      // Block alternative IP representations (hex, octal, decimal)
      if (
        /^0x[0-9a-f]+$/i.test(hostname) ||
        /^0[0-7]+\.[0-7]+\.[0-7]+\.[0-7]+$/.test(hostname) ||
        /^\d{8,10}$/.test(hostname)
      ) {
        throw new Error('Alternative IP representations are not allowed');
      }
      
      // Block cloud metadata endpoints
      if (
        hostname === '169.254.169.254' ||
        hostname === 'metadata.google.internal' ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local')
      ) {
        throw new Error('Access to cloud metadata is not allowed');
      }

      // Enforce URL length limit
      if (url.length > 2048) {
        throw new Error('URL too long');
      }
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'URL inválida ou não permitida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify brand ownership if brandId is provided (optional - just log if not found)
    if (brandId && typeof brandId === 'string') {
      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('id')
        .eq('id', brandId)
        .eq('user_id', user.id)
        .single();

      if (brandError || !brand) {
        console.log('⚠️ Brand não encontrada ou não autorizada, mas continuando análise:', brandId);
        // Não bloquear a análise - apenas continuar sem brand associada
      }
    }

    console.log('Analisando URL:', url);

    // supabase client already initialized above for auth

    // Fetch the webpage content (with redirect protection)
    let pageContent = '';
    try {
      const pageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GEO-Analyzer/1.0)',
        },
        redirect: 'manual', // Don't follow redirects to prevent SSRF via redirect
      });
      
      if (pageResponse.ok) {
        const html = await pageResponse.text();
        // Extract basic content (title, meta, headings)
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        
        pageContent = `
Título: ${titleMatch ? titleMatch[1] : 'Não encontrado'}
Meta Description: ${descMatch ? descMatch[1] : 'Não encontrada'}
H1: ${h1Match ? h1Match[1] : 'Não encontrado'}
`;
      }
    } catch (error) {
      console.error('Erro ao buscar página:', error);
      pageContent = 'Não foi possível acessar o conteúdo da página.';
    }

    // Prepare the AI prompt
    const prompt = `Você é um especialista em GEO (Generative Engine Optimization) e SEO. Analise a seguinte URL e seu conteúdo:

URL: ${url}
${pageContent}

Forneça uma análise completa em formato JSON com a seguinte estrutura:
{
  "score": <número de 0-100>,
  "summary": "<resumo geral da análise>",
  "strengths": ["<pontos fortes>"],
  "weaknesses": ["<pontos fracos>"],
  "recommendations": [
    {
      "title": "<título da recomendação>",
      "description": "<descrição detalhada>",
      "priority": "high|medium|low",
      "impact": "<impacto esperado>"
    }
  ],
  "geoOptimization": {
    "score": <0-100>,
    "insights": ["<insights específicos de GEO>"]
  },
  "seoOptimization": {
    "score": <0-100>,
    "insights": ["<insights específicos de SEO>"]
  }
}

Foque em:
1. Otimização para engines de IA (ChatGPT, Gemini, Claude, Perplexity)
2. Estrutura de conteúdo e semântica
3. Autoridade e credibilidade
4. SEO técnico básico
5. Recomendações práticas e acionáveis`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    console.log('Enviando para Lovable AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite', // Modelo mais rápido
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em GEO e SEO. Responda sempre em português do Brasil e em formato JSON válido.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5, // Respostas mais diretas
        max_tokens: 2500, // Limitar tokens para análise rápida
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Erro na API de IA:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Por favor, adicione créditos ao seu workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Erro na API de IA: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;

    console.log('Resposta da IA recebida');

    // Parse the JSON response
    let analysis;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || 
                       analysisText.match(/```\n([\s\S]*?)\n```/) ||
                       [null, analysisText];
      analysis = JSON.parse(jsonMatch[1]);
    } catch (error) {
      console.error('Erro ao parsear resposta da IA:', error);
      // Fallback response
      analysis = {
        score: 50,
        summary: analysisText.substring(0, 200),
        strengths: ['Análise em processamento'],
        weaknesses: ['Análise em processamento'],
        recommendations: [{
          title: 'Análise Detalhada',
          description: analysisText,
          priority: 'medium',
          impact: 'A análise completa está disponível no texto acima'
        }],
        geoOptimization: { score: 50, insights: ['Processando...'] },
        seoOptimization: { score: 50, insights: ['Processando...'] }
      };
    }

    // Generate actionable tasks based on the analysis
    const tasks = generateActionableTasks(
      analysis.geoOptimization.score,
      analysis.seoOptimization.score,
      analysis.geoOptimization,
      analysis.seoOptimization,
      analysis.recommendations
    );

    // Add tasks to the response
    const enrichedAnalysis = {
      ...analysis,
      tasks,
      url
    };

    // Save as insight if requested
    if (saveAsInsight && user.id) {
      try {
        console.log('Salvando resumo como insight...');
        
        // Extract site name from URL for title
        const urlObj = new URL(url);
        const siteName = urlObj.hostname.replace('www.', '').split('.')[0];
        const title = `${siteName.charAt(0).toUpperCase() + siteName.slice(1)} - Resumo de Análise`;

        const insightData = {
          user_id: user.id,
          brand_id: brandId || null,
          type: 'summary',
          title: title,
          content: {
            url: url,
            score: analysis.score,
            geoScore: analysis.geoOptimization.score,
            seoScore: analysis.seoOptimization.score,
            summary: analysis.summary,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            recommendations: analysis.recommendations,
            tasks: tasks
          }
        };

        const { error: insertError } = await supabase
          .from('ai_insights')
          .insert(insightData);

        if (insertError) {
          console.error('Erro ao salvar insight:', insertError);
        } else {
          console.log('✅ Resumo salvo como insight com sucesso!');
        }
      } catch (saveError) {
        console.error('Erro ao salvar resumo:', saveError);
        // Não falhar a requisição se o salvamento falhar
      }
    }

    return new Response(
      JSON.stringify(enrichedAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro na análise:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao processar análise' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Function to generate actionable tasks based on analysis scores
function generateActionableTasks(
  geoScore: number,
  seoScore: number,
  geoAnalysis: any,
  seoAnalysis: any,
  recommendations: any[]
) {
  const tasks: any[] = [];

  // GEO optimization tasks
  if (geoScore < 80) {
    if (geoScore < 50) {
      tasks.push({
        title: 'Implementar Schema Markup Estruturado',
        description: 'Adicione schema.org markup (Organization, Product, FAQ) para facilitar a extração de dados por IAs.',
        priority: 'high',
        category: 'geo',
        estimated_impact: 15
      });
    }
    
    tasks.push({
      title: 'Otimizar Conteúdo para Linguagem Natural',
      description: 'Reescreva seções-chave usando perguntas e respostas diretas que IAs podem citar facilmente.',
      priority: geoScore < 60 ? 'high' : 'medium',
      category: 'geo',
      estimated_impact: 12
    });

    if (geoScore < 70) {
      tasks.push({
        title: 'Criar Seção de Perguntas Frequentes (FAQ)',
        description: 'Adicione uma seção FAQ completa com perguntas comuns e respostas claras no formato adequado para IAs.',
        priority: 'medium',
        category: 'content',
        estimated_impact: 10
      });
    }
  }

  // SEO optimization tasks
  if (seoScore < 80) {
    if (seoScore < 50) {
      tasks.push({
        title: 'Corrigir Meta Tags Essenciais',
        description: 'Adicione ou otimize title, meta description e Open Graph tags em todas as páginas principais.',
        priority: 'high',
        category: 'seo',
        estimated_impact: 18
      });
    }

    if (seoScore < 70) {
      tasks.push({
        title: 'Melhorar Estrutura de Headings',
        description: 'Organize o conteúdo com hierarquia clara de H1, H2, H3 incluindo palavras-chave relevantes.',
        priority: 'medium',
        category: 'seo',
        estimated_impact: 8
      });

      tasks.push({
        title: 'Otimizar Velocidade de Carregamento',
        description: 'Comprima imagens, minifique CSS/JS e implemente lazy loading para melhorar Core Web Vitals.',
        priority: 'high',
        category: 'performance',
        estimated_impact: 15
      });
    }

    tasks.push({
      title: 'Adicionar Alt Text em Imagens',
      description: 'Inclua descrições alt descritivas e ricas em palavras-chave em todas as imagens.',
      priority: 'low',
      category: 'seo',
      estimated_impact: 5
    });
  }

  // Technical improvements
  if (geoScore < 90 || seoScore < 90) {
    tasks.push({
      title: 'Implementar Dados Estruturados JSON-LD',
      description: 'Adicione markup JSON-LD para breadcrumbs, produtos, eventos e outras entidades relevantes.',
      priority: 'medium',
      category: 'technical',
      estimated_impact: 12
    });
  }

  // Content quality tasks
  const avgScore = (geoScore + seoScore) / 2;
  if (avgScore < 75) {
    tasks.push({
      title: 'Expandir Conteúdo de Valor',
      description: 'Crie conteúdo mais profundo e detalhado sobre tópicos-chave com no mínimo 1500 palavras.',
      priority: 'medium',
      category: 'content',
      estimated_impact: 10
    });
  }

  // Add recommendation-based tasks (limit to first 2)
  recommendations.slice(0, 2).forEach((rec, index) => {
    if (rec.title && rec.description) {
      tasks.push({
        title: rec.title,
        description: rec.description,
        priority: rec.priority || 'low',
        category: 'technical',
        estimated_impact: 5
      });
    }
  });

  return tasks;
}

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Buscando agendamentos pendentes...');

    // Buscar agendamentos que precisam rodar
    const now = new Date().toISOString();
    const { data: schedules, error: schedulesError } = await supabase
      .from('url_monitoring_schedules')
      .select('*')
      .eq('enabled', true)
      .lte('next_run', now);

    if (schedulesError) {
      throw schedulesError;
    }

    console.log(`Encontrados ${schedules?.length || 0} agendamentos pendentes`);

    const results = [];

    for (const schedule of schedules || []) {
      try {
        console.log(`Processando agendamento ${schedule.id} para URL: ${schedule.url}`);

        // Buscar última análise para comparar
        const { data: lastAnalysis } = await supabase
          .from('url_analysis_history')
          .select('geo_score, seo_score, overall_score')
          .eq('user_id', schedule.user_id)
          .eq('url', schedule.url)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Fazer análise via função analyze-url
        let pageContent = '';
        try {
          const pageResponse = await fetch(schedule.url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GEO-Analyzer/1.0)' },
          });
          
          if (pageResponse.ok) {
            const html = await pageResponse.text();
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

        const prompt = `Você é um especialista em GEO (Generative Engine Optimization) e SEO. Analise a seguinte URL e seu conteúdo:

URL: ${schedule.url}
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
}`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite', // Modelo mais rápido
            messages: [
              { role: 'system', content: 'Você é um especialista em GEO e SEO. Responda sempre em português do Brasil e em formato JSON válido.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.5, // Respostas mais diretas
            max_tokens: 2000, // Limitar para análises programadas
          }),
        });

        if (!aiResponse.ok) {
          throw new Error(`Erro na API de IA: ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const analysisText = aiData.choices[0].message.content;

        let analysis;
        try {
          const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || 
                           analysisText.match(/```\n([\s\S]*?)\n```/) ||
                           [null, analysisText];
          analysis = JSON.parse(jsonMatch[1]);
        } catch (error) {
          console.error('Erro ao parsear resposta da IA:', error);
          analysis = {
            score: 50,
            summary: 'Análise em processamento',
            geoOptimization: { score: 50, insights: [] },
            seoOptimization: { score: 50, insights: [] }
          };
        }

        // Try to find brand_id based on URL domain
        let brandId = null;
        try {
          const urlObj = new URL(schedule.url);
          const domain = urlObj.hostname.replace('www.', '');
          
          const { data: brand } = await supabase
            .from('brands')
            .select('id')
            .eq('user_id', schedule.user_id)
            .ilike('domain', `%${domain}%`)
            .limit(1)
            .maybeSingle();
          
          if (brand) {
            brandId = brand.id;
            console.log(`Brand encontrada para URL ${schedule.url}: ${brandId}`);
          }
        } catch (error) {
          console.log('Não foi possível determinar brand_id para URL:', schedule.url);
        }

        // Salvar no histórico
        const { error: historyError } = await supabase
          .from('url_analysis_history')
          .insert({
            user_id: schedule.user_id,
            brand_id: brandId,
            url: schedule.url,
            overall_score: analysis.score,
            geo_score: analysis.geoOptimization.score,
            seo_score: analysis.seoOptimization.score,
            summary: analysis.summary,
            analysis_data: analysis,
          });

        if (historyError) {
          console.error('Erro ao salvar histórico:', historyError);
        }

        // Verificar se houve queda significativa e criar alerta
        if (lastAnalysis && schedule.alert_on_drop) {
          const scoreDrop = lastAnalysis.overall_score - analysis.score;
          
          if (scoreDrop >= schedule.alert_threshold) {
            await supabase.from('alerts_history').insert({
              user_id: schedule.user_id,
              alert_type: 'score_decrease',
              title: 'Queda Significativa Detectada',
              message: `O score de ${schedule.url} caiu ${scoreDrop.toFixed(1)} pontos (de ${lastAnalysis.overall_score} para ${analysis.score})`,
              priority: scoreDrop >= 20 ? 'high' : 'medium',
              metadata: {
                url: schedule.url,
                previous_score: lastAnalysis.overall_score,
                current_score: analysis.score,
                drop: scoreDrop,
              },
            });
          }
        }

        // Atualizar próxima execução
        const nextRun = new Date();
        if (schedule.frequency === 'daily') {
          nextRun.setDate(nextRun.getDate() + 1);
        } else {
          nextRun.setDate(nextRun.getDate() + 7);
        }

        await supabase
          .from('url_monitoring_schedules')
          .update({
            last_run: now,
            next_run: nextRun.toISOString(),
          })
          .eq('id', schedule.id);

        results.push({
          schedule_id: schedule.id,
          url: schedule.url,
          success: true,
          score: analysis.score,
        });

      } catch (error: any) {
        console.error(`Erro ao processar agendamento ${schedule.id}:`, error);
        results.push({
          schedule_id: schedule.id,
          url: schedule.url,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

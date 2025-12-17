import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, reportType = "individual", brandIds, period = "30days" } = await req.json();

    if (!userId) {
      throw new Error("userId is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate date range
    const daysAgo = period === "7days" ? 7 : period === "30days" ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Fetch brands data - filter by brandIds if provided
    const brandsQuery = supabase
      .from("brands")
      .select("*")
      .eq("user_id", userId);
    
    if (brandIds && brandIds.length > 0) {
      brandsQuery.in("id", brandIds);
    }
    
    const { data: brands } = await brandsQuery;

    if (!brands || brands.length === 0) {
      throw new Error("No brands found");
    }

    const selectedBrandIds = brands.map(b => b.id);

    const { data: scores } = await supabase
      .from("geo_scores")
      .select("*")
      .in("brand_id", selectedBrandIds)
      .gte("computed_at", startDate.toISOString())
      .order("computed_at", { ascending: false });

    const { data: mentions } = await supabase
      .from("mentions_llm")
      .select("*")
      .in("brand_id", selectedBrandIds)
      .gte("collected_at", startDate.toISOString());

    const { data: alerts } = await supabase
      .from("alerts_history")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString());

    // Prepare comprehensive data summary
    const isComparative = brands.length > 1;
    const brandName = brands.length === 1 ? brands[0].name : null;
    
    // Get the most recent score for each brand (not average)
    const getLatestScore = (brandId: string) => {
      const brandScores = scores?.filter(s => s.brand_id === brandId);
      if (!brandScores || brandScores.length === 0) return 0;
      
      // Sort by computed_at descending and get the first (most recent)
      const sortedScores = [...brandScores].sort((a, b) => 
        new Date(b.computed_at).getTime() - new Date(a.computed_at).getTime()
      );
      
      return Number(sortedScores[0].score);
    };

    const reportData = {
      reportType,
      isComparative,
      brandName: brandName || "múltiplas marcas",
      period,
      brands: brands.map(b => ({
        name: b.name,
        domain: b.domain,
        latestScore: getLatestScore(b.id), // Score mais recente (usado em KPIs)
        mentions: mentions?.filter(m => m.brand_id === b.id && m.mentioned).length || 0,
        totalQueries: mentions?.filter(m => m.brand_id === b.id).length || 0,
      })),
      overallStats: {
        totalScores: scores?.length || 0,
        totalMentions: mentions?.filter(m => m.mentioned).length || 0,
        totalAlerts: alerts?.length || 0,
      },
    };

    // Prepare data summary for AI
    const dataSummary = {
      brandInfo: reportData.brands
        .map(
          (b) =>
            `- ${b.name} (${b.domain}): Score atual ${b.latestScore.toFixed(1)}/100, ${b.mentions} menções em ${b.totalQueries} consultas`
        )
        .join("\n"),
      scoresInfo: `Total de ${reportData.overallStats.totalScores} scores coletados no período`,
      mentionsInfo: `${reportData.overallStats.totalMentions} menções registradas`,
      alertsInfo: `${reportData.overallStats.totalAlerts} alertas identificados`,
    };

    // Generate report with AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // Modelo padrão e eficiente
        messages: [
          {
            role: "system",
            content: `Você é um analista GEO (Generative Engine Optimization) e SEO especializado. 
Gere relatórios em português brasileiro com insights ACIONÁVEIS e MENSURÁVEIS.

⚠️ REGRA CRÍTICA DE TÍTULO:
- NUNCA use as palavras "lead", "leads" ou "geração de leads" em NENHUM título
- FOCO EXCLUSIVO em: visibilidade, performance, reconhecimento, presença online, autoridade

⚠️ REGRA CRÍTICA DE SCORES:
- Use SEMPRE o "Score Atual" (score mais recente) nas métricas principais
- O "Score Atual" representa o desempenho MAIS RECENTE da marca (ex: 82.2/100)
- NÃO calcule médias históricas - use apenas o valor mais recente para consistência com KPIs

${isComparative ? `
TIPO DE RELATÓRIO: COMPARATIVO ESTRATÉGICO
Este é um RELATÓRIO COMPARATIVO ENTRE MÚLTIPLAS MARCAS focado em:
- Análise de posicionamento competitivo entre as marcas
- Benchmarking quantitativo de performance GEO
- Identificação de gaps e oportunidades competitivas
- Ranking de líderes vs seguidores em cada métrica
- Recomendações táticas para cada marca superar concorrentes

EXEMPLOS DE TÍTULOS CORRETOS:
✅ "Análise Comparativa de Visibilidade em LLMs"
✅ "Benchmark de Performance GEO entre Marcas"
✅ "Relatório Comparativo de Autoridade Online"

EXEMPLOS PROIBIDOS:
❌ Qualquer título contendo "lead", "leads" ou "geração"
` : `
TIPO DE RELATÓRIO: INDIVIDUAL DE PERFORMANCE
Este é um RELATÓRIO INDIVIDUAL DE PERFORMANCE focado em:
- Análise aprofundada da performance histórica da marca
- Evolução de métricas GEO e SEO ao longo do tempo
- Identificação de pontos fortes e áreas de melhoria
- Oportunidades específicas de crescimento baseadas em dados
- Plano de ação estratégico personalizado

EXEMPLOS DE TÍTULOS CORRETOS:
✅ "Análise de Visibilidade em LLMs - [Marca]"
✅ "Relatório de Performance GEO - [Marca]"
✅ "Diagnóstico de Autoridade Online - [Marca]"

EXEMPLOS PROIBIDOS:
❌ Qualquer título contendo "lead", "leads" ou "geração"
`}

FORMATO JSON OBRIGATÓRIO:
1. Resposta DEVE ser JSON válido e completo
2. Use apenas aspas duplas
3. Complete TODOS os arrays - NUNCA truncar
4. Escape caracteres especiais
5. Feche todos os colchetes e chaves

O relatório deve conter:
- Insights estratégicos para crescimento
- Recomendações específicas e mensuráveis
- Análise competitiva e benchmarking
- Próximos passos com níveis de prioridade

Foco em insights que possam ser implementados imediatamente com valor mensurável.`
          },
          {
            role: "user",
            content: `Generate a ${isComparative ? 'COMPARATIVE' : 'INDIVIDUAL'} GEO report in Brazilian Portuguese based on this data:

**Report Type:** ${isComparative ? 'Comparativo entre múltiplas marcas' : 'Individual'} (${reportType})
**Period:** ${period}
**Number of Brands:** ${brands.length}

**Brand Summary:**
${dataSummary.brandInfo}

**GEO Scores:**
${dataSummary.scoresInfo}

**LLM Mentions Analysis:**
${dataSummary.mentionsInfo}

**Alerts & Issues:**
${dataSummary.alertsInfo}

${isComparative ? `
**IMPORTANTE:** Este é um relatório COMPARATIVO. Você DEVE:
1. Comparar as marcas entre si em cada métrica
2. Identificar o líder em cada categoria
3. Apontar gaps competitivos específicos
4. Fornecer recomendações para cada marca superar as concorrentes
5. Criar um ranking geral de performance
` : `
**IMPORTANTE:** Este é um relatório INDIVIDUAL focado em ${brandName}. Você DEVE:
1. Focar profundamente na performance desta marca específica
2. Analisar tendências históricas
3. Identificar oportunidades únicas de crescimento
4. Fornecer um plano de ação detalhado e personalizado
`}

**CRITICAL: Return ONLY a valid, complete JSON object with this exact structure (ensure ALL arrays and objects are properly closed):**

⚠️ LEMBRE-SE: O título NÃO PODE conter as palavras "lead", "leads" ou "geração de leads"!

{
  "title": "${isComparative ? 'Análise Comparativa de Visibilidade em LLMs' : 'Análise de Visibilidade em LLMs'} - [Nome da(s) marca(s)] (máx. 100 caracteres)",
  "reportType": "${isComparative ? 'comparative' : 'individual'}",
  "executiveSummary": "Resumo executivo detalhado em 3-5 parágrafos (250-400 palavras) destacando principais achados, tendências e oportunidades",
  "period": {
    "start": "${period === "7days" ? "últimos 7 dias" : period === "30days" ? "últimos 30 dias" : "últimos 90 dias"}",
    "end": "hoje"
  },
  "keyMetrics": {
    "totalMentions": número_total_de_mencoes,
    "currentScore": score_atual_0_a_100,
    "topPerformingBrand": "nome_da_marca",
    "growthRate": "percentual_crescimento_com_sinal"
  },
  "insights": [
    {
      "title": "Título do Insight",
      "category": "performance|opportunity|risk|trend",
      "description": "Descrição detalhada do insight (2-3 frases)",
      "impact": "high|medium|low",
      "actionable": true|false
    }
  ],
  "recommendations": [
    {
      "title": "Recomendação Específica",
      "description": "Descrição detalhada da ação recomendada",
      "priority": "high|medium|low",
      "estimatedImpact": "Impacto esperado em 1-2 frases",
      "timeframe": "Prazo estimado para implementação",
      "category": "content|technical|strategic|competitive"
    }
  ],
  ${isComparative ? `"brandComparison": [
    {
      "brandName": "Nome da Marca",
      "rank": 1,
      "score": score_numérico,
      "strengths": ["força específica 1", "força 2"],
      "weaknesses": ["fraqueza 1", "fraqueza 2"],
      "recommendation": "Recomendação específica para esta marca"
    }
  ],` : ''}
  "competitiveAnalysis": {
    "positioning": "${isComparative ? 'Análise comparativa de posicionamento entre as marcas' : 'Análise de posicionamento competitivo'}",
    "strengths": ["força 1", "força 2", "força 3"],
    "weaknesses": ["fraqueza 1", "fraqueza 2"],
    "opportunities": ["oportunidade 1", "oportunidade 2", "oportunidade 3"]
  },
  "trends": [
    {
      "trend": "Nome da Tendência",
      "direction": "up|down|stable",
      "significance": "Alta|Média|Baixa",
      "description": "Descrição da tendência e seu impacto"
    }
  ],
  "nextSteps": [
    {
      "action": "Ação específica a ser tomada",
      "owner": "Responsável sugerido",
      "deadline": "Prazo sugerido",
      "priority": 1-5
    }
  ]
}

IMPORTANT: Complete ALL arrays properly. Do not truncate. Ensure the JSON is valid and parseable.

Provide the most comprehensive and detailed analysis possible.`,
          },
        ],
        max_tokens: 8000, // Otimizado para custos
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`[REPORT-GENERATOR] AI API error (${aiResponse.status}):`, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error("Limite de requisições excedido. Por favor, tente novamente em alguns instantes.");
      } else if (aiResponse.status === 402) {
        throw new Error("Créditos insuficientes. Por favor, adicione créditos à sua workspace.");
      }
      
      throw new Error(`Falha ao gerar relatório: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;

    // Função para limpar e validar JSON
    const cleanJsonString = (str: string): string => {
      // Remover markdown code blocks
      let cleaned = str.trim();
      if (cleaned.includes('```json')) {
        cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      }
      
      // Encontrar o primeiro { e o último } para garantir JSON válido
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
      
      return cleaned;
    };

    let parsedReport;
    try {
      console.log(`[REPORT-GENERATOR] Raw AI response length: ${content.length} chars`);
      console.log(`[REPORT-GENERATOR] First 300 chars: ${content.substring(0, 300)}`);
      
      const cleanedJson = cleanJsonString(content);
      console.log(`[REPORT-GENERATOR] Attempting to parse JSON (length: ${cleanedJson.length})`);
      console.log(`[REPORT-GENERATOR] After cleaning (first 200 chars): ${cleanedJson.substring(0, 200)}`);
      
      parsedReport = JSON.parse(cleanedJson);
      console.log(`[REPORT-GENERATOR] ✅ Parse successful!`);
      
      // Validar estrutura obrigatória
      if (!parsedReport.title || !parsedReport.executiveSummary) {
        throw new Error('Missing required fields: title or executiveSummary');
      }
      
      // Validar comprimento do relatório
      const reportText = JSON.stringify(parsedReport);
      const charCount = reportText.length;
      
      console.log(`[REPORT-GENERATOR] Report character count: ${charCount}`);
      
      if (charCount < 5000) {
        console.warn(`[REPORT-GENERATOR] ⚠️ Report below minimum length (${charCount} < 5000 chars)`);
      } else if (charCount >= 10000 && charCount <= 14000) {
        console.log(`[REPORT-GENERATOR] ✅ Report meets ideal length standards (${charCount} chars)`);
      }
      
    } catch (e) {
      console.error("[REPORT-GENERATOR] ❌ Failed to parse AI response:", e);
      console.error("[REPORT-GENERATOR] Content that failed:", content.substring(0, 500));
      
      // Criar relatório de fallback estruturado
      parsedReport = {
        title: `Relatório GEO - ${reportData.brandName}`,
        executiveSummary: "Houve um erro ao processar o relatório completo. Por favor, tente gerar novamente.",
        sections: [{
          title: "Erro de Processamento",
          content: "Não foi possível processar os dados do relatório. Tente gerar novamente em alguns instantes.",
          metrics: [],
          insights: []
        }],
        competitiveAnalysis: {
          positioning: "Indisponível",
          opportunities: [],
          threats: []
        },
        recommendations: [],
        actionPlan: {
          immediate: [],
          shortTerm: [],
          longTerm: []
        },
        kpis: [],
        conclusion: "Por favor, tente gerar o relatório novamente."
      };
    }

    // Save report with brand info
    const finalBrandName = brands.length === 1 ? brands[0].name : null;
    let title = parsedReport.title || `Relatório GEO de Desempenho - ${new Date().toLocaleDateString("pt-BR")}`;
    
    // Always ensure brand name is in title
    if (finalBrandName && !title.includes(finalBrandName)) {
      title = `${finalBrandName} - ${title}`;
    }
    
    // Delete ALL old report insights for this user to avoid duplicates
    const brandId = brands.length === 1 ? brands[0].id : null;
    
    console.log(`[REPORT-GENERATOR] Deletando relatórios antigos para user_id: ${userId}`);
    const { error: deleteError } = await supabase
      .from("ai_insights")
      .delete()
      .eq("user_id", userId)
      .eq("type", "report");
    
    if (deleteError) {
      console.error("[REPORT-GENERATOR] Erro ao deletar relatórios antigos:", deleteError);
    }
    
    console.log(`[REPORT-GENERATOR] Inserindo novo relatório com brand_id: ${brandId}`);
    const { data: insertedReport, error: insertError } = await supabase
      .from("ai_insights")
      .insert({
        user_id: userId,
        brand_id: brandId,
        type: "report",
        title,
        content: parsedReport,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[REPORT-GENERATOR] ❌ Erro ao salvar relatório:", insertError);
      throw new Error(`Failed to save report: ${insertError.message}`);
    }
    
    console.log(`[REPORT-GENERATOR] ✅ Relatório salvo com sucesso, ID: ${insertedReport?.id}`);

    return new Response(JSON.stringify(parsedReport), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[REPORT-GENERATOR] ❌ Error:", error);
    
    const errorMessage = error.message || "Erro desconhecido ao gerar relatório";
    const statusCode = error.message?.includes("429") ? 429 
                     : error.message?.includes("402") ? 402 
                     : 500;
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

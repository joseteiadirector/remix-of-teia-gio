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
    const { userId, brandId } = await req.json();

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

    // Get historical data
    const brandsQuery = brandId
      ? supabase.from("brands").select("*").eq("id", brandId).eq("user_id", userId)
      : supabase.from("brands").select("*").eq("user_id", userId);

    const { data: brands, error: brandsError } = await brandsQuery;
    if (brandsError) throw brandsError;

    if (!brands || brands.length === 0) {
      throw new Error("No brands found");
    }

    const brandIds = brands.map(b => b.id);

    // Get recent GEO scores
    const { data: scores } = await supabase
      .from("geo_scores")
      .select("*")
      .in("brand_id", brandIds)
      .order("computed_at", { ascending: false })
      .limit(30);

    // Get recent GEO mentions (LLMs)
    const { data: mentions } = await supabase
      .from("mentions_llm")
      .select("*")
      .in("brand_id", brandIds)
      .order("collected_at", { ascending: false })
      .limit(50);

    // Get recent SEO signals (Google Analytics, Search Console)
    const { data: seoSignals } = await supabase
      .from("signals")
      .select("*")
      .in("brand_id", brandIds)
      .eq("kind", "seo")
      .order("collected_at", { ascending: false })
      .limit(50);

    // Prepare data summary for AI - SEPARATED BY SOURCE
    const brandName = brandId ? brands.find(b => b.id === brandId)?.name : 
                      brands.length === 1 ? brands[0].name : null;
    
    const dataSummary = {
      brandName: brandName || "múltiplas marcas",
      brands: brands.map(b => ({ name: b.name, domain: b.domain })),
      
      // GEO DATA (LLM Mentions)
      geoData: {
        recentScores: scores?.map(s => ({
          score: s.score,
          breakdown: s.breakdown,
          date: s.computed_at,
        })) || [],
        mentionsCount: mentions?.filter(m => m.mentioned).length || 0,
        totalQueries: mentions?.length || 0,
        providers: [...new Set(mentions?.map(m => m.provider) || [])],
        avgConfidence: (mentions && mentions.filter(m => m.mentioned).length > 0)
          ? mentions.filter(m => m.mentioned).reduce((sum, m) => sum + Number(m.confidence), 0) / mentions.filter(m => m.mentioned).length
          : 0
      },
      
      // SEO DATA (Google Analytics, Search Console)
      seoData: {
        ga4Metrics: seoSignals?.filter(s => s.metric?.includes('ga4_')) || [],
        gscMetrics: seoSignals?.filter(s => s.metric?.includes('gsc_')) || [],
        totalSignals: seoSignals?.length || 0
      }
    };

    // Call AI for predictions
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a HYBRID analytics expert combining SEO + GEO data. Analyze both data sources and provide predictions and insights in Portuguese (Brazil).

CRÍTICO - CAMPOS OBRIGATÓRIOS NO PDF:
- TODAS as "predictions" DEVEM ter "hybridAnalysis" preenchido (40-60 palavras)
- TODAS as "predictions" DEVEM ter "opportunities" com pelo menos 2 itens
- TODAS as "suggestions" DEVEM ter "expectedImpact" preenchido
- TODAS as "suggestions" DEVEM ter "implementation.steps" com pelo menos 2 passos

IMPORTANTE: Você DEVE mencionar o nome da marca "${dataSummary.brandName}" no início de TODAS as descrições e análises.

ESTRUTURA HÍBRIDA (SEO + GEO):
- SEMPRE separe claramente análises SEO e GEO
- Mostre como SEO e GEO se complementam
- Identifique padrões e correlações entre ambas as fontes

REQUISITOS DE CONTEÚDO CRÍTICOS:
- Análise CONCISA: máximo 2.500 caracteres no TOTAL
- Descrições: 50-80 palavras cada
- CRITICAL: Return VALID and COMPLETE JSON only - no truncation
- JSON MUST be properly closed with all braces matched
- Generate 2 predictions and 2 suggestions ONLY (not 3)
            
Return a COMPLETE and VALID JSON object with this exact structure:
{
  "predictions": [
    {
      "title": "string (deve incluir nome da marca)",
      "description": "string (50-80 palavras - começar mencionando a marca)",
      "confidence": "high" | "medium" | "low",
      "timeframe": "string",
      "seoInsights": {
        "finding": "string (análise específica dos dados SEO)",
        "metrics": ["string (1-2 métricas GA4/GSC relevantes)"]
      },
      "geoInsights": {
        "finding": "string (análise específica dos dados GEO)",
        "metrics": ["string (1-2 menções/confiança em LLMs)"]
      },
      "hybridAnalysis": "string OBRIGATÓRIO (como SEO e GEO se complementam - 40-60 palavras - NUNCA DEIXAR VAZIO)",
      "dataPoints": ["string (máximo 2 pontos concretos combinando SEO+GEO)"],
      "risks": ["string (máximo 1-2 riscos)"],
      "opportunities": ["string OBRIGATÓRIO - mínimo 2 itens (oportunidades concretas)"]
    }
  ],
  "suggestions": [
    {
      "title": "string (deve incluir nome da marca)",
      "description": "string (60-80 palavras - começar mencionando a marca)",
      "priority": "high" | "medium" | "low",
      "expectedImpact": "string OBRIGATÓRIO (impacto quantificado - ex: Aumento de 15-20% no tráfego - NUNCA DEIXAR VAZIO)",
      "seoFocus": {
        "actions": ["string (1-2 ações específicas para melhorar SEO)"],
        "targetMetrics": ["string (1-2 métricas SEO a impactar)"]
      },
      "geoFocus": {
        "actions": ["string (1-2 ações específicas para melhorar GEO)"],
        "targetMetrics": ["string (1-2 métricas GEO a impactar)"]
      },
      "implementation": {
        "steps": ["string OBRIGATÓRIO - mínimo 2 passos (ações específicas numeradas combinando SEO+GEO - NUNCA DEIXAR VAZIO)"],
        "timeline": "string",
        "resources": "string",
        "kpis": ["string (máximo 2 métricas híbridas SEO+GEO)"]
      },
      "rationale": "string (justificativa com dados SEO+GEO - 40-60 palavras)"
    }
  ],
  "marketContext": {
    "currentPosition": "string (60-80 palavras)",
    "competitiveInsights": "string (40-60 palavras)",
    "industryTrends": ["string (máximo 2 tendências)"]
  },
  "trends": {
    "overall": "positive" | "negative" | "stable",
    "keyInsights": ["string (máximo 2 insights - 30-50 palavras cada)"],
    "dataAnalysis": "string (80-100 palavras)"
  },
  "actionPlan": {
    "immediate": ["string (máximo 2 ações para 7 dias)"],
    "shortTerm": ["string (máximo 2 ações para 30 dias)"],
    "longTerm": ["string (máximo 1 estratégia 90+ dias)"]
  }
}

CRITICAL REQUIREMENTS:
- Generate EXACTLY 2 predictions and EXACTLY 2 suggestions
- NUNCA deixe "hybridAnalysis" vazio nas predictions
- NUNCA deixe "opportunities" vazio nas predictions (mínimo 2 itens)
- NUNCA deixe "expectedImpact" vazio nas suggestions
- NUNCA deixe "implementation.steps" vazio nas suggestions (mínimo 2 passos)
- Ensure JSON is complete and valid - check closing braces
- Keep descriptions concise: 50-80 words per section
- Total output: 2.000-2.500 characters maximum
- Focus on actionable insights
- COMPLETE the JSON before reaching token limit`,
          },
          {
            role: "user",
            content: `Analyze this HYBRID data (SEO + GEO) for the brand "${dataSummary.brandName}" and provide comprehensive predictions:

DADOS SEO (Google Analytics + Search Console):
${JSON.stringify(dataSummary.seoData, null, 2)}

DADOS GEO (Menções em LLMs):
${JSON.stringify(dataSummary.geoData, null, 2)}

CRITICAL REQUIREMENTS:
- Analysis MUST be between 2,000-2,500 characters (keep it concise!)
- Always mention brand name "${dataSummary.brandName}" in analyses
- SEPARATE clearly SEO insights from GEO insights
- Show HOW SEO and GEO data complement each other
- Provide EXACTLY 2 detailed predictions with concrete data
- Include EXACTLY 2 specific, actionable suggestions
- Add market context combining both perspectives
- Use professional language
- ENSURE JSON IS COMPLETE AND VALID - all braces must be closed
- Keep each section concise: 50-80 words maximum
- FINISH the complete JSON structure before hitting token limit

CAMPOS OBRIGATÓRIOS PARA O PDF EXECUTIVO:
- predictions[].hybridAnalysis: NUNCA VAZIO (40-60 palavras explicando SEO+GEO)
- predictions[].opportunities: NUNCA VAZIO (mínimo 2 oportunidades concretas)
- suggestions[].expectedImpact: NUNCA VAZIO (quantificar impacto com percentuais)
- suggestions[].implementation.steps: NUNCA VAZIO (mínimo 2 passos de ação)

Provide HYBRID analysis in Portuguese (Brazil).`,
          },
        ],
        temperature: 0.7,
        max_tokens: 16000, // Aumentado para garantir JSON completo
      }),
    });

    if (!aiResponse.ok) {
      throw new Error("Failed to get AI predictions");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;

    // Parse JSON from AI response
    let parsedContent;
    try {
      let cleanContent = content.trim();
      
      console.log(`[AI-PREDICTIONS] Raw AI response length: ${content.length} chars`);
      console.log(`[AI-PREDICTIONS] First 300 chars: ${content.substring(0, 300)}`);
      
      // Remove ALL markdown code blocks
      if (cleanContent.includes('```')) {
        // Match any code block with optional language specifier
        cleanContent = cleanContent.replace(/```[a-z]*\n?/gi, '');
        console.log(`[AI-PREDICTIONS] After removing markdown blocks (first 200 chars): ${cleanContent.substring(0, 200)}`);
      }
      
      // Find the actual JSON object
      const firstBrace = cleanContent.indexOf('{');
      const lastBrace = cleanContent.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('No JSON object found in response');
      }
      
      cleanContent = cleanContent.substring(firstBrace, lastBrace + 1).trim();
      
      console.log(`[AI-PREDICTIONS] Attempting to parse JSON (length: ${cleanContent.length})`);
      
      parsedContent = JSON.parse(cleanContent);
      
      // Validar estrutura
      if (!parsedContent.predictions || !Array.isArray(parsedContent.predictions)) {
        console.warn(`[AI-PREDICTIONS] Invalid predictions array`);
        parsedContent.predictions = [];
      }
      
      if (!parsedContent.suggestions || !Array.isArray(parsedContent.suggestions)) {
        console.warn(`[AI-PREDICTIONS] Invalid suggestions array`);
        parsedContent.suggestions = [];
      }
      
      // Validar comprimento da análise
      const analysisText = JSON.stringify(parsedContent);
      const charCount = analysisText.length;
      
      console.log(`[AI-PREDICTIONS] ✅ Parse successful!`);
      console.log(`[AI-PREDICTIONS] Analysis character count: ${charCount}`);
      console.log(`[AI-PREDICTIONS] Predictions count: ${parsedContent.predictions?.length || 0}`);
      console.log(`[AI-PREDICTIONS] Suggestions count: ${parsedContent.suggestions?.length || 0}`);
      
      // ✅ VALIDAÇÃO CRÍTICA: Garantir que campos obrigatórios do PDF estejam preenchidos
      parsedContent.predictions?.forEach((pred: any, idx: number) => {
        if (!pred.hybridAnalysis || pred.hybridAnalysis.trim() === "") {
          console.warn(`[AI-PREDICTIONS] ⚠️ Prediction ${idx + 1} sem hybridAnalysis - gerando fallback`);
          pred.hybridAnalysis = `A análise híbrida combina dados de SEO (posicionamento em buscadores) e GEO (visibilidade em IAs) para ${dataSummary.brandName}, mostrando como a marca está sendo percebida tanto em mecanismos tradicionais quanto em sistemas de IA generativa.`;
        }
        if (!pred.opportunities || !Array.isArray(pred.opportunities) || pred.opportunities.length < 2) {
          console.warn(`[AI-PREDICTIONS] ⚠️ Prediction ${idx + 1} sem opportunities - gerando fallback`);
          pred.opportunities = [
            "Expandir presença digital para aumentar visibilidade",
            "Otimizar conteúdo para mecanismos de IA generativa"
          ];
        }
      });
      
      parsedContent.suggestions?.forEach((sugg: any, idx: number) => {
        if (!sugg.expectedImpact || sugg.expectedImpact.trim() === "") {
          console.warn(`[AI-PREDICTIONS] ⚠️ Suggestion ${idx + 1} sem expectedImpact - gerando fallback`);
          sugg.expectedImpact = "Aumento estimado de 10-15% na visibilidade em 3-6 meses.";
        }
        if (!sugg.implementation?.steps || !Array.isArray(sugg.implementation.steps) || sugg.implementation.steps.length < 2) {
          console.warn(`[AI-PREDICTIONS] ⚠️ Suggestion ${idx + 1} sem implementation.steps - gerando fallback`);
          if (!sugg.implementation) sugg.implementation = {};
          sugg.implementation.steps = [
            "Auditar conteúdo existente e identificar oportunidades de otimização",
            "Implementar melhorias técnicas e de conteúdo de acordo com as recomendações"
          ];
        }
      });
      
      if (charCount < 2000) {
        console.warn(`[AI-PREDICTIONS] Analysis below target length (${charCount} < 2000 chars)`);
      } else if (charCount >= 2000 && charCount <= 3000) {
        console.log(`[AI-PREDICTIONS] ✅ Analysis meets length standards (${charCount} chars)`);
      }
      
    } catch (e) {
      const error = e as Error;
      console.error("[AI-PREDICTIONS] ❌ Failed to parse AI response:", error);
      console.error("[AI-PREDICTIONS] Error details:", error.message);
      console.error("[AI-PREDICTIONS] Raw content sample (first 1000 chars):", content.substring(0, 1000));
      
      // Em vez de quebrar a plataforma com 500, fazemos fallback seguro
      parsedContent = {
        predictions: [],
        suggestions: [],
        _rawTextSample: content.substring(0, 1000),
        _parseError: error.message,
      };
      console.warn("[AI-PREDICTIONS] Using safe fallback content due to JSON parse error");
    }
    
    // Validar que temos conteúdo mínimo antes de salvar (não lançar erro se vier vazio)
    if (!parsedContent.predictions || parsedContent.predictions.length === 0) {
      console.warn("[AI-PREDICTIONS] IA não gerou predições válidas. Salvando insight vazio para manter integridade.");
    }

    // Save insights to database
    const finalBrandName = brandId ? brands.find(b => b.id === brandId)?.name : 
                           brands.length === 1 ? brands[0].name : null;
    
    const predictionTitle = finalBrandName 
      ? `${finalBrandName} - Análise Preditiva Completa`
      : `Análise Preditiva Completa - ${new Date().toLocaleDateString("pt-BR")}`;
    
    // Delete ALL old insights (prediction and suggestion) for this brand/user to avoid duplicates
    const deleteConditions = brandId 
      ? supabase.from("ai_insights")
          .delete()
          .eq("user_id", userId)
          .eq("brand_id", brandId)
          .in("type", ["prediction", "suggestion"])
      : supabase.from("ai_insights")
          .delete()
          .eq("user_id", userId)
          .is("brand_id", null)
          .in("type", ["prediction", "suggestion"]);
    
    await deleteConditions;
    
    // Save single consolidated insight with both predictions and suggestions
    await supabase.from("ai_insights").insert({
      user_id: userId,
      brand_id: brandId,
      type: "prediction",
      title: predictionTitle,
      content: parsedContent,
    });

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in ai-predictions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

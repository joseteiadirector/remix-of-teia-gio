import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HallucinationAnalysis {
  llm: string;
  response: string;
  hallucinationRisk: number;
  divergenceScore: number;
  factualInconsistencies: string[];
  consensusAlignment: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { executionId, brandId } = await req.json();

    console.log('Detecting hallucinations for execution:', executionId);

    // Buscar resultados da execução
    const { data: execution, error: execError } = await supabase
      .from('nucleus_executions')
      .select('results, llms_used')
      .eq('id', executionId)
      .single();

    if (execError) throw execError;

    const results = execution.results as any;
    const responses = Object.entries(results).map(([llm, data]: [string, any]) => ({
      llm,
      response: data.answer || '',
      confidence: data.confidence || 0
    }));

    // Análise de consenso
    const consensusAnalysis = analyzeConsensus(responses);
    
    // Detecção de divergências
    const hallucinationScores: HallucinationAnalysis[] = responses.map(({ llm, response, confidence }) => {
      const divergence = calculateDivergence(response, responses.filter(r => r.llm !== llm));
      const factualChecks = checkFactualConsistency(response, responses);
      const consensusAlign = consensusAnalysis[llm] || 0;
      
      // Score de risco de alucinação (0-100)
      const hallucinationRisk = calculateHallucinationRisk(
        divergence,
        confidence,
        consensusAlign,
        factualChecks.length
      );

      return {
        llm,
        response,
        hallucinationRisk,
        divergenceScore: divergence,
        factualInconsistencies: factualChecks,
        consensusAlignment: consensusAlign
      };
    });

    // Ordenar por risco
    hallucinationScores.sort((a, b) => b.hallucinationRisk - a.hallucinationRisk);

    // Identificar alucinações críticas (risco > 70%)
    const criticalHallucinations = hallucinationScores.filter(h => h.hallucinationRisk > 70);

    // Salvar análise
    const { error: insertError } = await supabase
      .from('hallucination_detections')
      .insert({
        execution_id: executionId,
        brand_id: brandId,
        user_id: user.id,
        detection_results: {
          scores: hallucinationScores,
          critical: criticalHallucinations,
          consensus: consensusAnalysis,
          timestamp: new Date().toISOString()
        },
        critical_count: criticalHallucinations.length,
        avg_risk_score: hallucinationScores.reduce((sum, h) => sum + h.hallucinationRisk, 0) / hallucinationScores.length
      });

    if (insertError) console.error('Error saving hallucination detection:', insertError);

    return new Response(
      JSON.stringify({
        hallucinationScores,
        criticalHallucinations,
        consensusAnalysis,
        summary: {
          totalAnalyzed: responses.length,
          criticalCount: criticalHallucinations.length,
          avgRisk: hallucinationScores.reduce((sum, h) => sum + h.hallucinationRisk, 0) / hallucinationScores.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in detect-hallucinations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Calcula divergência entre uma resposta e as outras
function calculateDivergence(response: string, otherResponses: any[]): number {
  if (otherResponses.length === 0) return 0;

  const words = response.toLowerCase().split(/\s+/);
  const otherWords = otherResponses.flatMap(r => r.response.toLowerCase().split(/\s+/));
  
  const uniqueWords = words.filter(w => !otherWords.includes(w));
  const divergenceRatio = uniqueWords.length / words.length;
  
  return Math.min(divergenceRatio * 100, 100);
}

// Análise de consenso entre LLMs
function analyzeConsensus(responses: any[]): Record<string, number> {
  const consensus: Record<string, number> = {};
  
  responses.forEach(({ llm, response }) => {
    const words = response.toLowerCase().split(/\s+/);
    const otherResponses = responses.filter(r => r.llm !== llm);
    
    let matchCount = 0;
    words.forEach((word: string) => {
      if (otherResponses.some(r => r.response.toLowerCase().includes(word))) {
        matchCount++;
      }
    });
    
    consensus[llm] = (matchCount / words.length) * 100;
  });
  
  return consensus;
}

// Checa consistência factual
function checkFactualConsistency(response: string, allResponses: any[]): string[] {
  const inconsistencies: string[] = [];
  
  // Detectar números que divergem significativamente
  const numbers = response.match(/\d+/g) || [];
  numbers.forEach(num => {
    const otherNumbers = allResponses
      .filter(r => r.response !== response)
      .flatMap(r => r.response.match(/\d+/g) || []);
    
    const numValue = parseInt(num);
    const hasMatch = otherNumbers.some(on => Math.abs(parseInt(on) - numValue) / numValue < 0.1);
    
    if (!hasMatch && otherNumbers.length > 0) {
      inconsistencies.push(`Número divergente: ${num}`);
    }
  });
  
  // Detectar nomes próprios únicos
  const properNouns = response.match(/[A-Z][a-z]+/g) || [];
  properNouns.forEach(noun => {
    const mentioned = allResponses.filter(r => r.response !== response).some(r => r.response.includes(noun));
    if (!mentioned) {
      inconsistencies.push(`Nome próprio não confirmado: ${noun}`);
    }
  });
  
  return inconsistencies;
}

// Calcula score de risco de alucinação
function calculateHallucinationRisk(
  divergence: number,
  confidence: number,
  consensusAlign: number,
  inconsistencyCount: number
): number {
  // Alta divergência + alta confiança = suspeita de alucinação
  const divergenceFactor = divergence * 0.4;
  const confidenceFactor = (confidence > 80 ? 20 : 0); // Penaliza confiança muito alta em respostas divergentes
  const consensusFactor = (100 - consensusAlign) * 0.3;
  const inconsistencyFactor = Math.min(inconsistencyCount * 10, 30);
  
  return Math.min(divergenceFactor + confidenceFactor + consensusFactor + inconsistencyFactor, 100);
}

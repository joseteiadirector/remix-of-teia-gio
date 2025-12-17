import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { analyzeMentionWithAI } from "../_shared/llm-mention-analyzer.ts";
import { getAvailableProviders, generateContextualQueries } from "../_shared/llm-providers.ts";
import { apiCallWithRetry } from "../_shared/retry-helper.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MentionResult {
  provider: string;
  query: string;
  mentioned: boolean;
  confidence: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  context: 'relevant' | 'irrelevant' | 'partial';
  answer_excerpt: string;
  reasoning?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('🚀 Starting LLM mentions collection...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase configuration');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
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

    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('❌ Invalid JSON body:', e);
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { brandId, customQuery, selectedProviders } = body;

    // Comprehensive input validation
    if (!brandId || typeof brandId !== 'string') {
      console.error('❌ Invalid brandId:', brandId);
      return new Response(JSON.stringify({ error: 'brandId is required and must be a valid UUID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(brandId)) {
      return new Response(JSON.stringify({ error: 'Invalid brandId format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate customQuery length if provided
    if (customQuery !== undefined && customQuery !== null) {
      if (typeof customQuery !== 'string') {
        return new Response(JSON.stringify({ error: 'customQuery must be a string' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (customQuery.length > 500) {
        return new Response(JSON.stringify({ error: 'customQuery too long (max 500 characters)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Validate selectedProviders if provided
    if (selectedProviders !== undefined && selectedProviders !== null) {
      if (!Array.isArray(selectedProviders)) {
        return new Response(JSON.stringify({ error: 'selectedProviders must be an array' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (selectedProviders.length > 10) {
        return new Response(JSON.stringify({ error: 'Too many providers selected (max 10)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      for (const provider of selectedProviders) {
        if (typeof provider !== 'string' || provider.length > 50) {
          return new Response(JSON.stringify({ error: 'Invalid provider format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    console.log(`📊 Fetching brand details for ID: ${brandId}`);
    
    // Get brand details and verify ownership
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .eq('user_id', user.id)
      .single();

    if (brandError) {
      console.error('❌ Database error fetching brand:', brandError);
      return new Response(JSON.stringify({ error: 'Database error', details: brandError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!brand) {
      console.error(`❌ Brand not found or unauthorized: ${brandId}`);
      return new Response(JSON.stringify({ error: 'Brand not found or unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Brand found: ${brand.name} (${brand.domain})`);
    
    // Build brand context for queries
    const brandContext = brand.context || brand.description || '';
    if (brandContext) {
      console.log(`📝 Brand context: ${brandContext}`);
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableKey) {
      console.error('❌ LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY is required for AI analysis' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔑 API Keys status:', {
      openai: !!openaiKey,
      perplexity: !!perplexityKey,
      lovable: !!lovableKey
    });

    const results: MentionResult[] = [];
    const errors: Array<{ provider: string; query: string; error: string }> = [];
    
    // Generate targeted queries in Portuguese (contextualized)
    const industry = brand.domain.includes('claro') ? 'telecomunicações' : 
                     brand.domain.includes('tech') ? 'tecnologia' : 'tecnologia empresarial';
    
    console.log(`🏢 Industry detected: ${industry}`);
    
    // Use custom query if provided, otherwise generate contextual queries
    const selectedQueries = customQuery 
      ? [customQuery] 
      : generateContextualQueries(brand.name, brand.domain, industry, brandContext);
    console.log(`📝 ${customQuery ? 'Using custom query' : `Generated ${selectedQueries.length} contextual queries`}`);
    
    // Get available providers
    let availableProviders = getAvailableProviders({
      openai: openaiKey,
      lovable: lovableKey,
      perplexity: perplexityKey
    });

    // Filter providers if selectedProviders is provided
    if (selectedProviders && Array.isArray(selectedProviders) && selectedProviders.length > 0) {
      availableProviders = availableProviders.filter(p => 
        selectedProviders.includes(p.key)
      );
      console.log(`🎯 Filtered to selected providers: ${selectedProviders.join(', ')}`);
    }

    if (availableProviders.length === 0) {
      console.error('❌ No LLM providers available');
      return new Response(JSON.stringify({ error: 'No LLM providers configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🤖 Testing ${availableProviders.length} providers with ${selectedQueries.length} queries`);
    console.log(`📊 Total operations: ${availableProviders.length * selectedQueries.length}`);

    // Query each provider
    let successCount = 0;
    let failCount = 0;
    const startTime = Date.now();
    const TIMEOUT_MS = 120000; // 2 minutes timeout

    for (let i = 0; i < selectedQueries.length; i++) {
      // Check if we're approaching timeout
      if (Date.now() - startTime > TIMEOUT_MS) {
        console.warn(`⏱️ Timeout reached after ${Math.floor((Date.now() - startTime) / 1000)}s. Returning partial results.`);
        break;
      }
      
      const query = selectedQueries[i];
      console.log(`\n🔍 Query ${i + 1}/${selectedQueries.length}: "${query.substring(0, 60)}..."`);
      
      for (const { provider, apiKey } of availableProviders) {
        try {
          console.log(`  → Querying ${provider.name} [RETRY ENABLED]...`);
          
          const queryStartTime = Date.now();
          
          // Add timeout and RETRY per query
          const answer = await apiCallWithRetry(
            async () => {
              const queryPromise = provider.query(query, apiKey);
              const timeoutPromise = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Query timeout')), 30000)
              );
              return Promise.race([queryPromise, timeoutPromise]) as Promise<string>;
            },
            `${provider.name}-${query.substring(0, 30)}`,
            { maxAttempts: 2, timeoutMs: 35000, initialDelayMs: 1000 }
          );
          
          const queryDuration = Date.now() - queryStartTime;
          
          if (!answer || answer.trim().length === 0) {
            throw new Error('Empty response from provider');
          }
          
          console.log(`  ✓ Response received (${queryDuration}ms, ${answer.length} chars)`);
          
          // Use AI-powered analysis
          const analysisStartTime = Date.now();
          const analysis = await analyzeMentionWithAI(answer, brand.name, brand.domain, lovableKey);
          const analysisDuration = Date.now() - analysisStartTime;
          
          console.log(`  ✓ AI analysis complete (${analysisDuration}ms)`);
          console.log(`    Mentioned: ${analysis.mentioned}, Confidence: ${analysis.confidence}%, Sentiment: ${analysis.sentiment}, Context: ${analysis.context}`);
          
          results.push({
            provider: provider.name,
            query,
            mentioned: analysis.mentioned,
            confidence: analysis.confidence,
            sentiment: analysis.sentiment,
            context: analysis.context,
            answer_excerpt: analysis.excerpt,
            reasoning: analysis.reasoning
          });

          const { error: insertError } = await supabase.from('mentions_llm').insert({
            brand_id: brandId,
            provider: provider.name,
            query,
            mentioned: analysis.mentioned,
            confidence: analysis.confidence,
            answer_excerpt: analysis.excerpt,
          });
          
          if (insertError) {
            console.error(`  ⚠️ Database insert failed:`, insertError);
          } else {
            successCount++;
            console.log(`  ✓ Saved to database`);
          }
          
        } catch (error) {
          failCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`  ❌ ${provider.name} failed: ${errorMessage}`);
          errors.push({
            provider: provider.name,
            query: query.substring(0, 100),
            error: errorMessage
          });
        }

        // Wait 1s between queries to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n✅ Collection completed in ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`📊 Results: ${successCount} success, ${failCount} failed, ${results.length} total mentions`);
    console.log(`🎯 Mentions found: ${results.filter(r => r.mentioned).length}/${results.length}`);

    return new Response(JSON.stringify({ 
      success: true, 
      brand: brand.name,
      results,
      totalQueries: results.length,
      mentions: results.filter(r => r.mentioned).length,
      successCount,
      failCount,
      errors: errors.length > 0 ? errors : undefined,
      executionTimeMs: Date.now() - startTime,
      stats: {
        avgConfidence: results.length > 0 
          ? (results.reduce((sum, r) => sum + r.confidence, 0) / results.length).toFixed(2)
          : 0,
        sentimentBreakdown: {
          positive: results.filter(r => r.sentiment === 'positive').length,
          neutral: results.filter(r => r.sentiment === 'neutral').length,
          negative: results.filter(r => r.sentiment === 'negative').length,
        },
        contextBreakdown: {
          relevant: results.filter(r => r.context === 'relevant').length,
          partial: results.filter(r => r.context === 'partial').length,
          irrelevant: results.filter(r => r.context === 'irrelevant').length,
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Critical error in collect-llm-mentions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

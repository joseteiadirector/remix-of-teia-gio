import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
      throw new Error('Unauthorized');
    }

    const { queryId, brandId } = await req.json();

    // Comprehensive input validation
    if (!queryId || typeof queryId !== 'string') {
      throw new Error('Invalid queryId');
    }
    if (!brandId || typeof brandId !== 'string') {
      throw new Error('Invalid brandId');
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(queryId) || !uuidRegex.test(brandId)) {
      throw new Error('Invalid UUID format');
    }

    console.log(`Executing nucleus query ${queryId} for brand ${brandId}`);

    // Get query details
    const { data: query, error: queryError } = await supabase
      .from('nucleus_queries')
      .select('*')
      .eq('id', queryId)
      .eq('user_id', user.id)
      .single();

    if (queryError || !query) {
      throw new Error('Query not found');
    }

    // Get brand details
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .eq('user_id', user.id)
      .single();

    if (brandError || !brand) {
      throw new Error('Brand not found');
    }

    // Create execution record
    const { data: execution, error: executionError } = await supabase
      .from('nucleus_executions')
      .insert([{
        user_id: user.id,
        query_id: queryId,
        brand_id: brandId,
        status: 'pending',
        llms_used: query.selected_llms,
      }])
      .select()
      .single();

    if (executionError) {
      throw new Error('Failed to create execution record');
    }

    try {
      // Replace placeholders in query text
      let processedQuery = query.query_text;
      processedQuery = processedQuery.replace(/{brand}/g, brand.name);
      processedQuery = processedQuery.replace(/{domain}/g, brand.domain);

      const selectedLLMs = query.selected_llms as string[];
      
      // Validate selected_llms array
      if (!Array.isArray(selectedLLMs) || selectedLLMs.length === 0) {
        throw new Error('Invalid selected_llms configuration');
      }
      if (selectedLLMs.length > 10) {
        throw new Error('Too many LLMs selected (max 10)');
      }
      for (const llmId of selectedLLMs) {
        if (typeof llmId !== 'string' || llmId.length > 50) {
          throw new Error('Invalid LLM ID format');
        }
      }
      
      const results: any[] = [];
      let totalMentions = 0;
      let totalQueries = 0;

      // Execute query on each selected LLM
      for (const llmId of selectedLLMs) {
        try {
          console.log(`Querying ${llmId} with: ${processedQuery}`);

          const response = await fetch(`${supabaseUrl}/functions/v1/collect-llm-mentions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              brandId: brandId,
              customQuery: processedQuery,
              selectedProviders: [llmId],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            results.push({
              provider: llmId,
              mentions: data.mentions || 0,
              queries: data.totalQueries || 1,
              success: true,
            });
            totalMentions += data.mentions || 0;
            totalQueries += data.totalQueries || 1;
          } else {
            const error = await response.text();
            console.error(`Failed to query ${llmId}:`, error);
            results.push({
              provider: llmId,
              success: false,
              error,
            });
            totalQueries += 1;
          }

          // Wait 2 seconds between LLM calls to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`Error querying ${llmId}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.push({
            provider: llmId,
            success: false,
            error: errorMessage,
          });
          totalQueries += 1;
        }
      }

      // Update execution record with results
      const { error: updateError } = await supabase
        .from('nucleus_executions')
        .update({
          status: 'completed',
          results: { details: results },
          total_queries: totalQueries,
          total_mentions: totalMentions,
          completed_at: new Date().toISOString(),
        })
        .eq('id', execution.id);

      if (updateError) {
        console.error('Failed to update execution:', updateError);
      }

      console.log(`Execution ${execution.id} completed: ${totalMentions}/${totalQueries} mentions`);

      return new Response(JSON.stringify({
        success: true,
        executionId: execution.id,
        totalQueries,
        totalMentions,
        results,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      // Update execution record with error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await supabase
        .from('nucleus_executions')
        .update({
          status: 'failed',
          error: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', execution.id);

      throw error;
    }

  } catch (error) {
    console.error('Error in execute-nucleus-query:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

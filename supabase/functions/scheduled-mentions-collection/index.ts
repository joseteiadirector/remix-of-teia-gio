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

    console.log('Starting scheduled mentions collection...');

    // Get all brands
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id, name, user_id');

    if (brandsError) {
      throw new Error(`Failed to fetch brands: ${brandsError.message}`);
    }

    if (!brands || brands.length === 0) {
      console.log('No brands found');
      return new Response(JSON.stringify({ message: 'No brands to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${brands.length} brands...`);

    const results = [];

    // Process each brand
    for (const brand of brands) {
      try {
        console.log(`Collecting mentions for brand: ${brand.name}`);

        // Call the collect-llm-mentions function
        const response = await fetch(`${supabaseUrl}/functions/v1/collect-llm-mentions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ brandId: brand.id }),
        });

        if (response.ok) {
          const data = await response.json();
          results.push({
            brandId: brand.id,
            brandName: brand.name,
            success: true,
            mentions: data.mentions,
            totalQueries: data.totalQueries,
          });
          console.log(`✓ Collected ${data.mentions}/${data.totalQueries} mentions for ${brand.name}`);
        } else {
          const error = await response.text();
          console.error(`✗ Failed to collect mentions for ${brand.name}:`, error);
          results.push({
            brandId: brand.id,
            brandName: brand.name,
            success: false,
            error,
          });
        }

        // Wait 2 seconds between brands to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error processing brand ${brand.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          brandId: brand.id,
          brandName: brand.name,
          success: false,
          error: errorMessage,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Mentions collection complete: ${successCount} succeeded, ${failCount} failed`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Processed ${brands.length} brands`,
      successCount,
      failCount,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scheduled-mentions-collection:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

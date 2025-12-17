import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user
    const { data: { user }, error: authError } = await createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { brandId, query, limit = 5 } = await req.json();

    if (!brandId || !query) {
      throw new Error('Brand ID and query are required');
    }

    console.log(`Searching knowledge base for brand ${brandId}: "${query}"`);

    // Extract keywords from query for better search
    const keywords = query
      .toLowerCase()
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, '')
      .split(/\s+/)
      .filter((word: string) => word.length > 2)
      .slice(0, 10);

    if (keywords.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        chunks: [],
        message: 'No valid search terms'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build search query using PostgreSQL full-text search
    const searchQuery = keywords.join(' | '); // OR search
    
    const { data: chunks, error: searchError } = await supabaseClient
      .from('document_chunks')
      .select(`
        id,
        content,
        chunk_index,
        content_length,
        document_id,
        brand_documents!inner (
          file_name,
          status
        )
      `)
      .eq('brand_id', brandId)
      .eq('brand_documents.status', 'completed')
      .textSearch('content', searchQuery, {
        type: 'websearch',
        config: 'portuguese'
      })
      .limit(limit);

    if (searchError) {
      console.error('Search error:', searchError);
      
      // Fallback: simple ILIKE search if full-text fails
      const likePattern = `%${keywords[0]}%`;
      const { data: fallbackChunks, error: fallbackError } = await supabaseClient
        .from('document_chunks')
        .select(`
          id,
          content,
          chunk_index,
          content_length,
          document_id,
          brand_documents!inner (
            file_name,
            status
          )
        `)
        .eq('brand_id', brandId)
        .eq('brand_documents.status', 'completed')
        .ilike('content', likePattern)
        .limit(limit);

      if (fallbackError) {
        throw fallbackError;
      }

      return new Response(JSON.stringify({ 
        success: true, 
        chunks: fallbackChunks || [],
        searchMethod: 'fallback'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${chunks?.length || 0} relevant chunks`);

    return new Response(JSON.stringify({ 
      success: true, 
      chunks: chunks || [],
      searchMethod: 'fulltext'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

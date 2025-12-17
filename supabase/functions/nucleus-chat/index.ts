import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Search knowledge base for relevant context
async function searchKnowledgeBase(supabase: any, brandId: string, query: string): Promise<string> {
  try {
    // Extract keywords from query
    const keywords = query
      .toLowerCase()
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, '')
      .split(/\s+/)
      .filter((word: string) => word.length > 2)
      .slice(0, 5);

    if (keywords.length === 0) return '';

    // Try full-text search first
    const searchQuery = keywords.join(' | ');
    
    let { data: chunks, error } = await supabase
      .from('document_chunks')
      .select(`
        content,
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
      .limit(3);

    // Fallback to ILIKE if full-text fails
    if (error || !chunks || chunks.length === 0) {
      const { data: fallbackChunks } = await supabase
        .from('document_chunks')
        .select(`
          content,
          brand_documents!inner (
            file_name,
            status
          )
        `)
        .eq('brand_id', brandId)
        .eq('brand_documents.status', 'completed')
        .ilike('content', `%${keywords[0]}%`)
        .limit(3);
      
      chunks = fallbackChunks;
    }

    if (!chunks || chunks.length === 0) return '';

    // Build context string
    const context = chunks
      .map((c: any) => `[${c.brand_documents.file_name}]: ${c.content}`)
      .join('\n\n');

    console.log(`Found ${chunks.length} relevant chunks from knowledge base`);
    return context;
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { message, brandId } = await req.json();

    if (!message || !brandId) {
      throw new Error('Missing message or brandId');
    }

    // Get brand details
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .eq('user_id', user.id)
      .single();

    if (brandError || !brand) {
      throw new Error('Brand not found or unauthorized');
    }

    console.log('Processing chat message:', { message, brand: brand.name });

    // Search knowledge base for relevant context
    const knowledgeContext = await searchKnowledgeBase(supabase, brandId, message);
    const hasKnowledgeBase = knowledgeContext.length > 0;
    
    if (hasKnowledgeBase) {
      console.log('Knowledge base context found, enhancing prompts');
    }

    // Get API keys
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    const googleKey = Deno.env.get('GOOGLE_AI_API_KEY');
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');

    // Replace placeholders in message
    const processedMessage = message
      .replace(/{brand}/g, brand.name)
      .replace(/{domain}/g, brand.domain);

    console.log('Processed message:', processedMessage);

    // Build system prompt with knowledge base context
    const baseSystemPrompt = `Você está analisando menções e presença de ${brand.name} (${brand.domain}). Forneça respostas detalhadas e factuais sempre em português.`;
    
    const systemPromptWithKB = hasKnowledgeBase 
      ? `${baseSystemPrompt}\n\n## CONTEXTO DA BASE DE CONHECIMENTO DA MARCA:\nUse as seguintes informações oficiais da marca para fundamentar sua resposta:\n\n${knowledgeContext}\n\n## INSTRUÇÕES:\n- Priorize as informações da base de conhecimento acima\n- Se a pergunta não puder ser respondida com o contexto, use seu conhecimento geral\n- Sempre cite a fonte quando usar informações do contexto`
      : baseSystemPrompt;

    // Define LLM providers to query
    const llmProviders = [
      {
        key: 'chatgpt',
        name: 'ChatGPT',
        apiKey: openaiKey,
        endpoint: 'https://api.openai.com/v1/chat/completions',
        makeRequest: async () => {
          if (!openaiKey) return null;
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPromptWithKB },
                { role: 'user', content: processedMessage }
              ],
              max_tokens: 800,
              temperature: 0.7,
            }),
          });
          
          if (!response.ok) {
            console.error('ChatGPT error:', await response.text());
            return null;
          }
          
          const data = await response.json();
          return data.choices[0]?.message?.content || null;
        }
      },
      {
        key: 'gemini',
        name: 'Google Gemini',
        apiKey: googleKey,
        makeRequest: async () => {
          if (!googleKey) return null;
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${googleKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `${systemPromptWithKB}\n\nPergunta: ${processedMessage}`
                }]
              }],
              generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7,
              }
            }),
            }
          );
          
          if (!response.ok) {
            console.error('Gemini error:', await response.text());
            return null;
          }
          
          const data = await response.json();
          console.log('Gemini response data:', JSON.stringify(data, null, 2));
          
          if (!data.candidates || !data.candidates[0]) {
            console.error('Gemini: No candidates in response');
            return null;
          }
          
          const candidate = data.candidates[0];
          const text = candidate.content?.parts?.[0]?.text;
          
          if (!text) {
            console.error('Gemini: No text in response. finishReason:', candidate.finishReason);
            return null;
          }
          
          return text;
        }
      },
      {
        key: 'claude',
        name: 'Claude',
        apiKey: anthropicKey,
        makeRequest: async () => {
          if (!anthropicKey) return null;
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': anthropicKey,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'claude-3-5-haiku-20241022',
              max_tokens: 800,
              system: systemPromptWithKB,
              messages: [{
                role: 'user',
                content: processedMessage
              }],
            }),
          });
          
          if (!response.ok) {
            console.error('Claude error:', await response.text());
            return null;
          }
          
          const data = await response.json();
          return data.content[0]?.text || null;
        }
      },
      {
        key: 'perplexity',
        name: 'Perplexity',
        apiKey: perplexityKey,
        makeRequest: async () => {
          if (!perplexityKey) return null;
          const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${perplexityKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'sonar',
              messages: [
                { role: 'system', content: systemPromptWithKB },
                { role: 'user', content: processedMessage }
              ],
              max_tokens: 800,
              temperature: 0.7,
            }),
          });
          
          if (!response.ok) {
            console.error('Perplexity error:', await response.text());
            return null;
          }
          
          const data = await response.json();
          return data.choices[0]?.message?.content || null;
        }
      }
    ];

    // Query all LLMs in parallel
    const results = await Promise.allSettled(
      llmProviders.map(async (provider) => {
        if (!provider.apiKey) {
          console.log(`Skipping ${provider.name} - no API key`);
          return { 
            llm: provider.key, 
            success: false, 
            error: 'API key not configured' 
          };
        }

        try {
          console.log(`Querying ${provider.name}...`);
          const response = await provider.makeRequest();
          
          if (!response) {
            return { 
              llm: provider.key, 
              success: false, 
              error: 'No response from API' 
            };
          }

          // Save to mentions_llm
          const { error: insertError } = await supabase
            .from('mentions_llm')
            .insert({
              brand_id: brandId,
              provider: provider.key,
              query: processedMessage,
              mentioned: true,
              confidence: hasKnowledgeBase ? 0.95 : 0.85, // Higher confidence with KB
              answer_excerpt: response.substring(0, 500),
            });

          if (insertError) {
            console.error(`Error saving ${provider.name} mention:`, insertError);
          }

          return {
            llm: provider.key,
            success: true,
            response: response,
            usedKnowledgeBase: hasKnowledgeBase,
          };
        } catch (error) {
          console.error(`Error querying ${provider.name}:`, error);
          return {
            llm: provider.key,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    const finalResults = results.map((result) => 
      result.status === 'fulfilled' ? result.value : { success: false, error: 'Request failed' }
    );

    const successCount = finalResults.filter(r => r.success).length;
    console.log(`Completed: ${successCount}/${llmProviders.length} LLMs responded. KB used: ${hasKnowledgeBase}`);

    return new Response(
      JSON.stringify({
        success: true,
        results: finalResults,
        totalQueried: llmProviders.length,
        successCount,
        usedKnowledgeBase: hasKnowledgeBase,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in nucleus-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const results = {
    openai: { status: 'unknown', message: '' },
    google: { status: 'unknown', message: '' },
    claude: { status: 'unknown', message: '' },
    perplexity: { status: 'unknown', message: '' },
    gsc: { status: 'unknown', message: '' },
    ga4: { status: 'unknown', message: '' },
  };

  // Test OpenAI
  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      results.openai = { status: 'error', message: 'API key not configured' };
    } else {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${openaiKey}` }
      });
      if (response.ok) {
        results.openai = { status: 'success', message: 'Connected successfully' };
      } else {
        results.openai = { status: 'error', message: `HTTP ${response.status}` };
      }
    }
  } catch (error) {
    results.openai = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
  }

  // Test Google/Gemini via Lovable AI
  try {
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      results.google = { status: 'error', message: 'Lovable AI key not configured' };
    } else {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        })
      });
      if (response.ok) {
        results.google = { status: 'success', message: 'Connected via Lovable AI' };
      } else {
        const errorText = await response.text();
        console.error('Google/Lovable AI error:', response.status, errorText);
        results.google = { status: 'error', message: `HTTP ${response.status}` };
      }
    }
  } catch (error) {
    results.google = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
  }

  // Test Claude via Anthropic API direct
  try {
    const claudeKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!claudeKey) {
      results.claude = { status: 'not_configured', message: 'API key not configured' };
    } else {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': claudeKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        })
      });
      if (response.ok) {
        results.claude = { status: 'success', message: 'Connected successfully' };
      } else {
        const errorText = await response.text();
        console.error('Claude error:', response.status, errorText);
        results.claude = { status: 'error', message: `HTTP ${response.status}` };
      }
    }
  } catch (error) {
    results.claude = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
  }

  // Test Perplexity
  try {
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityKey) {
      results.perplexity = { status: 'error', message: 'API key not configured' };
    } else {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })
      });
      if (response.ok || response.status === 400) {
        results.perplexity = { status: 'success', message: 'Connected successfully' };
      } else {
        results.perplexity = { status: 'error', message: `HTTP ${response.status}` };
      }
    }
  } catch (error) {
    results.perplexity = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
  }

  // Check GSC credentials
  const gscCredentials = Deno.env.get('GSC_CREDENTIALS_JSON');
  results.gsc = gscCredentials 
    ? { status: 'configured', message: 'Credentials set (validation requires OAuth)' }
    : { status: 'not_configured', message: 'Credentials not set' };

  // Check GA4 property
  const ga4Property = Deno.env.get('GA4_PROPERTY_ID');
  results.ga4 = ga4Property
    ? { status: 'configured', message: `Property ID: ${ga4Property}` }
    : { status: 'not_configured', message: 'Property ID not set' };

  console.log('Connection test results:', results);

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
/**
 * LLM Providers Service
 * Centralized logic for querying different LLM providers
 */

import { getCachedResponse, setCachedResponse } from './llm-cache.ts';

export interface LLMProvider {
  name: string;
  query: (question: string, apiKey: string) => Promise<string>;
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on certain error codes
      if (lastError.message.includes('401') || lastError.message.includes('403')) {
        throw lastError; // Auth errors shouldn't be retried
      }
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Query with cache support
 */
async function queryWithCache(
  provider: string,
  question: string,
  apiKey: string,
  queryFn: () => Promise<string>
): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  // Check cache first
  if (supabaseUrl && supabaseServiceKey) {
    const cached = await getCachedResponse(question, provider, supabaseUrl, supabaseServiceKey);
    if (cached) return cached;
  }
  
  // Query API
  const response = await queryFn();
  
  // Cache the response
  if (supabaseUrl && supabaseServiceKey && response) {
    await setCachedResponse(question, provider, response, supabaseUrl, supabaseServiceKey);
  }
  
  return response;
}

export const providers = {
  chatgpt: {
    name: 'ChatGPT',
    query: async (question: string, apiKey: string): Promise<string> => {
      return queryWithCache('chatgpt', question, apiKey, () => 
        retryWithBackoff(async () => {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'You are a helpful assistant. Be concise and direct.' },
                { role: 'user', content: question }
              ],
              max_tokens: 800,
              temperature: 0.7,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ OpenAI API error:', response.status, errorText);
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          
          if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('❌ Invalid OpenAI response structure:', JSON.stringify(data));
            throw new Error('Invalid response structure from OpenAI');
          }
          
          const content = data.choices[0].message.content;
          if (!content || content.trim().length === 0) {
            console.error('❌ Empty content from OpenAI');
            throw new Error('Empty response from provider');
          }
          
          return content;
        }, 2) // Only 2 retries to avoid long waits
      );
    }
  },

  gemini: {
    name: 'Gemini',
    query: async (question: string, apiKey: string): Promise<string> => {
      return queryWithCache('gemini', question, apiKey, () =>
        retryWithBackoff(async () => {
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [{ role: 'user', content: question }],
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
          }

          const data = await response.json();
          return data.choices[0].message.content;
        })
      );
    }
  },

  claude: {
    name: 'Claude',
    query: async (question: string, apiKey: string): Promise<string> => {
      return queryWithCache('claude', question, apiKey, () =>
        retryWithBackoff(async () => {
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash', // Using Gemini as proxy for Claude
              messages: [{ role: 'user', content: question }],
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Claude API error: ${response.status} - ${error}`);
          }

          const data = await response.json();
          return data.choices[0].message.content;
        })
      );
    }
  },

  perplexity: {
    name: 'Perplexity',
    query: async (question: string, apiKey: string): Promise<string> => {
      return queryWithCache('perplexity', question, apiKey, () =>
        retryWithBackoff(async () => {
          const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'sonar',
              messages: [
                { role: 'system', content: 'Be precise and concise.' },
                { role: 'user', content: question }
              ],
              temperature: 0.2,
              top_p: 0.9,
              max_tokens: 1000
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            console.error('Perplexity API error:', response.status, error);
            throw new Error(`Perplexity API error: ${response.status} - ${error}`);
          }

          const data = await response.json();
          
          if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            console.error('❌ Invalid Perplexity response structure:', JSON.stringify(data));
            throw new Error('Empty or invalid response from Perplexity');
          }
          
          return data.choices[0].message.content;
        }, 2) // Only 2 retries for Perplexity to avoid long waits
      );
    }
  }
};

export function getAvailableProviders(apiKeys: {
  openai?: string;
  lovable?: string;
  perplexity?: string;
}): Array<{ key: keyof typeof providers, provider: LLMProvider, apiKey: string }> {
  console.log('🔍 Checking available LLM providers...');
  
  const available: Array<{ key: keyof typeof providers, provider: LLMProvider, apiKey: string }> = [];

  if (apiKeys.openai && typeof apiKeys.openai === 'string' && apiKeys.openai.trim().length > 0) {
    available.push({ key: 'chatgpt', provider: providers.chatgpt, apiKey: apiKeys.openai });
    console.log('  ✓ ChatGPT available');
  } else {
    console.log('  ✗ ChatGPT not configured');
  }
  
  if (apiKeys.lovable && typeof apiKeys.lovable === 'string' && apiKeys.lovable.trim().length > 0) {
    available.push({ key: 'gemini', provider: providers.gemini, apiKey: apiKeys.lovable });
    available.push({ key: 'claude', provider: providers.claude, apiKey: apiKeys.lovable });
    console.log('  ✓ Gemini available');
    console.log('  ✓ Claude available');
  } else {
    console.log('  ✗ Lovable AI (Gemini/Claude) not configured');
  }
  
  if (apiKeys.perplexity && typeof apiKeys.perplexity === 'string' && apiKeys.perplexity.trim().length > 0) {
    available.push({ key: 'perplexity', provider: providers.perplexity, apiKey: apiKeys.perplexity });
    console.log('  ✓ Perplexity available');
  } else {
    console.log('  ✗ Perplexity not configured');
  }

  console.log(`📊 Total available providers: ${available.length}`);
  
  if (available.length === 0) {
    console.error('❌ WARNING: No LLM providers configured!');
  }

  return available;
}

export function generateContextualQueries(brandName: string, domain: string, industry: string, brandContext?: string): string[] {
  // Input validation
  if (!brandName || typeof brandName !== 'string' || brandName.trim().length === 0) {
    console.error('❌ Invalid brandName for query generation');
    throw new Error('brandName is required and must be a non-empty string');
  }

  if (!domain || typeof domain !== 'string' || domain.trim().length === 0) {
    console.error('❌ Invalid domain for query generation');
    throw new Error('domain is required and must be a non-empty string');
  }

  if (!industry || typeof industry !== 'string' || industry.trim().length === 0) {
    console.warn('⚠️ Invalid industry, using default');
    industry = 'tecnologia';
  }

  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  
  // Add context to disambiguate when available
  const contextInfo = brandContext && brandContext.trim().length > 0 
    ? `, ${brandContext}` 
    : '';
  
  console.log(`📝 Generating contextual queries for: ${brandName} (${cleanDomain}) in ${industry}${contextInfo ? ` with context: ${brandContext}` : ''}`);
  
  const queries = [
    `O que você sabe sobre a empresa ${brandName}${contextInfo}?`,
    `Me fale sobre ${brandName}${contextInfo} e suas soluções`,
    `Você conhece a ${brandName}${contextInfo}? O que ela oferece?`,
    `Quais são os principais serviços da ${brandName}${contextInfo}?`,
    `${brandName}${contextInfo} é uma boa empresa de ${industry}?`,
    `O site ${cleanDomain} é da empresa ${brandName}${contextInfo}?`
  ];

  console.log(`✅ Generated ${queries.length} contextual queries`);
  return queries;
}

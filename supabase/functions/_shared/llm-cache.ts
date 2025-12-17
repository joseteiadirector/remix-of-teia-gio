/**
 * LLM Query Cache Service
 * Reduces API calls by caching responses with smart TTL
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CACHE_TTL_DAYS = 7; // Cache responses for 7 days

/**
 * Generate a consistent hash for a query
 */
function generateQueryHash(query: string, provider: string): string {
  const normalized = query.toLowerCase().trim();
  const combined = `${provider}:${normalized}`;
  
  // Simple hash function (FNV-1a)
  let hash = 2166136261;
  for (let i = 0; i < combined.length; i++) {
    hash ^= combined.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Check if a cached response exists and is valid
 */
export async function getCachedResponse(
  query: string,
  provider: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<string | null> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const queryHash = generateQueryHash(query, provider);
    
    console.log(`🔍 Checking cache for: ${provider} - ${query.substring(0, 50)}...`);
    
    const { data, error } = await supabase
      .from('llm_query_cache')
      .select('response, hit_count, created_at')
      .eq('query_hash', queryHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    
    if (error) {
      console.error('  ❌ Cache lookup error:', error);
      return null;
    }
    
    if (data) {
      console.log(`  ✓ Cache HIT! (age: ${Math.floor((Date.now() - new Date(data.created_at).getTime()) / 1000 / 60)}min, hits: ${data.hit_count})`);
      
      // Increment hit counter (fire and forget)
      supabase
        .from('llm_query_cache')
        .update({ hit_count: data.hit_count + 1 })
        .eq('query_hash', queryHash)
        .then(() => console.log('  → Hit counter updated'));
      
      return data.response;
    }
    
    console.log('  ✗ Cache MISS - will query API');
    return null;
  } catch (error) {
    console.error('  ❌ Cache check failed:', error);
    return null; // Fail gracefully, proceed with API call
  }
}

/**
 * Store a response in the cache
 */
export async function setCachedResponse(
  query: string,
  provider: string,
  response: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const queryHash = generateQueryHash(query, provider);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);
    
    console.log(`💾 Caching response for: ${provider} - ${query.substring(0, 50)}...`);
    
    const { error } = await supabase
      .from('llm_query_cache')
      .upsert({
        query_hash: queryHash,
        query_text: query,
        provider,
        response,
        expires_at: expiresAt.toISOString(),
        hit_count: 1
      }, {
        onConflict: 'query_hash'
      });
    
    if (error) {
      console.error('  ❌ Failed to cache response:', error);
    } else {
      console.log(`  ✓ Response cached (expires in ${CACHE_TTL_DAYS} days)`);
    }
  } catch (error) {
    console.error('  ❌ Cache storage failed:', error);
    // Non-critical, continue without caching
  }
}

/**
 * Clean expired cache entries (should be called periodically)
 */
export async function cleanExpiredCache(
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<number> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🧹 Cleaning expired cache entries...');
    
    const { data, error } = await supabase
      .from('llm_query_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');
    
    if (error) {
      console.error('  ❌ Cache cleanup error:', error);
      return 0;
    }
    
    const count = data?.length || 0;
    console.log(`  ✓ Cleaned ${count} expired cache entries`);
    return count;
  } catch (error) {
    console.error('  ❌ Cache cleanup failed:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ total: number; hitRate: number; avgAge: number }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase
      .from('llm_query_cache')
      .select('hit_count, created_at');
    
    if (error || !data) {
      return { total: 0, hitRate: 0, avgAge: 0 };
    }
    
    const total = data.length;
    const totalHits = data.reduce((sum, entry) => sum + entry.hit_count, 0);
    const avgAge = data.reduce((sum, entry) => {
      const age = Date.now() - new Date(entry.created_at).getTime();
      return sum + age;
    }, 0) / total / 1000 / 60; // in minutes
    
    const hitRate = totalHits / (total || 1);
    
    return { total, hitRate, avgAge };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return { total: 0, hitRate: 0, avgAge: 0 };
  }
}

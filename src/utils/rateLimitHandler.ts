/**
 * Utility para lidar com rate limiting e retry logic
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, delay: number) => void;
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number = 60
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Executa uma função com retry automático em caso de rate limiting
 */
export async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 60000,
    onRetry
  } = options;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Verificar se é erro de rate limiting (429)
      const isRateLimitError = 
        error?.message?.includes('429') || 
        error?.message?.includes('rate limit') ||
        error?.message?.includes('Rate limit');
      
      if (!isRateLimitError || attempt === maxRetries) {
        // Se não é rate limit ou esgotou tentativas, propaga o erro
        throw error;
      }
      
      // Extrair retry_after da mensagem de erro se disponível
      let retryAfter = 60; // default 60 segundos
      try {
        const match = error?.message?.match(/retry_after[":]+\s*(\d+)/i);
        if (match) {
          retryAfter = parseInt(match[1], 10);
        }
      } catch {
        // Usa o default
      }
      
      // Calcular delay com backoff exponencial
      const baseDelay = Math.min(
        initialDelay * Math.pow(2, attempt),
        maxDelay
      );
      
      // Usar o maior valor entre backoff e retry_after
      const delay = Math.max(baseDelay, retryAfter * 1000);
      
      console.warn(
        `🔄 Rate limit detectado. Tentativa ${attempt + 1}/${maxRetries}. ` +
        `Aguardando ${delay/1000}s antes de tentar novamente...`
      );
      
      if (onRetry) {
        onRetry(attempt + 1, delay);
      }
      
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Falha após múltiplas tentativas');
}

/**
 * Cache simples em memória com TTL
 */
class SimpleCache<T> {
  private cache = new Map<string, { value: T; expires: number }>();
  
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  set(key: string, value: T, ttlMs: number = 30000) {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttlMs
    });
  }
  
  clear() {
    this.cache.clear();
  }
}

// Cache global para métricas IGO
export const igoMetricsCache = new SimpleCache<any>();

/**
 * Debounce helper para evitar chamadas múltiplas
 */
export function createDebouncer(delayMs: number = 500) {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return <T extends (...args: any[]) => any>(fn: T) => {
    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      return new Promise<ReturnType<T>>((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            const result = await fn(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delayMs);
      });
    };
  };
}

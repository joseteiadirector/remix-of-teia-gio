/**
 * Sistema de Retry Automático com Exponential Backoff
 * Para garantir resiliência nas chamadas de API
 */

interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  timeoutMs?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  timeoutMs: 120000, // 2 minutes
};

/**
 * Executa uma função com retry automático e exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let delay = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      console.log(`[RETRY] Attempt ${attempt}/${opts.maxAttempts}`);
      
      // Execute with timeout
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), opts.timeoutMs)
        ),
      ]);

      console.log(`[RETRY] Success on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`[RETRY] Attempt ${attempt} failed:`, error);

      if (attempt < opts.maxAttempts) {
        console.log(`[RETRY] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
      }
    }
  }

  throw new Error(
    `Failed after ${opts.maxAttempts} attempts. Last error: ${lastError?.message}`
  );
}

/**
 * Wrapper para chamadas de API com retry automático
 */
export async function apiCallWithRetry<T>(
  apiCall: () => Promise<T>,
  operationName: string,
  options: RetryOptions = {}
): Promise<T> {
  console.log(`[API-RETRY] Starting ${operationName}`);
  
  try {
    const result = await withRetry(apiCall, options);
    console.log(`[API-RETRY] ${operationName} completed successfully`);
    return result;
  } catch (error) {
    console.error(`[API-RETRY] ${operationName} failed after all retries:`, error);
    throw error;
  }
}

/**
 * Rate limiter simples
 */
export class RateLimiter {
  private lastCall = 0;
  private minInterval: number;

  constructor(callsPerSecond: number) {
    this.minInterval = 1000 / callsPerSecond;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    
    if (timeSinceLastCall < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastCall;
      console.log(`[RATE-LIMITER] Throttling for ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastCall = Date.now();
  }
}

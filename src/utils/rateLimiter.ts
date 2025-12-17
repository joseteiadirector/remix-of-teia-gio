/**
 * Rate Limiter Client-Side
 * Previne abuso de APIs e edge functions
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();

  /**
   * Verifica se pode fazer request
   * @param key - Identificador único (userId, endpoint, etc)
   * @param config - Configuração de limite
   * @returns true se pode fazer request, false se excedeu
   */
  canMakeRequest(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    // Se não existe ou expirou, criar nova entrada
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    // Se ainda está dentro do limite
    if (entry.count < config.maxRequests) {
      entry.count++;
      return true;
    }

    // Excedeu o limite
    return false;
  }

  /**
   * Retorna tempo restante até reset (ms)
   */
  getTimeUntilReset(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;

    const now = Date.now();
    return Math.max(0, entry.resetTime - now);
  }

  /**
   * Reseta limite para uma chave específica
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Limpa todas as entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

// Configurações padrão por tipo de operação
export const RATE_LIMITS = {
  // AI operations - mais restritivo
  aiGeneration: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 req/min
  aiChat: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 req/min
  
  // Data operations - moderado
  dataFetch: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 req/min
  dataUpdate: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 req/min
  
  // Analysis - mais permissivo
  urlAnalysis: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 req/min
  reportGeneration: { maxRequests: 3, windowMs: 60 * 1000 }, // 3 req/min
};

export const rateLimiter = new RateLimiter();

// Limpeza automática a cada 5 minutos
setInterval(() => {
  rateLimiter.cleanup();
}, 5 * 60 * 1000);

/**
 * Hook para usar rate limiter em componentes React
 */
export function useRateLimit(key: string, config: RateLimitConfig) {
  const checkLimit = (): { allowed: boolean; resetIn?: number } => {
    const allowed = rateLimiter.canMakeRequest(key, config);
    
    if (!allowed) {
      const resetIn = rateLimiter.getTimeUntilReset(key);
      return { allowed: false, resetIn };
    }
    
    return { allowed: true };
  };

  return { checkLimit, reset: () => rateLimiter.reset(key) };
}

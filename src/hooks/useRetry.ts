import { useState } from 'react';
import { logger } from '@/utils/logger';

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoff?: boolean;
}

export function useRetry() {
  const [isRetrying, setIsRetrying] = useState(false);

  const executeWithRetry = async <T,>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> => {
    const { maxAttempts = 3, delayMs = 1000, backoff = true } = options;
    
    setIsRetrying(true);
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await fn();
        setIsRetrying(false);
        return result;
      } catch (error: any) {
        lastError = error;
        
        // Não fazer retry em erros específicos
        if (error.message?.includes('402') || error.message?.includes('401')) {
          setIsRetrying(false);
          throw error;
        }
        
        // Se não é a última tentativa, aguardar antes de tentar novamente
        if (attempt < maxAttempts) {
          const delay = backoff ? delayMs * attempt : delayMs;
          logger.warn('Tentativa de retry falhou', { attempt, maxAttempts, delay, error: lastError?.message });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    setIsRetrying(false);
    throw lastError || new Error('Falha após múltiplas tentativas');
  };

  return { executeWithRetry, isRetrying };
}

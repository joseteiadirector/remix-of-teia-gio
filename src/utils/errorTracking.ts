/**
 * Error Tracking & Logging
 * Sistema centralizado para rastrear e logar erros
 */

import { logger } from "./logger";

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  context: ErrorContext;
  timestamp: number;
  count: number;
}

class ErrorTracker {
  private errors: TrackedError[] = [];
  private maxErrors = 100;
  private errorCounts = new Map<string, number>();

  /**
   * Rastreia um erro
   */
  track(
    error: Error | string,
    severity: ErrorSeverity = 'medium',
    context: ErrorContext = {}
  ): void {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;
    const errorKey = this.getErrorKey(message, context);

    // Incrementar contador
    const count = (this.errorCounts.get(errorKey) || 0) + 1;
    this.errorCounts.set(errorKey, count);

    const trackedError: TrackedError = {
      id: crypto.randomUUID(),
      message,
      stack,
      severity,
      context,
      timestamp: Date.now(),
      count,
    };

    this.errors.unshift(trackedError);

    // Manter apenas os últimos N erros
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log estruturado
    this.logError(trackedError);

    // Se for crítico, alertar
    if (severity === 'critical') {
      this.alertCriticalError(trackedError);
    }
  }

  /**
   * Log estruturado do erro
   */
  private logError(error: TrackedError): void {
    const logData = {
      timestamp: new Date(error.timestamp).toISOString(),
      severity: error.severity,
      message: error.message,
      count: error.count,
      ...error.context,
    };

    // Usar logger estruturado
    if (error.severity === 'critical' || error.severity === 'high') {
      logger.error(`${error.message}`, logData);
    } else if (error.severity === 'medium') {
      logger.warn(`${error.message}`, logData);
    } else {
      logger.debug(`${error.message}`, logData);
    }

    // Em produção, você enviaria para serviço como Sentry
    if (import.meta.env.PROD) {
      this.sendToMonitoring(error);
    }
  }

  /**
   * Gera chave única para agrupar erros similares
   */
  private getErrorKey(message: string, context: ErrorContext): string {
    return `${message}-${context.component || 'unknown'}-${context.action || 'unknown'}`;
  }

  /**
   * Alerta para erros críticos
   */
  private alertCriticalError(error: TrackedError): void {
    // Você pode integrar com sistema de alertas aqui
    logger.error('ERRO CRÍTICO DETECTADO', { error });
  }

  /**
   * Enviar para serviço de monitoramento (placeholder)
   */
  private sendToMonitoring(error: TrackedError): void {
    // Implementar integração com Sentry, LogRocket, etc.
    logger.info('Enviando erro para monitoramento', { errorId: error.id });
  }

  /**
   * Retorna erros recentes
   */
  getRecentErrors(limit: number = 10): TrackedError[] {
    return this.errors.slice(0, limit);
  }

  /**
   * Retorna erros por severidade
   */
  getErrorsBySeverity(severity: ErrorSeverity): TrackedError[] {
    return this.errors.filter(e => e.severity === severity);
  }

  /**
   * Estatísticas de erros
   */
  getStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    topErrors: Array<{ message: string; count: number }>;
  } {
    const bySeverity = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    this.errors.forEach(error => {
      bySeverity[error.severity]++;
    });

    const topErrors = Array.from(this.errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));

    return {
      total: this.errors.length,
      bySeverity,
      topErrors,
    };
  }

  /**
   * Limpa erros antigos
   */
  cleanup(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.errors = this.errors.filter(e => e.timestamp > oneDayAgo);
  }

  /**
   * Limpa todos os erros
   */
  clear(): void {
    this.errors = [];
    this.errorCounts.clear();
  }
}

export const errorTracker = new ErrorTracker();

// Limpeza automática de erros antigos a cada hora
setInterval(() => {
  errorTracker.cleanup();
}, 60 * 60 * 1000);

// Expor globalmente para debugging
if (typeof window !== 'undefined') {
  (window as any).errorTracker = errorTracker;
  logger.info('Error tracking disponível via window.errorTracker.getStats()');
}

/**
 * Hook React para error tracking
 */
export function useErrorTracking(component: string) {
  return {
    trackError: (
      error: Error | string,
      severity: ErrorSeverity = 'medium',
      action?: string,
      metadata?: Record<string, any>
    ) => {
      errorTracker.track(error, severity, {
        component,
        action,
        metadata,
      });
    },
  };
}

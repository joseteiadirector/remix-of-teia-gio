/**
 * Sistema de Monitoramento Avançado
 * Métricas de performance, erros e health checks em tempo real
 */

import * as Sentry from '@sentry/react';

// Tipos de eventos monitorados
export type MonitoringEventType = 
  | 'api_call'
  | 'page_load'
  | 'user_action'
  | 'error'
  | 'performance'
  | 'cache_hit'
  | 'cache_miss';

interface MonitoringEvent {
  type: MonitoringEventType;
  name: string;
  duration?: number;
  metadata?: Record<string, any>;
  timestamp: number;
}

interface PerformanceMetrics {
  totalEvents: number;
  avgDuration: number;
  errorRate: number;
  cacheHitRate: number;
  apiCallCount: number;
  lastUpdate: number;
}

class MonitoringService {
  private events: MonitoringEvent[] = [];
  private maxEvents = 1000; // Manter últimos 1000 eventos
  private metricsInterval: number | null = null;

  constructor() {
    // Limpar eventos antigos periodicamente (a cada 5 min)
    this.metricsInterval = window.setInterval(() => {
      this.cleanOldEvents();
    }, 5 * 60 * 1000);
  }

  /**
   * Registra um evento de monitoramento
   */
  track(
    type: MonitoringEventType,
    name: string,
    options?: {
      duration?: number;
      metadata?: Record<string, any>;
      sendToSentry?: boolean;
    }
  ) {
    const event: MonitoringEvent = {
      type,
      name,
      duration: options?.duration,
      metadata: options?.metadata,
      timestamp: Date.now(),
    };

    // Adicionar aos eventos locais
    this.events.push(event);

    // Limitar tamanho do array
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Enviar para Sentry se configurado
    if (options?.sendToSentry && import.meta.env.VITE_SENTRY_DSN) {
      this.sendToSentry(event);
    }

    // Silent in production - logs only in development via logger
    import('@/utils/logger').then(({ logger }) => {
      logger.debug(`[Monitoring] ${type}:${name}`, options);
    });
  }

  /**
   * Mede duração de uma operação
   */
  async measure<T>(
    name: string,
    operation: () => Promise<T>,
    options?: {
      type?: MonitoringEventType;
      metadata?: Record<string, any>;
    }
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      this.track(options?.type || 'performance', name, {
        duration,
        metadata: options?.metadata,
        sendToSentry: duration > 3000, // Enviar para Sentry se > 3s
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.track('error', name, {
        duration,
        metadata: {
          ...options?.metadata,
          error: error instanceof Error ? error.message : String(error),
        },
        sendToSentry: true,
      });
      
      throw error;
    }
  }

  /**
   * Registra erro
   */
  trackError(error: Error, context?: Record<string, any>) {
    this.track('error', error.name, {
      metadata: {
        message: error.message,
        stack: error.stack,
        ...context,
      },
      sendToSentry: true,
    });

    // Enviar para Sentry com contexto
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error, {
        extra: context,
      });
    }
  }

  /**
   * Registra chamada de API
   */
  trackApiCall(
    endpoint: string,
    method: string,
    options?: {
      duration?: number;
      status?: number;
      cached?: boolean;
    }
  ) {
    const type = options?.cached ? 'cache_hit' : 'api_call';
    
    this.track(type, `${method} ${endpoint}`, {
      duration: options?.duration,
      metadata: {
        method,
        endpoint,
        status: options?.status,
        cached: options?.cached,
      },
      sendToSentry: options?.status && options.status >= 500, // Enviar erros 5xx
    });
  }

  /**
   * Obtém métricas agregadas
   */
  getMetrics(timeWindowMs: number = 5 * 60 * 1000): PerformanceMetrics {
    const now = Date.now();
    const recentEvents = this.events.filter(
      e => now - e.timestamp < timeWindowMs
    );

    const totalEvents = recentEvents.length;
    const errorEvents = recentEvents.filter(e => e.type === 'error').length;
    const cacheHits = recentEvents.filter(e => e.type === 'cache_hit').length;
    const cacheMisses = recentEvents.filter(e => e.type === 'cache_miss').length;
    const apiCalls = recentEvents.filter(e => e.type === 'api_call').length;
    
    const eventsWithDuration = recentEvents.filter(e => e.duration !== undefined);
    const avgDuration = eventsWithDuration.length > 0
      ? eventsWithDuration.reduce((sum, e) => sum + (e.duration || 0), 0) / eventsWithDuration.length
      : 0;

    const errorRate = totalEvents > 0 ? errorEvents / totalEvents : 0;
    const totalCacheEvents = cacheHits + cacheMisses;
    const cacheHitRate = totalCacheEvents > 0 ? cacheHits / totalCacheEvents : 0;

    return {
      totalEvents,
      avgDuration,
      errorRate,
      cacheHitRate,
      apiCallCount: apiCalls + cacheHits,
      lastUpdate: now,
    };
  }

  /**
   * Obtém eventos recentes
   */
  getRecentEvents(limit: number = 50): MonitoringEvent[] {
    return this.events.slice(-limit).reverse();
  }

  /**
   * Health check do sistema
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: PerformanceMetrics;
    issues: string[];
  } {
    const metrics = this.getMetrics();
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Verificar taxa de erro
    if (metrics.errorRate > 0.1) {
      issues.push(`Alta taxa de erro: ${(metrics.errorRate * 100).toFixed(1)}%`);
      status = 'unhealthy';
    } else if (metrics.errorRate > 0.05) {
      issues.push(`Taxa de erro elevada: ${(metrics.errorRate * 100).toFixed(1)}%`);
      status = 'degraded';
    }

    // Verificar performance
    if (metrics.avgDuration > 3000) {
      issues.push(`Performance degradada: ${metrics.avgDuration.toFixed(0)}ms média`);
      status = status === 'unhealthy' ? 'unhealthy' : 'degraded';
    } else if (metrics.avgDuration > 2000) {
      issues.push(`Performance lenta: ${metrics.avgDuration.toFixed(0)}ms média`);
      if (status === 'healthy') status = 'degraded';
    }

    // Verificar cache
    if (metrics.cacheHitRate < 0.5 && metrics.apiCallCount > 10) {
      issues.push(`Cache hit rate baixo: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
      if (status === 'healthy') status = 'degraded';
    }

    return { status, metrics, issues };
  }

  /**
   * Limpa eventos antigos (> 30 min)
   */
  private cleanOldEvents() {
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    this.events = this.events.filter(e => e.timestamp > thirtyMinutesAgo);
  }

  /**
   * Envia evento para Sentry
   */
  private sendToSentry(event: MonitoringEvent) {
    try {
      if (event.type === 'error') {
        Sentry.captureMessage(`${event.type}: ${event.name}`, {
          level: 'error',
          extra: event.metadata,
        });
      } else if (event.duration && event.duration > 3000) {
        Sentry.captureMessage(`Slow operation: ${event.name}`, {
          level: 'warning',
          extra: {
            duration: event.duration,
            ...event.metadata,
          },
        });
      }
    } catch (error) {
      console.error('[Monitoring] Failed to send to Sentry:', error);
    }
  }

  /**
   * Cleanup ao desmontar
   */
  destroy() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

// Helper hooks para facilitar uso
export const useMonitoring = () => {
  return {
    track: monitoring.track.bind(monitoring),
    measure: monitoring.measure.bind(monitoring),
    trackError: monitoring.trackError.bind(monitoring),
    trackApiCall: monitoring.trackApiCall.bind(monitoring),
    getMetrics: monitoring.getMetrics.bind(monitoring),
    getHealthStatus: monitoring.getHealthStatus.bind(monitoring),
  };
};

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100;

  startMeasure(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
      });
    };
  }

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Manter apenas as últimas N métricas
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
    
    // Log se a operação foi muito lenta (> 1s)
    if (metric.duration > 1000) {
      console.warn(`[PERFORMANCE] Operação lenta detectada: ${metric.name} levou ${metric.duration.toFixed(2)}ms`);
    }
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  getAverageDuration(name: string): number {
    const filtered = this.metrics.filter(m => m.name === name);
    if (filtered.length === 0) return 0;
    
    const total = filtered.reduce((sum, m) => sum + m.duration, 0);
    return total / filtered.length;
  }

  getSlowestOperations(limit: number = 5): PerformanceMetric[] {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  clear(): void {
    this.metrics = [];
  }

  printReport(): void {
    import('@/utils/logger').then(({ logger }) => {
      logger.debug('📊 Performance Report');
      
      const uniqueNames = [...new Set(this.metrics.map(m => m.name))];
      
      uniqueNames.forEach(name => {
        const avg = this.getAverageDuration(name);
        const count = this.metrics.filter(m => m.name === name).length;
        logger.debug(`${name}: ${avg.toFixed(2)}ms (${count} calls)`);
      });
      
      logger.debug('\n🐌 Slowest operations:');
      this.getSlowestOperations().forEach((m, i) => {
        logger.debug(`${i + 1}. ${m.name}: ${m.duration.toFixed(2)}ms`);
      });
    });
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Helper hook para usar no React
export function usePerformanceMonitor(name: string) {
  return {
    measure: <T,>(fn: () => T): T => {
      const end = performanceMonitor.startMeasure(name);
      try {
        const result = fn();
        end();
        return result;
      } catch (error) {
        end();
        throw error;
      }
    },
    measureAsync: async <T,>(fn: () => Promise<T>): Promise<T> => {
      const end = performanceMonitor.startMeasure(name);
      try {
        const result = await fn();
        end();
        return result;
      } catch (error) {
        end();
        throw error;
      }
    },
  };
}

// Web Vitals monitoring
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        import('@/utils/logger').then(({ logger }) => {
          logger.debug('📈 LCP:', entry);
        });
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // Observer não suportado
  }

  // First Input Delay
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        import('@/utils/logger').then(({ logger }) => {
          logger.debug('⚡ FID:', entry);
        });
      }
    }).observe({ entryTypes: ['first-input'] });
  } catch (e) {
    // Observer não suportado
  }

  // Cumulative Layout Shift
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          import('@/utils/logger').then(({ logger }) => {
            logger.debug('📐 CLS:', entry);
          });
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    // Observer não suportado
  }
}

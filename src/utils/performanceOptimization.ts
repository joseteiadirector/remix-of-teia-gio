/**
 * Performance optimization utilities
 */

/**
 * Defer non-critical resources
 */
export function deferNonCriticalResources(): void {
  // Defer third-party scripts
  const scripts = document.querySelectorAll('script[data-defer="true"]');
  scripts.forEach((script) => {
    script.setAttribute('defer', 'true');
  });
}

/**
 * Preconnect to critical domains
 */
export function preconnectCriticalDomains(domains: string[]): void {
  domains.forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Monitor Core Web Vitals
 */
export class WebVitalsMonitor {
  private static metrics: Record<string, number> = {};

  static recordMetric(name: string, value: number): void {
    this.metrics[name] = value;
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${name}: ${value.toFixed(2)}`);
    }
  }

  static getMetrics(): Record<string, number> {
    return this.metrics;
  }

  static reportToAnalytics(): void {
    // Send metrics to analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      Object.entries(this.metrics).forEach(([name, value]) => {
        window.gtag('event', name, {
          event_category: 'Web Vitals',
          value: Math.round(value),
          non_interaction: true,
        });
      });
    }
  }
}

/**
 * Lazy load images when they enter viewport
 */
export function setupLazyLoading(): void {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
}

/**
 * Optimize font loading
 */
export function optimizeFontLoading(): void {
  // Use font-display: swap
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Reduce layout shifts
 */
export function preventLayoutShifts(): void {
  // Add aspect ratio to images without dimensions
  const images = document.querySelectorAll('img:not([width]):not([height])');
  
  images.forEach((img: Element) => {
    const htmlImg = img as HTMLImageElement;
    if (htmlImg.naturalWidth && htmlImg.naturalHeight) {
      const aspectRatio = htmlImg.naturalWidth / htmlImg.naturalHeight;
      htmlImg.style.aspectRatio = aspectRatio.toString();
    }
  });
}

/**
 * Bundle size monitor
 */
export class BundleSizeMonitor {
  static async analyzeBundle(): Promise<{
    totalSize: number;
    chunks: Array<{ name: string; size: number }>;
  }> {
    const performance = window.performance;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const jsResources = resources.filter((r) => 
      r.name.endsWith('.js') || r.name.endsWith('.mjs')
    );
    
    const chunks = jsResources.map((r) => ({
      name: r.name.split('/').pop() || 'unknown',
      size: r.transferSize || 0,
    }));
    
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    
    return { totalSize, chunks };
  }

  static logBundleInfo(): void {
    this.analyzeBundle().then(({ totalSize, chunks }) => {
      console.log(`[Bundle] Total JS size: ${(totalSize / 1024).toFixed(2)}KB`);
      console.log('[Bundle] Top 5 chunks:');
      chunks
        .sort((a, b) => b.size - a.size)
        .slice(0, 5)
        .forEach((chunk) => {
          console.log(`  - ${chunk.name}: ${(chunk.size / 1024).toFixed(2)}KB`);
        });
    });
  }
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

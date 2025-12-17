/**
 * Image optimization utilities
 * Provides optimized image loading strategies
 */

import { logger } from '@/utils/logger';

interface ImageConfig {
  src: string;
  alt: string;
  loading?: 'lazy' | 'eager';
  className?: string;
}

export function getOptimizedImageProps(config: ImageConfig) {
  return {
    src: config.src,
    alt: config.alt,
    loading: config.loading || 'lazy',
    decoding: 'async' as const,
    className: config.className,
  };
}

export function preloadCriticalImages(imagePaths: string[]) {
  if (typeof window === 'undefined') return;
  
  imagePaths.forEach(path => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = path;
    document.head.appendChild(link);
  });
}

/**
 * Generate a tiny blur placeholder from an image
 * This creates a low-quality preview that loads instantly
 */
export function generateBlurDataURL(width: number = 10, height: number = 10): string {
  if (typeof window === 'undefined') return '';
  
  // Create a tiny colored rectangle as placeholder
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Create gradient for blur effect
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(120, 119, 198, 0.1)');
  gradient.addColorStop(0.5, 'rgba(74, 222, 128, 0.1)');
  gradient.addColorStop(1, 'rgba(251, 146, 60, 0.1)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
}

/**
 * Preload critical images for better LCP
 */
export function preloadImage(src: string, options?: {
  as?: 'image';
  fetchpriority?: 'high' | 'low' | 'auto';
  type?: string;
}): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = options?.as || 'image';
  link.href = src;
  
  if (options?.fetchpriority) {
    link.setAttribute('fetchpriority', options.fetchpriority);
  }
  
  if (options?.type) {
    link.type = options.type;
  }
  
  document.head.appendChild(link);
}

/**
 * Image loading performance metrics
 */
export class ImagePerformanceMonitor {
  private static metrics = new Map<string, number>();

  static recordLoadTime(src: string, startTime: number): void {
    const loadTime = performance.now() - startTime;
    this.metrics.set(src, loadTime);
    
    // Log performance for debugging
    if (loadTime > 2000) {
      logger.warn(`[IMG Performance] Slow load: ${src} (${loadTime.toFixed(0)}ms)`);
    }
  }

  static getMetrics(): Map<string, number> {
    return this.metrics;
  }

  static getAverageLoadTime(): number {
    const times = Array.from(this.metrics.values());
    if (times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
}

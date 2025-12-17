import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  srcSet?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
  quality?: number;
  blurDataURL?: string;
}

export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  sizes,
  srcSet,
  objectFit = 'cover',
  onLoad,
  onError,
  quality = 85,
  blurDataURL,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [imgError, setImgError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Gerar srcSet automaticamente para imagens responsivas
  const generateSrcSet = (baseSrc: string): string => {
    if (srcSet) return srcSet;
    
    // Se a imagem já tem srcSet definido, usar ele
    const widths = [320, 640, 768, 1024, 1280, 1920];
    const srcSetArray = widths
      .filter(w => !width || w <= width * 2) // Não gerar maiores que 2x a largura original
      .map(w => `${baseSrc}?w=${w}&q=${quality} ${w}w`)
      .join(', ');
    
    return srcSetArray || '';
  };

  // Otimizar sizes automaticamente baseado na largura
  const optimizedSizes = sizes || (
    width 
      ? `(max-width: 640px) 100vw, (max-width: 1024px) ${Math.min(width, 640)}px, ${width}px`
      : '100vw'
  );

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
    logger.debug('Imagem carregada', { src: src.substring(0, 50) });
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    logger.error('Falha ao carregar imagem', { src });
    setImgError(true);
    onError?.();
  };

  // Preload para imagens críticas
  useEffect(() => {
    if (priority && typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      if (srcSet || width) {
        link.setAttribute('imagesrcset', generateSrcSet(src));
        link.setAttribute('imagesizes', optimizedSizes);
      }
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src, srcSet, width]);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={{ aspectRatio: width && height ? `${width}/${height}` : undefined }}
    >
      {/* Blur placeholder if provided */}
      {!isLoaded && !imgError && blurDataURL && (
        <img
          src={blurDataURL}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl"
        />
      )}
      
      {/* Skeleton loader */}
      {!isLoaded && !imgError && !blurDataURL && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted" />
      )}

      {/* Image with error fallback */}
      {isInView && !imgError && (
        <picture>
          {/* AVIF format para browsers com suporte (melhor compressão) */}
          <source 
            type="image/avif"
            srcSet={generateSrcSet(src.replace(/\.(jpg|jpeg|png)$/i, '.avif'))}
            sizes={optimizedSizes}
          />
          
          {/* WebP format para browsers modernos (boa compressão) */}
          <source 
            type="image/webp"
            srcSet={generateSrcSet(src.replace(/\.(jpg|jpeg|png)$/i, '.webp'))}
            sizes={optimizedSizes}
          />
          
          {/* Fallback para formato original */}
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            srcSet={generateSrcSet(src)}
            sizes={optimizedSizes}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'w-full h-full transition-all duration-700 ease-out',
              objectFit === 'cover' && 'object-cover',
              objectFit === 'contain' && 'object-contain',
              objectFit === 'fill' && 'object-fill',
              objectFit === 'none' && 'object-none',
              objectFit === 'scale-down' && 'object-scale-down',
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            )}
            style={{
              contentVisibility: 'auto',
            }}
          />
        </picture>
      )}
      
      {/* Error fallback */}
      {imgError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
          Imagem não disponível
        </div>
      )}

      {/* Blur overlay during load */}
      {!isLoaded && isInView && !imgError && (
        <div className="absolute inset-0 backdrop-blur-xl" />
      )}
    </div>
  );
}

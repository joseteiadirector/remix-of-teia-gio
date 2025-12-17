/**
 * Helper para servir assets via CDN
 * Configurar VITE_CDN_URL no .env para produção
 */

const CDN_URL = import.meta.env.VITE_CDN_URL || '';

/**
 * Obter URL de asset com suporte para CDN
 * Em dev: retorna path local
 * Em prod com CDN: retorna CDN URL
 * 
 * @example
 * getCDNUrl('/images/logo.png') -> 'https://cdn.example.com/images/logo.png'
 */
export const getCDNUrl = (path: string): string => {
  if (!CDN_URL) {
    return path;
  }
  
  // Remover barra inicial se existir
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `${CDN_URL}/${cleanPath}`;
};

/**
 * Preload de asset via CDN
 * Útil para hero images e recursos críticos
 */
export const preloadCDNAsset = (path: string, as: 'image' | 'script' | 'style' = 'image') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = getCDNUrl(path);
  link.as = as;
  
  if (as === 'image') {
    link.type = 'image/jpeg'; // Ajustar baseado na extensão se necessário
  }
  
  document.head.appendChild(link);
};

/**
 * Obter srcset otimizado para responsive images via CDN
 * Requer CDN com suporte a transformação de imagens (Cloudflare Images, Vercel Image Optimization)
 */
export const getCDNSrcSet = (path: string, widths: number[] = [640, 750, 828, 1080, 1200]): string => {
  if (!CDN_URL) {
    return '';
  }
  
  return widths
    .map(width => `${getCDNUrl(path)}?w=${width} ${width}w`)
    .join(', ');
};

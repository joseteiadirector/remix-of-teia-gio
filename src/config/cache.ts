/**
 * Constantes de configuração de cache
 * Centralizando valores para facilitar manutenção
 */

export const CACHE_DURATIONS = {
  // Duração em milissegundos
  SUBSCRIPTION_CHECK: 5 * 60 * 1000, // 5 minutos
  QUERY_DEFAULT: 10 * 60 * 1000, // 10 minutos
  QUERY_STALE: 5 * 60 * 1000, // 5 minutos
  QUERY_GC: 30 * 60 * 1000, // 30 minutos
  
  // React Query específico
  REACT_QUERY: {
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  },
  
  // Por tipo de dado
  ALERTS: 2 * 60 * 1000, // 2 minutos (dados mais voláteis)
  SCORES: 5 * 60 * 1000, // 5 minutos
  BRANDS: 10 * 60 * 1000, // 10 minutos
  MENTIONS: 3 * 60 * 1000, // 3 minutos
  TRENDS: 15 * 60 * 1000, // 15 minutos
} as const;

export const PERFORMANCE = {
  // Limites de performance
  MAX_ITEMS_PER_PAGE: 50,
  DEBOUNCE_DELAY: 300, // ms
  THROTTLE_DELAY: 1000, // ms
  
  // Virtualização
  VIRTUAL_OVERSCAN: 10, // Itens extras renderizados
} as const;

export const LIMITS = {
  // Limites de API
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
  
  // Rate limiting
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minuto
  RATE_LIMIT_MAX_REQUESTS: 60,
} as const;

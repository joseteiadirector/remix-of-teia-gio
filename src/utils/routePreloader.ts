/**
 * Sistema de Preload Estratégico de Rotas
 * Carrega antecipadamente rotas frequentemente acessadas
 */

import { logger } from '@/utils/logger';

type PreloadableRoute =
  | 'Dashboard'
  | 'Brands'
  | 'Analytics'
  | 'Reports'
  | 'LLMMentions'
  | 'Scores';

interface PreloadConfig {
  priority: 'high' | 'medium' | 'low';
  timeout?: number;
}

const routeLoaders: Record<PreloadableRoute, () => Promise<any>> = {
  Dashboard: () => import('../pages/Dashboard'),
  Brands: () => import('../pages/Brands'),
  Analytics: () => import('../pages/Analytics'),
  Reports: () => import('../pages/Reports'),
  LLMMentions: () => import('../pages/LLMMentions'),
  Scores: () => import('../pages/Scores'),
};

const preloadConfigs: Record<PreloadableRoute, PreloadConfig> = {
  Dashboard: { priority: 'high' },
  Brands: { priority: 'high' },
  Analytics: { priority: 'medium', timeout: 2000 },
  Reports: { priority: 'medium', timeout: 3000 },
  LLMMentions: { priority: 'low', timeout: 5000 },
  Scores: { priority: 'medium', timeout: 2000 },
};

// Track preloaded routes
const preloadedRoutes = new Set<PreloadableRoute>();

/**
 * Preload uma rota específica
 */
export const preloadRoute = async (route: PreloadableRoute): Promise<void> => {
  if (preloadedRoutes.has(route)) {
    return; // Já carregada
  }

  const loader = routeLoaders[route];
  if (!loader) {
    logger.warn(`[RoutePreloader] Route "${route}" not found`);
    return;
  }

  try {
    await loader();
    preloadedRoutes.add(route);
    logger.info(`[RoutePreloader] ✅ Preloaded: ${route}`);
  } catch (error) {
    logger.error(`[RoutePreloader] ❌ Failed to preload ${route}:`, error);
  }
};

/**
 * Preload múltiplas rotas com priorização
 */
export const preloadRoutes = async (routes: PreloadableRoute[]): Promise<void> => {
  // Ordenar por prioridade
  const sortedRoutes = routes.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = preloadConfigs[a]?.priority || 'low';
    const bPriority = preloadConfigs[b]?.priority || 'low';
    return priorityOrder[aPriority] - priorityOrder[bPriority];
  });

  // Preload sequencialmente respeitando timeouts
  for (const route of sortedRoutes) {
    const config = preloadConfigs[route];
    
    if (config.timeout) {
      await new Promise(resolve => setTimeout(resolve, config.timeout));
    }
    
    await preloadRoute(route);
  }
};

/**
 * Preload automático de rotas críticas após login
 */
export const preloadCriticalRoutes = (): void => {
  // Usar requestIdleCallback se disponível
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadRoutes(['Dashboard', 'Brands', 'Analytics']);
    }, { timeout: 2000 });
  } else {
    // Fallback para setTimeout
    setTimeout(() => {
      preloadRoutes(['Dashboard', 'Brands', 'Analytics']);
    }, 1000);
  }
};

/**
 * Preload baseado em hover (mouse over em links)
 */
export const preloadOnHover = (route: PreloadableRoute) => {
  // Debounce para evitar preloads desnecessários
  const timeout = setTimeout(() => {
    preloadRoute(route);
  }, 100);

  return () => clearTimeout(timeout);
};

/**
 * Limpar cache de preload (útil para testes)
 */
export const clearPreloadCache = (): void => {
  preloadedRoutes.clear();
  logger.info('[RoutePreloader] Cache cleared');
};

// Log inicial
if (import.meta.env.DEV) {
  logger.info('[RoutePreloader] Sistema de preload ativo');
}

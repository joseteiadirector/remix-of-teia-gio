import { useEffect } from 'react';
import { preloadRoute, preloadOnHover } from '@/utils/routePreloader';

type PreloadableRoute = 
  | 'Dashboard'
  | 'Brands'
  | 'Analytics'
  | 'Reports'
  | 'LLMMentions'
  | 'Scores';

/**
 * Hook para preload de rotas com hover
 * Usa para links que você quer carregar antecipadamente
 * 
 * @example
 * const { onMouseEnter, onMouseLeave } = useRoutePreload('Dashboard');
 * <Link to="/dashboard" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
 */
export const useRoutePreload = (route: PreloadableRoute) => {
  let cleanup: (() => void) | undefined;

  const onMouseEnter = () => {
    cleanup = preloadOnHover(route);
  };

  const onMouseLeave = () => {
    if (cleanup) {
      cleanup();
    }
  };

  return { onMouseEnter, onMouseLeave };
};

/**
 * Hook para preload automático ao montar componente
 * Útil para páginas que você sabe que o usuário vai acessar
 * 
 * @example
 * useAutoPreload(['Dashboard', 'Brands']);
 */
export const useAutoPreload = (routes: PreloadableRoute[]) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      routes.forEach(route => preloadRoute(route));
    }, 500); // Delay de 500ms para não interferir com o render inicial

    return () => clearTimeout(timeout);
  }, []); // Executar apenas uma vez
};

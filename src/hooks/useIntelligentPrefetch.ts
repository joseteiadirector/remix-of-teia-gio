import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { intelligentPrefetch } from '@/utils/intelligentPrefetch';

/**
 * Hook para tracking automático de navegação e prefetch inteligente
 * Usar no componente raiz (App.tsx)
 */
export const useIntelligentPrefetch = () => {
  const location = useLocation();

  useEffect(() => {
    intelligentPrefetch.trackNavigation(location.pathname);
  }, [location.pathname]);
};

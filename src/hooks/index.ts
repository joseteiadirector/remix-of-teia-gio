/**
 * Central export file for all custom hooks
 * Import from here for better organization
 * 
 * @example
 * ```tsx
 * import { useMediaQuery, useLocalStorage, useClickOutside } from '@/hooks';
 * ```
 */

export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from './useMediaQuery';
export { useLocalStorage } from './useLocalStorage';
export { useClickOutside, useOnClickOutside } from './useClickOutside';
export { useAsync, useFetch } from './useAsync';
export type { UseAsyncState, UseAsyncReturn } from './useAsync';

// Re-export existing hooks
export { useDebounce } from './useDebounce';
export { usePagination } from './usePagination';
export { useRetry } from './useRetry';
export { useSubscriptionLimits } from './useSubscriptionLimits';
export { useDashboardConfig } from './useDashboardConfig';
export { useToast } from './use-toast';
export { useRealtimeKPIs } from './useRealtimeKPIs';
export { useRealtimeSync } from './useRealtimeSync';
export { useBroadcastChannel } from './useBroadcastChannel';
export { useRoutePreload, useAutoPreload } from './useRoutePreload';

// KAPI Metrics - Hook centralizado (fonte única de verdade)
export { useKAPIMetrics, useMultipleBrandsKAPIMetrics } from './useKAPIMetrics';
export type { KAPIMetricValue, KAPIMetricsData } from './useKAPIMetrics';

// Re-export i18n hook
export { useTranslation } from 'react-i18next';

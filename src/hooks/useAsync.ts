import { useState, useCallback, useEffect } from 'react';

export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

/**
 * Hook to handle async operations with loading, error, and data states
 * @param asyncFunction - Async function to execute
 * @param immediate - Whether to execute immediately on mount (default: false)
 * @returns Object with data, loading, error, execute, and reset
 * 
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useAsync(
 *   async (brandId: string) => {
 *     const response = await fetch(`/api/brands/${brandId}`);
 *     return response.json();
 *   }
 * );
 * 
 * return (
 *   <div>
 *     <button onClick={() => execute('123')} disabled={loading}>
 *       Load Brand
 *     </button>
 *     {loading && <LoadingSpinner />}
 *     {error && <ErrorMessage error={error} />}
 *     {data && <BrandDetails brand={data} />}
 *   </div>
 * );
 * ```
 */
export function useAsync<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  immediate = false
): UseAsyncReturn<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  // Execute the async function
  const execute = useCallback(
    async (...args: any[]) => {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await asyncFunction(...args);
        setState({ data: response, loading: false, error: null });
      } catch (error) {
        setState({ 
          data: null, 
          loading: false, 
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    },
    [asyncFunction]
  );

  // Reset state
  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Simplified hook for data fetching with automatic execution
 * @param asyncFunction - Async function to execute
 * @param deps - Dependencies array (similar to useEffect)
 * @returns Object with data, loading, error, and refetch
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useFetch(
 *   () => fetch('/api/brands').then(r => r.json()),
 *   []
 * );
 * 
 * return (
 *   <div>
 *     {loading && <LoadingSpinner />}
 *     {error && <ErrorMessage error={error} />}
 *     {data && <BrandList brands={data} />}
 *     <button onClick={refetch}>Refresh</button>
 *   </div>
 * );
 * ```
 */
export function useFetch<T = any>(
  asyncFunction: () => Promise<T>,
  deps: any[] = []
): UseAsyncState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await asyncFunction();
      setState({ data: response, loading: false, error: null });
    } catch (error) {
      setState({ 
        data: null, 
        loading: false, 
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
  }, [asyncFunction]);

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    ...state,
    refetch,
  };
}

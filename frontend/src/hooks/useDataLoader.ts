import { useCallback, useEffect, useRef, useState, type DependencyList, type Dispatch, type SetStateAction } from 'react';

interface UseDataLoaderOptions {
  enabled?: boolean;
}

interface UseDataLoaderResult<TData> {
  data: TData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<TData | null>;
  setData: Dispatch<SetStateAction<TData | null>>;
}

export function useDataLoader<TData>(
  loadData: () => Promise<TData>,
  dependencies: DependencyList = [],
  options: UseDataLoaderOptions = {},
): UseDataLoaderResult<TData> {
  const { enabled = true } = options;
  const [data, setData] = useState<TData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const requestCounterRef = useRef(0);

  const refetch = useCallback(async (): Promise<TData | null> => {
    if (!enabled) {
      setLoading(false);
      return null;
    }

    const requestId = requestCounterRef.current + 1;
    requestCounterRef.current = requestId;
    setLoading(true);
    setError(null);

    try {
      const response = await loadData();
      if (requestCounterRef.current === requestId) {
        setData(response);
      }
      return response;
    } catch (caughtError) {
      const normalizedError = caughtError instanceof Error ? caughtError : new Error('Data load failed');
      if (requestCounterRef.current === requestId) {
        setError(normalizedError);
      }
      return null;
    } finally {
      if (requestCounterRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [enabled, loadData]);

  useEffect(() => {
    void refetch();
  }, [refetch, ...dependencies]);

  return { data, loading, error, refetch, setData };
}

import { useEffect } from "react";
import { useState } from "react";

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependency: number | string | boolean | undefined = 0,
): { data: T | null; error: Error | null; isLoading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await asyncFunction();
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [asyncFunction, dependency]);

  return { data, error, isLoading };
}

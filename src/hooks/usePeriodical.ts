import { useEffect } from "react";

export function usePeriodical(callback: () => void, interval: number, isLoading: boolean, dependency: (string | number | boolean | undefined) = 0) {
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        if (!isLoading) {
            timeoutId = setTimeout(callback, interval);
        }
        return () => clearTimeout(timeoutId);
    }, [isLoading, interval, callback, dependency]);
}
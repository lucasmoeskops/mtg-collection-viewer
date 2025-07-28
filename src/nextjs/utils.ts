export const fetchWithRevalidateBuilder = (seconds: number = 3600) => (input: URL | RequestInfo, init?: RequestInit) => {
    const request = new Request(input, { ...init, next: { revalidate: seconds } });
    return fetch(request);
};

import { useRouter, useSearchParams } from "next/navigation";

export function updateQueryParams(
    router: ReturnType<typeof useRouter>,
    searchParams: ReturnType<typeof useSearchParams>,
    newParams: Record<string, string | number | boolean | undefined>,
    clearExisting: boolean = false,
): void {
    let changed = false;
    if (clearExisting) {
        console.log("Clearing existing query parameters:", searchParams.toString());
    } else {
        console.log("Current query parameters before update:", searchParams.toString());
    }
    const finalSearchParams = clearExisting ? new URLSearchParams() : new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
        if (value !== searchParams.get(key) || !value && searchParams.has(key)) {
            if (!value) {
                finalSearchParams.delete(key);
            } else {
                finalSearchParams.set(key, String(value));
            }
            changed = true;
        }
    });

    console.log("Final query parameters:", finalSearchParams.toString());

    if (changed) {
        router.push(`?${finalSearchParams.toString()}`, { scroll: true });
    }
}

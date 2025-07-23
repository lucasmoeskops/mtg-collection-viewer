import { useRouter, useSearchParams } from "next/navigation";

export function updateQueryParams(
    router: ReturnType<typeof useRouter>,
    searchParams: ReturnType<typeof useSearchParams>,
    newParams: Record<string, string | number | boolean | undefined>,
): void {
    let changed = false;
    const finalSearchParams = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
        if (value !== searchParams.get(key)) {
            if (value === undefined) {
                finalSearchParams.delete(key);
            } else {
                finalSearchParams.set(key, String(value));
            }
            changed = true;
        }
    });

    if (changed) {
        router.push(`?${finalSearchParams.toString()}`, { scroll: true });
    }
}

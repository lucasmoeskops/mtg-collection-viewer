export type Amount = {
    server: number;
    local: number;
}

export function initializeAmount(number: number): Amount {
    return {
        server: number,
        local: number,
    };
}

export function isUnsaved(amount: Amount): boolean {
    return amount.server !== amount.local;
}
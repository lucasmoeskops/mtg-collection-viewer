'use client'

import MagicCardLike from "@/interfaces/MagicCardLike"
import { getAccountIdByUsername, getAllCards } from "@/supabase/helpers"
import { createContext, ReactNode, useCallback, useState } from "react"

export type AccountContextProps = {
    accountId: number,
    cards: MagicCardLike[],
    errorCode: number,
    isLoading: boolean,
    setAccountIdByUsername: (username: string) => Promise<void>,
}

export type AccountProviderProps = {
    children: ReactNode | ReactNode[]
}

export const AccountContext = createContext<AccountContextProps>({
    accountId: -1,
    cards: [],
    errorCode: 0,
    isLoading: true,
    setAccountIdByUsername: () => Promise.resolve(),
})

export default function AccountProvider({ children }: AccountProviderProps) {
    const [accountId, setAccountId] = useState<number>(-1)
    const [cards, setCards] = useState<MagicCardLike[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorCode, setErrorCode] = useState<number>(0);

    const setAccountIdByUsername = useCallback(async (username: string) => {
        setIsLoading(true)
        const newAccountId = await getAccountIdByUsername(username)
        if (newAccountId !== accountId) {
            const cards = newAccountId && newAccountId > 0 ? (await getAllCards(newAccountId || -1)) : []
            setAccountId(newAccountId || -1)
            setCards(cards)
        }
        if (!newAccountId) {
            setErrorCode(1)
        } else if (errorCode === 1) {
            setErrorCode(0)
        }
        setIsLoading(false)
    }, [accountId, errorCode]);

    const value: AccountContextProps = {
        accountId,
        cards,
        errorCode,
        isLoading,
        setAccountIdByUsername,
    }

    return <AccountContext.Provider value={value}>
        {children}
    </AccountContext.Provider>
}
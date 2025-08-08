'use client'

import MagicCardLike from "@/interfaces/MagicCardLike"
import { getAccountIdByUsername, getAllCards } from "@/supabase/helpers"
import { createContext, ReactNode, useCallback, useState } from "react"

export type AccountContextProps = {
    accountId: number,
    cards: MagicCardLike[],
    setAccountIdByUsername: (username: string) => Promise<void>,
}

export type AccountProviderProps = {
    children: ReactNode | ReactNode[]
}

export const AccountContext = createContext<AccountContextProps>({
    accountId: -1,
    cards: [],
    setAccountIdByUsername: () => Promise.resolve(),
})

export default function AccountProvider({ children }: AccountProviderProps) {
    const [accountId, setAccountId] = useState<number>(-1)
    const [cards, setCards] = useState<MagicCardLike[]>([])

    const setAccountIdByUsername = useCallback(async (username: string) => {
        const newAccountId = await getAccountIdByUsername(username)
        if (newAccountId !== accountId) {
            const cards = newAccountId && newAccountId > 0 ? (await getAllCards(newAccountId || -1)) : []
            setAccountId(newAccountId || -1)
            setCards(cards)
        }
    }, [accountId]);

    const value: AccountContextProps = {
        accountId,
        cards,
        setAccountIdByUsername,
    }

    return <AccountContext.Provider value={value}>
        {children}
    </AccountContext.Provider>
}
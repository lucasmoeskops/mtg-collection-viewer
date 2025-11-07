'use client'


import MagicCardLike, { getCard, newEmptyCard } from "@/interfaces/MagicCardLike"
import { getRandomCard } from "@/supabase/server";
import { createContext, ReactNode, useCallback, useEffect, useRef, useState } from "react"


async function fetchBackground(): Promise<MagicCardLike | null> {
    const card = await getRandomCard();
    if (!card) {
        return null;
    }
    const cardFromScryfall = await getCard(card.series, card.cardnumber.toString());
    if (!cardFromScryfall || !cardFromScryfall.art_crop_url) {
        return null;
    }
    return cardFromScryfall;
}

export type BackgroundContextProps = {
    backgroundCard: MagicCardLike | null,
    isRefreshing: boolean,
    refreshBackgroundCard: () => Promise<void>,
}

export type BackgroundContextProviderProps = {
    children: ReactNode | ReactNode[]
}

export const BackgroundContext = createContext<BackgroundContextProps>({
    backgroundCard: null,
    isRefreshing: false,
    refreshBackgroundCard: async () => {},
})

export default function BackgroundContextProvider({ children }: BackgroundContextProviderProps) {
    const [card, setCard] = useState<MagicCardLike | null>(newEmptyCard());
    const [isRefreshing, setIsRefreshing] = useState<boolean>(true);
    const initialCardFetched = useRef<boolean>(false);

    const refreshBackgroundCard = useCallback(async () => {
        setIsRefreshing(true);
        const [card] = await Promise.all([
            fetchBackground(), 
            // Don't change the background too quickly
            new Promise(resolve => setTimeout(resolve, 1500))
        ]);
        setCard(card);
        setIsRefreshing(false);
    }, []);

    useEffect(() => {
        if (initialCardFetched.current) {
            return;
        }
        initialCardFetched.current = true;
        refreshBackgroundCard();
    }, [refreshBackgroundCard]);

    const value: BackgroundContextProps = {
        backgroundCard: card,
        isRefreshing,
        refreshBackgroundCard,
    };

    return <BackgroundContext.Provider value={value}>
        {children}
    </BackgroundContext.Provider>
}
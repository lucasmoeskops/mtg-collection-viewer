'use client'

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react"
import { CardSet } from "@/types/CardSet"
import { BoundMTGCard } from "@/types/BoundMTGCard"
import { getCardHash, getCardsForSet, MTGCard } from "@/types/MTGCard"
import { debounce } from "@mui/material"
import { getOwnedCardsForSet, saveCardChanges } from "@/supabase/editor"
import { initializeAmount } from "@/types/Amount"
import { getCardOwnershipCardHash } from "@/types/CardOwnershipData"
import { CardChange, getCardChangeHash } from "@/types/CardChange"
import { AccountContext } from "./AccountContextProvider"


export type CardEditorContextProps = {
    cards: BoundMTGCard[],
    set: CardSet | null,
    addCardChange: (change: CardChange) => void,
    setSet: (set: CardSet | null) => void,
}

export type CardEditorContextProviderProps = {
    children: ReactNode | ReactNode[]
}

export const CardEditorContext = createContext<CardEditorContextProps>({
    cards: [],
    set: null,
    addCardChange: () => {},
    setSet: () => {},
});

export default function CardEditorContextProvider({ children }: CardEditorContextProviderProps) {
    const { accountName, accountKey, isAuthenticated, invalidateCardData } = useContext(AccountContext);
    const [cards, setCards] = useState<MTGCard[]>([]);
    const [ownershipData, setOwnershipData] = useState<{[cardId: string]: number}>({});
    const [boundCards, setBoundCards] = useState<BoundMTGCard[]>([]);
    const [set, setSet] = useState<CardSet | null>(null);
    const [cardChangeQueue, setCardChangeQueue] = useState<CardChange[]>([]);

    function addCardChange(change: CardChange) {
        console.log('addCardChange', cardChangeQueue);
        setCardChangeQueue(prev => [...prev, change]);
    }

    const debouncedPushCardChanges = useMemo(() => debounce(async (changes: CardChange[]) => {
        const changeCombineMap = new Map<string, CardChange>();
        for (const change of changes) {
            const key = getCardChangeHash(change);
            changeCombineMap.set(key, change);
        }
        const combinedChanges = Array.from(changeCombineMap.values());
        if (combinedChanges.length === 0) {
            return;
        }
        // Clear the queue
        setCardChangeQueue(prev => prev.slice(changes.length));
        const succesfullChanges = await saveCardChanges(accountName, accountKey, combinedChanges);
        setOwnershipData(prev => {
            const updated = { ...prev };
            for (const change of succesfullChanges) {
                const cardId = getCardOwnershipCardHash(change);
                updated[cardId] = change.amount;
            }
            return updated;
        });
        invalidateCardData();
    }, 300), [accountName, accountKey, setCardChangeQueue, invalidateCardData]);

    const value = {
        cards: boundCards,
        set,
        accountName,
        accountKey,
        addCardChange,
        setSet
    };

    useEffect(() => {
        async function loadCards(setCode: string) {
            const cards = await getCardsForSet(setCode);
            setCards(cards);
        }
        setCards([]);
        setCardChangeQueue([]);
        setOwnershipData({});
        setBoundCards([]);

        if (set && set.code) {
            loadCards(set.code);
        }
    }, [set]);

    useEffect(() => {
        async function loadOwnershipData(setCode: string, name: string, key: string) {
            try {
                const cardsWithOwnership = await getOwnedCardsForSet(setCode, name, key);
                const ownershipMap: {[cardId: string]: number} = {};
                cardsWithOwnership.forEach(card => {
                    ownershipMap[getCardOwnershipCardHash(card)] = card.amount;
                });
                setOwnershipData(ownershipMap);
            } catch (error) {
                setOwnershipData({});
                console.error('Error fetching ownership data:', error);
            }
        }
        setOwnershipData({});

        if (set && set.code && isAuthenticated) {
            loadOwnershipData(set.code, accountName, accountKey);
        }
    }, [set, isAuthenticated, accountName, accountKey]);

    useEffect(() => {
        const combined = cards.map(card => {
            const cardIdNonFoil = getCardHash(card, false);
            const cardIdFoil = getCardHash(card, true);
            return {
                card,
                amount: initializeAmount(ownershipData[cardIdNonFoil] || 0),
                amountFoil: initializeAmount(ownershipData[cardIdFoil] || 0),
            };
        });
        setBoundCards(combined);
    }, [cards, ownershipData]);

    useEffect(() => {
        if (cardChangeQueue.length > 0) {
            console.log('Scheduling push of card changes', cardChangeQueue);
            debouncedPushCardChanges(cardChangeQueue);
        }
    }, [cardChangeQueue, debouncedPushCardChanges]);

    return <CardEditorContext.Provider value={value}>
        {children}
    </CardEditorContext.Provider>
}
'use client'

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react"
import { CardSet } from "@/types/CardSet"
import { BoundMTGCard } from "@/types/BoundMTGCard"
import { getCardHash, getCardsByQuery, getCardsForSet, MTGCard } from "@/types/MTGCard"
import { debounce } from "@mui/material"
import { getOwnedCardsForSet, saveCardChanges } from "@/supabase/editor"
import { initializeAmount } from "@/types/Amount"
import { getCardOwnershipCardHash } from "@/types/CardOwnershipData"
import { CardChange, getCardChangeHash } from "@/types/CardChange"
import { AccountContext } from "./AccountContextProvider"


export type CardEditorContextProps = {
    cards: BoundMTGCard[],
    set: CardSet | null,
    query: string,
    addCardChange: (change: CardChange) => void,
    setSet: (set: CardSet | null) => void,
    setQuery: (query: string) => void,
}

export type CardEditorContextProviderProps = {
    children: ReactNode | ReactNode[]
}

export const CardEditorContext = createContext<CardEditorContextProps>({
    cards: [],
    set: null,
    query: '',
    addCardChange: () => {},
    setSet: () => {},
    setQuery: () => {},
});

export default function CardEditorContextProvider({ children }: CardEditorContextProviderProps) {
    const { accountName, accountKey, isAuthenticated, invalidateCardData } = useContext(AccountContext);
    const [cards, setCards] = useState<MTGCard[]>([]);
    const [ownershipData, setOwnershipData] = useState<{[cardId: string]: number}>({});
    const [boundCards, setBoundCards] = useState<BoundMTGCard[]>([]);
    const [set, setSet] = useState<CardSet | null>(null);
    const [query, setQuery] = useState<string>('');
    const [cardChangeQueue, setCardChangeQueue] = useState<CardChange[]>([]);
    const [loadingSets, setLoadingSets] = useState<Set<string>>(new Set());
    const [loadedSets, setLoadedSets] = useState<Set<string>>(new Set());

    function addCardChange(change: CardChange) {
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
        query,
        accountName,
        accountKey,
        addCardChange,
        setSet,
        setQuery,
    };

    useEffect(() => {
        async function loadCards(setCode: string | undefined) {
            let allCards: MTGCard[] = [];
            if (query.trim().length > 0) {
                allCards = await getCardsByQuery(query, setCode);
            } else if (setCode) {
                allCards = await getCardsForSet(setCode);
            } else {
                allCards = [];
            }
            if (relevant) {
                setCards(allCards);
            }
        }
        let relevant = true;
        setCards([]);
        setCardChangeQueue([]);
        setBoundCards([]);

        if (set && set.code) {
            loadCards(set.code);
        } else if (query.trim().length > 0) {
            loadCards(undefined);
        }
        return () => {
            relevant = false;
        };
    }, [set, query]);

    useEffect(() => {
        async function loadOwnershipData(setCodes: string[], name: string, key: string) {
            for (const setCode of setCodes) {
                if (loadingSets.has(setCode)) {
                    return;
                }
                try {
                    const ownershipMap: {[cardId: string]: number} = {};
                    const cardsWithOwnership = await getOwnedCardsForSet(setCode, name, key);
                    cardsWithOwnership.forEach(card => {
                        ownershipMap[getCardOwnershipCardHash(card)] = card.amount;
                    });
                    setOwnershipData(oldOwnershipMap => ({ ...oldOwnershipMap, ...ownershipMap }));
                    setLoadedSets(prev => new Set(prev).add(setCode));
                } catch (error) {
                    console.error('Error fetching ownership data:', error);
                }
            }
        }

        if (!isAuthenticated) {
            return;
        }

        const currentSets = new Set<string>();
        for (const card of cards) {
            currentSets.add(card.setId);
        }
        if (currentSets.difference(loadingSets).size > 0) {
            loadOwnershipData(Array.from(currentSets), accountName, accountKey);
            setLoadingSets(prev => new Set(prev).union(currentSets));
        }
    }, [cards, isAuthenticated, accountName, accountKey, loadingSets]);

    useEffect(() => {
        const combined = cards.filter(card => loadedSets.has(card.setId)).map(card => {
            const cardIdNonFoil = getCardHash(card, false);
            const cardIdFoil = getCardHash(card, true);
            return {
                card,
                amount: initializeAmount(ownershipData[cardIdNonFoil] || 0),
                amountFoil: initializeAmount(ownershipData[cardIdFoil] || 0),
            };
        });
        setBoundCards(combined);
    }, [cards, loadedSets, ownershipData]);

    useEffect(() => {
        if (cardChangeQueue.length > 0) {
            debouncedPushCardChanges(cardChangeQueue);
        }
    }, [cardChangeQueue, debouncedPushCardChanges]);

    return <CardEditorContext.Provider value={value}>
        {children}
    </CardEditorContext.Provider>
}
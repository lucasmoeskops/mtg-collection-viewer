"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CardSet } from "@/types/CardSet";
import { BoundMTGCard } from "@/types/BoundMTGCard";
import {
  MTGCard,
  getCardHash,
  getCardsByQuery,
  getCardsForSet,
} from "@/types/MTGCard";
import { debounce } from "@mui/material";
import { getOwnedCardsForSets, saveCardChanges } from "@/db/editor";
import { initializeAmount } from "@/types/Amount";
import { getCardOwnershipCardHash } from "@/types/CardOwnershipData";
import { CardChange, getCardChangeHash } from "@/types/CardChange";
import { AccountContext } from "./AccountContextProvider";
import { useAsync } from "@/hooks/useAsync";

export type CardEditorContextProps = {
  cards: BoundMTGCard[];
  set: CardSet | null;
  query: string;
  isLoading: boolean;
  addCardChange: (change: CardChange) => void;
  setSet: (set: CardSet | null) => void;
  setQuery: (query: string) => void;
};

export type CardEditorContextProviderProps = {
  children: ReactNode | ReactNode[];
};

export const CardEditorContext = createContext<CardEditorContextProps>({
  cards: [],
  set: null,
  query: "",
  isLoading: false,
  addCardChange: () => {},
  setSet: () => {},
  setQuery: () => {},
});

async function updateCards(query: string, setCode: string | false) {
  let allCards: MTGCard[] = [];
  if (query.trim().length > 0) {
    allCards = await getCardsByQuery(query, setCode || undefined);
  } else if (setCode) {
    allCards = await getCardsForSet(setCode);
  } else {
    allCards = [];
  }
  return allCards;
}

export default function CardEditorContextProvider({
  children,
}: CardEditorContextProviderProps) {
  const { accountName, accountKey, isAuthenticated, invalidateCardData } =
    useContext(AccountContext);
  const [ownershipData, setOwnershipData] = useState<{
    [cardId: string]: number;
  }>({});
  const [set, setSet] = useState<CardSet | null>(null);
  const [query, setQuery] = useState<string>("");
  const [cardChangeQueue, setCardChangeQueue] = useState<CardChange[]>([]);
  const [loadingSets, setLoadingSets] = useState<Set<string>>(new Set());
  const [loadedSets, setLoadedSets] = useState<Set<string>>(new Set());

  function addCardChange(change: CardChange) {
    setCardChangeQueue((prev) => [...prev, change]);
  }

  const debouncedPushCardChanges = useMemo(
    () =>
      debounce(async (changes: CardChange[]) => {
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
        setCardChangeQueue((prev) => prev.slice(changes.length));
        const succesfullChanges = await saveCardChanges(
          accountName,
          accountKey,
          combinedChanges,
        );
        setOwnershipData((prev) => {
          const updated = { ...prev };
          for (const change of succesfullChanges) {
            const cardId = getCardOwnershipCardHash(change);
            updated[cardId] = change.amount;
          }
          return updated;
        });
        invalidateCardData();
      }, 300),
    [accountName, accountKey, setCardChangeQueue, invalidateCardData],
  );

  const setCode = useMemo(() => set?.code || false, [set]);
  const updateCardsCallback = useCallback(
    () => updateCards(query, setCode),
    [query, setCode],
  );

  const { data: cards, isLoading } = useAsync<MTGCard[]>(updateCardsCallback);

  const boundCards = useMemo(() => {
    return cards
      ?.filter((card) => loadedSets.has(card.setId))
      .map((card) => {
        const cardIdNonFoil = getCardHash(card, false);
        const cardIdFoil = getCardHash(card, true);
        return {
          card,
          amount: initializeAmount(ownershipData[cardIdNonFoil] || 0),
          amountFoil: initializeAmount(ownershipData[cardIdFoil] || 0),
        };
      });
  }, [cards, loadedSets, ownershipData]);

  const value = {
    cards: boundCards || [],
    set,
    query,
    accountName,
    accountKey,
    isLoading: isLoading || loadedSets.size < loadingSets.size,
    addCardChange,
    setSet,
    setQuery,
  };

  useEffect(() => {
    async function loadOwnershipData(
      setCodes: string[],
      name: string,
      key: string,
    ) {
      const ownershipMap: { [cardId: string]: number } = {};
      setLoadingSets((prev) => new Set(prev).union(currentSets));
      try {
        const cardsWithOwnership = await getOwnedCardsForSets(
          setCodes,
          name,
          key,
        );
        cardsWithOwnership.forEach((card) => {
          ownershipMap[getCardOwnershipCardHash(card)] = card.amount;
        });
      } catch (error) {
        console.error("Error fetching ownership data:", error);
        return;
      }
      setOwnershipData((oldOwnershipMap) => ({
        ...oldOwnershipMap,
        ...ownershipMap,
      }));
      setLoadedSets((prev) => new Set(prev).union(new Set(setCodes)));
    }

    if (!isAuthenticated) {
      return;
    }

    const currentSets = new Set<string>();
    for (const card of cards || []) {
      currentSets.add(card.setId);
    }
    if (currentSets.difference(loadingSets).size > 0) {
      loadOwnershipData(
        Array.from(currentSets.difference(loadingSets)),
        accountName,
        accountKey,
      );
    }
  }, [cards, isAuthenticated, accountName, accountKey, loadingSets]);

  if (cardChangeQueue.length > 0) {
    debouncedPushCardChanges(cardChangeQueue);
  }

  return (
    <CardEditorContext.Provider value={value}>
      {children}
    </CardEditorContext.Provider>
  );
}

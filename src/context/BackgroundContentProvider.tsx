"use client";

import { useAsync } from "@/hooks/useAsync";
import MagicCardLike, { getCard } from "@/interfaces/MagicCardLike";
import { getRandomCard } from "@/supabase/server";
import { ReactNode, createContext, useState } from "react";

async function fetchBackground(): Promise<MagicCardLike | null> {
  const card = await getRandomCard();
  if (!card) {
    return null;
  }
  const cardFromScryfall = await getCard(
    card.series,
    card.cardnumber.toString(),
  );
  if (!cardFromScryfall || !cardFromScryfall.art_crop_url) {
    return null;
  }
  cardFromScryfall.id = card.id;
  return cardFromScryfall;
}

export type BackgroundContextProps = {
  backgroundCard: MagicCardLike | null;
  isRefreshing: boolean;
  refreshBackgroundCard: () => void;
};

export type BackgroundContextProviderProps = {
  children: ReactNode | ReactNode[];
};

export const BackgroundContext = createContext<BackgroundContextProps>({
  backgroundCard: null,
  isRefreshing: false,
  refreshBackgroundCard: () => {},
});

export default function BackgroundContextProvider({
  children,
}: BackgroundContextProviderProps) {
  const [counter, setCounter] = useState<number>(0);
  const { data: card, isLoading } = useAsync<MagicCardLike | null>(
    fetchBackground,
    counter,
  );

  const refreshBackgroundCard = () => {
    setCounter((prev) => prev + 1);
  };

  const value: BackgroundContextProps = {
    backgroundCard: card,
    isRefreshing: isLoading,
    refreshBackgroundCard,
  };

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
}

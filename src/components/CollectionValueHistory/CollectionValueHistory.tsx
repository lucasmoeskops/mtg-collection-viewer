"use client";

import { AccountContext } from "@/context/AccountContextProvider";
import { getCollectionValueHistory } from "@/db/collection-value";
import { useContext } from "react";
import { GraphPopover } from "../Price/Price";

/** Graph button for the value of the whole collection over time (not just the selected cards). */
export function CollectionValueHistory() {
  const { accountId } = useContext(AccountContext);

  if (accountId === -1) {
    return null;
  }

  return (
    <GraphPopover
      history={{
        title: "Collection value over time (all cards, dashed = estimated)",
        load: () => getCollectionValueHistory(accountId),
      }}
    />
  );
}

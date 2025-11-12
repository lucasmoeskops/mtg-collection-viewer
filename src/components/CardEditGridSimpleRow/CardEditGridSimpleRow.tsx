'use client';

import { BoundMTGCard } from "@/types/BoundMTGCard";
import { TableCell, TableRow } from "@mui/material";
import { AmountEditor } from "../AmountEditor/AmountEditor";
import { useContext } from "react";
import { CardEditorContext } from "@/context/CardEditorContextProvider";
import { fromCard } from "@/types/CardChange";
import { AccountContext } from "@/context/AccountContextProvider";

type CardGridRowProps = {
    card: BoundMTGCard;
};

export default function CardGridRow({ card }: CardGridRowProps) {
    const { addCardChange, set } = useContext(CardEditorContext);
    const { isAuthenticated } = useContext(AccountContext);
    const { card: { id, name, collectorNumber, color, rarity }, amount, amountFoil } = card;

    function onAmountChange(newAmount: number) {
        addCardChange(fromCard(card.card, false, newAmount));
    }

    function onAmountFoilChange(newAmount: number) {
        addCardChange(fromCard(card.card, true, newAmount));
    }

    return (
        <TableRow key={id}>
            <TableCell>{name}</TableCell>
            {!set && <TableCell>{card.card.series}</TableCell>}
            <TableCell>{collectorNumber}</TableCell>
            <TableCell>{color}</TableCell>
            <TableCell>{rarity}</TableCell>
            <TableCell>
                {isAuthenticated ? <AmountEditor key={amount.server} amount={amount.server} onAmountChange={onAmountChange} /> : '-'}
            </TableCell>
            <TableCell>
                {isAuthenticated ? <AmountEditor key={amountFoil.server} amount={amountFoil.server} onAmountChange={onAmountFoilChange} /> : '-'}
            </TableCell>
        </TableRow>
    );
}
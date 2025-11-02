'use client';

import { BoundMTGCard } from "@/types/BoundMTGCard";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { AmountEditor } from "../AmountEditor/AmountEditor";
import { useContext } from "react";
import { CardEditorContext } from "@/context/CardEditorContextProvider";
import { fromCard } from "@/types/CardChange";
import { AccountContext } from "@/context/AccountContextProvider";

export type CardEditGridSimpleProps = {
    cards: BoundMTGCard[];
};

type CardGridRowProps = {
    card: BoundMTGCard;
};

function CardGridRow({ card }: CardGridRowProps) {
    const { addCardChange } = useContext(CardEditorContext);
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

export function CardEditGridSimple({ cards }: CardEditGridSimpleProps) {
    return (
        <div>
            <Table key={cards.length}>
                <TableHead>
                    <TableRow>
                        <TableCell>Card Name</TableCell>
                        <TableCell>Collector Number</TableCell>
                        <TableCell>Color</TableCell>
                        <TableCell>Rarity</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Amount foil</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {cards.map(card => CardGridRow({ card }))}
                </TableBody>
            </Table>
        </div>
    );
}
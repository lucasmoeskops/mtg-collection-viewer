'use client';

import { BoundMTGCard } from "@/types/BoundMTGCard";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { useContext } from "react";
import { CardEditorContext } from "@/context/CardEditorContextProvider";
import CardGridRow from "../CardEditGridSimpleRow/CardEditGridSimpleRow";

export type CardEditGridSimpleProps = {
    cards: BoundMTGCard[];
};


export function CardEditGridSimple({ cards }: CardEditGridSimpleProps) {
    const { set } = useContext(CardEditorContext);

    return (
        <TableContainer key={cards.length}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Card Name</TableCell>
                        {!set && <TableCell>Set</TableCell>}
                        <TableCell>Collector Number</TableCell>
                        <TableCell>Color</TableCell>
                        <TableCell>Rarity</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Amount foil</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {cards.map(card => <CardGridRow key={card.card.id} card={card} />)}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
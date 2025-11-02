'use client';

import { Button } from "@mui/material";
import { useState } from "react";

export type AmountEditorProps = {
    amount: number;
    onAmountChange: (newAmount: number) => void;
}

export function AmountEditor({ amount, onAmountChange }: AmountEditorProps) {
    const [displayAmount, setDisplayAmount] = useState<number>(amount);

    function increment() {
        setDisplayAmount(displayAmount + 1);
        onAmountChange(displayAmount + 1);
    }

    function decrement() {
        setDisplayAmount(Math.max(0, displayAmount - 1));
        onAmountChange(Math.max(0, displayAmount - 1));
    }

    return (
        <div>
            <Button variant="contained" size="small" onClick={decrement}>-</Button>
            <span style={{margin: '0 8px'}}>{displayAmount !== amount ? <span style={{color: 'darkorange'}}>{displayAmount}</span> : displayAmount}</span>
            <Button variant="contained" size="small" onClick={increment}>+</Button>
        </div>
    );
}
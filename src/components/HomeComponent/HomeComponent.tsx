'use client';

import { AccountContext } from "@/context/AccountContextProvider";
import { Typography } from "@mui/material";
import { useContext } from "react";

export function HomeComponent() {
    const { isAuthenticated, accountName } = useContext(AccountContext);
    if (!isAuthenticated) {
        return (
            <>
            <Typography variant="h4" component="h1" gutterBottom>
                Welcome to {accountName}&apos;s page!
            </Typography>
        </>);
    }
    if (!accountName) {
        return (
            <>
            <Typography variant="h4" component="h1" gutterBottom>
                Welcome to the MTG Card Viewer!
            </Typography>
        </>);
    } else {
        return (
            <>
                <Typography variant="h4" component="h1" gutterBottom>
                    Welcome, {accountName}!
                </Typography>
                <Typography variant="body1">
                    This is your personal space to explore and manage your Magic: The Gathering card collection.
                </Typography>
            </>
        );
    }
}
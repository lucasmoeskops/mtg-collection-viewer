'use client'

import MagicCardLike from "@/interfaces/MagicCardLike"
import { getAccountIdByUsername, getAllCards } from "@/supabase/helpers"
import { authenticate } from "@/supabase/server"
import { debounce } from "lodash"
import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react"

export type AccountContextProps = {
    accountId: number,
    isAuthenticated: boolean,
    authenticationError: string,
    authenticationInProgress: boolean,
    accountName: string,
    accountKey: string,
    cards: MagicCardLike[],
    errorCode: number,
    isLoading: boolean,
    setAccountIdByUsername: (username: string) => Promise<void>,
    getSubpageUrl: (subpage: string) => string,
    authenticate: (name: string, key: string) => void,
    logout: () => void,
    invalidateCardData: () => void,
    setCardDataNeeded: (needed: boolean) => void,
}

export type AccountProviderProps = {
    children: ReactNode | ReactNode[]
}

export const AccountContext = createContext<AccountContextProps>({
    accountId: -1,
    isAuthenticated: false,
    authenticationError: '',
    authenticationInProgress: false,
    accountName: '',
    accountKey: '',
    cards: [],
    errorCode: 0,
    isLoading: true,
    setAccountIdByUsername: () => Promise.resolve(),
    getSubpageUrl: (subpage: string) => subpage ? `/unknown/${subpage}` : '/unknown',
    authenticate: () => { },
    logout: () => { },
    invalidateCardData: () => { },
    setCardDataNeeded: () => { },
})

export default function AccountProvider({ children }: AccountProviderProps) {
    const [accountId, setAccountId] = useState<number>(-1)
    const [cards, setCards] = useState<MagicCardLike[]>([])
    const [cardDataValid, setCardDataValid] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorCode, setErrorCode] = useState<number>(0);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [accountName, setAccountName] = useState<string>('');
    const [accountKey, setAccountKey] = useState<string>('');
    const [authenticationError, setAuthenticationError] = useState<string>('');
    const [authenticationInProgress, setAuthenticationInProgress] = useState<boolean>(false);
    const [cardDataNeeded, setCardDataNeeded] = useState<boolean>(false);

    // Debounced authentication to avoid too many requests while typing
    const authenticator = useMemo(() => debounce(async (name: string, key: string) => {
        if (name && key) {
            setAccountName(name);
            setAccountKey(key);
            setAuthenticationInProgress(true);
            try {
                const result = await authenticate(name, key);
                setIsAuthenticated(result);
                setAuthenticationError(result ? '' : 'Authentication failed.');
            } catch (error) {
                setIsAuthenticated(false);
                setAuthenticationError('Authentication problem.');
                console.error('Authentication error:', error);
            } finally {
                setAuthenticationInProgress(false);
            }
        } else {
            setIsAuthenticated(false);
            setAuthenticationError('');
        }
    }, 500), [setIsAuthenticated, setAuthenticationError, setAuthenticationInProgress]);

    const setAccountIdByUsername = useCallback(async (username: string) => {
        if (username === accountName && accountId !== -1) {
            return;
        }
        if (username !== accountName) {
            setAccountName(username);
            setIsAuthenticated(false);
        }
        setIsLoading(true)
        const newAccountId = await getAccountIdByUsername(username)
        if (newAccountId !== accountId) {
            setAccountId(newAccountId || -1)
        }
        if (!newAccountId) {
            setErrorCode(1)
        } else if (errorCode === 1) {
            setErrorCode(0)
        }
        setIsLoading(false)
    }, [accountId, errorCode, accountName]);

    useEffect(() => {
        let relevant = true;
        if (cardDataNeeded && !cardDataValid && accountId !== -1) {
            setIsLoading(true)
            getAllCards(accountId).then((cards) => {
                if (relevant) {
                    setCards(cards)
                    setCardDataValid(true);
                    setIsLoading(false)
                }
            }).catch(() => {
                if (relevant) {
                    setIsLoading(false)
                }
            });
        }
        return () => {
            relevant = false;
        };
    }, [accountId, cardDataValid, cardDataNeeded]);

    const value: AccountContextProps = {
        accountId,
        cards,
        errorCode,
        isLoading,
        getSubpageUrl: (subpage: string) => subpage ? `/${accountName}/${subpage}` : `/${accountName}`,
        setAccountIdByUsername,
        isAuthenticated,
        authenticationError,
        authenticationInProgress,
        accountName,
        accountKey,
        authenticate: authenticator,
        logout: () => {
            setCards([]);
            setIsAuthenticated(false);
            setAccountName('');
            setAccountKey('');
            setAuthenticationError('');
        },
        invalidateCardData: () => {
            setCardDataValid(false);
        },
        setCardDataNeeded
    }

    return <AccountContext.Provider value={value}>
        {children}
    </AccountContext.Provider>
}
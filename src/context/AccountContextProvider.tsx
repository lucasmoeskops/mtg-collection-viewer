"use client";

import { useAsync } from "@/hooks/useAsync";
import MagicCardLike from "@/interfaces/MagicCardLike";
import getAuthenticatedAccountData, {
  updateAccountSettings,
} from "@/db/authenticate";
import { getAccountByUsername, getAllCards } from "@/db/helpers";
import {
  AccountSettings,
  defaultAccountSettings,
  validateAccountSettings,
} from "@/types/AccountSettings";
import { debounce } from "lodash";
import {
  ReactNode,
  createContext,
  useCallback,
  useMemo,
  useState,
} from "react";

export type AccountContextProps = {
  accountId: number;
  isAuthenticated: boolean;
  authenticationError: string;
  authenticationInProgress: boolean;
  accountName: string;
  accountKey: string;
  cards: MagicCardLike[];
  errorCode: number;
  isLoading: boolean;
  settings: AccountSettings;
  setAccountIdByUsername: (username: string) => Promise<void>;
  getSubpageUrl: (subpage: string) => string;
  authenticate: (name: string, key: string) => void;
  logout: () => void;
  invalidateCardData: () => void;
  setCardDataNeeded: (needed: boolean) => void;
  setSettings: (settings: AccountSettings) => void;
};

export type AccountProviderProps = {
  children: ReactNode | ReactNode[];
};

export const AccountContext = createContext<AccountContextProps>({
  accountId: -1,
  isAuthenticated: false,
  authenticationError: "",
  authenticationInProgress: false,
  accountName: "",
  accountKey: "",
  cards: [],
  errorCode: 0,
  isLoading: true,
  settings: defaultAccountSettings(),
  setAccountIdByUsername: () => Promise.resolve(),
  getSubpageUrl: (subpage: string) =>
    subpage ? `/unknown/${subpage}` : "/unknown",
  authenticate: () => {},
  logout: () => {},
  invalidateCardData: () => {},
  setCardDataNeeded: () => {},
  setSettings: () => {},
});

export default function AccountProvider({ children }: AccountProviderProps) {
  const [accountId, setAccountId] = useState<number>(-1);
  const [cardDataValid, setCardDataValid] = useState<boolean>(false);
  const [loadedCards, setLoadedCards] = useState<MagicCardLike[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorCode, setErrorCode] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [accountName, setAccountName] = useState<string>("");
  const [accountKey, setAccountKey] = useState<string>("");
  const [authenticationError, setAuthenticationError] = useState<string>("");
  const [authenticationInProgress, setAuthenticationInProgress] =
    useState<boolean>(false);
  const [cardDataNeeded, setCardDataNeeded] = useState<boolean>(false);
  const [settings, setSettings] = useState<AccountSettings | null>(null);

  // Debounced authentication to avoid too many requests while typing
  const authenticator = useMemo(
    () =>
      debounce(async (name: string, key: string) => {
        if (name && key) {
          setAccountName(name);
          setAccountKey(key);
          setAuthenticationInProgress(true);
          try {
            const accountData = await getAuthenticatedAccountData(name, key);
            setIsAuthenticated(accountData !== null);
            setAuthenticationError(accountData ? "" : "Authentication failed.");
            if (accountData) {
              setSettings(validateAccountSettings(accountData.settings));
            }
          } catch (error) {
            setIsAuthenticated(false);
            setAuthenticationError("Authentication problem.");
            console.error("Authentication error:", error);
          } finally {
            setAuthenticationInProgress(false);
          }
        } else {
          setIsAuthenticated(false);
          setAuthenticationError("");
        }
      }, 500),
    [setIsAuthenticated, setAuthenticationError, setAuthenticationInProgress],
  );

  const setAccountIdByUsername = useCallback(
    async (username: string) => {
      if (username === accountName && accountId !== -1) {
        return;
      }
      if (username !== accountName) {
        setAccountName(username);
      }
      setIsAuthenticated(false);
      setIsLoading(true);
      const newAccountData = await getAccountByUsername(username);
      if (newAccountData?.id !== accountId) {
        setAccountId(newAccountData?.id || -1);
      }
      if (!newAccountData?.id) {
        setErrorCode(1);
      }
      if (newAccountData?.settings) {
        setSettings(validateAccountSettings(newAccountData.settings));
      } else {
        setSettings(defaultAccountSettings());
      }
      setErrorCode(0);
      setIsLoading(false);
    },
    [accountId, accountName],
  );

  const fetchCards = useCallback(async () => {
    try {
      const fetchedCards = accountId === -1 ? [] : await getAllCards(accountId);
      setCardDataValid(true);
      setCardDataNeeded(false);
      setLoadedCards(fetchedCards);
      return;
    } catch (error) {
      console.error("Error fetching cards:", error);
      return;
    }
  }, [accountId]);

  const updateSettings = useCallback(async () => {
    if (isAuthenticated && accountName && accountKey && settings) {
      const validatedSettings = validateAccountSettings(settings);
      await updateAccountSettings(accountName, accountKey, validatedSettings);
      if (JSON.stringify(validatedSettings) !== JSON.stringify(settings)) {
        setSettings(validatedSettings);
      }
    }
  }, [isAuthenticated, accountName, accountKey, settings]);

  const { isLoading: cardsLoading } = useAsync<void>(
    fetchCards,
    !cardDataValid && cardDataNeeded && accountId !== -1,
  );
  const { isLoading: settingsLoading } = useAsync<void>(updateSettings);

  const value: AccountContextProps = {
    accountId,
    cards: loadedCards,
    errorCode,
    isLoading: isLoading || cardsLoading || settingsLoading,
    isAuthenticated,
    authenticationError,
    authenticationInProgress,
    accountName,
    accountKey,
    authenticate: authenticator,
    settings: settings || defaultAccountSettings(),
    getSubpageUrl: (subpage: string) =>
      subpage ? `/${accountName}/${subpage}` : `/${accountName}`,
    setAccountIdByUsername,
    logout: () => {
      setCardDataNeeded(false);
      setCardDataValid(false);
      setIsAuthenticated(false);
      setLoadedCards([]);
      setAccountName("");
      setAccountKey("");
      setAuthenticationError("");
      setSettings(defaultAccountSettings());
    },
    invalidateCardData: () => {
      setCardDataValid(false);
    },
    setCardDataNeeded,
    setSettings,
  };

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

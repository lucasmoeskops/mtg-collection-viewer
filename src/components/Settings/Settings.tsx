"use client";

import { ReactNode, useContext, useMemo, useState } from "react";
import { AccountContext } from "@/context/AccountContextProvider";
import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextareaAutosize,
  Typography,
} from "@mui/material";
import { debounce } from "lodash";
import { Browse, Merchant } from "@/configuration/grid-views";
import {
  CardSortingLabels,
  sortingMethodFromKey,
  sortingMethodToKey,
} from "@/enums/CardSorting";

export default function Settings({}): ReactNode {
  const { settings, setSettings, isLoading } = useContext(AccountContext);
  const {
    browseModeDefaultOrdering,
    merchantModeDefaultOrdering,
    showBrowseMode,
    showMerchantMode,
    showCollectionMode,
    welcomeMessage,
  } = settings;
  const [currentWelcomeMessage, setCurrentWelcomeMessage] =
    useState<string>(welcomeMessage);

  const debouncedSetSettings = useMemo(
    () =>
      debounce((newSettings) => {
        setSettings(newSettings);
      }, 800),
    [setSettings],
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Settings
      </Typography>
      <Stack spacing={4} direction="column" maxWidth={500}>
        <FormControl variant="standard" disabled={isLoading}>
          <FormLabel htmlFor="welcome-message-text-field">
            Welcome message
          </FormLabel>
          <FormHelperText>
            This message will be shown on the home page of your account.
          </FormHelperText>
          <TextareaAutosize
            id="welcome-message-text-field"
            minRows={3}
            value={currentWelcomeMessage}
            onChange={(e) => {
              setCurrentWelcomeMessage(e.target.value);
              debouncedSetSettings({
                ...settings,
                welcomeMessage: e.target.value,
              });
            }}
            style={{ width: "100%", fontSize: "1rem", padding: "8px" }}
          />
        </FormControl>
        <FormControl variant="standard" disabled={isLoading}>
          <FormLabel htmlFor="show-browse-mode-switch">Browse Mode</FormLabel>
          <FormHelperText>
            Enable or disable browse mode in the card grid view for everyone
            viewing this account.
          </FormHelperText>
          <Switch
            id="show-browse-mode-switch"
            checked={showBrowseMode}
            onChange={() => {
              setSettings({
                ...settings,
                showBrowseMode: !showBrowseMode,
              });
            }}
          />
        </FormControl>
        <FormControl variant="standard" disabled={isLoading}>
          <FormLabel htmlFor="browse-mode-default-order-select">
            Browse Mode Sort Order
          </FormLabel>
          <FormHelperText>
            Set the default sort order for browse mode in the card grid view.
          </FormHelperText>
          <Select
            id="browse-mode-default-order-select"
            value={sortingMethodToKey(browseModeDefaultOrdering)}
            onChange={(e) => {
              setSettings({
                ...settings,
                browseModeDefaultOrdering:
                  sortingMethodFromKey(e.target.value) ||
                  browseModeDefaultOrdering,
              });
            }}
          >
            {Browse.sortModes.map((option) => (
              <MenuItem
                key={sortingMethodToKey(option)}
                value={sortingMethodToKey(option)}
              >
                {CardSortingLabels[option]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl variant="standard" disabled={isLoading}>
          <FormLabel htmlFor="show-merchant-mode-switch">
            Merchant Mode
          </FormLabel>
          <FormHelperText>
            Enable or disable merchant mode in the card grid view for everyone
            viewing this account.
          </FormHelperText>
          <Switch
            id="show-merchant-mode-switch"
            checked={showMerchantMode}
            onChange={() => {
              setSettings({
                ...settings,
                showMerchantMode: !showMerchantMode,
              });
            }}
          />
        </FormControl>
        <FormControl variant="standard" disabled={isLoading}>
          <FormLabel htmlFor="merchant-mode-default-order-select">
            Merchant Mode Sort Order
          </FormLabel>
          <FormHelperText>
            Set the default sort order for merchant mode in the card grid view.
          </FormHelperText>
          <Select
            id="merchant-mode-default-order-select"
            value={sortingMethodToKey(merchantModeDefaultOrdering)}
            onChange={(e) => {
              setSettings({
                ...settings,
                merchantModeDefaultOrdering:
                  sortingMethodFromKey(e.target.value) ||
                  merchantModeDefaultOrdering,
              });
            }}
          >
            {Merchant.sortModes.map((option) => (
              <MenuItem
                key={sortingMethodToKey(option)}
                value={sortingMethodToKey(option)}
              >
                {CardSortingLabels[option]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl variant="standard" disabled={isLoading}>
          <FormLabel htmlFor="show-collection-mode-switch">
            Collection Mode
          </FormLabel>
          <FormHelperText>
            Enable or disable collection mode in the card grid view for everyone
            viewing this account.
          </FormHelperText>
          <Switch
            id="show-collection-mode-switch"
            checked={showCollectionMode}
            onChange={() => {
              setSettings({
                ...settings,
                showCollectionMode: !showCollectionMode,
              });
            }}
          />
        </FormControl>
      </Stack>
    </Box>
  );
}

"use client";

import { useContext, useEffect, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  FormControl,
  FormLabel,
  Stack,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import { AccountContext } from "@/context/AccountContextProvider";
import { useRouter } from "next/navigation";
import { BackgroundContext } from "@/context/BackgroundContentProvider";
import styles from "./IntroComponent.module.css";
import { usePeriodical } from "@/hooks/usePeriodical";

function EnterAccountNameAndRedirectComponent() {
  const [currentAccountName, setCurrentAccountName] = useState<string>("");
  const router = useRouter();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    router.push(`/${currentAccountName}`);
  }

  return (
    <Box sx={{ p: 2 }}>
      <form onSubmit={handleSubmit}>
        <FormControl sx={{ p: 3, width: "100%" }}>
          <FormLabel htmlFor="account-name">Account to view</FormLabel>
          <Stack direction="column" spacing={2} alignItems="right">
            <TextField
              id="account-name"
              label="Account name"
              variant="outlined"
              value={currentAccountName}
              onChange={(e) => setCurrentAccountName(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={currentAccountName.length === 0}
            >
              Go
            </Button>
          </Stack>
        </FormControl>
      </form>
    </Box>
  );
}

function LoginComponent() {
  const {
    authenticate,
    authenticationError,
    authenticationInProgress,
    isAuthenticated,
    getSubpageUrl,
  } = useContext(AccountContext);
  const [accountName, setAccountName] = useState<string>("");
  const [accountKey, setAccountKey] = useState<string>("");
  const router = useRouter();

  function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    authenticate(accountName, accountKey);
  }

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to user home page
      router.push(getSubpageUrl(""));
    }
  }, [isAuthenticated, router, getSubpageUrl]);

  return (
    <Box sx={{ p: 2 }}>
      <form onSubmit={handleLogin}>
        <FormControl
          sx={{ p: 3, width: "100%" }}
          error={authenticationError.length > 0}
          disabled={authenticationInProgress || isAuthenticated}
        >
          <FormLabel htmlFor="account-name">Login</FormLabel>
          <Stack direction="column" spacing={2} alignItems="right">
            {authenticationError && (
              <div style={{ color: "red" }}>{authenticationError}</div>
            )}
            <TextField
              id="account-name"
              label="Account name"
              variant="outlined"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
            />
            <TextField
              id="account-key"
              label="Account key"
              variant="outlined"
              type="password"
              value={accountKey}
              onChange={(e) => setAccountKey(e.target.value)}
            />
            <Button
              loading={authenticationInProgress}
              type="submit"
              variant="contained"
              size="large"
            >
              Login
            </Button>
          </Stack>
        </FormControl>
      </form>
    </Box>
  );
}

export default function IntroComponent() {
  const { isRefreshing, refreshBackgroundCard } = useContext(BackgroundContext);
  const [currentTab, setCurrentTab] = useState<string>("view");
  usePeriodical(refreshBackgroundCard, 15 * 1000, isRefreshing);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

  return (
    <main className={styles.main}>
      <AppBar position="static" color="primary">
        <Tabs
          variant="fullWidth"
          indicatorColor="primary"
          textColor="inherit"
          value={currentTab}
          onChange={handleTabChange}
        >
          <Tab label="View" value="view" />
          <Tab label="Login" value="login" />
        </Tabs>
      </AppBar>
      {currentTab === "view" && <EnterAccountNameAndRedirectComponent />}
      {currentTab === "login" && <LoginComponent />}
    </main>
  );
}

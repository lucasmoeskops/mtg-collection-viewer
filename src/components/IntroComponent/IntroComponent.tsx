
'use client';

import { useContext, useEffect, useRef, useState } from "react";
import { AppBar, Box, Button, FormControl, FormLabel, Stack, Tab, Tabs, TextField } from "@mui/material";
import Link from "next/link";
import { AccountContext } from "@/context/AccountContextProvider";
import { useRouter } from "next/navigation";

function EnterAccountNameAndRedirectComponent() {

  const [currentAccountName, setCurrentAccountName] = useState<string>("");

  return <Box sx={{ p: 2 }}>
      <FormControl sx={{ p: 3, width: '100%' }}>
        <FormLabel>Account to view</FormLabel>
        <Stack direction="column" spacing={2} alignItems="right">
          <TextField label="Account name" variant="outlined" value={currentAccountName} onChange={(e) => setCurrentAccountName(e.target.value)} />
            <Button variant="contained" size="large" disabled={currentAccountName.length === 0} LinkComponent={Link} href={`/${currentAccountName}`}>
              Go
            </Button>
        </Stack>
      </FormControl>
    </Box>;
}

function LoginComponent() {
  const { authenticate, authenticationError, authenticationInProgress, isAuthenticated, getSubpageUrl } = useContext(AccountContext);
  const [accountName, setAccountName] = useState<string>("");
  const [accountKey, setAccountKey] = useState<string>("");
  const router = useRouter();

  function handleLogin() {
    authenticate(accountName, accountKey);
  }

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to user home page
      router.push(getSubpageUrl(''));
    }
  }, [isAuthenticated, router, getSubpageUrl]);

  if (authenticationInProgress) {
    return <Box sx={{ p: 2 }}>
      <div>Authenticating...</div>
    </Box>;
  }

  if (isAuthenticated) {
    // Redirect to user home page
    return <Box sx={{ p: 2 }}>
      <div>Successfully authenticated!</div>
    </Box>;
  }

  return <Box sx={{ p: 2 }}>
      <FormControl sx={{ p: 3, width: '100%' }}>
        <FormLabel>Login</FormLabel>
        <Stack direction="column" spacing={2} alignItems="right">
          {authenticationError && <div style={{ color: 'red' }}>{authenticationError}</div>}
          <TextField label="Account name" variant="outlined" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
          <TextField label="Account key" variant="outlined" type="password" value={accountKey} onChange={(e) => setAccountKey(e.target.value)} />
          <Button variant="contained" size="large" onClick={handleLogin}>Login</Button>
        </Stack>
      </FormControl>
    </Box>;
}


export default function IntroComponent() {
  const { logout } = useContext(AccountContext);
  const [currentTab, setCurrentTab] = useState<string>("view");
  const logoutCalled = useRef(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  };

  useEffect(() => {
    if (!logoutCalled.current) {
      logoutCalled.current = true;
      logout();
    }
  }, [logout]);

  return (
    <main style={{ minWidth: '400px', minHeight: '350px' }}>
      <AppBar position="static" color="primary">
        <Tabs variant="fullWidth" indicatorColor="primary" textColor="inherit" value={currentTab} onChange={handleTabChange}>
          <Tab label="View" value="view" />
          <Tab label="Login" value="login" />
        </Tabs>
      </AppBar>
      {currentTab === "view" && <EnterAccountNameAndRedirectComponent />}
      {currentTab === "login" && <LoginComponent />}
    </main>
  );
}

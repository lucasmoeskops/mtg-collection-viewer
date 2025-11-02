'use client'

import { AccountContext } from "@/context/AccountContextProvider";
import { useContext, useEffect } from "react";
import styles from "./MainComponent.module.css";
import MainTabs from "../MainTabs/MainTabs";
import { useParams } from "next/navigation";
import { Box } from "@mui/material";

export function MainComponent ({ children }: { children: React.ReactNode }) {
  'use client'
  const { errorCode, isLoading, setAccountIdByUsername } = useContext(AccountContext);
  const { username } = useParams();

  useEffect(() => {
    setAccountIdByUsername(username as string).then(() => {
      // Optionally handle any post-login logic here
    }).catch(error => {
      console.error("Failed to set account ID by username:", error);
    });
  }, [username, setAccountIdByUsername]);

  if (isLoading) {
    return (
      <div className={styles.page}>
      <main className={styles.main}>
        <Box sx={{ p: 2 }}>
          Loading...
        </Box>
      </main>
    </div>
    )
  }

  if (errorCode) {
    return <div className={styles.page}>
      <main className={styles.main}>
        Something went wrong unfortunately.
      </main>
    </div>
  }

  return <div className={styles.page}>
      <main className={styles.main}>
        <MainTabs />
        {children}
      </main>
    </div>
}
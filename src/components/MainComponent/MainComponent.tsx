'use client'

import { AccountContext } from "@/context/AccountContextProvider";
import { useContext, useEffect } from "react";
import ViewSwitchTabs from "../ViewSwitchTabs/ViewSwitchTabs";
import Filters from "../Filters/Filters";
import InfoBox from "../InfoBox/InfoBox";
import MagicCardGrid from "../MagicCardGrid/MagicCardGrid";
import styles from "./MainComponent.module.css";

export function MainComponent ({ username }: { username: string }) {
  'use client'
  const { setAccountIdByUsername } = useContext(AccountContext);

  useEffect(() => {
    setAccountIdByUsername(username).then(() => {
      // Optionally handle any post-login logic here
    }).catch(error => {
      console.error("Failed to set account ID by username:", error);
    });
  }, [username, setAccountIdByUsername]);

  return <div className={styles.page}>
      <main className={styles.main}>
        <ViewSwitchTabs />
        <Filters />
        <InfoBox />
        <MagicCardGrid />
      </main>
    </div>
}
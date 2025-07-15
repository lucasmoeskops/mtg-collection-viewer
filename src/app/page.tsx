
import styles from "./page.module.css";
import { getAllCards } from "@/supabase/helpers";
import MagicCardLike from "@/interfaces/MagicCardLike";
import MagicCardGrid from "@/components/MagicCardGrid/MagicCardGrid";
import CardSelectionContextProvider from "@/context/CardContextProvider";
import ViewSwitchTabs from "@/components/ViewSwitchTabs/ViewSwitchTabs";
import SetContextProvider from "@/context/SetContextProvider";
import Filters from "@/components/Filters/Filters";
import InfoBox from "@/components/InfoBox/InfoBox";
import ViewModeProvider from "@/context/ViewModeContextProvider";


export default async function Home() {
  const cards: MagicCardLike[] = await getAllCards()
  
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <SetContextProvider>
          <ViewModeProvider>
            <CardSelectionContextProvider cards={cards}>
              <ViewSwitchTabs />
              <Filters />
              <InfoBox />
              <MagicCardGrid />
            </CardSelectionContextProvider>
          </ViewModeProvider>
        </SetContextProvider>
      </main>
    </div>
  );
}

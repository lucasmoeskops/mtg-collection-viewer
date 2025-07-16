
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
  let cards: MagicCardLike[]
  let error = false

  try {
    cards = await getAllCards()
  } catch (e) {
    console.log('Error:', e)
    error = true
    cards = []
  }
  
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <SetContextProvider>
          <ViewModeProvider>
            <CardSelectionContextProvider cards={cards}>
              {error && <p>An error occurred while loading the card data.</p>}
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

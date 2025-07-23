
import styles from "./page.module.css";
import MagicCardGrid from "@/components/MagicCardGrid/MagicCardGrid";
import ViewSwitchTabs from "@/components/ViewSwitchTabs/ViewSwitchTabs";
import Filters from "@/components/Filters/Filters";
import InfoBox from "@/components/InfoBox/InfoBox";


export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <ViewSwitchTabs />
        <Filters />
        <InfoBox />
        <MagicCardGrid />
      </main>
    </div>
  );
}

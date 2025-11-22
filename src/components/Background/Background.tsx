"use client";

import { useContext, useState } from "react";
import styles from "./Background.module.css";
import Link from "next/link";
import { BackgroundContext } from "@/context/BackgroundContentProvider";

export type BackgroundProps = {
  children?: React.ReactNode;
  hasOverlay?: boolean;
  fullBackground?: boolean;
};

export default function Background({
  children,
  hasOverlay = true,
  fullBackground = false,
}: BackgroundProps) {
  const { backgroundCard } = useContext(BackgroundContext);
  const [previousBackgroundCardId, setPreviousBackgroundCardId] = useState<
    number | null
  >(null);
  const [previousImageUrl, setPreviousImageUrl] = useState<string | null>(null);
  const [usePrimary, setUsePrimary] = useState<boolean>(true);
  const [imageUrl, setImageUrl] = useState<string>(
    backgroundCard?.art_crop_url || "/mtg-card-back.webp",
  );

  if (backgroundCard?.id && backgroundCard?.id !== previousBackgroundCardId) {
    setPreviousBackgroundCardId(backgroundCard?.id);
    setPreviousImageUrl(imageUrl);
    setUsePrimary(!usePrimary);
    setImageUrl(backgroundCard?.art_crop_url || "/mtg-card-back.webp");
  }

  return (
    <div className={styles.background}>
      <div
        className={`${styles.overlayBackground} ${usePrimary ? styles.fadeIn : styles.fadeOut}`}
        style={{
          backgroundImage: `url(${usePrimary ? imageUrl : previousImageUrl})`,
        }}
      />
      <div
        className={`${styles.overlayBackground} ${usePrimary ? styles.fadeOut : styles.fadeIn}`}
        style={{
          backgroundImage: `url(${usePrimary ? previousImageUrl : imageUrl})`,
        }}
      />
      {hasOverlay ? (
        <div
          className={`${styles.overlay} ${fullBackground ? styles.overlayFull : styles.overlayPartial}`}
        >
          {children}
        </div>
      ) : (
        children
      )}
      <div className={styles.attribution}>
        <Link href={backgroundCard?.cardmarket_url || "#"} target="blank">
          {backgroundCard
            ? `Art from "${backgroundCard.name}" by ${backgroundCard.artist}`
            : ""}
        </Link>
      </div>
    </div>
  );
}

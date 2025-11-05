'use client';

import { useContext, useEffect, useState } from "react";
import styles from './Background.module.css';
import Link from "next/link";
import { BackgroundContext } from "@/context/BackgroundContentProvider";


export type BackgroundProps = {
    children?: React.ReactNode;
    hasOverlay?: boolean;
    fullBackground?: boolean;
}


export default function Background({ children, hasOverlay=true, fullBackground=false }: BackgroundProps) {
    const { backgroundCard, isRefreshing } = useContext(BackgroundContext);
    const [fadeOut, setFadeOut] = useState<boolean>(false);
    const backgroundImage = backgroundCard?.art_crop_url || null;

    useEffect(() => {
        setFadeOut(isRefreshing);
    }, [isRefreshing]);

    return (
        <div className={styles.background}>
            <div className={`${styles.overlayBackground} ${fadeOut ? styles.fadeOut : ''}`}  style={{
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none'}} />
            {hasOverlay ? <div className={`${styles.overlay} ${fullBackground ? styles.overlayFull : styles.overlayPartial}`}>
                {children}
            </div> : children}
            <div className={styles.attribution}>
                <Link href={backgroundCard?.cardmarket_url || '#'} target="blank">{backgroundCard ? `Art from "${backgroundCard.name}" by ${backgroundCard.artist}` : ''}</Link>
            </div>
        </div>
    );
}

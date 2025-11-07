'use client';

import { useContext, useEffect, useRef, useState } from "react";
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
    const [ oldImageUrl, setOldImageUrl ] = useState<string | null>(null);
    const wasRefreshing = useRef<boolean>(false);
    const usePrimary = useRef<boolean>(true);
    const [ backgroundImage, setBackgroundImage ] = useState<string>(backgroundCard?.art_crop_url || '/mtg-card-back.webp');

    useEffect(() => {
        if (isRefreshing) {
            setOldImageUrl(backgroundImage);
            wasRefreshing.current = true;
        } else if (wasRefreshing.current) {
            wasRefreshing.current = false;
            usePrimary.current = !usePrimary.current;
            setBackgroundImage(backgroundCard?.art_crop_url || oldImageUrl || '/mtg-card-back.webp');
        }
    }, [isRefreshing, backgroundImage, backgroundCard, oldImageUrl]);

    return (
        <div className={styles.background}>
            <div className={`${styles.overlayBackground} ${usePrimary.current ? styles.fadeIn : styles.fadeOut}`}  style={{
            backgroundImage: `url(${usePrimary.current ? backgroundImage : oldImageUrl})`}} />
            <div className={`${styles.overlayBackground} ${usePrimary.current ? styles.fadeOut : styles.fadeIn}`}  style={{
            backgroundImage: `url(${usePrimary.current ? oldImageUrl : backgroundImage})`}} />
            {hasOverlay ? <div className={`${styles.overlay} ${fullBackground ? styles.overlayFull : styles.overlayPartial}`}>
                {children}
            </div> : children}
            <div className={styles.attribution}>
                <Link href={backgroundCard?.cardmarket_url || '#'} target="blank">{backgroundCard ? `Art from "${backgroundCard.name}" by ${backgroundCard.artist}` : ''}</Link>
            </div>
        </div>
    );
}

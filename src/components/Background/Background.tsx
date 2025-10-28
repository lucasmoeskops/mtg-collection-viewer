'use client';

import MagicCardLike, { getCard } from "@/interfaces/MagicCardLike";
import { getRandomCard } from "@/supabase/server";
import { useEffect, useState } from "react";
import styles from './Background.module.css';
import Link from "next/link";

async function fetchBackground(): Promise<MagicCardLike | null> {
    const card = await getRandomCard();
    if (!card) {
        return null;
    }
    const cardFromScryfall = await getCard(card.series, card.cardnumber.toString());
    if (!cardFromScryfall || !cardFromScryfall.art_crop_url) {
        return null;
    }
    return cardFromScryfall;
}

export default function Background({ children }: { children?: React.ReactNode }) {
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [card, setCard] = useState<MagicCardLike | null>(null);

    useEffect(() => {
        async function loadBackground() {
            const card = await fetchBackground();
            setBackgroundImage(card?.art_crop_url || null);
            setCard(card);
        }
        loadBackground();
    }, []);

    return (
        <div className={styles.background} style={{
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        }}>
            <div className={styles.overlay}>
                {children}
            </div>
            <div className={styles.attribution}>
                <Link href={card?.cardmarket_url || '#'} target="blank">{card ? `Art from "${card.name}" by ${card.artist}` : ''}</Link>
            </div>
        </div>
    );
}

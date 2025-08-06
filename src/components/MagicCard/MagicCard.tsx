'use client'

import { CardSelectionContextContext } from "@/context/CardContextProvider"
import RenderableMagicCardLike from "@/interfaces/RenderableMagicCardLike"
import { Typography } from "@mui/material"
import Image from "next/image"
import { useContext } from "react"
import styles from "./MagicCard.module.css"

export type MagicCardProps = {
    card: RenderableMagicCardLike
}

export default function MagicCard({ card }: MagicCardProps) {
    const { getCardInfo } = useContext(CardSelectionContextContext)
    const { image_url, name } = card
    // const isFoil = card.renderEffects.includes(RenderEffect.FOIL)

    return <>
        <div className={[styles.default, card.is_foil && styles.foil].join(' ')}>
        {card.image_url && (
            <Image src={image_url} alt={name} fill={true} loading={"lazy"} priority={false} unoptimized={true} />
        )}
        </div>
        <Typography>{getCardInfo(card)}</Typography>
    </>
}
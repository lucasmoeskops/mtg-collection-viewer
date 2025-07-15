'use client'

import { CardSelectionContextContext } from "@/context/CardContextProvider"
import RenderableMagicCardLike from "@/interfaces/RenderableMagicCardLike"
import { Typography } from "@mui/material"
import Image from "next/image"
import { useContext } from "react"

export type MagicCardProps = {
    card: RenderableMagicCardLike
}

export default function MagicCard({ card }: MagicCardProps) {
    const { getCardInfo } = useContext(CardSelectionContextContext)
    const { image_url, name } = card

    return <>
        <div style={{position: 'relative', aspectRatio: '488/680', borderRadius: '13px', overflow: 'hidden'}}>
        {card.image_url && (
            <Image src={image_url} alt={name} fill={true} loading={"lazy"} priority={false} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"/>
        )}
        </div>
        <Typography>{getCardInfo(card)}</Typography>
    </>
}
'use client'

import { CardSelectionContextContext } from "@/context/CardContextProvider"
import { Box } from "@mui/material"
import { useContext } from "react"

export default function InfoBox({}) {
    const { generalInfo } = useContext(CardSelectionContextContext)

    if (!generalInfo) {
        return null
    }

    return <Box>{generalInfo}</Box>
}
'use client'

import { CardSelectionContextContext } from "@/context/CardContextProvider"
import { Grid, Pagination, Stack } from "@mui/material"
import { ChangeEvent, ReactNode, Suspense, useContext } from "react"
import MagicCard from "../MagicCard/MagicCard"
import PaginationContextProvider, { PaginationContext } from "@/context/PaginationContextProvider"
import RenderableMagicCardLike from "@/interfaces/RenderableMagicCardLike"


type MagicCardGridInnerProps = {
    cards: RenderableMagicCardLike[]
}

function MagicCardGridInner({ cards }: MagicCardGridInnerProps) {
    const { page, setPage, numPages, perPage } = useContext(PaginationContext)

    function handleChange<T>(_event: ChangeEvent<T>, value: number) {
        setPage(value-1)
    }

    return <Stack spacing={2}>
        <Pagination count={numPages} page={page+1} onChange={handleChange} variant="outlined" color="primary" />
        <Grid container spacing={2}>
            {cards.slice(page*perPage, (page + 1) * perPage).map((card, index) => 
            <Grid size={{xs: 12, sm: 6, md: 4, lg: 3}} key={card.image_url + index}>
                <MagicCard card={card} />
            </Grid>
            )}
        </Grid>
        <Pagination count={numPages} page={page+1} onChange={handleChange} variant="outlined" color="primary" />
    </Stack>
}

export default function MagicCardGrid (): ReactNode {
    const { cards } = useContext(CardSelectionContextContext)

    return <Suspense fallback={<div>Loading...</div>}>
        <PaginationContextProvider items={cards} perPage={24}>
            <MagicCardGridInner cards={cards} />
        </PaginationContextProvider>
    </Suspense>
}
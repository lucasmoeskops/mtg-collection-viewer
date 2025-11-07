'use client';

import CardSelectionContextProvider from "@/context/CardContextProvider";
import Filters from "../Filters/Filters";
import InfoBox from "../InfoBox/InfoBox";
import CloseIcon from '@mui/icons-material/Close';
import MagicCardGrid from "../MagicCardGrid/MagicCardGrid";
import { ViewModes } from "@/types/ViewModes";
import ViewModeProvider from "@/context/ViewModeContextProvider";
import { useSearchParams } from "next/navigation";
import { queryParametersToContext } from "@/types/CardSelectionContext";
import { useContext, useState } from "react";
import { ScreenContext } from "@/context/ScreenContextProvider";
import { Box, Button, Modal } from "@mui/material";


export function ViewModeView({ viewModeId }: { viewModeId: ViewModes }) {
    const searchParams = useSearchParams();
    const [ open, setOpen ] =  useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const { isMobile } = useContext(ScreenContext);
    const extraContext = queryParametersToContext(Object.fromEntries(searchParams.entries()), []);

    return (
        <ViewModeProvider viewModeId={viewModeId}>
            <CardSelectionContextProvider extraContext={extraContext}>
                {isMobile ? (
                    <>
                        <Button variant="contained" onClick={handleOpen}>Filter</Button>
                        <Modal
                            open={open}
                            onClose={handleClose}
                            aria-labelledby="modal-modal-title"
                            aria-describedby="modal-modal-description"
                            slotProps={{
                                root: {
                                    style: {
                                        background: 'rgba(255, 255, 255, 0.9)',
                                        overflowY: 'auto',
                                    }
                                },
                                backdrop: { style: { background: 'transparent' } }
                            }}
                            >
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
                                    <Button variant="contained" onClick={handleClose} startIcon={<CloseIcon />}>Close</Button>
                                </Box>
                                <Filters />
                            </Box>
                        </Modal>
                    </>
                ) : <Filters />}
                <InfoBox />
                <MagicCardGrid />
            </CardSelectionContextProvider>
        </ViewModeProvider>
    );
}
'use client'

import { views } from "@/configuration/grid-views"
import { ViewModeContext } from "@/context/ViewModeContextProvider"
import { Box, Tab, Tabs } from "@mui/material"
import { ReactNode, useContext, useState } from "react"


function a11yProps(index: number) {
    return {
        id: `view-switch-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    }
}

export default function ViewSwitchTabs(): ReactNode {
    const {viewModeIndex, setViewModeIndex} = useContext(ViewModeContext)
    const [value, setValue] = useState(viewModeIndex)

    function handleChange (event: React.SyntheticEvent, newValue: number) {
        setValue(newValue)
        setViewModeIndex(newValue)
    }

    return (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleChange} aria-label="view modes">
                {views.map(({label}, index) => <Tab label={label} key={index} {...a11yProps(index)} />)}
            </Tabs>
        </Box>
    )
}
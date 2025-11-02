'use client'

import { Browse, Collection, Merchant } from "@/configuration/grid-views"
import { AccountContext } from "@/context/AccountContextProvider"
import { Box, Tab, Tabs } from "@mui/material"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ReactNode, useContext, useEffect, useMemo } from "react"


function a11yProps(index: number) {
    return {
        id: `view-switch-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    }
}

export default function MainTabs(): ReactNode {
    const {getSubpageUrl, isAuthenticated} = useContext(AccountContext)
    const pathname = usePathname();
    const secondValue = pathname.split('/')[2] || ''; // Assumes URL structure is /[username]/[viewmode]
    const router = useRouter();
    const validOptions = useMemo(() => {
        const base = ['', Browse.id, Merchant.id, Collection.id, 'settings', 'colofon', 'logout'];
        if (isAuthenticated) {
            base.push('editor');
        }
        return base;
    }, [isAuthenticated]);
    
    useEffect(() => {
        if (!validOptions.includes(secondValue)) {
            // Redirect to home if invalid tab
            router.replace(getSubpageUrl(''));
        }
    }, [isAuthenticated, router, secondValue, getSubpageUrl, validOptions]);

    const activeTab = validOptions.includes(secondValue) ? secondValue : '';

    return (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} aria-label="view modes" variant="scrollable" scrollButtons="auto">
                <Tab label={"Home"} value={''} component={Link} href={getSubpageUrl('')} {...a11yProps(0)} />
                <Tab label={Browse.label} value={Browse.id} component={Link} href={getSubpageUrl(Browse.id)} {...a11yProps(0)} />
                <Tab label={Merchant.label} value={Merchant.id} component={Link} href={getSubpageUrl(Merchant.id)} {...a11yProps(1)} />
                <Tab label={Collection.label} value={Collection.id} component={Link} href={getSubpageUrl(Collection.id)} {...a11yProps(2)} />
                {isAuthenticated && <Tab label="Editor" value="editor" component={Link} href={getSubpageUrl('editor')} {...a11yProps(2)} />}
                <Tab label="Settings" value="settings" component={Link} href={getSubpageUrl('settings')} {...a11yProps(3)} />
                <Tab label="Colofon" value="colofon" component={Link} href={getSubpageUrl('colofon')} {...a11yProps(3)} />
                <Tab label="Logout" value="logout" component={Link} href={getSubpageUrl('logout')} {...a11yProps(4)} />
            </Tabs>
        </Box>
    )
}
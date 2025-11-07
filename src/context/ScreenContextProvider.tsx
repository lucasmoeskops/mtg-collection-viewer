'use client'

import { debounce } from "lodash";
import { createContext, useEffect, useState } from "react";

export type ScreenContextProps = {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    atLeastTablet?: boolean;
    atLeastDesktop?: boolean;
    atMostTablet?: boolean;
    atMostMobile?: boolean;
}

export type ScreenContextProviderProps = {
    children: React.ReactNode;
};


export const ScreenContext = createContext<ScreenContextProps>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    atLeastTablet: false,
    atLeastDesktop: false,
    atMostTablet: false,
    atMostMobile: false,
});


export default function ScreenContextProvider({ children }: ScreenContextProviderProps) {
    const [screenSize, setScreenSize] = useState<ScreenContextProps>({
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        atLeastTablet: false,
        atLeastDesktop: false,
        atMostTablet: false,
        atMostMobile: false,
    });

    useEffect(() => {
        const handleResize = () => {
            setScreenSize({
                isMobile: window.innerWidth < 768,
                isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
                isDesktop: window.innerWidth >= 1024,
                atLeastTablet: window.innerWidth >= 768,
                atLeastDesktop: window.innerWidth >= 1024,
                atMostTablet: window.innerWidth < 1024,
                atMostMobile: window.innerWidth < 768,
            });
        };
        const debouncedHandleResize = debounce(handleResize, 100);

        window.addEventListener("resize", debouncedHandleResize);
        handleResize();

        return () => {
            window.removeEventListener("resize", debouncedHandleResize);
        };
    }, []);

    return (
        <ScreenContext.Provider value={screenSize}>
            {children}
        </ScreenContext.Provider>
    );
}
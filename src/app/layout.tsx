import type { Metadata } from "next";
import "./globals.css";
import { Container } from "@mui/material";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { Roboto } from 'next/font/google';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import SetContextProvider from "@/context/SetContextProvider";
import ViewModeProvider from "@/context/ViewModeContextProvider";
import CardSelectionContextProvider from "@/context/CardContextProvider";
import { getAllCards } from "@/supabase/helpers";
import MagicCardLike from "@/interfaces/MagicCardLike";
import { Suspense } from "react";

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: "MTG Collection Viewer",
  description: "By Lucas Moeskops",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    let cards: MagicCardLike[]
    let error = false
  
    try {
      cards = await getAllCards()
    } catch (e) {
      console.log('Error:', e)
      error = true
      cards = []
    }
    
  return (
    <html lang="en" className={roboto.variable}>
      <ThemeProvider theme={theme}>
        <Suspense fallback={<div>Loading...</div>}>
          <SetContextProvider>
            <ViewModeProvider>
              <CardSelectionContextProvider cards={cards}>
                <body>
                {error && <p>An error occurred while loading the card data.</p>}
                  <AppRouterCacheProvider>
                      <Container>
                        {children}
                      </Container>
                  </AppRouterCacheProvider>
                </body>
              </CardSelectionContextProvider>
            </ViewModeProvider>
          </SetContextProvider>
        </Suspense>
      </ThemeProvider>
    </html>
  );
}

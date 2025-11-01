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
import { Suspense } from "react";
import AccountProvider from "@/context/AccountContextProvider";
import Background from "@/components/Background/Background";

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
  return (
    <html lang="en" className={roboto.variable}>
      <body>
        <ThemeProvider theme={theme}>
          <Suspense fallback={<Background><div>Something went wrong...</div></Background>}>
            <SetContextProvider>
              <AccountProvider>
                <ViewModeProvider>
                  <CardSelectionContextProvider>
                    <AppRouterCacheProvider>
                        <Container>
                          {children}
                        </Container>
                    </AppRouterCacheProvider>
                  </CardSelectionContextProvider>
                </ViewModeProvider>
              </AccountProvider>
            </SetContextProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Container } from "@mui/material";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { Roboto } from 'next/font/google';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.variable}>
      <ThemeProvider theme={theme}>
        <body>
          <AppRouterCacheProvider>
              <Container>
                {children}
              </Container>
          </AppRouterCacheProvider>
        </body>
      </ThemeProvider>
    </html>
  );
}

'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#ac3b61',
    },
    secondary: {
      main: '#28333b',
    },
  },
});

export default theme;

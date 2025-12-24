"use client";

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
// 👇 CHANGE THIS LINE: Remove the { } curly braces
import fyntracTheme from './fyntrac-theme'; 

export default function ThemeRegistry({ children }) {
  return (
    <ThemeProvider theme={fyntracTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
"use client";
import { Suspense } from "react";
import LoginPage from "./auth/auth-page";
import fyntracTheme from "./theme/fyntrac-theme";
import { ThemeProvider, CssBaseline, CircularProgress, Box } from "@mui/material";
export default function Home() {
  return (
    <div>
      <ThemeProvider theme={fyntracTheme}>
        <CssBaseline />
        <Suspense
          fallback={
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
              <CircularProgress />
            </Box>
          }
        >
          <LoginPage />
        </Suspense>
      </ThemeProvider>
    </div>
  );
}

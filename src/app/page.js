"use client";
import LoginPage from "./auth/auth-page";
import fyntracTheme from "./theme/fyntrac-theme";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { TenantProvider } from "./tenant-context";
export default function Home() {
  return (
    <div>
      <TenantProvider>
        <ThemeProvider theme={fyntracTheme}>
          <CssBaseline />
          <LoginPage />
        </ThemeProvider>
      </TenantProvider>
    </div>
  );
}

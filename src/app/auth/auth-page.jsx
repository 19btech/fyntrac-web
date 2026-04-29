"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "../services/api-client";
// Ensure you have configured Grid2 in your project
import Grid from "@mui/material/Grid2";
import { useTenant } from "../tenant-context";
import {
  Box,
  Typography,
  Button,
  Autocomplete,
  CircularProgress,
  InputLabel,
  CssBaseline,
  ThemeProvider,
  createTheme,
  TextField,
  Alert,
} from "@mui/material";
import { Inter } from "next/font/google";

// --- 1. FONTS & THEME SETUP ---
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const customTheme = createTheme({
  typography: {
    fontFamily: inter.style.fontFamily,
  },
  palette: {
    primary: {
      main: "#1335FF",
    },
    background: {
      default: "#ffffff",
    },
    text: {
      primary: "#1e293b",
      secondary: "#475569",
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "0.5rem",
            backgroundColor: "#ffffff",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "0.5rem",
          textTransform: "none",
          fontWeight: 600,
          padding: "10px 16px",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "0.5rem"
        }
      }
    }
  },
});

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenant, setTenant, setUser } = useTenant();

  // --- 2. STATE ---
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (tenant) console.log("✅ Tenant updated in context:", tenant);
  }, [tenant]);

  // --- 3. Check session on load (especially after OAuth2 redirect) ---
  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await authApi.getSession();

        if (data.authenticated) {
          // Clear the 401 redirect guard — user is authenticated
          sessionStorage.removeItem("_401_redirecting");
          setAuthenticated(true);
          setUserEmail(data.email || data.preferred_username || "");
          if (data.user) setUser(data.user);

          if (Array.isArray(data.tenants) && data.tenants.length > 0) {
            setTenants(data.tenants);
            console.log("✅ Tenants loaded:", data.tenants);
          }

          if (data.tenantError) {
            setLoginError(data.tenantError);
          }

          // If tenant is already selected AND the user didn't just log out,
          // auto-navigate to main. Otherwise show the Sign In button.
          const justLoggedOut = sessionStorage.getItem("just_logged_out");
          if (data.tenant && !justLoggedOut) {
            setTenant(data.tenant);
            router.push("/main");
            return;
          }

          // If they did just log out, clear the flag so next sign-in is clean
          if (justLoggedOut) {
            sessionStorage.removeItem("just_logged_out");
            setAuthenticated(false); // show Sign In button
          }
        }
      } catch (error) {
        // Not authenticated — that's fine, show the sign-in button
        console.log("Session check: not authenticated");
      } finally {
        setLoadingSession(false);

        // Clean up the ?authenticated=true from the URL after checking
        if (searchParams.get("authenticated")) {
          window.history.replaceState({}, "", "/");
        }
      }
    };

    checkSession();
  }, []);

  // --- 4. Redirect to Zitadel login ---
  const handleSignIn = () => {
    // Clear the logout flag so next session check can auto-redirect normally
    sessionStorage.removeItem("just_logged_out");
    window.location.href = authApi.getLoginUrl();
  };

  // --- 5. Submit tenant selection ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTenant) {
      alert("Please select a tenant before continuing.");
      return;
    }

    try {
      // Tell the gateway which tenant was selected (stored in session)
      await authApi.selectTenant(selectedTenant.tenantCode);

      // Clear the 401 redirect guard — user selected a tenant
      sessionStorage.removeItem("_401_redirecting");
      setTenant(selectedTenant.tenantCode);
      console.log("Tenant code set:", selectedTenant.tenantCode);

      router.push("/main");
    } catch (error) {
      console.error("❌ Error selecting tenant:", error);
      alert("Failed to set tenant. Please try again.");
    }
  };

  // --- Loading state ---
  if (loadingSession) {
    return (
      <ThemeProvider theme={customTheme}>
        <CssBaseline />
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline />

      <Grid container sx={{ minHeight: "100vh", position: "relative" }}>

        {/* --- LOGO --- */}
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 16, sm: 32 },
            left: { xs: 16, sm: 32 },
            height: { xs: 32, sm: 40 },
            width: 'auto',
            zIndex: 10,
          }}
        >
          <img
            src="fyntrac.png"
            alt="Logo"
            style={{
              width: '100px',
              height: 'auto',  // Maintain aspect ratio
              maxWidth: '100%' // Ensures responsiveness
            }}
          />
        </Box>
        {/* --- LEFT PANEL --- */}
        <Grid
          size={{ xs: 0, lg: 7.2 }}
          sx={{
            display: { xs: "none", lg: "flex" },
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#E6EEFF",
            borderRadius: "0 60px 60px 0",
            p: 6,
          }}
        >
          <Box sx={{ maxWidth: "32rem", textAlign: "center" }}>
            <Typography
              component="h1"
              variant="h2"
              sx={{
                fontWeight: 700,
                color: "#1e293b",
                lineHeight: 1.1,
                mb: 3,
              }}
            >
              Your Accounting Rules, Automated
            </Typography>
            <Typography variant="h6" sx={{ color: "#475569" }}>
              "Simplify complexity. Automate clarity. Deliver insight."
            </Typography>
          </Box>
        </Grid>

        {/* --- RIGHT PANEL --- */}
        <Grid
          size={{ xs: 12, lg: 4.8 }}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 6,
            px: { xs: 2, sm: 4 },
            backgroundColor: "background.paper",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: "24rem" }}>

            <Typography
              component="h2"
              variant="h4"
              align="center"
              sx={{ fontWeight: 700, mb: 4, color: "#0f172a" }}
            >
              {authenticated ? "Select Tenant" : "Sign In"}
            </Typography>

            {/* Error message */}
            {loginError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {loginError}
              </Alert>
            )}

            {!authenticated ? (
              /* ──── NOT AUTHENTICATED: Show Sign In Button ──── */
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="body1"
                  sx={{ color: "#475569", mb: 3 }}
                >
                  Click below to sign in securely with your organization account.
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSignIn}
                  sx={{
                    mt: 1,
                    mb: 2,
                    bgcolor: "#14213d",
                    "&:hover": {
                      bgcolor: "rgba(20, 33, 61, 0.9)",
                    },
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                    py: 1.5,
                    fontSize: "1rem",
                  }}
                >
                  Sign In with Zitadel
                </Button>
              </Box>
            ) : (
              /* ──── AUTHENTICATED: Show Tenant Selector ──── */
              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>

                {/* Welcome message */}
                <Alert severity="success" sx={{ mb: 3 }}>
                  Welcome, {userEmail}!
                </Alert>

                <Box sx={{ mb: 3 }}>
                  <InputLabel
                    htmlFor="user-tenants"
                    sx={{ mb: 0.5, fontWeight: 500, color: "#334155", fontSize: "0.875rem" }}
                  >
                    Select Tenant
                  </InputLabel>
                  <Autocomplete
                    fullWidth
                    disablePortal
                    id="user-tenants"
                    size="small"
                    options={tenants}
                    value={selectedTenant}
                    getOptionLabel={(option) => option.name || ""}
                    isOptionEqualToValue={(option, value) =>
                      option.tenantCode === value.tenantCode
                    }
                    onChange={(event, newValue) => {
                      setSelectedTenant(newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select Tenant"
                        helperText="Select your tenant from the list"
                      />
                    )}
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={!selectedTenant}
                  sx={{
                    mt: 1,
                    mb: 2,
                    bgcolor: "#14213d",
                    "&:hover": {
                      bgcolor: "rgba(20, 33, 61, 0.9)",
                    },
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                    "&:disabled": {
                      bgcolor: "#94a3b8",
                      color: "#e2e8f0"
                    }
                  }}
                >
                  Continue
                </Button>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}
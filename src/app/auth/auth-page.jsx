"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
// Ensure you have configured Grid2 in your project
import Grid from "@mui/material/Grid2";
import { useTenant } from "../tenant-context";
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Autocomplete,
  CircularProgress,
  InputLabel,
  CssBaseline,
  ThemeProvider,
  createTheme
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
  const { tenant, setTenant, setUser } = useTenant();

  // --- 2. STATE ---
  const [email, setEmail] = useState("");
  const [pswd, setPswd] = useState("");
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loadingTenants, setLoadingTenants] = useState(false);

  useEffect(() => {
    if (tenant) console.log("✅ Tenant updated in context:", tenant);
  }, [tenant]);

  // --- 3. LOGIC ---
  const login = async () => {
    if (!email || !pswd) return;

    setLoadingTenants(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI}/fyntrac/auth/login`;
      const response = await axios.post(
        url,
        { email, pswd },
        { headers: { "X-Tenant": "master", Accept: "*/*" } }
      );

      console.log("Full response:", response.data);

      if (Array.isArray(response.data.tenants)) {
        setTenants(response.data.tenants);
        setUser(response.data.user);
        console.log("✅ Tenants loaded:", response.data.tenants);
      } else {
        console.error("⚠️ Unexpected tenant data:", response.data.tenants);
      }
    } catch (error) {
      console.error("❌ Error during login:", error);
      alert("Login failed — please check your credentials.");
    } finally {
      setLoadingTenants(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedTenant) {
      alert("Please select a tenant before continuing.");
      return;
    }

    setTenant(selectedTenant.tenantCode);
    console.log("Tenant code set:", selectedTenant.tenantCode);

    setTimeout(() => {
      router.push("/main");
    }, 0);
  };

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
              Sign In
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>

              <Box sx={{ mb: 3 }}>
                <InputLabel
                  htmlFor="email"
                  sx={{ mb: 0.5, fontWeight: 500, color: "#334155", fontSize: "0.875rem" }}
                >
                  Email *
                </InputLabel>
                <TextField
                  required
                  fullWidth
                  id="email"
                  placeholder="Enter your email"
                  variant="outlined"
                  size="small"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <InputLabel
                  htmlFor="password"
                  sx={{ mb: 0.5, fontWeight: 500, color: "#334155", fontSize: "0.875rem" }}
                >
                  Password *
                </InputLabel>
                <TextField
                  required
                  fullWidth
                  id="password"
                  type="password"
                  variant="outlined"
                  size="small"
                  value={pswd}
                  onChange={(e) => setPswd(e.target.value)}
                  onBlur={() => {
                    if (pswd && email) login();
                  }}
                />
              </Box>

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
                  loading={loadingTenants}
                  disabled={loadingTenants}
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
                      placeholder={loadingTenants ? "Loading..." : "Select Tenant"}
                      helperText="Select your tenant from the list"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingTenants ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={!selectedTenant || loadingTenants}
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
                Login
              </Button>

              <Box sx={{ textAlign: "center", mt: 3 }}>
                <Link
                  href="#"
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: "#1335FF",
                    textDecoration: "none",
                    "&:hover": {
                      color: "#0B21B3",
                    },
                  }}
                >
                  Forgot password? Reset here
                </Link>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}
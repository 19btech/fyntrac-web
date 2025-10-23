"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Grid from "@mui/material/Grid2"; // MUI v6 Grid2 syntax
import { useTenant } from "../tenant-context";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  useTheme,
  Autocomplete,
  CircularProgress,
} from "@mui/material";

export default function LoginPage() {
  const theme = useTheme();
  const router = useRouter();
  const { tenant, user, setTenant, setUser, clearSession } = useTenant();

  const [email, setEmail] = useState("");
  const [pswd, setPswd] = useState("");
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [loadingTenants, setLoadingTenants] = useState(false);

  // Log tenant whenever it changes (for debugging)
  useEffect(() => {
    if (tenant) console.log("✅ Tenant updated in context:", tenant);
  }, [tenant]);

  const login = async () => {
    if (!email || !pswd) {
      alert("Please enter both email and password.");
      return;
    }

    setLoadingTenants(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI}/fyntrac/auth/login`;
      const response = await axios.post(
        url,
        { email, pswd },
        {
          headers: {
            "X-Tenant": "Test",
            Accept: "*/*",
          },
        }
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

    // Update context (async)
    setTenant(selectedTenant.tenantCode);
    console.log("Tenant code set:", selectedTenant.tenantCode);

    // Give React one render tick to update context before navigating
    setTimeout(() => {
      router.push("/main");
    }, 0);
  };

  return (
    <Grid container sx={{ minHeight: "100vh", minWidth: "100vw" }}>
      {/* LEFT PANEL - 75% */}
      <Grid
        size={{ xs: 12, sm: 7 }}
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          borderTopRightRadius: { md: "80px" },
          borderBottomRightRadius: { md: "80px" },
          p: 6,
          textAlign: "center",
          transition: "all 0.3s ease",
        }}
      >
        <Typography variant="h3" gutterBottom>
          Empowering Financial Intelligence
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: "500px" }}>
          “Simplify complexity. Automate clarity. Deliver insight.”
        </Typography>
      </Grid>

      {/* RIGHT PANEL - 25% */}
      <Grid
        size={{ xs: 12, sm: 5 }}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 4,
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Paper
          elevation={5}
          sx={{
            minWidth: 320,
            p: 4,
            borderRadius: 4,
          }}
        >
          <Typography
            variant="h5"
            fontWeight="600"
            mb={3}
            textAlign="center"
            color="primary"
          >
            Sign In
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              margin="normal"
              value={pswd}
              onChange={(e) => setPswd(e.target.value)}
              onBlur={() => {
                if (pswd && email) login();
              }}
            />

            <Autocomplete
              fullWidth
              disablePortal
              id="user-tenants"
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
                  label="Select Tenant"
                  variant="outlined"
                  margin="normal"
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

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={!selectedTenant || loadingTenants}
              sx={{
                mt: 3,
                py: 1.5,
                fontWeight: "bold",
                textTransform: "none",
              }}
            >
              Login
            </Button>

            <Typography
              variant="body2"
              sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}
            >
              Forgot password? <a href="#">Reset here</a>
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}

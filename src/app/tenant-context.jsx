"use client";
import React, { createContext, useState, useContext, useEffect } from "react";
import { authApi } from "./services/api-client";

// Create a combined context for Tenant + User
const TenantContext = createContext(null);

// Provider component
export const TenantProvider = ({ children }) => {
  // Initialize tenant from localStorage
  const [tenant, setTenantState] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedTenant");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  // Initialize user from localStorage
  const [user, setUserState] = useState(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });

  // Track if session has been checked
  const [sessionChecked, setSessionChecked] = useState(false);

  // Setter for tenant (also saves to localStorage)
  const setTenant = (newTenant) => {
    setTenantState(newTenant);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedTenant", JSON.stringify(newTenant));
    }
  };

  // Setter for user (also saves to localStorage)
  const setUser = (newUser) => {
    setUserState(newUser);
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(newUser));
    }
  };

  // Check gateway session on page reload
  const checkSession = async () => {
    try {
      const data = await authApi.getSession();
      if (data.authenticated) {
        if (data.user) setUser(data.user);

        // Prevent overwriting a locally selected tenant with null if the session is lagging
        if (data.tenant) {
          setTenant(data.tenant);
        } else if (!tenant && data.tenant) {
          setTenant(data.tenant);
        }
      }
    } catch (error) {
      console.log("Session check failed:", error.message);
    } finally {
      setSessionChecked(true);
    }
  };

  // Clear both tenant and user data (used for logout)
  const clearSession = () => {
    setTenantState(null);
    setUserState(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("selectedTenant");
      localStorage.removeItem("user");
      // Clear the 401 redirect guard so the login page doesn't get stuck
      sessionStorage.removeItem("_401_redirecting");
      // Signal to the login page that this was an explicit logout
      // so it does NOT auto-redirect even if gateway session lingers
      sessionStorage.setItem("just_logged_out", "true");
    }
    // Redirect to gateway's OIDC logout → Zitadel → back to frontend login page
    authApi.logout();
  };

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        setTenant,
        user,
        setUser,
        clearSession,
        sessionChecked,
        checkSession,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

// ✅ Hook (must only be used inside a component wrapped in TenantProvider)
export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
};

export default TenantProvider;

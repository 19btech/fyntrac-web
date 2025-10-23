"use client";
import React, { createContext, useState, useContext } from "react";

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

  // Clear both tenant and user data (used for logout)
  const clearSession = () => {
    setTenantState(null);
    setUserState(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("selectedTenant");
      localStorage.removeItem("user");
    }
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        setTenant,
        user,
        setUser,
        clearSession,
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

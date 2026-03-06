import axios from "axios";

/**
 * Centralized API client that routes all requests through the Spring Cloud Gateway.
 *
 * - Base URL points to the gateway (port 8585)
 * - withCredentials: true sends session cookies with every request
 * - The gateway injects X-Tenant and Authorization headers automatically
 * - 401 responses redirect to the login page
 */

const GATEWAY_URI = process.env.NEXT_PUBLIC_GATEWAY_URI || "http://localhost:8585";

const apiClient = axios.create({
    baseURL: GATEWAY_URI,
    withCredentials: true,  // Send session cookies to gateway
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// Response interceptor: redirect to login on 401
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error("⛔ 401 UNAUTHORIZED on:", error.config?.url);

            // Never redirect for auth endpoints — let them fail gracefully
            if (error.config?.url?.includes("/auth/")) {
                return Promise.reject(error);
            }

            // Redirect to login ONCE — use sessionStorage to survive page reloads
            if (typeof window !== "undefined") {
                const alreadyRedirecting = sessionStorage.getItem("_401_redirecting");
                const isOnLoginPage = window.location.pathname === "/";

                if (!alreadyRedirecting && !isOnLoginPage) {
                    sessionStorage.setItem("_401_redirecting", "true");
                    console.error("Redirecting to / due to 401");
                    localStorage.removeItem("selectedTenant");
                    localStorage.removeItem("user");
                    window.location.href = "/";
                }
            }
        }
        return Promise.reject(error);
    }
);

// --- Auth API ---

export const authApi = {
    /**
     * Get the URL to redirect the user to for OAuth2 login via Zitadel.
     * The gateway handles the OAuth2 handshake and redirects back to the frontend.
     */
    getLoginUrl: () => {
        return `${GATEWAY_URI}/oauth2/authorization/zitadel`;
    },

    /**
     * Set the selected tenant in the gateway session.
     * The gateway will inject X-Tenant header on all subsequent requests.
     */
    selectTenant: async (tenantCode) => {
        const response = await apiClient.post("/auth/select-tenant", { tenantCode });
        return response.data;
    },

    /**
     * Check current session status (on page reload or after OAuth2 login).
     * After successful OAuth2 login, this also fetches tenants from the dataloader.
     * @returns {{ authenticated, email, name, tenants, tenant, user }}
     */
    getSession: async () => {
        const response = await apiClient.get("/auth/session");
        return response.data;
    },

    /**
     * Logout: redirects to the gateway's logout endpoint which performs
     * OIDC RP-Initiated Logout with Zitadel.
     */
    logout: () => {
        if (typeof window !== "undefined") {
            window.location.href = `${GATEWAY_URI}/auth/logout`;
        }
    },
};

// --- Service API helpers ---
// These use the gateway routes: /api/dataloader/** and /api/reporting/**

export const dataloaderApi = {
    get: (path, config = {}) => apiClient.get(`/api/dataloader${path}`, config),
    post: (path, data, config = {}) => apiClient.post(`/api/dataloader${path}`, data, config),
    put: (path, data, config = {}) => apiClient.put(`/api/dataloader${path}`, data, config),
    delete: (path, config = {}) => apiClient.delete(`/api/dataloader${path}`, config),
};

export const reportingApi = {
    get: (path, config = {}) => apiClient.get(`/api/reporting${path}`, config),
    post: (path, data, config = {}) => apiClient.post(`/api/reporting${path}`, data, config),
};

export default apiClient;

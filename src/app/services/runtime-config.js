/**
 * Service URLs resolved at runtime instead of build time.
 *
 * NEXT_PUBLIC_* values are inlined into the client bundle by `next build`, so an image built
 * for one environment (e.g. the QA host) ignores the env vars of the container it runs in.
 * The root layout reads the container's env on each request and publishes it as
 * window.__FYNTRAC_ENV__; the browser reads from there first.
 */

export const RUNTIME_CONFIG_GLOBAL = "__FYNTRAC_ENV__";

const DEFAULTS = {
    gatewayUri: "http://localhost:8585",
    dslStudioUrl: "http://localhost:3000",
    insightUrl: "http://localhost:3001",
};

/**
 * Server only: read the container's env. The computed key keeps Next.js from inlining the
 * NEXT_PUBLIC_* values at build time.
 */
export function readServerRuntimeConfig() {
    const env = (name) => process.env[`NEXT_PUBLIC_${name}`] || undefined;
    return {
        gatewayUri: env("GATEWAY_URI") || DEFAULTS.gatewayUri,
        dslStudioUrl: env("DSL_STUDIO_URL") || DEFAULTS.dslStudioUrl,
        insightUrl: env("INSIGHT_URL") || DEFAULTS.insightUrl,
    };
}

function runtimeValue(key) {
    if (typeof window !== "undefined") {
        const value = window[RUNTIME_CONFIG_GLOBAL]?.[key];
        if (value) return value;
    }
    return undefined;
}

// The build-time values remain a fallback for `next dev`, where there is no injected config.
export const gatewayUri = () =>
    runtimeValue("gatewayUri") || process.env.NEXT_PUBLIC_GATEWAY_URI || DEFAULTS.gatewayUri;

export const dslStudioUrl = () =>
    runtimeValue("dslStudioUrl") || process.env.NEXT_PUBLIC_DSL_STUDIO_URL || DEFAULTS.dslStudioUrl;

export const insightUrl = () =>
    runtimeValue("insightUrl") || process.env.NEXT_PUBLIC_INSIGHT_URL || DEFAULTS.insightUrl;

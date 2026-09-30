/**
 * HomeVerse Frontend Environment Configuration (Phase 35)
 * Centralizes environment resolution across Development, Staging, and Production.
 */

export type Environment = "development" | "staging" | "production";

const resolveEnvironment = (): Environment => {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV;
  if (env === "production") return "production";
  if (env === "staging") return "staging";
  return "development";
};

export const currentEnvironment: Environment = resolveEnvironment();

export const isDevelopment = currentEnvironment === "development";
export const isStaging = currentEnvironment === "staging";
export const isProduction = currentEnvironment === "production";

export const environmentConfig = {
  environment: currentEnvironment,
  isDevelopment,
  isStaging,
  isProduction,
  apiUrl:
    process.env.NEXT_PUBLIC_API_URL ||
    (isDevelopment ? "http://localhost:8080" : "https://api.homeverse.ai"),
  features: {
    enableAnalytics: isProduction || isStaging,
    enableDebugTools: isDevelopment,
    enableMockFallbacks: isDevelopment,
  },
};

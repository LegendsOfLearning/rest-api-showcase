export type ShowcaseEnvironment = "staging" | "production";

export const SHOWCASE_ENVIRONMENT_COOKIE = "showcase_environment";

export const showcaseApiBases: Record<ShowcaseEnvironment, string> = {
  staging: "https://api.smartlittlecookies.com/api",
  production: "https://api.legendsoflearning.com/api",
};

export function parseShowcaseEnvironment(value: unknown): ShowcaseEnvironment {
  if (value !== "staging" && value !== "production") {
    throw new Error("Select staging or production before connecting.");
  }
  return value;
}

export function configuredShowcaseEnvironment(baseUrl: string): ShowcaseEnvironment {
  const host = new URL(baseUrl).hostname;
  return host === "api.smartlittlecookies.com" || host === "app.smartlittlecookies.com"
    ? "staging"
    : "production";
}

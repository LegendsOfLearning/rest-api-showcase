import { cookies } from "next/headers";
import { configuredShowcaseEnvironment, parseShowcaseEnvironment, showcaseApiBases, SHOWCASE_ENVIRONMENT_COOKIE, type ShowcaseEnvironment } from "@/lib/api/environment";
import { cwd } from "process";

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

function detectAiPort(): number {
  const aiMatch = cwd().match(/ai([1-8])/);

  if (!aiMatch) return 4000;

  return 4000 + Number.parseInt(aiMatch[1], 10);
}

function isLocalApiBase(value: string): boolean {
  return /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?\/api\/?$/i.test(value);
}

export function legendsApiBaseUrl(environment?: ShowcaseEnvironment): string {
  if (environment !== undefined) return showcaseApiBases[parseShowcaseEnvironment(environment)];
  const configuredBase = process.env.LEGENDS_API_URL || "";
  const defaultDevBase = `http://localhost:${detectAiPort()}/api`;
  const defaultProdBase = "https://api.legendsoflearning.com/api";

  if (process.env.NODE_ENV === "development") {
    return stripTrailingSlash(isLocalApiBase(configuredBase) ? configuredBase : defaultDevBase);
  }

  return stripTrailingSlash(configuredBase || defaultProdBase);
}

export function defaultShowcaseEnvironment(): ShowcaseEnvironment {
  return configuredShowcaseEnvironment(legendsApiBaseUrl());
}

export async function sessionApiBaseUrl(): Promise<string> {
  const store = await cookies();
  const environment = store.get(SHOWCASE_ENVIRONMENT_COOKIE)?.value;
  // Existing sessions have no environment cookie. Keep their original configured
  // upstream; an invalid explicit value must never fall back to another host.
  return environment === undefined
    ? legendsApiBaseUrl()
    : legendsApiBaseUrl(parseShowcaseEnvironment(environment));
}

export async function sessionEnvironment(): Promise<ShowcaseEnvironment> {
  const store = await cookies();
  const environment = store.get(SHOWCASE_ENVIRONMENT_COOKIE)?.value;
  return environment === undefined ? defaultShowcaseEnvironment() : parseShowcaseEnvironment(environment);
}

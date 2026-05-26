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

export function legendsApiBaseUrl(): string {
  const configuredBase = process.env.LEGENDS_API_URL || "";
  const defaultDevBase = `http://localhost:${detectAiPort()}/api`;
  const defaultProdBase = "https://api.smartlittlecookies.com/api";

  if (process.env.NODE_ENV === "development") {
    return stripTrailingSlash(isLocalApiBase(configuredBase) ? configuredBase : defaultDevBase);
  }

  return stripTrailingSlash(configuredBase || defaultProdBase);
}

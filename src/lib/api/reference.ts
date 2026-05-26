export const LEGENDS_OPENAPI_SPEC_URL =
  process.env.NEXT_PUBLIC_LEGENDS_OPENAPI_SPEC_URL ||
  "https://api.smartlittlecookies.com/api/v3/docs/openapi";

export function openApiOperationUrl(operationId: string): string {
  return `${LEGENDS_OPENAPI_SPEC_URL}#operation/${operationId}`;
}

/**
 * Utility functions for formatting API paths for display
 */

/**
 * Formats an API path to include the v3 version prefix for display purposes
 * @param entry - An object with url or path property
 * @returns Formatted path with /api/v3 prefix
 */
export function getV3Path(entry: { url?: string; path?: string } | null | undefined): string {
  if (!entry) return '';
  const version = process.env.NEXT_PUBLIC_LEGENDS_API_VERSION || process.env.LEGENDS_API_VERSION || 'v3';
  const rel = entry.url || entry.path || '';
  const qIndex = rel.indexOf('?');
  const pathOnly = (qIndex >= 0 ? rel.slice(0, qIndex) : rel).replace(/^\/api\/?/, '');
  const withVersion = pathOnly.startsWith(`${version}/`) ? pathOnly : `${version}/${pathOnly}`;
  return `/api/${withVersion}`;
}


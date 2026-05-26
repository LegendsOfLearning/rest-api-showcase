"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { findDocReference, generateApiLabel } from "@/lib/docs";

type ApiCallEntry = {
  id: string;
  method: string;
  url: string;
  path: string;
  status?: number;
  startedAt: number;
  finishedAt?: number;
  durationMs?: number;
  error?: string;
  label?: string;
  docUrl?: string;
  description?: string;
  requestBody?: unknown;
  responseBody?: unknown;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
};

type ApiActivityContextValue = {
  entries: ApiCallEntry[];
  drawerOpen: boolean;
  selectedEntry?: ApiCallEntry;
  setDrawerOpen: (open: boolean) => void;
  selectEntry: (id: string) => void;
  clearEntries: () => void;
};

const ApiActivityContext = createContext<ApiActivityContextValue | null>(null);

function isBackgroundRequest(headers?: HeadersInit) {
  if (!headers) return false;

  if (headers instanceof Headers) {
    return headers.get("x-console-background")?.toLowerCase() === "true";
  }

  if (Array.isArray(headers)) {
    return headers.some(
      ([key, value]) => key.toLowerCase() === "x-console-background" && String(value).toLowerCase() === "true"
    );
  }

  return Object.entries(headers).some(
    ([key, value]) => key.toLowerCase() === "x-console-background" && String(value).toLowerCase() === "true"
  );
}

export function ApiActivityProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<ApiCallEntry[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const isPatched = useRef(false);

  const selectEntry = useCallback((id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  }, []);

  const clearEntries = useCallback(() => {
    setEntries([]);
    setSelectedId(undefined);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || isPatched.current) {
      return;
    }

    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method || "GET").toUpperCase();
      const urlString = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const targetUrl = new URL(urlString, window.location.origin);
      const path = targetUrl.pathname;

      if (!path.startsWith("/api") || isBackgroundRequest(init?.headers)) {
        return originalFetch(input, init);
      }

      const id = crypto.randomUUID();
      const meta = findDocReference(path, method);
      // Always generate a label - use doc reference if available, otherwise generate from path/method
      const label = meta?.label || generateApiLabel(path, method);

      const requestHeaders = (() => {
        if (!init?.headers) return undefined;
        const headers: Record<string, string> = {};
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => {
            headers[key] = value;
          });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => {
            headers[key.toLowerCase()] = value;
          });
        } else {
          Object.entries(init.headers).forEach(([key, value]) => {
            headers[key.toLowerCase()] = String(value);
          });
        }
        return headers;
      })();

      const parseBody = (body?: BodyInit | null) => {
        if (typeof body === "string") {
          try {
            return JSON.parse(body);
          } catch {
            return body;
          }
        }
        return body;
      };

      const entry: ApiCallEntry = {
        id,
        method,
        url: urlString,
        path,
        startedAt: performance.now(),
        label,
        docUrl: meta?.docUrl,
        description: meta?.description
      };

      if (init?.body) {
        entry.requestBody = parseBody(init.body as BodyInit);
      }

      if (requestHeaders) {
        entry.requestHeaders = requestHeaders;
      }

      setEntries((prev) => {
        const next = [entry, ...prev];
        return next.slice(0, 40);
      });

      try {
        const response = await originalFetch(input, init);
        const finishedAt = performance.now();
        let responseBody: unknown;
        try {
          const clone = response.clone();
          try {
            responseBody = await clone.json();
          } catch {
            responseBody = await clone.text();
          }
        } catch {
          responseBody = undefined;
        }

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        setEntries((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: response.status,
                  finishedAt,
                  durationMs: finishedAt - item.startedAt
                  ,
                  responseBody,
                  responseHeaders
                }
              : item
          )
        );

        return response;
      } catch (error) {
        const finishedAt = performance.now();

        setEntries((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: undefined,
                  finishedAt,
                  durationMs: finishedAt - item.startedAt,
                  error: error instanceof Error ? error.message : String(error)
                }
              : item
          )
        );

        throw error;
      }
    };

    isPatched.current = true;

    return () => {
      window.fetch = originalFetch;
      isPatched.current = false;
    };
  }, []);

  const selectedEntry = useMemo(() => entries.find((entry) => entry.id === selectedId) || entries[0], [entries, selectedId]);

  const value = useMemo(
    () => ({
      entries,
      drawerOpen,
      selectedEntry,
      setDrawerOpen,
      selectEntry,
      clearEntries
    }),
    [entries, drawerOpen, selectedEntry, selectEntry, clearEntries]
  );

  return <ApiActivityContext.Provider value={value}>{children}</ApiActivityContext.Provider>;
}

export function useApiActivity() {
  const context = useContext(ApiActivityContext);
  if (!context) {
    throw new Error("useApiActivity must be used within ApiActivityProvider");
  }
  return context;
}

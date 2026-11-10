"use client";

import { useCallback, useMemo } from "react";

import { URLS } from "@/config/urls";

export interface ApiConfig {
  baseURL?: string;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(`Request failed with status ${status}`);
    this.status = status;
    this.data = data;
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Django's CSRF cookie, sent back as a header on anything that changes data (staff sessions need it). */
function csrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

/**
 * Thin fetch wrapper. The returned functions are stable as long as the config
 * values are, so they are safe in dependency arrays. Still destructure
 * (`const { get, post } = useApi()`) and memoize any config object you pass.
 */
export function useApi(config?: ApiConfig) {
  const baseURL = config?.baseURL ?? URLS.API_BASE_URL;
  const headersKey = JSON.stringify(config?.headers ?? {});

  const request = useCallback(
    async <T>(method: Method, path: string, body?: unknown): Promise<T> => {
      const response = await fetch(`${baseURL}${path}`, {
        method,
        credentials: "include",
        headers: {
          Accept: "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(method !== "GET" && csrfToken() ? { "X-CSRFToken": csrfToken() } : {}),
          ...(JSON.parse(headersKey) as Record<string, string>),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const data = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) {
        throw new ApiError(response.status, data);
      }
      return data as T;
    },
    [baseURL, headersKey],
  );

  const get = useCallback(<T>(path: string) => request<T>("GET", path), [request]);

  /** Fetches a file (the CSV export) with the staff session cookie and returns it with its name. */
  const download = useCallback(
    async (path: string): Promise<{ blob: Blob; filename: string }> => {
      const response = await fetch(`${baseURL}${path}`, { credentials: "include" });
      if (!response.ok) {
        throw new ApiError(response.status, await response.json().catch(() => null));
      }
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? "download";
      return { blob: await response.blob(), filename };
    },
    [baseURL],
  );
  const post = useCallback(<T>(path: string, body?: unknown) => request<T>("POST", path, body), [request]);
  const put = useCallback(<T>(path: string, body?: unknown) => request<T>("PUT", path, body), [request]);
  const patch = useCallback(<T>(path: string, body?: unknown) => request<T>("PATCH", path, body), [request]);
  const del = useCallback(<T>(path: string) => request<T>("DELETE", path), [request]);

  return useMemo(() => ({ get, post, put, patch, del, download }), [get, post, put, patch, del, download]);
}

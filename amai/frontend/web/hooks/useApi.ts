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
  const post = useCallback(<T>(path: string, body?: unknown) => request<T>("POST", path, body), [request]);
  const put = useCallback(<T>(path: string, body?: unknown) => request<T>("PUT", path, body), [request]);
  const patch = useCallback(<T>(path: string, body?: unknown) => request<T>("PATCH", path, body), [request]);
  const del = useCallback(<T>(path: string) => request<T>("DELETE", path), [request]);

  return useMemo(() => ({ get, post, put, patch, del }), [get, post, put, patch, del]);
}

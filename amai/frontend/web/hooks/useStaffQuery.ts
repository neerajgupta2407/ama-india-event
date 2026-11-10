"use client";

import { useCallback, useEffect, useState } from "react";

import { useStaff } from "@/contexts/StaffContext";
import { useApi } from "@/hooks/useApi";
import { errorMessage, isSignedOut } from "@/utils/staff";

interface QueryState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => void;
}

/**
 * GET a staff endpoint. Pass null to wait (for example until a filter is ready).
 * `path` is a plain string, so it is safe as a dependency; when it changes the data reloads.
 */
export function useStaffQuery<T>(path: string | null): QueryState<T> {
  const { get } = useApi();
  const { signedOut } = useStaff();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    get<T>(path)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
        setLoadedFor(path);
      })
      .catch((caught) => {
        if (cancelled) return;
        if (isSignedOut(caught)) {
          signedOut();
          return;
        }
        setError(errorMessage(caught));
        setLoadedFor(path);
      });
    return () => {
      cancelled = true;
    };
  }, [get, path, tick, signedOut]);

  const refetch = useCallback(() => setTick((n) => n + 1), []);
  return { data, error, loading: path !== null && loadedFor !== path, refetch };
}

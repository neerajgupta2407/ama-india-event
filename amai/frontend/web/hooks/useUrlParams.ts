"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Filters live in the address bar, so a link like /dashboard/registrations/?status=confirmed
 * opens pre-filtered and a refresh keeps the view. Setting a filter resets the page number.
 */
export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const set = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(search.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (!("page" in updates)) next.delete("page");
      const text = next.toString();
      router.replace(text ? `${pathname}?${text}` : pathname, { scroll: false });
    },
    [router, pathname, search],
  );

  return { params: search, set };
}

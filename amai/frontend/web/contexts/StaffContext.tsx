"use client";

import { createContext, useContext } from "react";

import type { StaffUser } from "@/types/staff";

interface StaffContextValue {
  user: StaffUser;
  /** Call when the API says the session is gone: sends the person back to the login page. */
  signedOut: () => void;
  signOut: () => Promise<void>;
}

export const StaffContext = createContext<StaffContextValue | null>(null);

export function useStaff(): StaffContextValue {
  const value = useContext(StaffContext);
  if (!value) throw new Error("useStaff must be used inside the dashboard");
  return value;
}

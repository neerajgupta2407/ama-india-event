import type { StaffUser } from "@/types/staff";
import { hasRole } from "@/utils/staff";

/** Roles that may read registrations, payments and enquiries. Check-in operators may not. */
export const VIEW_ROLES = ["ops", "finance", "membership", "event_admin", "viewer"] as const;

/** Where a person lands after signing in: gate staff go straight to check-in. */
export function homeFor(user: StaffUser): string {
  return hasRole(user, ...VIEW_ROLES) ? "/dashboard/" : "/dashboard/check-in/";
}

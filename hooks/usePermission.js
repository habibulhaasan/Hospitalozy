"use client";

/**
 * hooks/usePermission.js
 * ------------------------------------------------------------------
 * Thin wrapper over AuthContext's `employee.permissions` (the same
 * shape EmployeeComponent's Role & Page Access grid writes:
 * { dashboard, billing, reporting, doctors, testMaster, employees,
 * settings }). One hook, used everywhere a permission check is
 * needed, so the field name for "can this person see billing" only
 * has to be right in one place.
 * ------------------------------------------------------------------ */
import { useAuth } from "@/context/AuthContext";

export function usePermission(moduleKey) {
  const { employee, loading } = useAuth();
  if (loading) return false;
  if (!employee) return false;
  // Admin role always passes, even if a specific permission checkbox
  // wasn't explicitly ticked — matches EmployeeComponent's Role preset
  // where Admin has every module set to true by default.
  if (employee.role === "Admin") return true;
  return !!employee.permissions?.[moduleKey];
}

/** Convenience for when a page/component genuinely needs the whole map. */
export function usePermissions() {
  const { employee, loading } = useAuth();
  if (loading || !employee) return {};
  if (employee.role === "Admin") {
    return { dashboard: true, billing: true, reporting: true, doctors: true, testMaster: true, employees: true, settings: true };
  }
  return employee.permissions || {};
}

"use client";

/**
 * app/dashboard/layout.jsx
 * ------------------------------------------------------------------
 * The permission-gated shell every dashboard page renders inside.
 * Two jobs:
 *   1. Redirect to /login if nobody's signed in.
 *   2. Only show nav links for modules the signed-in employee's
 *      `permissions` actually include — this is "showing specific
 *      components to specific users" applied at the navigation
 *      level, not just inside each page (a Billing Staff employee
 *      never even sees a "Test Master" link, rather than seeing it
 *      and hitting a permission-denied page after clicking).
 *
 * Each individual page still wraps its content in <PermissionGate>
 * too (see app/dashboard/doctors/page.jsx) — the nav hiding people
 * from links they can't use is a UX nicety, not the actual security
 * boundary. Someone navigating straight to a URL they don't have
 * permission for should still be blocked by the page itself, and
 * ultimately by your Firestore security rules — a hidden nav link is
 * not access control.
 * ------------------------------------------------------------------ */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermission";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", module: "dashboard" },
  // "dashboard" is effectively "any assigned role" — every ROLE_PRESET
  // in EmployeeComponent sets it true, which matches firestore.rules
  // treating /patients/{docId} as open to any signed-in employee
  // rather than gated to one specific module.
  { href: "/dashboard/patients", label: "Patients", module: "dashboard" },
  { href: "/dashboard/invoices/new", label: "Billing", module: "billing" },
  { href: "/dashboard/lab-reports/new", label: "Reporting", module: "reporting" },
  { href: "/dashboard/doctors", label: "Doctors", module: "doctors" },
  { href: "/dashboard/test-master", label: "Test Master", module: "testMaster" },
  { href: "/dashboard/employees", label: "Employees", module: "employees" },
  { href: "/dashboard/accounting", label: "Accounting", module: "billing" },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, employee, loading, signOut } = useAuth();
  const permissions = usePermissions();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) return <div className="p-8 text-sm text-slate-400">Loading…</div>;
  if (!user) return null; // redirect effect above is about to fire

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-sm text-slate-800">Hospitalozy</span>
          {NAV_ITEMS.filter((item) => permissions[item.module]).map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-slate-600 hover:text-slate-900">
              {item.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{employee?.name || user.email}</span>
          <button onClick={() => signOut().then(() => router.push("/login"))} className="text-xs text-slate-500 hover:text-red-600 underline">
            Sign Out
          </button>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}

"use client";

/**
 * app/dashboard/page.jsx
 * ------------------------------------------------------------------
 * Landing page after sign-in — a simple module launcher. Real
 * dashboards (today's revenue, pending due, etc.) would likely
 * embed pieces of AccountingComponent's KPI row here; left as a
 * simple launcher since that's a product decision, not a structural
 * one this scaffold should presume for you.
 * ------------------------------------------------------------------ */
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermission";

const TILES = [
  { href: "/dashboard/invoices/new", label: "New Invoice", module: "billing" },
  { href: "/dashboard/patient-tickets/new", label: "New OPD Ticket", module: "billing" },
  { href: "/dashboard/lab-reports/new", label: "New Lab Report", module: "reporting" },
  { href: "/dashboard/patients", label: "Patients", module: "dashboard" },
  { href: "/dashboard/doctors", label: "Doctors", module: "doctors" },
  { href: "/dashboard/test-master", label: "Test Master", module: "testMaster" },
  { href: "/dashboard/employees", label: "Employees", module: "employees" },
  { href: "/dashboard/accounting", label: "Accounting", module: "billing" },
];

export default function DashboardHomePage() {
  const { employee } = useAuth();
  const permissions = usePermissions();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-lg font-semibold text-slate-800 mb-1">Welcome{employee?.name ? `, ${employee.name}` : ""}</h1>
      <p className="text-sm text-slate-500 mb-6">{employee?.role || "—"}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {TILES.filter((t) => permissions[t.module]).map((t) => (
          <a key={t.href} href={t.href} className="bg-white border border-slate-200 rounded-lg p-4 text-sm font-medium text-slate-700 hover:border-slate-400">
            {t.label}
          </a>
        ))}
      </div>
    </div>
  );
}

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
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import SidebarNav from "@/components/shared/SidebarNav";
import { useQuickAccess } from "@/hooks/useQuickAccess";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, employee, loading, signOut } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const { quickAccessLinks } = useQuickAccess();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) return <div className="p-8 text-sm text-slate-400">Loading…</div>;
  if (!user) return null; // redirect effect above is about to fire

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <SidebarNav 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header (Top Nav) - Now used for Quick Access & User Profile */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            {quickAccessLinks.length === 0 ? (
              <span className="text-xs text-slate-400 italic">Quick Access (Configure in Settings)</span>
            ) : (
              quickAccessLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="whitespace-nowrap text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                >
                  {link.label}
                </Link>
              ))
            )}
          </div>
          
          <div className="flex items-center gap-4 pl-4 ml-auto border-l border-slate-200">
            <span className="text-xs text-slate-600 font-medium whitespace-nowrap">{employee?.name || user.email}</span>
            <button 
              onClick={() => signOut().then(() => router.push("/login"))} 
              className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded hover:bg-slate-200 hover:text-red-600 transition-colors whitespace-nowrap"
            >
              Sign Out
            </button>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

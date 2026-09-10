"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/hooks/usePermission";

const NAV_GROUPS = [
  {
    label: "Overview",
    module: "dashboard",
    items: [
      { href: "/dashboard", label: "Dashboard", exact: true },
      { href: "/dashboard/patients", label: "Patient List" }
    ]
  },
  {
    label: "Billing",
    module: "billing",
    items: [
      { href: "/dashboard/invoices/new", label: "New Invoice" },
      { href: "/dashboard/invoices", label: "Invoice History", exact: true },
      { href: "/dashboard/accounting", label: "Accounting" }
    ]
  },
  {
    label: "Laboratory",
    module: "reporting",
    items: [
      { href: "/dashboard/lab-reports/new", label: "New Report" },
      { href: "/dashboard/lab-reports", label: "Report History", exact: true }
    ]
  },
  {
    label: "Administration",
    // We don't have a single module for admin, so we evaluate item by item
    items: [
      { href: "/dashboard/doctors", label: "Doctors", module: "doctors" },
      { href: "/dashboard/employees", label: "Employees", module: "employees" },
      { href: "/dashboard/test-master", label: "Test Master", module: "testMaster" },
      { href: "/dashboard/settings", label: "Settings", module: "settings" }
    ]
  }
];

export default function SidebarNav({ isCollapsed, onToggleCollapse }) {
  const permissions = usePermissions();
  const pathname = usePathname();
  
  const [openGroups, setOpenGroups] = useState({
    "Overview": true,
    "Billing": true,
    "Laboratory": true,
    "Administration": true,
  });

  const toggleGroup = (label) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className={`flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 h-full ${isCollapsed ? "w-16" : "w-64"}`}>
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        {!isCollapsed && <span className="font-bold text-white tracking-wide truncate">Hospitalozy</span>}
        <button onClick={onToggleCollapse} className="text-slate-400 hover:text-white mx-auto">
          {isCollapsed ? "▶" : "◀"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-2">
        {NAV_GROUPS.map((group) => {
          // Check if user has permission for this group
          const hasGroupAccess = group.module 
            ? permissions[group.module] 
            : group.items.some(item => permissions[item.module]);
            
          if (!hasGroupAccess) return null;

          // Filter items based on individual module permissions if specified
          const visibleItems = group.items.filter(item => item.module ? permissions[item.module] : true);
          if (visibleItems.length === 0) return null;

          const isOpen = openGroups[group.label];

          return (
            <div key={group.label} className="px-2">
              {!isCollapsed ? (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
                >
                  {group.label}
                  <span className="text-[10px]">{isOpen ? "▼" : "▶"}</span>
                </button>
              ) : (
                <div className="text-center text-[10px] font-bold text-slate-600 uppercase py-2 mb-1" title={group.label}>
                  {group.label.substring(0, 3)}
                </div>
              )}

              {(!isCollapsed && isOpen) || isCollapsed ? (
                <div className="mt-1 space-y-1">
                  {visibleItems.map(item => {
                    const isActive = item.exact 
                      ? pathname === item.href 
                      : (pathname === item.href || pathname.startsWith(item.href + "/"));
                      
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={isCollapsed ? item.label : undefined}
                        className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                          isActive
                            ? "bg-blue-600 text-white font-medium shadow-sm"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        } ${isCollapsed ? "text-center text-xs truncate py-3" : ""}`}
                      >
                        {isCollapsed ? item.label.substring(0, 2) : item.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}


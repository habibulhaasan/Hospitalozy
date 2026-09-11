"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/hooks/usePermission";
import { 
  LayoutDashboard, Users, Receipt, History, Calculator, 
  FileText, FlaskConical, Stethoscope, UserCog, Database, 
  Settings, ChevronRight, ChevronLeft, Activity 
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Overview",
    module: "dashboard",
    items: [
      { href: "/dashboard", label: "Dashboard", exact: true, icon: LayoutDashboard },
      { href: "/dashboard/patients", label: "Patient List", icon: Users }
    ]
  },
  {
    label: "Billing",
    module: "billing",
    items: [
      { href: "/dashboard/invoices/new", label: "New Invoice", icon: Receipt },
      { href: "/dashboard/invoices", label: "Invoice History", exact: true, icon: History },
      { href: "/dashboard/accounting", label: "Accounting", icon: Calculator }
    ]
  },
  {
    label: "Laboratory",
    module: "reporting",
    items: [
      { href: "/dashboard/lab-reports/new", label: "New Report", icon: FileText },
      { href: "/dashboard/lab-reports", label: "Report History", exact: true, icon: FlaskConical }
    ]
  },
  {
    label: "Administration",
    items: [
      { href: "/dashboard/doctors", label: "Doctors", module: "doctors", icon: Stethoscope },
      { href: "/dashboard/employees", label: "Employees", module: "employees", icon: UserCog },
      { href: "/dashboard/test-master", label: "Test Master", module: "testMaster", icon: Database },
      { href: "/dashboard/settings", label: "Settings", module: "settings", icon: Settings }
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
    if (isCollapsed) {
      onToggleCollapse();
    }
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className={`flex flex-col bg-white border-r border-slate-200 text-slate-700 transition-all duration-300 h-full ${isCollapsed ? "w-[72px]" : "w-64"}`}>
      <div className="flex items-center justify-between p-4 h-[53px] border-b border-slate-200 shrink-0">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2 text-blue-600 font-bold tracking-wide truncate">
              <Activity className="w-5 h-5 shrink-0" />
              <span>Hospitalozy</span>
            </div>
            <button 
              onClick={onToggleCollapse} 
              className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button 
            onClick={onToggleCollapse}
            className="mx-auto text-blue-600 p-1.5 rounded-md hover:bg-blue-50 transition-colors"
            title="Expand Sidebar"
          >
            <Activity className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
        {NAV_GROUPS.map((group) => {
          const hasGroupAccess = group.module 
            ? permissions[group.module] 
            : group.items.some(item => permissions[item.module]);
            
          if (!hasGroupAccess) return null;

          const visibleItems = group.items.filter(item => item.module ? permissions[item.module] : true);
          if (visibleItems.length === 0) return null;

          const isOpen = openGroups[group.label];

          return (
            <div key={group.label} className="px-3">
              {!isCollapsed ? (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full text-left px-2 py-1 mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {group.label}
                  <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                </button>
              ) : (
                <div className="border-b border-slate-100 mx-2 mb-2" />
              )}

              {(!isCollapsed && isOpen) || isCollapsed ? (
                <div className="space-y-1">
                  {visibleItems.map(item => {
                    const isActive = item.exact 
                      ? pathname === item.href 
                      : (pathname === item.href || pathname.startsWith(item.href + "/"));
                      
                    const Icon = item.icon;
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={isCollapsed ? item.label : undefined}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          isActive
                            ? "bg-blue-50 text-blue-700 font-medium shadow-sm"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        } ${isCollapsed ? "justify-center" : ""}`}
                      >
                        <Icon className={`shrink-0 ${isCollapsed ? "w-5 h-5" : "w-4 h-4"} ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
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


"use client";

import React, { useState } from "react";
import { useQuickAccess } from "@/hooks/useQuickAccess";

const AVAILABLE_LINKS = [
  { href: "/dashboard/invoices/new", label: "New Invoice" },
  { href: "/dashboard/lab-reports/new", label: "New Report" },
  { href: "/dashboard/patients", label: "Patients" },
  { href: "/dashboard/doctors", label: "Doctors" },
  { href: "/dashboard/employees", label: "Employees" },
  { href: "/dashboard/accounting", label: "Accounting" },
];

export default function SettingsComponent() {
  const { quickAccessLinks, saveQuickAccess } = useQuickAccess();
  const [selectedLinks, setSelectedLinks] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Initialize selectedLinks when quickAccessLinks load
  React.useEffect(() => {
    if (!hasLoaded && quickAccessLinks.length > 0) {
      setSelectedLinks(quickAccessLinks.map(l => l.href));
      setHasLoaded(true);
    }
  }, [quickAccessLinks, hasLoaded]);

  const handleToggle = (href) => {
    setSelectedLinks(prev => 
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    );
  };

  const handleSave = () => {
    const newLinks = AVAILABLE_LINKS.filter(l => selectedLinks.includes(l.href));
    saveQuickAccess(newLinks);
    alert("Quick Access settings saved!");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">Settings</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Quick Access Bar</h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose which pages appear in the top header for easy access. These preferences are saved locally on this browser.
          </p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AVAILABLE_LINKS.map(link => (
              <label key={link.href} className="flex items-center gap-3 p-3 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedLinks.includes(link.href)}
                  onChange={() => handleToggle(link.href)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 font-medium">{link.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-sm font-medium transition-colors shadow-sm"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


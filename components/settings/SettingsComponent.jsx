"use client";

import React, { useState, useEffect } from "react";
import { useQuickAccess } from "@/hooks/useQuickAccess";

const AVAILABLE_LINKS = [
  { href: "/dashboard/patient-tickets/new", label: "New Ticket" },
  { href: "/dashboard/invoices/new", label: "New Invoice" },
  { href: "/dashboard/lab-reports/new", label: "New Report" },
  { href: "/dashboard/patients", label: "Patients" },
  { href: "/dashboard/doctors", label: "Doctors" },
  { href: "/dashboard/employees", label: "Employees" },
  { href: "/dashboard/accounting", label: "Accounting" },
];

export default function SettingsComponent({
  onLoadAppConfig = async () => ({}),
  onSaveAppConfig = async () => {},
} = {}) {
  const { quickAccessLinks, saveQuickAccess } = useQuickAccess();
  const [selectedLinks, setSelectedLinks] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("quick-access");

  const [appConfig, setAppConfig] = useState({ 
    showManualTestSelector: false, 
    showExtraPageSelector: false, 
    technologistCanEditReports: true,
    hiddenNavItems: [] 
  });
  const [configSaving, setConfigSaving] = useState(false);

  // Initialize selectedLinks when quickAccessLinks load
  useEffect(() => {
    if (!hasLoaded && quickAccessLinks.length > 0) {
      setSelectedLinks(quickAccessLinks.map(l => l.href));
      setHasLoaded(true);
    }
  }, [quickAccessLinks, hasLoaded]);

  useEffect(() => {
    onLoadAppConfig().then(cfg => {
      if (cfg) setAppConfig(prev => ({ ...prev, ...cfg }));
    }).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = (href) => {
    setSelectedLinks(prev => 
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    );
  };

  const handleSaveQuickAccess = () => {
    const newLinks = AVAILABLE_LINKS.filter(l => selectedLinks.includes(l.href));
    saveQuickAccess(newLinks);
    alert("Quick Access settings saved!");
  };

  const handleSaveAppConfig = async () => {
    setConfigSaving(true);
    try {
      await onSaveAppConfig(appConfig);
      alert("App configuration saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save app configuration.");
    } finally {
      setConfigSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">Settings</h1>
      </div>

      <div className="flex border-b border-slate-200 mb-6">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "quick-access"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
          onClick={() => setActiveTab("quick-access")}
        >
          Quick Access
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "navigation"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
          onClick={() => setActiveTab("navigation")}
        >
          Navigation Configuration
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "global"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
          onClick={() => setActiveTab("global")}
        >
          Lab Configuration
        </button>
      </div>

      {activeTab === "quick-access" && (
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
                onClick={handleSaveQuickAccess}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded text-sm font-medium transition-colors shadow-sm"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "navigation" && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Sidebar Navigation</h2>
            <p className="text-xs text-slate-500 mt-1">
              Choose which items are globally visible in the sidebar navigation. (Requires page refresh to take effect).
            </p>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Dashboard", "Patient List", "New Ticket", "Ticket History",
                "New Invoice", "Invoice History", "Commissions", "Accounting",
                "New Report", "Report History", "Doctors", "Agents",
                "Employees", "Test Master", "Settings"
              ].map(label => {
                const isHidden = (appConfig.hiddenNavItems || []).includes(label);
                return (
                  <label key={label} className="flex items-center gap-3 p-3 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={!isHidden}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAppConfig(prev => {
                          const currentHidden = prev.hiddenNavItems || [];
                          const newHidden = checked 
                            ? currentHidden.filter(l => l !== label) 
                            : [...currentHidden, label];
                          return { ...prev, hiddenNavItems: newHidden };
                        });
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 font-medium">{label}</span>
                  </label>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleSaveAppConfig}
                disabled={configSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2 rounded text-sm font-medium transition-colors shadow-sm"
              >
                {configSaving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "global" && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Lab Reports</h2>
            <p className="text-xs text-slate-500 mt-1">
              Global configuration for the laboratory report builder.
            </p>
          </div>

          <div className="p-5">
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={appConfig.showManualTestSelector || false}
                  onChange={(e) => setAppConfig(prev => ({ ...prev, showManualTestSelector: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm text-slate-700 font-medium">Show manual test selector by default</span>
                  <span className="text-xs text-slate-500">If unchecked, technologists will not see the manual test selector in the lab report builder, and tests will only be auto-populated from the selected invoice/ticket.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={appConfig.showExtraPageSelector || false}
                  onChange={(e) => setAppConfig(prev => ({ ...prev, showExtraPageSelector: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm text-slate-700 font-medium">Show extra page selector</span>
                  <span className="text-xs text-slate-500">If unchecked, the "+ Add Extra Page" button will be hidden from technologists, preventing manual creation of free-text pages.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer transition-colors">
                <input 
                  type="checkbox" 
                  checked={appConfig.technologistCanEditReports ?? true}
                  onChange={(e) => setAppConfig(prev => ({ ...prev, technologistCanEditReports: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div className="flex flex-col">
                  <span className="text-sm text-slate-700 font-medium">Technologists can edit reports</span>
                  <span className="text-xs text-slate-500">If unchecked, technologists will not see the "Edit" button for any report. Only Admins or designated roles will be able to edit them.</span>
                </div>
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleSaveAppConfig}
                disabled={configSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2 rounded text-sm font-medium transition-colors shadow-sm"
              >
                {configSaving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


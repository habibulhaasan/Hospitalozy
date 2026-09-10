"use client";

import { useState, useEffect } from "react";

/**
 * Hook to manage Quick Access links stored in localStorage.
 * Since this runs per-browser, it's a great fit for UI preferences.
 * We use a custom event to sync changes across components (e.g. from Settings to Header).
 */
export function useQuickAccess() {
  const [quickAccessLinks, setQuickAccessLinks] = useState([]);

  useEffect(() => {
    // Initial load
    const loadLinks = () => {
      const stored = localStorage.getItem("hospitalozy_quick_access");
      if (stored) {
        try {
          setQuickAccessLinks(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse quick access links", e);
        }
      }
    };

    loadLinks();

    // Listen for cross-component updates
    window.addEventListener("quick_access_updated", loadLinks);
    return () => window.removeEventListener("quick_access_updated", loadLinks);
  }, []);

  const saveQuickAccess = (links) => {
    localStorage.setItem("hospitalozy_quick_access", JSON.stringify(links));
    setQuickAccessLinks(links);
    window.dispatchEvent(new Event("quick_access_updated"));
  };

  return { quickAccessLinks, saveQuickAccess };
}


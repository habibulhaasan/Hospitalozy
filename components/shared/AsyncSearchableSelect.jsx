"use client";

/**
 * components/shared/AsyncSearchableSelect.jsx
 * ------------------------------------------------------------------
 * A searchable dropdown backed by an async lookup instead of a fixed
 * option list — for "search across a Firestore collection (or two)
 * and pick one" instead of SearchableSelect's "filter this array
 * that's already in memory." Debounced (300ms) so it doesn't fire a
 * query on every keystroke.
 *
 * Built for LabReportComponent's "find patient via Invoice/OPD
 * Ticket" search, but generic — anywhere else in this project needs
 * the same "type to search a backend, pick a result" pattern can
 * reuse this instead of writing another one-off combobox.
 * ------------------------------------------------------------------ */
import React, { useState, useEffect, useRef } from "react";

export default function AsyncSearchableSelect({ onSearch, onSelect, renderItem, placeholder, minChars = 2, emptyHint }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < minChars) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const found = await onSearch(query.trim());
        if (!cancelled) setResults(Array.isArray(found) ? found : []);
      } catch (err) {
        console.error(err);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, minChars]);

  function handleSelect(item) {
    onSelect(item);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <input
        className="border rounded px-2 py-1.5 text-sm w-full"
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      {open && query.trim().length >= minChars && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded shadow-lg text-sm">
          {loading && <div className="px-2 py-1.5 text-xs text-slate-400">Searching…</div>}
          {!loading && results.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-slate-400">{emptyHint || "No match found."}</div>
          )}
          {!loading &&
            results.map((item) => (
              <div
                key={item.key}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(item);
                }}
                className="px-2 py-1.5 hover:bg-slate-100 cursor-pointer"
              >
                {renderItem(item)}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

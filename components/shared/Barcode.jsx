"use client";

/**
 * components/shared/Barcode.jsx
 * ------------------------------------------------------------------
 * Renders a real, scannable Code128 barcode via the `jsbarcode`
 * package (`npm install jsbarcode` — MIT licensed, industry standard).
 * Loaded dynamically since it's a DOM-drawing library rather than a
 * plain data function.
 *
 * Deliberately NOT a hand-rolled Code128 encoder: a bar-width table
 * that's subtly wrong looks completely fine on screen but silently
 * fails at the scanner — worse than no barcode, since it looks like
 * it should work. `jsbarcode` is the reliable way to get one that
 * actually scans.
 *
 * If jsbarcode isn't installed yet, this falls back to a plain
 * readable text label instead of drawing something fake.
 *
 * Previously duplicated as InvoiceBarcode (InvoiceComponent.jsx,
 * InvoiceListComponent.jsx) and BillBarcode (PatientBillingComponent.jsx,
 * PatientBillingListComponent.jsx) — same implementation both times,
 * just renamed. This is the one copy everything should import now.
 * ------------------------------------------------------------------ */
import React, { useState, useEffect, useRef } from "react";

export default function Barcode({ value, height = 36, width = 1.3 }) {
  const svgRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("jsbarcode");
        const JsBarcode = mod.default || mod;
        if (!cancelled && svgRef.current) {
          JsBarcode(svgRef.current, value || " ", { format: "CODE128", displayValue: false, height, margin: 0, width });
          setFailed(false);
        }
      } catch (err) {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, height, width]);

  if (failed) {
    return (
      <div className="text-center">
        <div className="text-xs font-mono tracking-widest border border-slate-300 px-3 py-2 inline-block">{value}</div>
        <div className="no-print text-[9px] text-amber-600 mt-1">
          Run <code>npm install jsbarcode</code> for a scannable barcode here.
        </div>
      </div>
    );
  }
  return <svg ref={svgRef} />;
}

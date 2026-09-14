/**
 * components/shared/Pagination.jsx
 * Reusable prev/next pagination bar.
 * Props:
 *   currentPage  — 1-based page number (number)
 *   hasMore      — whether a next page exists (boolean)
 *   onPrev       — callback for previous page
 *   onNext       — callback for next page
 *   loading      — disable buttons while fetching (boolean)
 *   totalOnPage  — number of records shown on this page (number)
 *   pageSize     — max records per page (number)
 */
export default function Pagination({
  currentPage,
  hasMore,
  onPrev,
  onNext,
  loading = false,
  totalOnPage,
  pageSize = 20,
}) {
  if (currentPage === 1 && !hasMore) return null; // single page — hide entirely

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white">
      <p className="text-xs text-slate-500">
        Page {currentPage}
        {totalOnPage != null ? ` · ${totalOnPage} record${totalOnPage !== 1 ? "s" : ""}` : ""}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={currentPage <= 1 || loading}
          className="px-3 py-1.5 text-xs font-medium rounded border border-slate-200 bg-white text-slate-700
                     hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>
        <button
          onClick={onNext}
          disabled={!hasMore || loading}
          className="px-3 py-1.5 text-xs font-medium rounded border border-slate-200 bg-white text-slate-700
                     hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}


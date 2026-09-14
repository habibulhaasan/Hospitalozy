/**
 * lib/firestore/pagination.js
 * Shared cursor-based pagination utility for all listing screens.
 */
import { getDocs } from "firebase/firestore";

export const PAGE_SIZE = 20;

/**
 * fetchPage — executes a paginated Firestore query.
 *
 * @param {import("firebase/firestore").Query} baseQuery
 *   The query WITHOUT startAfter/limit applied — this function adds them.
 * @param {import("firebase/firestore").DocumentSnapshot|null} cursor
 *   The last document from the previous page, or null for page 1.
 * @param {number} pageSize
 * @returns {{ data: any[], firstDoc, lastDoc, hasMore: boolean }}
 */
export async function fetchPage(baseQuery, cursor = null, pageSize = PAGE_SIZE) {
  const { query, startAfter, limit } = await import("firebase/firestore");

  const q = cursor
    ? query(baseQuery, startAfter(cursor), limit(pageSize + 1))
    : query(baseQuery, limit(pageSize + 1));

  const snap = await getDocs(q);
  const docs = snap.docs;
  const hasMore = docs.length > pageSize;
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

  return {
    data: pageDocs,
    firstDoc: pageDocs[0] || null,
    lastDoc: pageDocs[pageDocs.length - 1] || null,
    hasMore,
  };
}


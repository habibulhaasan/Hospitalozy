/**
 * lib/cache.js
 * In-session memory cache for Firestore collections that don't change
 * during a work session (doctors, agents, tests, employee role lists).
 * Persists across component mounts without Context or localStorage.
 * TTL: 10 minutes by default.
 */

const DEFAULT_TTL_MS = 10 * 60 * 1000;
const store = new Map(); // key → { data, expiresAt }

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet(key, data, ttlMs = DEFAULT_TTL_MS) {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function cacheInvalidate(key) {
  store.delete(key);
}

export async function withCache(key, fetchFn, ttlMs = DEFAULT_TTL_MS) {
  const cached = cacheGet(key);
  if (cached !== null) return cached;
  const data = await fetchFn();
  cacheSet(key, data, ttlMs);
  return data;
}


import type { AnalysisResult } from "@/types";

interface CacheEntry {
  result: AnalysisResult;
  expiresAt: number;
}

// In-memory cache — survives hot reloads in dev, resets on cold start
// For production, swap this Map for Redis or a database
const cache = new Map<string, CacheEntry>();
const TTL_MS = 60 * 60 * 1000; // 1 hour

export function getCached(key: string): AnalysisResult | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.result;
}

export function setCached(key: string, result: AnalysisResult): void {
  cache.set(key, { result, expiresAt: Date.now() + TTL_MS });
}

export function makeCacheKey(owner: string, repo: string): string {
  return `${owner}/${repo}`.toLowerCase();
}

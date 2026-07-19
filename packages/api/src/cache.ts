/**
 * Least-recently-used cache with per-entry expiry.
 *
 * Concierge answers to identical questions are served from memory for a short
 * window, which cuts latency and protects the upstream Gemini quota. Reads
 * refresh recency, so hot questions stay cached while cold ones age out; when
 * full, the least recently used entry is evicted.
 */
export class LruTtlCache<V> {
  readonly #entries = new Map<string, { value: V; expiresAt: number }>();

  constructor(
    readonly ttlMs: number,
    readonly maxEntries: number,
  ) {
    if (ttlMs <= 0 || maxEntries <= 0) {
      throw new RangeError('ttlMs and maxEntries must be positive');
    }
  }

  get(key: string): V | undefined {
    const entry = this.#entries.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.#entries.delete(key);
      return undefined;
    }
    // Re-insert to mark as most recently used (Map preserves insertion order).
    this.#entries.delete(key);
    this.#entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V): void {
    if (this.#entries.has(key)) {
      this.#entries.delete(key);
    } else if (this.#entries.size >= this.maxEntries) {
      const lru = this.#entries.keys().next().value;
      if (lru !== undefined) this.#entries.delete(lru);
    }
    this.#entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  get size(): number {
    return this.#entries.size;
  }
}

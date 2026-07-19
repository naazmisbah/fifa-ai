import { afterEach, describe, expect, test, vi } from 'vitest';
import { LruTtlCache } from '../src/cache.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('LruTtlCache', () => {
  test('stores and retrieves within the TTL', () => {
    const cache = new LruTtlCache<string>(1000, 4);
    cache.set('k', 'v');
    expect(cache.get('k')).toBe('v');
    expect(cache.size).toBe(1);
  });

  test('expires entries after the TTL', () => {
    vi.useFakeTimers();
    const cache = new LruTtlCache<string>(1000, 4);
    cache.set('k', 'v');
    vi.advanceTimersByTime(1001);
    expect(cache.get('k')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  test('evicts the least recently USED entry, not the oldest inserted', () => {
    const cache = new LruTtlCache<number>(60_000, 2);
    cache.set('first', 1);
    cache.set('second', 2);
    cache.get('first'); // refreshes recency of "first"
    cache.set('third', 3); // evicts "second"
    expect(cache.get('first')).toBe(1);
    expect(cache.get('second')).toBeUndefined();
    expect(cache.get('third')).toBe(3);
  });

  test('overwriting a key refreshes it without evicting others', () => {
    const cache = new LruTtlCache<number>(60_000, 2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('a', 10);
    expect(cache.get('a')).toBe(10);
    expect(cache.get('b')).toBe(2);
  });

  test('rejects non-positive configuration', () => {
    expect(() => new LruTtlCache(0, 5)).toThrow(RangeError);
    expect(() => new LruTtlCache(1000, 0)).toThrow(RangeError);
  });
});

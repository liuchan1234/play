import { describe, it, expect } from 'vitest';
import { LruMap } from '../src/lruMap';

describe('LruMap', () => {
  it('stores and retrieves values', () => {
    const map = new LruMap<string, number>(10);
    map.set('a', 1);
    map.set('b', 2);
    expect(map.get('a')).toBe(1);
    expect(map.get('b')).toBe(2);
  });

  it('returns undefined for missing keys', () => {
    const map = new LruMap<string, number>(10);
    expect(map.get('nope')).toBeUndefined();
  });

  it('evicts oldest entry when over capacity', () => {
    const map = new LruMap<string, number>(3);
    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);
    map.set('d', 4); // should evict 'a'
    expect(map.get('a')).toBeUndefined();
    expect(map.get('b')).toBe(2);
    expect(map.get('d')).toBe(4);
    expect(map.size).toBe(3);
  });

  it('get() refreshes entry position (prevents eviction)', () => {
    const map = new LruMap<string, number>(3);
    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);
    map.get('a'); // refresh 'a' — now 'b' is oldest
    map.set('d', 4); // should evict 'b', not 'a'
    expect(map.get('a')).toBe(1);
    expect(map.get('b')).toBeUndefined();
    expect(map.get('d')).toBe(4);
  });

  it('set() on existing key updates value and position', () => {
    const map = new LruMap<string, number>(3);
    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);
    map.set('a', 100); // update 'a' — now 'b' is oldest
    map.set('d', 4); // should evict 'b'
    expect(map.get('a')).toBe(100);
    expect(map.get('b')).toBeUndefined();
  });

  it('delete() removes entry', () => {
    const map = new LruMap<string, number>(10);
    map.set('a', 1);
    map.delete('a');
    expect(map.get('a')).toBeUndefined();
    expect(map.size).toBe(0);
  });

  it('has() returns correct boolean', () => {
    const map = new LruMap<string, number>(10);
    map.set('a', 1);
    expect(map.has('a')).toBe(true);
    expect(map.has('b')).toBe(false);
  });

  it('clear() removes all entries', () => {
    const map = new LruMap<string, number>(10);
    map.set('a', 1);
    map.set('b', 2);
    map.clear();
    expect(map.size).toBe(0);
    expect(map.get('a')).toBeUndefined();
  });

  it('throws if maxSize < 1', () => {
    expect(() => new LruMap<string, number>(0)).toThrow();
    expect(() => new LruMap<string, number>(-1)).toThrow();
  });

  it('works with maxSize = 1', () => {
    const map = new LruMap<string, number>(1);
    map.set('a', 1);
    expect(map.get('a')).toBe(1);
    map.set('b', 2);
    expect(map.get('a')).toBeUndefined();
    expect(map.get('b')).toBe(2);
    expect(map.size).toBe(1);
  });
});

import { describe, it, expect } from 'vitest';
import { shuffle } from '../src/utils';

describe('shuffle', () => {
  it('returns a new array (does not mutate original)', () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    const result = shuffle(original);
    expect(original).toEqual(copy); // original unchanged
    expect(result).not.toBe(original); // different reference
  });

  it('preserves all elements', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = shuffle(arr);
    expect(result.length).toBe(arr.length);
    expect(result.sort((a, b) => a - b)).toEqual(arr.sort((a, b) => a - b));
  });

  it('handles empty array', () => {
    expect(shuffle([])).toEqual([]);
  });

  it('handles single element', () => {
    expect(shuffle([42])).toEqual([42]);
  });

  it('actually shuffles (statistical — at least one difference in 100 runs)', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let sawDifference = false;
    for (let i = 0; i < 100; i++) {
      const result = shuffle(arr);
      if (result.some((v, idx) => v !== arr[idx])) {
        sawDifference = true;
        break;
      }
    }
    expect(sawDifference).toBe(true);
  });
});

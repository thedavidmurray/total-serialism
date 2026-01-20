/**
 * Example test to verify Jest setup
 */

import { describe, it, expect } from '@jest/globals';

describe('Jest Setup Verification', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should work with arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  it('should work with custom grid matchers', () => {
    const grid1 = [
      [1, 0],
      [0, 1]
    ];
    const grid2 = [
      [1, 0],
      [0, 1]
    ];
    expect(grid1).toEqualGrid(grid2);
  });
});
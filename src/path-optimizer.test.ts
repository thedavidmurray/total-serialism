'use strict';

/**
 * Test suite for PathOptimizer
 * TDD approach for pen plotter path optimization
 */

import { PathOptimizer } from './path-optimizer';

// Test helpers
const assertPointsEqual = (actual: any[], expected: any[], tolerance = 0.01) => {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < actual.length; i++) {
    expect(Math.abs(actual[i].x - expected[i].x)).toBeLessThan(tolerance);
    expect(Math.abs(actual[i].y - expected[i].y)).toBeLessThan(tolerance);
  }
};

describe('PathOptimizer', () => {
  let optimizer: PathOptimizer;

  beforeEach(() => {
    optimizer = new PathOptimizer();
  });

  describe('simplifyPath', () => {
    it('should return original points if less than 3 points', () => {
      const points = [{ x: 0, y: 0 }, { x: 10, y: 10 }];
      const result = optimizer.simplifyPath(points);
      expect(result).toEqual(points);
    });

    it('should simplify straight line with redundant points', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 5, y: 5 },   // redundant
        { x: 10, y: 10 }
      ];
      const result = optimizer.simplifyPath(points, 1.0);
      expect(result).toEqual([{ x: 0, y: 0 }, { x: 10, y: 10 }]);
    });

    it('should preserve points outside tolerance', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 5, y: 10 },  // significant deviation
        { x: 10, y: 0 }
      ];
      const result = optimizer.simplifyPath(points, 1.0);
      expect(result.length).toBe(3);
    });

    it('should handle complex paths', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 1, y: 0.1 },
        { x: 2, y: 0.2 },
        { x: 3, y: 0.3 },
        { x: 10, y: 1 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ];
      const result = optimizer.simplifyPath(points, 0.5);
      expect(result.length).toBeLessThan(points.length);
      expect(result[0]).toEqual(points[0]);
      expect(result[result.length - 1]).toEqual(points[points.length - 1]);
    });
  });

  describe('joinPaths', () => {
    it('should join paths with matching endpoints', () => {
      const paths = [
        { points: [{ x: 0, y: 0 }, { x: 10, y: 0 }], closed: false },
        { points: [{ x: 10, y: 0 }, { x: 10, y: 10 }], closed: false }
      ];
      const result = optimizer.joinPaths(paths, 1.0);
      expect(result.length).toBe(1);
      expect(result[0].points.length).toBe(3);
    });

    it('should not join paths beyond threshold', () => {
      const paths = [
        { points: [{ x: 0, y: 0 }, { x: 10, y: 0 }], closed: false },
        { points: [{ x: 20, y: 0 }, { x: 20, y: 10 }], closed: false }
      ];
      const result = optimizer.joinPaths(paths, 5.0);
      expect(result.length).toBe(2);
    });

    it('should reverse paths when needed for joining', () => {
      const paths = [
        { points: [{ x: 0, y: 0 }, { x: 10, y: 0 }], closed: false },
        { points: [{ x: 20, y: 0 }, { x: 10, y: 0 }], closed: false }
      ];
      const result = optimizer.joinPaths(paths, 1.0);
      expect(result.length).toBe(1);
      expect(result[0].points).toEqual([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 20, y: 0 }
      ]);
    });

    it('should not join closed paths', () => {
      const paths = [
        { points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 0 }], closed: true },
        { points: [{ x: 0, y: 0 }, { x: 0, y: 10 }], closed: false }
      ];
      const result = optimizer.joinPaths(paths, 1.0);
      expect(result.length).toBe(2);
    });
  });

  describe('optimizeOrder', () => {
    it('should handle single path', () => {
      const paths = [
        { points: [{ x: 0, y: 0 }, { x: 10, y: 0 }], closed: false }
      ];
      const result = optimizer.optimizeOrder(paths);
      expect(result).toEqual(paths);
    });

    it('should order paths by nearest neighbor', () => {
      const paths = [
        { points: [{ x: 0, y: 0 }, { x: 10, y: 0 }], closed: false },
        { points: [{ x: 100, y: 0 }, { x: 110, y: 0 }], closed: false },
        { points: [{ x: 20, y: 0 }, { x: 30, y: 0 }], closed: false }
      ];
      const result = optimizer.optimizeOrder(paths);
      
      // Should order: first -> third -> second (by proximity)
      expect(result[0]).toBe(paths[0]);
      expect(result[1]).toBe(paths[2]);
      expect(result[2]).toBe(paths[1]);
    });

    it('should reverse paths for optimal ordering', () => {
      const paths = [
        { points: [{ x: 0, y: 0 }, { x: 10, y: 0 }], closed: false },
        { points: [{ x: 30, y: 0 }, { x: 20, y: 0 }], closed: false }
      ];
      const result = optimizer.optimizeOrder(paths);
      
      // Second path should be reversed
      expect(result[1].points[0]).toEqual({ x: 20, y: 0 });
      expect(result[1].points[1]).toEqual({ x: 30, y: 0 });
    });
  });

  describe('cleanSVG', () => {
    it('should remove consecutive move commands', () => {
      const svg = 'M10,10 M20,20 L30,30';
      const result = optimizer.cleanSVG(svg);
      expect(result).toBe('M20,20 L30,30');
    });

    it('should remove zero-length line segments', () => {
      const svg = 'M10,10 L20,20 L20,20 L30,30';
      const result = optimizer.cleanSVG(svg);
      expect(result).toBe('M10,10 L20,20 L30,30');
    });

    it('should normalize decimal precision', () => {
      const svg = 'M10.123456789,10.987654321 L20.111111111,20.222222222';
      const result = optimizer.cleanSVG(svg);
      expect(result).toBe('M10.123,10.987 L20.111,20.222');
    });
  });

  describe('parseSVGPath', () => {
    it('should parse simple path', () => {
      const path = 'M10,10 L20,20 L30,10';
      const result = optimizer.parseSVGPath(path);
      expect(result.length).toBe(1);
      expect(result[0].points).toEqual([
        { x: 10, y: 10 },
        { x: 20, y: 20 },
        { x: 30, y: 10 }
      ]);
      expect(result[0].closed).toBe(false);
    });

    it('should parse multiple paths', () => {
      const path = 'M10,10 L20,20 M30,30 L40,40';
      const result = optimizer.parseSVGPath(path);
      expect(result.length).toBe(2);
    });

    it('should handle closed paths', () => {
      const path = 'M10,10 L20,20 L30,10 Z';
      const result = optimizer.parseSVGPath(path);
      expect(result[0].closed).toBe(true);
    });
  });

  describe('toSVGPath', () => {
    it('should convert segments to SVG path', () => {
      const segments = [
        {
          points: [{ x: 10, y: 10 }, { x: 20, y: 20 }, { x: 30, y: 10 }],
          closed: false
        }
      ];
      const result = optimizer.toSVGPath(segments);
      expect(result).toBe('M10,10 L20,20 L30,10');
    });

    it('should handle closed paths', () => {
      const segments = [
        {
          points: [{ x: 10, y: 10 }, { x: 20, y: 20 }, { x: 30, y: 10 }],
          closed: true
        }
      ];
      const result = optimizer.toSVGPath(segments);
      expect(result).toBe('M10,10 L20,20 L30,10 Z');
    });

    it('should handle multiple segments', () => {
      const segments = [
        { points: [{ x: 0, y: 0 }, { x: 10, y: 0 }], closed: false },
        { points: [{ x: 20, y: 0 }, { x: 30, y: 0 }], closed: false }
      ];
      const result = optimizer.toSVGPath(segments);
      expect(result).toBe('M0,0 L10,0 M20,0 L30,0');
    });
  });

  describe('Integration tests', () => {
    it('should optimize a complete SVG path', () => {
      const inputSVG = 'M0,0 L1,0.1 L2,0.2 L10,1 M10,1 L10,10 L0,10 Z';
      
      // Parse, simplify, join, optimize order, and convert back
      const segments = optimizer.parseSVGPath(inputSVG);
      const simplified = segments.map(seg => ({
        ...seg,
        points: optimizer.simplifyPath(seg.points, 0.5)
      }));
      const joined = optimizer.joinPaths(simplified, 1.0);
      const ordered = optimizer.optimizeOrder(joined);
      const outputSVG = optimizer.toSVGPath(ordered);
      const cleaned = optimizer.cleanSVG(outputSVG);
      
      // Should have optimized the path
      expect(cleaned.length).toBeLessThan(inputSVG.length);
      expect(segments.length).toBeGreaterThan(ordered.length); // Paths were joined
    });
  });
});
/**
 * Unit tests for PathOptimizer
 */

const PathOptimizer = require('../path-optimizer.js');

describe('PathOptimizer', () => {
  let optimizer;

  beforeEach(() => {
    optimizer = new PathOptimizer({
      penSpeed: 100,
      travelSpeed: 200,
      penUpDownTime: 0.1
    });
  });

  describe('Constructor', () => {
    test('should initialize with default values', () => {
      const defaultOptimizer = new PathOptimizer();
      expect(defaultOptimizer.penSpeed).toBe(100);
      expect(defaultOptimizer.travelSpeed).toBe(200);
      expect(defaultOptimizer.penUpDownTime).toBe(0.1);
    });

    test('should initialize with custom values', () => {
      const customOptimizer = new PathOptimizer({
        penSpeed: 150,
        travelSpeed: 250,
        penUpDownTime: 0.2
      });
      expect(customOptimizer.penSpeed).toBe(150);
      expect(customOptimizer.travelSpeed).toBe(250);
      expect(customOptimizer.penUpDownTime).toBe(0.2);
    });
  });

  describe('distance', () => {
    test('should calculate distance between two points', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 3, y: 4 };
      expect(optimizer.distance(p1, p2)).toBe(5);
    });

    test('should return 0 for same point', () => {
      const p = { x: 5, y: 5 };
      expect(optimizer.distance(p, p)).toBe(0);
    });
  });

  describe('simplifyPaths - Douglas-Peucker', () => {
    test('should not simplify paths with 2 or fewer points', () => {
      const paths = [
        { points: [{ x: 0, y: 0 }, { x: 10, y: 10 }], closed: false }
      ];
      const simplified = optimizer.simplifyPaths(paths, 1.0);
      expect(simplified[0].points.length).toBe(2);
    });

    test('should simplify straight line to endpoints', () => {
      const paths = [
        {
          points: [
            { x: 0, y: 0 },
            { x: 5, y: 5 },
            { x: 10, y: 10 }
          ],
          closed: false
        }
      ];
      const simplified = optimizer.simplifyPaths(paths, 0.1);
      expect(simplified[0].points.length).toBe(2);
      expect(simplified[0].points[0]).toEqual({ x: 0, y: 0 });
      expect(simplified[0].points[1]).toEqual({ x: 10, y: 10 });
    });

    test('should preserve significant points', () => {
      const paths = [
        {
          points: [
            { x: 0, y: 0 },
            { x: 5, y: 10 }, // Significant deviation
            { x: 10, y: 0 }
          ],
          closed: false
        }
      ];
      const simplified = optimizer.simplifyPaths(paths, 0.1);
      expect(simplified[0].points.length).toBe(3); // Should keep all points
    });
  });

  describe('mergePaths', () => {
    test('should merge paths that share endpoints', () => {
      const paths = [
        {
          points: [{ x: 0, y: 0 }, { x: 5, y: 0 }],
          closed: false
        },
        {
          points: [{ x: 5, y: 0 }, { x: 10, y: 0 }],
          closed: false
        }
      ];
      const merged = optimizer.mergePaths(paths);
      expect(merged.length).toBeLessThan(paths.length);
    });

    test('should not merge non-connected paths', () => {
      const paths = [
        {
          points: [{ x: 0, y: 0 }, { x: 5, y: 0 }],
          closed: false
        },
        {
          points: [{ x: 10, y: 10 }, { x: 15, y: 10 }],
          closed: false
        }
      ];
      const merged = optimizer.mergePaths(paths);
      expect(merged.length).toBe(paths.length);
    });

    test('should handle empty paths array', () => {
      const merged = optimizer.mergePaths([]);
      expect(merged).toEqual([]);
    });
  });

  describe('sortPaths', () => {
    test('should sort paths by nearest neighbor', () => {
      const paths = [
        { points: [{ x: 100, y: 100 }, { x: 110, y: 100 }], closed: false },
        { points: [{ x: 0, y: 0 }, { x: 10, y: 0 }], closed: false },
        { points: [{ x: 10, y: 0 }, { x: 20, y: 0 }], closed: false }
      ];

      const sorted = optimizer.sortPaths(paths);

      // First path should be closest to origin
      expect(sorted[0].points[0].x).toBeLessThan(sorted[1].points[0].x);
    });

    test('should handle single path', () => {
      const paths = [
        { points: [{ x: 0, y: 0 }, { x: 10, y: 0 }], closed: false }
      ];
      const sorted = optimizer.sortPaths(paths);
      expect(sorted.length).toBe(1);
    });

    test('should handle empty paths array', () => {
      const sorted = optimizer.sortPaths([]);
      expect(sorted).toEqual([]);
    });
  });

  describe('reloopPaths', () => {
    test('should randomize start point of closed loops', () => {
      const originalPath = {
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 }
        ],
        closed: true
      };

      const paths = [JSON.parse(JSON.stringify(originalPath))];
      const relooped = optimizer.reloopPaths(paths);

      // Points should be rotated but same set
      expect(relooped[0].points.length).toBe(originalPath.points.length);
      expect(relooped[0].closed).toBe(true);
    });

    test('should not modify open paths', () => {
      const paths = [
        {
          points: [{ x: 0, y: 0 }, { x: 10, y: 0 }],
          closed: false
        }
      ];

      const relooped = optimizer.reloopPaths(paths);
      expect(relooped[0].points[0]).toEqual({ x: 0, y: 0 });
    });

    test('should handle paths with fewer than 3 points', () => {
      const paths = [
        {
          points: [{ x: 0, y: 0 }, { x: 10, y: 0 }],
          closed: true
        }
      ];

      const relooped = optimizer.reloopPaths(paths);
      expect(relooped[0].points.length).toBe(2);
    });
  });

  describe('optimize', () => {
    test('should apply all optimizations by default', () => {
      const paths = [
        { points: [{ x: 0, y: 0 }, { x: 5, y: 0 }], closed: false },
        { points: [{ x: 5, y: 0 }, { x: 10, y: 0 }], closed: false }
      ];

      const optimized = optimizer.optimize(paths);

      expect(optimized).toBeDefined();
      expect(optimizer.stats.originalPaths).toBe(2);
      expect(optimizer.stats.optimizedPaths).toBeDefined();
    });

    test('should respect optimization options', () => {
      const paths = [
        {
          points: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 2 },
            { x: 3, y: 3 }
          ],
          closed: false
        }
      ];

      const optimized = optimizer.optimize(paths, {
        merge: false,
        sort: false,
        reloop: false,
        simplify: true,
        tolerance: 0.1
      });

      expect(optimized).toBeDefined();
      // Simplification should reduce points
      expect(optimized[0].points.length).toBeLessThanOrEqual(paths[0].points.length);
    });

    test('should calculate stats correctly', () => {
      const paths = [
        { points: [{ x: 0, y: 0 }, { x: 10, y: 0 }], closed: false }
      ];

      optimizer.optimize(paths);

      expect(optimizer.stats.originalPaths).toBe(1);
      expect(optimizer.stats.originalPoints).toBe(2);
      expect(optimizer.stats.originalDistance).toBeGreaterThan(0);
      expect(optimizer.stats.timeSaved).toBeDefined();
    });
  });

  describe('perpendicularDistance', () => {
    test('should calculate perpendicular distance correctly', () => {
      const point = { x: 5, y: 5 };
      const lineStart = { x: 0, y: 0 };
      const lineEnd = { x: 10, y: 0 };

      const dist = optimizer.perpendicularDistance(point, lineStart, lineEnd);
      expect(dist).toBe(5); // Point is 5 units above the line
    });

    test('should handle point on the line', () => {
      const point = { x: 5, y: 0 };
      const lineStart = { x: 0, y: 0 };
      const lineEnd = { x: 10, y: 0 };

      const dist = optimizer.perpendicularDistance(point, lineStart, lineEnd);
      expect(dist).toBeCloseTo(0);
    });
  });

  describe('findConnection', () => {
    test('should find end-start connection', () => {
      const path1 = {
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }]
      };
      const path2 = {
        points: [{ x: 10, y: 0 }, { x: 20, y: 0 }]
      };

      const connection = optimizer.findConnection(path1, path2, 0.01);
      expect(connection).not.toBeNull();
      expect(connection.type).toBe('end-start');
    });

    test('should return null for non-connected paths', () => {
      const path1 = {
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }]
      };
      const path2 = {
        points: [{ x: 100, y: 100 }, { x: 110, y: 100 }]
      };

      const connection = optimizer.findConnection(path1, path2, 0.01);
      expect(connection).toBeNull();
    });
  });

  describe('PathOptimizer.parseSVGPaths', () => {
    test('should parse path elements', () => {
      const svgString = '<svg><path d="M 0 0 L 10 10"/></svg>';
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');

      const paths = PathOptimizer.parseSVGPaths(svgElement);
      expect(paths.length).toBeGreaterThan(0);
    });

    test('should parse line elements', () => {
      const svgString = '<svg><line x1="0" y1="0" x2="10" y2="10"/></svg>';
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');

      const paths = PathOptimizer.parseSVGPaths(svgElement);
      expect(paths.length).toBe(1);
      expect(paths[0].points.length).toBe(2);
    });
  });

  describe('PathOptimizer.pathsToSVG', () => {
    test('should convert paths to SVG string', () => {
      const paths = [
        {
          points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
          closed: false
        }
      ];

      const svg = PathOptimizer.pathsToSVG(paths, 100, 100);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('<path');
    });

    test('should handle closed paths', () => {
      const paths = [
        {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 0, y: 10 }
          ],
          closed: true
        }
      ];

      const svg = PathOptimizer.pathsToSVG(paths, 100, 100);
      expect(svg).toContain(' Z');
    });
  });

  describe('Integration test', () => {
    test('should optimize complex path with all features', () => {
      const paths = [
        {
          points: [
            { x: 0, y: 0 },
            { x: 1, y: 0.1 },
            { x: 2, y: 0.05 },
            { x: 3, y: 0 }
          ],
          closed: false
        },
        {
          points: [
            { x: 3, y: 0 },
            { x: 4, y: 0 },
            { x: 5, y: 0 }
          ],
          closed: false
        },
        {
          points: [
            { x: 100, y: 100 },
            { x: 110, y: 100 }
          ],
          closed: false
        }
      ];

      const optimized = optimizer.optimize(paths, {
        merge: true,
        sort: true,
        reloop: false,
        simplify: true,
        tolerance: 0.5
      });

      // Should have fewer paths (merged) and fewer points (simplified)
      expect(optimized.length).toBeLessThanOrEqual(paths.length);
      expect(optimizer.stats.optimizedPoints).toBeLessThanOrEqual(optimizer.stats.originalPoints);

      // Should have calculated time savings
      expect(optimizer.stats.timeSaved).toBeDefined();
      expect(optimizer.stats.originalTime).toBeGreaterThan(0);
      expect(optimizer.stats.optimizedTime).toBeGreaterThan(0);
    });
  });
});

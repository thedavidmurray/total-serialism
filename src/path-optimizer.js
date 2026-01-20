'use strict';

/**
 * Path Optimizer for Pen Plotter (Browser-compatible version)
 * Provides utilities for optimizing SVG paths for efficient plotting
 */

class PathOptimizer {
  /**
   * Simplify a path using Ramer-Douglas-Peucker algorithm
   */
  simplifyPath(points, tolerance = 1.0) {
    if (points.length <= 2) return points;

    // Find point with maximum distance from line
    let maxDist = 0;
    let maxIdx = 0;
    const first = points[0];
    const last = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
      const dist = this.pointToLineDistance(points[i], first, last);
      if (dist > maxDist) {
        maxDist = dist;
        maxIdx = i;
      }
    }

    // If max distance is greater than tolerance, recursively simplify
    if (maxDist > tolerance) {
      const left = this.simplifyPath(points.slice(0, maxIdx + 1), tolerance);
      const right = this.simplifyPath(points.slice(maxIdx), tolerance);
      return left.slice(0, -1).concat(right);
    }

    return [first, last];
  }

  /**
   * Join paths where endpoints are within threshold distance
   */
  joinPaths(paths, threshold = 5.0) {
    const joined = [];
    const used = new Set();

    for (let i = 0; i < paths.length; i++) {
      if (used.has(i)) continue;

      const current = [...paths[i].points];
      let currentClosed = paths[i].closed;
      used.add(i);

      // Try to join with other paths
      let found = true;
      while (found) {
        found = false;
        const currentEnd = current[current.length - 1];

        for (let j = 0; j < paths.length; j++) {
          if (used.has(j) || paths[j].closed) continue;

          const other = paths[j].points;
          const otherStart = other[0];
          const otherEnd = other[other.length - 1];

          // Check if endpoints match within threshold
          if (this.distance(currentEnd, otherStart) < threshold) {
            current.push(...other.slice(1));
            used.add(j);
            found = true;
            break;
          } else if (this.distance(currentEnd, otherEnd) < threshold) {
            // Reverse and join
            current.push(...other.slice(0, -1).reverse());
            used.add(j);
            found = true;
            break;
          }
        }
      }

      joined.push({ points: current, closed: currentClosed });
    }

    return joined;
  }

  /**
   * Optimize path order using nearest neighbor TSP algorithm
   */
  optimizeOrder(paths) {
    if (paths.length <= 1) return paths;

    const ordered = [];
    const remaining = [...paths];
    
    // Start with first path
    ordered.push(remaining.shift());

    while (remaining.length > 0) {
      const lastPath = ordered[ordered.length - 1];
      const lastPoint = lastPath.points[lastPath.points.length - 1];

      // Find nearest path
      let minDist = Infinity;
      let minIdx = 0;
      let reverse = false;

      for (let i = 0; i < remaining.length; i++) {
        const path = remaining[i];
        const startDist = this.distance(lastPoint, path.points[0]);
        const endDist = this.distance(lastPoint, path.points[path.points.length - 1]);

        if (startDist < minDist) {
          minDist = startDist;
          minIdx = i;
          reverse = false;
        }
        if (endDist < minDist) {
          minDist = endDist;
          minIdx = i;
          reverse = true;
        }
      }

      // Add nearest path (possibly reversed)
      const nearestPath = remaining.splice(minIdx, 1)[0];
      if (reverse && !nearestPath.closed) {
        nearestPath.points.reverse();
      }
      ordered.push(nearestPath);
    }

    return ordered;
  }

  /**
   * Clean SVG string by removing redundant commands
   */
  cleanSVG(svgString) {
    // Remove consecutive move commands
    let cleaned = svgString.replace(/M[\d.,\s-]+M/g, (match) => {
      const moves = match.split('M').filter(m => m);
      return 'M' + moves[moves.length - 1];
    });

    // Remove zero-length line segments
    cleaned = cleaned.replace(/L([\d.,\s-]+)L\1/g, 'L$1');

    // Normalize number format
    cleaned = cleaned.replace(/(\d+\.\d{3})\d+/g, '$1');

    return cleaned;
  }

  /**
   * Convert SVG path string to PathSegment array
   */
  parseSVGPath(pathData) {
    const segments = [];
    const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
    
    let currentPath = [];
    let currentPos = { x: 0, y: 0 };

    for (const cmd of commands) {
      const type = cmd[0];
      const nums = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat);

      switch (type.toUpperCase()) {
        case 'M':
          if (currentPath.length > 0) {
            segments.push({ points: currentPath, closed: false });
          }
          currentPath = [];
          currentPos = { x: nums[0], y: nums[1] };
          currentPath.push({ ...currentPos });
          break;

        case 'L':
          currentPos = { x: nums[0], y: nums[1] };
          currentPath.push({ ...currentPos });
          break;

        case 'Z':
          if (currentPath.length > 0) {
            segments.push({ points: currentPath, closed: true });
            currentPath = [];
          }
          break;
      }
    }

    if (currentPath.length > 0) {
      segments.push({ points: currentPath, closed: false });
    }

    return segments;
  }

  /**
   * Convert PathSegment array back to SVG path string
   */
  toSVGPath(segments) {
    return segments.map(seg => {
      const path = seg.points.map((p, i) => 
        i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`
      ).join(' ');
      return seg.closed ? path + ' Z' : path;
    }).join(' ');
  }

  // Helper methods
  distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  pointToLineDistance(point, lineStart, lineEnd) {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
  window.PathOptimizer = PathOptimizer;
}
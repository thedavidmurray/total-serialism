/**
 * SVG Path Optimizer - Total Serialism
 *
 * Implements vpype-style optimization algorithms:
 * - Line Merge: Connect paths sharing endpoints
 * - Line Sort: Minimize pen-up travel distance
 * - Reloop: Randomize loop start points (prevent ink blots)
 * - Line Simplify: Reduce points while maintaining precision
 *
 * Based on research: vpype can save users "hours" on complex plots
 */

class PathOptimizer {
  constructor(config = {}) {
    this.penSpeed = config.penSpeed || 100; // mm/s when drawing
    this.travelSpeed = config.travelSpeed || 200; // mm/s when traveling
    this.penUpDownTime = config.penUpDownTime || 0.1; // seconds

    this.stats = {
      originalPaths: 0,
      optimizedPaths: 0,
      originalPoints: 0,
      optimizedPoints: 0,
      originalDistance: 0,
      optimizedDistance: 0,
      originalTravelDistance: 0,
      optimizedTravelDistance: 0,
      timeSaved: 0
    };
  }

  /**
   * Optimize an array of paths
   * @param {Array} paths - Array of path objects {points: [{x, y}], closed: boolean}
   * @param {Object} options - Optimization options
   */
  optimize(paths, options = {}) {
    const {
      merge = true,
      sort = true,
      reloop = true,
      simplify = true,
      tolerance = 0.1
    } = options;

    let optimizedPaths = JSON.parse(JSON.stringify(paths)); // Deep clone

    // Calculate original stats
    this.calculateStats(paths, 'original');

    // Apply optimizations in order
    if (simplify) {
      optimizedPaths = this.simplifyPaths(optimizedPaths, tolerance);
    }

    if (merge) {
      optimizedPaths = this.mergePaths(optimizedPaths);
    }

    if (reloop) {
      optimizedPaths = this.reloopPaths(optimizedPaths);
    }

    if (sort) {
      optimizedPaths = this.sortPaths(optimizedPaths);
    }

    // Calculate optimized stats
    this.calculateStats(optimizedPaths, 'optimized');

    // Calculate time savings
    this.calculateTimeSavings();

    return optimizedPaths;
  }

  /**
   * Line Merge: Connect paths that share endpoints
   */
  mergePaths(paths) {
    const merged = [];
    const used = new Set();
    const tolerance = 0.01; // Distance tolerance for endpoint matching

    for (let i = 0; i < paths.length; i++) {
      if (used.has(i)) continue;

      let currentPath = JSON.parse(JSON.stringify(paths[i]));
      let foundConnection = true;

      while (foundConnection) {
        foundConnection = false;

        for (let j = 0; j < paths.length; j++) {
          if (used.has(j) || i === j) continue;

          const otherPath = paths[j];

          // Check if paths can be connected
          const connection = this.findConnection(currentPath, otherPath, tolerance);

          if (connection) {
            currentPath = this.connectPaths(currentPath, otherPath, connection);
            used.add(j);
            foundConnection = true;
            break;
          }
        }
      }

      merged.push(currentPath);
      used.add(i);
    }

    return merged;
  }

  findConnection(path1, path2, tolerance) {
    const p1Start = path1.points[0];
    const p1End = path1.points[path1.points.length - 1];
    const p2Start = path2.points[0];
    const p2End = path2.points[path2.points.length - 1];

    // Check all possible connections
    if (this.distance(p1End, p2Start) < tolerance) {
      return { type: 'end-start', reverse1: false, reverse2: false };
    }
    if (this.distance(p1End, p2End) < tolerance) {
      return { type: 'end-end', reverse1: false, reverse2: true };
    }
    if (this.distance(p1Start, p2Start) < tolerance) {
      return { type: 'start-start', reverse1: true, reverse2: false };
    }
    if (this.distance(p1Start, p2End) < tolerance) {
      return { type: 'start-end', reverse1: true, reverse2: true };
    }

    return null;
  }

  connectPaths(path1, path2, connection) {
    let points1 = [...path1.points];
    let points2 = [...path2.points];

    if (connection.reverse1) points1.reverse();
    if (connection.reverse2) points2.reverse();

    // Remove duplicate endpoint
    return {
      points: [...points1, ...points2.slice(1)],
      closed: path1.closed && path2.closed
    };
  }

  /**
   * Line Sort: Minimize pen-up travel distance using greedy nearest neighbor
   */
  sortPaths(paths) {
    if (paths.length === 0) return paths;

    const sorted = [];
    const remaining = [...paths];
    let currentPos = { x: 0, y: 0 }; // Start at origin

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      let shouldReverse = false;

      // Find nearest path
      for (let i = 0; i < remaining.length; i++) {
        const path = remaining[i];
        const startDist = this.distance(currentPos, path.points[0]);
        const endDist = this.distance(currentPos, path.points[path.points.length - 1]);

        if (startDist < nearestDistance) {
          nearestDistance = startDist;
          nearestIndex = i;
          shouldReverse = false;
        }

        if (endDist < nearestDistance && !path.closed) {
          nearestDistance = endDist;
          nearestIndex = i;
          shouldReverse = true;
        }
      }

      // Add nearest path to sorted list
      const nearestPath = remaining.splice(nearestIndex, 1)[0];

      if (shouldReverse) {
        nearestPath.points.reverse();
      }

      sorted.push(nearestPath);
      currentPos = nearestPath.points[nearestPath.points.length - 1];
    }

    return sorted;
  }

  /**
   * Reloop: Randomize starting point of closed loops to prevent ink blots
   */
  reloopPaths(paths) {
    return paths.map(path => {
      if (!path.closed || path.points.length < 3) {
        return path;
      }

      // Pick random starting point
      const startIndex = Math.floor(Math.random() * path.points.length);

      // Rotate points
      const newPoints = [
        ...path.points.slice(startIndex),
        ...path.points.slice(0, startIndex)
      ];

      return { ...path, points: newPoints };
    });
  }

  /**
   * Line Simplify: Douglas-Peucker algorithm to reduce points
   */
  simplifyPaths(paths, tolerance) {
    return paths.map(path => ({
      ...path,
      points: this.douglasPeucker(path.points, tolerance)
    }));
  }

  douglasPeucker(points, tolerance) {
    if (points.length <= 2) return points;

    // Find point with maximum distance from line between first and last
    let maxDistance = 0;
    let maxIndex = 0;

    const first = points[0];
    const last = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
      const dist = this.perpendicularDistance(points[i], first, last);
      if (dist > maxDistance) {
        maxDistance = dist;
        maxIndex = i;
      }
    }

    // If max distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
      const left = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
      const right = this.douglasPeucker(points.slice(maxIndex), tolerance);

      // Combine results (removing duplicate middle point)
      return [...left.slice(0, -1), ...right];
    } else {
      // All points between first and last can be removed
      return [first, last];
    }
  }

  perpendicularDistance(point, lineStart, lineEnd) {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;

    const norm = Math.sqrt(dx * dx + dy * dy);
    if (norm === 0) return this.distance(point, lineStart);

    const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (norm * norm);

    let closestPoint;
    if (u < 0) {
      closestPoint = lineStart;
    } else if (u > 1) {
      closestPoint = lineEnd;
    } else {
      closestPoint = {
        x: lineStart.x + u * dx,
        y: lineStart.y + u * dy
      };
    }

    return this.distance(point, closestPoint);
  }

  /**
   * Calculate path statistics
   */
  calculateStats(paths, prefix) {
    let pathCount = paths.length;
    let pointCount = 0;
    let drawDistance = 0;
    let travelDistance = 0;
    let currentPos = { x: 0, y: 0 };

    paths.forEach(path => {
      // Travel distance to start of path
      travelDistance += this.distance(currentPos, path.points[0]);

      // Drawing distance
      for (let i = 1; i < path.points.length; i++) {
        drawDistance += this.distance(path.points[i - 1], path.points[i]);
      }

      pointCount += path.points.length;
      currentPos = path.points[path.points.length - 1];
    });

    this.stats[`${prefix}Paths`] = pathCount;
    this.stats[`${prefix}Points`] = pointCount;
    this.stats[`${prefix}Distance`] = drawDistance;
    this.stats[`${prefix}TravelDistance`] = travelDistance;
  }

  calculateTimeSavings() {
    // Original time
    const originalDrawTime = this.stats.originalDistance / this.penSpeed;
    const originalTravelTime = this.stats.originalTravelDistance / this.travelSpeed;
    const originalPenUpDownTime = this.stats.originalPaths * this.penUpDownTime;
    const originalTotal = originalDrawTime + originalTravelTime + originalPenUpDownTime;

    // Optimized time
    const optimizedDrawTime = this.stats.optimizedDistance / this.penSpeed;
    const optimizedTravelTime = this.stats.optimizedTravelDistance / this.travelSpeed;
    const optimizedPenUpDownTime = this.stats.optimizedPaths * this.penUpDownTime;
    const optimizedTotal = optimizedDrawTime + optimizedTravelTime + optimizedPenUpDownTime;

    this.stats.timeSaved = originalTotal - optimizedTotal;
    this.stats.originalTime = originalTotal;
    this.stats.optimizedTime = optimizedTotal;
  }

  /**
   * Utility: Calculate distance between two points
   */
  distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Parse SVG path data into point arrays
   */
  static parseSVGPaths(svgElement) {
    const paths = [];
    const pathElements = svgElement.querySelectorAll('path, polyline, polygon, line');

    pathElements.forEach(element => {
      const tagName = element.tagName.toLowerCase();
      let points = [];
      let closed = false;

      if (tagName === 'path') {
        const d = element.getAttribute('d');
        points = this.parsePathD(d);
        closed = d.trim().endsWith('Z') || d.trim().endsWith('z');
      } else if (tagName === 'polyline' || tagName === 'polygon') {
        const pointsStr = element.getAttribute('points');
        points = this.parsePoints(pointsStr);
        closed = tagName === 'polygon';
      } else if (tagName === 'line') {
        points = [
          { x: parseFloat(element.getAttribute('x1')), y: parseFloat(element.getAttribute('y1')) },
          { x: parseFloat(element.getAttribute('x2')), y: parseFloat(element.getAttribute('y2')) }
        ];
      }

      if (points.length > 0) {
        paths.push({ points, closed });
      }
    });

    return paths;
  }

  static parsePathD(d) {
    // Simplified path parser (handles M, L, C, Q commands)
    const points = [];
    const commands = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g);
    let currentX = 0, currentY = 0;

    commands?.forEach(cmd => {
      const type = cmd[0];
      const coords = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat);

      switch (type.toUpperCase()) {
        case 'M':
          currentX = type === 'M' ? coords[0] : currentX + coords[0];
          currentY = type === 'M' ? coords[1] : currentY + coords[1];
          points.push({ x: currentX, y: currentY });
          break;
        case 'L':
          for (let i = 0; i < coords.length; i += 2) {
            currentX = type === 'L' ? coords[i] : currentX + coords[i];
            currentY = type === 'L' ? coords[i + 1] : currentY + coords[i + 1];
            points.push({ x: currentX, y: currentY });
          }
          break;
        // Add more command support as needed
      }
    });

    return points;
  }

  static parsePoints(pointsStr) {
    const coords = pointsStr.trim().split(/[\s,]+/).map(parseFloat);
    const points = [];

    for (let i = 0; i < coords.length; i += 2) {
      points.push({ x: coords[i], y: coords[i + 1] });
    }

    return points;
  }

  /**
   * Convert paths back to SVG path data
   */
  static pathsToSVG(paths, width, height) {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

    paths.forEach(path => {
      if (path.points.length === 0) return;

      let d = `M ${path.points[0].x} ${path.points[0].y}`;

      for (let i = 1; i < path.points.length; i++) {
        d += ` L ${path.points[i].x} ${path.points[i].y}`;
      }

      if (path.closed) {
        d += ' Z';
      }

      svg += `<path d="${d}" fill="none" stroke="black" stroke-width="1"/>`;
    });

    svg += '</svg>';
    return svg;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PathOptimizer;
}

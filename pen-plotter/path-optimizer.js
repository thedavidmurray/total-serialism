/**
 * PATH OPTIMIZER UTILITIES
 * Advanced path optimization for pen plotters
 */

class PathOptimizer {
  constructor() {
    this.optimizationSettings = {
      minLineLength: 0.5, // mm
      mergeThreshold: 1.0, // mm
      simplifyTolerance: 0.1, // mm
      maxIterations: 1000
    };
  }

  /**
   * TSP (Traveling Salesman Problem) optimization for path ordering
   */
  optimizePathOrder(paths) {
    if (paths.length <= 2) return paths;
    
    // Extract start and end points of each path
    const points = paths.map((path, index) => ({
      pathIndex: index,
      start: path[0],
      end: path[path.length - 1]
    }));
    
    // Find optimal order using nearest neighbor heuristic
    const optimizedOrder = this.nearestNeighborTSP(points);
    
    // Reorder paths based on optimized sequence
    const optimizedPaths = [];
    let currentPos = { x: 0, y: 0 };
    
    optimizedOrder.forEach(pointInfo => {
      const path = paths[pointInfo.pathIndex];
      
      // Determine if we should reverse the path for better connectivity
      const distToStart = this.distance(currentPos, pointInfo.start);
      const distToEnd = this.distance(currentPos, pointInfo.end);
      
      if (distToEnd < distToStart) {
        // Reverse path for better flow
        optimizedPaths.push([...path].reverse());
        currentPos = pointInfo.start;
      } else {
        optimizedPaths.push(path);
        currentPos = pointInfo.end;
      }
    });
    
    return optimizedPaths;
  }

  /**
   * Nearest neighbor TSP approximation
   */
  nearestNeighborTSP(points) {
    if (points.length === 0) return [];
    
    const unvisited = [...points];
    const visited = [];
    let current = unvisited.shift(); // Start with first point
    visited.push(current);
    
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      
      // Find nearest unvisited point
      unvisited.forEach((point, index) => {
        const dist = Math.min(
          this.distance(current.end, point.start),
          this.distance(current.end, point.end),
          this.distance(current.start, point.start),
          this.distance(current.start, point.end)
        );
        
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestIndex = index;
        }
      });
      
      current = unvisited.splice(nearestIndex, 1)[0];
      visited.push(current);
    }
    
    return visited;
  }

  /**
   * Calculate distance between two points
   */
  distance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  /**
   * Merge nearby path endpoints
   */
  mergeNearbyEndpoints(paths, threshold = null) {
    threshold = threshold || this.optimizationSettings.mergeThreshold;
    const mergedPaths = [];
    
    for (let i = 0; i < paths.length; i++) {
      let currentPath = [...paths[i]];
      let merged = false;
      
      // Try to merge with existing paths
      for (let j = 0; j < mergedPaths.length; j++) {
        const existingPath = mergedPaths[j];
        
        // Check if we can connect end of existing to start of current
        if (this.distance(existingPath[existingPath.length - 1], currentPath[0]) < threshold) {
          mergedPaths[j] = [...existingPath, ...currentPath];
          merged = true;
          break;
        }
        
        // Check if we can connect end of current to start of existing
        if (this.distance(currentPath[currentPath.length - 1], existingPath[0]) < threshold) {
          mergedPaths[j] = [...currentPath, ...existingPath];
          merged = true;
          break;
        }
        
        // Check if we can connect end of existing to end of current (reverse current)
        if (this.distance(existingPath[existingPath.length - 1], currentPath[currentPath.length - 1]) < threshold) {
          mergedPaths[j] = [...existingPath, ...[...currentPath].reverse()];
          merged = true;
          break;
        }
        
        // Check if we can connect start of existing to start of current (reverse existing)
        if (this.distance(existingPath[0], currentPath[0]) < threshold) {
          mergedPaths[j] = [[...existingPath].reverse(), ...currentPath];
          merged = true;
          break;
        }
      }
      
      if (!merged) {
        mergedPaths.push(currentPath);
      }
    }
    
    return mergedPaths;
  }

  /**
   * Remove paths shorter than minimum length
   */
  removeShortPaths(paths, minLength = null) {
    minLength = minLength || this.optimizationSettings.minLineLength;
    
    return paths.filter(path => {
      let totalLength = 0;
      for (let i = 1; i < path.length; i++) {
        totalLength += this.distance(path[i-1], path[i]);
      }
      return totalLength >= minLength;
    });
  }

  /**
   * Simplify paths using Douglas-Peucker algorithm
   */
  simplifyPath(path, tolerance = null) {
    tolerance = tolerance || this.optimizationSettings.simplifyTolerance;
    
    if (path.length <= 2) return path;
    
    return this.douglasPeucker(path, tolerance);
  }

  /**
   * Douglas-Peucker path simplification algorithm
   */
  douglasPeucker(points, tolerance) {
    if (points.length <= 2) return points;
    
    // Find the point with maximum distance from line segment
    let maxDistance = 0;
    let maxIndex = 0;
    const start = points[0];
    const end = points[points.length - 1];
    
    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.pointToLineDistance(points[i], start, end);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }
    
    // If max distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
      const leftPath = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
      const rightPath = this.douglasPeucker(points.slice(maxIndex), tolerance);
      
      // Combine paths (remove duplicate middle point)
      return [...leftPath.slice(0, -1), ...rightPath];
    } else {
      // If max distance is within tolerance, return just start and end points
      return [start, end];
    }
  }

  /**
   * Calculate perpendicular distance from point to line
   */
  pointToLineDistance(point, lineStart, lineEnd) {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      // Line start and end are the same point
      return Math.sqrt(A * A + B * B);
    }
    
    const param = dot / lenSq;
    
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

  /**
   * Optimize complete path set
   */
  optimizeAllPaths(paths, options = {}) {
    console.log(`Optimizing ${paths.length} paths...`);
    
    let optimizedPaths = [...paths];
    
    // Step 1: Remove very short paths
    if (options.removeShortPaths !== false) {
      const beforeCount = optimizedPaths.length;
      optimizedPaths = this.removeShortPaths(optimizedPaths, options.minLength);
      console.log(`Removed ${beforeCount - optimizedPaths.length} short paths`);
    }
    
    // Step 2: Simplify individual paths
    if (options.simplifyPaths !== false) {
      optimizedPaths = optimizedPaths.map(path => 
        this.simplifyPath(path, options.simplifyTolerance)
      );
      console.log(`Simplified ${optimizedPaths.length} paths`);
    }
    
    // Step 3: Merge nearby endpoints
    if (options.mergeEndpoints !== false) {
      const beforeCount = optimizedPaths.length;
      optimizedPaths = this.mergeNearbyEndpoints(optimizedPaths, options.mergeThreshold);
      console.log(`Merged paths: ${beforeCount} -> ${optimizedPaths.length}`);
    }
    
    // Step 4: Optimize drawing order
    if (options.optimizeOrder !== false) {
      optimizedPaths = this.optimizePathOrder(optimizedPaths);
      console.log(`Optimized path drawing order`);
    }
    
    return optimizedPaths;
  }

  /**
   * Generate optimization report
   */
  generateReport(originalPaths, optimizedPaths) {
    const originalLength = this.calculateTotalLength(originalPaths);
    const optimizedLength = this.calculateTotalLength(optimizedPaths);
    const penUpDistance = this.calculatePenUpDistance(optimizedPaths);
    
    return {
      originalPathCount: originalPaths.length,
      optimizedPathCount: optimizedPaths.length,
      originalDrawingLength: originalLength,
      optimizedDrawingLength: optimizedLength,
      penUpDistance: penUpDistance,
      totalPlottingDistance: optimizedLength + penUpDistance,
      pathReduction: ((originalPaths.length - optimizedPaths.length) / originalPaths.length * 100).toFixed(1),
      lengthReduction: ((originalLength - optimizedLength) / originalLength * 100).toFixed(1)
    };
  }

  /**
   * Calculate total drawing length
   */
  calculateTotalLength(paths) {
    let total = 0;
    paths.forEach(path => {
      for (let i = 1; i < path.length; i++) {
        total += this.distance(path[i-1], path[i]);
      }
    });
    return total;
  }

  /**
   * Calculate total pen-up travel distance
   */
  calculatePenUpDistance(paths) {
    let total = 0;
    for (let i = 1; i < paths.length; i++) {
      const prevEnd = paths[i-1][paths[i-1].length - 1];
      const currentStart = paths[i][0];
      total += this.distance(prevEnd, currentStart);
    }
    return total;
  }
}

// Global instance
const pathOptimizer = new PathOptimizer();

// Convenience functions
function optimizePaths(paths, options) {
  return pathOptimizer.optimizeAllPaths(paths, options);
}

function generateOptimizationReport(original, optimized) {
  return pathOptimizer.generateReport(original, optimized);
}
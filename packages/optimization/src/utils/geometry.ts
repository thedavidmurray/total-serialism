import { Point, Path } from '../path-optimizer';

/**
 * Calculate Euclidean distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the total length of a path
 */
export function pathLength(points: Point[]): number {
  if (points.length < 2) return 0;
  
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += distance(points[i - 1], points[i]);
  }
  return length;
}

/**
 * Calculate perpendicular distance from point to line segment
 */
export function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  
  if (dx === 0 && dy === 0) {
    return distance(point, lineStart);
  }
  
  const t = Math.max(0, Math.min(1, 
    ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy)
  ));
  
  const projection = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy
  };
  
  return distance(point, projection);
}

/**
 * Simplify path using Ramer-Douglas-Peucker algorithm
 */
export function simplifyPath(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;
  
  // Find point with maximum distance from line between endpoints
  let maxDist = 0;
  let maxIndex = 0;
  
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }
  
  // If max distance is greater than tolerance, recursively simplify
  if (maxDist > tolerance) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPath(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }
  
  // Otherwise, return just the endpoints
  return [points[0], points[points.length - 1]];
}

/**
 * Smooth path using weighted averaging
 */
export function smoothPath(points: Point[], iterations: number = 2, factor: number = 0.5): Point[] {
  if (points.length <= 2) return points;
  
  let smoothed = [...points];
  
  for (let iter = 0; iter < iterations; iter++) {
    const newPoints = [smoothed[0]]; // Keep first point fixed
    
    for (let i = 1; i < smoothed.length - 1; i++) {
      const prev = smoothed[i - 1];
      const curr = smoothed[i];
      const next = smoothed[i + 1];
      
      newPoints.push({
        x: curr.x + factor * ((prev.x + next.x) / 2 - curr.x),
        y: curr.y + factor * ((prev.y + next.y) / 2 - curr.y)
      });
    }
    
    newPoints.push(smoothed[smoothed.length - 1]); // Keep last point fixed
    smoothed = newPoints;
  }
  
  return smoothed;
}

/**
 * Calculate bounding box of points
 */
export function boundingBox(points: Point[]): { min: Point; max: Point } {
  if (points.length === 0) {
    return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
  }
  
  const bounds = {
    min: { x: Infinity, y: Infinity },
    max: { x: -Infinity, y: -Infinity }
  };
  
  for (const point of points) {
    bounds.min.x = Math.min(bounds.min.x, point.x);
    bounds.min.y = Math.min(bounds.min.y, point.y);
    bounds.max.x = Math.max(bounds.max.x, point.x);
    bounds.max.y = Math.max(bounds.max.y, point.y);
  }
  
  return bounds;
}

/**
 * Check if two line segments intersect
 */
export function lineSegmentsIntersect(
  p1: Point, p2: Point, 
  p3: Point, p4: Point
): boolean {
  const ccw = (a: Point, b: Point, c: Point): boolean => {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
  };
  
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && 
         ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

/**
 * Calculate angle between two vectors in degrees
 */
export function angleBetween(v1: Point, v2: Point): number {
  const dot = v1.x * v2.x + v1.y * v2.y;
  const det = v1.x * v2.y - v1.y * v2.x;
  const angle = Math.atan2(det, dot) * 180 / Math.PI;
  return Math.abs(angle);
}

/**
 * Merge nearby parallel paths
 */
export function mergePaths(
  paths: Path[], 
  maxDistance: number = 2.0, 
  maxAngle: number = 15
): Path[] {
  const merged: Path[] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < paths.length; i++) {
    if (used.has(i)) continue;
    
    let currentPath = paths[i];
    let didMerge = true;
    
    while (didMerge) {
      didMerge = false;
      
      for (let j = 0; j < paths.length; j++) {
        if (i === j || used.has(j)) continue;
        
        const candidate = paths[j];
        
        // Check if paths can be merged
        if (canMergePaths(currentPath, candidate, maxDistance, maxAngle)) {
          currentPath = mergeTwo(currentPath, candidate);
          used.add(j);
          didMerge = true;
          break;
        }
      }
    }
    
    merged.push(currentPath);
    used.add(i);
  }
  
  return merged;
}

/**
 * Check if two paths can be merged
 */
function canMergePaths(
  path1: Path, 
  path2: Path, 
  maxDistance: number, 
  maxAngle: number
): boolean {
  // Check end-to-start connections
  const end1 = path1.points[path1.points.length - 1];
  const start2 = path2.points[0];
  
  if (distance(end1, start2) <= maxDistance) {
    // Check angle alignment
    if (path1.points.length >= 2 && path2.points.length >= 2) {
      const v1 = {
        x: end1.x - path1.points[path1.points.length - 2].x,
        y: end1.y - path1.points[path1.points.length - 2].y
      };
      const v2 = {
        x: path2.points[1].x - start2.x,
        y: path2.points[1].y - start2.y
      };
      
      // Normalize vectors
      const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
      
      if (len1 > 0 && len2 > 0) {
        v1.x /= len1;
        v1.y /= len1;
        v2.x /= len2;
        v2.y /= len2;
        
        return angleBetween(v1, v2) <= maxAngle;
      }
    }
    return true;
  }
  
  return false;
}

/**
 * Merge two paths into one
 */
function mergeTwo(path1: Path, path2: Path): Path {
  return {
    ...path1,
    points: [...path1.points, ...path2.points],
    metadata: {
      ...path1.metadata,
      merged: true,
      originalPaths: [
        ...(path1.metadata?.originalPaths || [path1.id]),
        ...(path2.metadata?.originalPaths || [path2.id])
      ]
    }
  };
}

/**
 * Calculate centroid of points
 */
export function centroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  
  const sum = points.reduce((acc, p) => ({
    x: acc.x + p.x,
    y: acc.y + p.y
  }), { x: 0, y: 0 });
  
  return {
    x: sum.x / points.length,
    y: sum.y / points.length
  };
}

/**
 * Find nearest point in a set to a given point
 */
export function nearestPoint(target: Point, points: Point[]): { point: Point; index: number; distance: number } {
  let minDist = Infinity;
  let nearest = points[0];
  let nearestIndex = 0;
  
  for (let i = 0; i < points.length; i++) {
    const dist = distance(target, points[i]);
    if (dist < minDist) {
      minDist = dist;
      nearest = points[i];
      nearestIndex = i;
    }
  }
  
  return {
    point: nearest,
    index: nearestIndex,
    distance: minDist
  };
}
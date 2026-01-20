/**
 * @pen-plotter-art/core
 * Core utilities and types for pen plotter art
 */

// Export all types
export * from './types';

// Version
export const VERSION = '0.0.1';

/**
 * Core utilities
 */

/**
 * Convert between units
 */
export const Units = {
  /** Convert millimeters to pixels */
  mmToPx: (mm: number, dpi: number = 96): number => {
    return (mm / 25.4) * dpi;
  },
  
  /** Convert pixels to millimeters */
  pxToMm: (px: number, dpi: number = 96): number => {
    return (px / dpi) * 25.4;
  },
  
  /** Convert inches to pixels */
  inToPx: (inches: number, dpi: number = 96): number => {
    return inches * dpi;
  },
  
  /** Convert pixels to inches */
  pxToIn: (px: number, dpi: number = 96): number => {
    return px / dpi;
  }
};

/**
 * Path utilities
 */
export const PathUtils = {
  /** Calculate bounds of a path */
  getBounds: (path: number[][]): import('./types').Bounds => {
    if (path.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }
    
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const [x, y] of path) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  },
  
  /** Calculate total length of a path */
  getLength: (path: number[][]): number => {
    if (path.length < 2) return 0;
    
    let length = 0;
    for (let i = 1; i < path.length; i++) {
      const [x1, y1] = path[i - 1];
      const [x2, y2] = path[i];
      length += Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
    
    return length;
  },
  
  /** Simplify path using Douglas-Peucker algorithm */
  simplify: (path: number[][], tolerance: number = 1): number[][] => {
    if (path.length <= 2) return path;
    
    // Find the point with maximum distance from line between start and end
    let maxDist = 0;
    let maxIndex = 0;
    
    const [startX, startY] = path[0];
    const [endX, endY] = path[path.length - 1];
    
    for (let i = 1; i < path.length - 1; i++) {
      const dist = pointToLineDistance(path[i], [startX, startY], [endX, endY]);
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }
    
    // If max distance is greater than tolerance, recursively simplify
    if (maxDist > tolerance) {
      const left = PathUtils.simplify(path.slice(0, maxIndex + 1), tolerance);
      const right = PathUtils.simplify(path.slice(maxIndex), tolerance);
      return [...left.slice(0, -1), ...right];
    } else {
      return [path[0], path[path.length - 1]];
    }
  }
};

/**
 * Random utilities with seed support
 */
export const Random = {
  /** Create a seeded random number generator */
  createSeeded: (seed: string | number): () => number => {
    // Simple LCG implementation
    let value = typeof seed === 'string' 
      ? seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      : seed;
    
    return () => {
      value = (value * 1664525 + 1013904223) % 2147483647;
      return value / 2147483647;
    };
  },
  
  /** Generate random number in range */
  range: (min: number, max: number, rng: () => number = Math.random): number => {
    return min + (max - min) * rng();
  },
  
  /** Random integer in range */
  rangeInt: (min: number, max: number, rng: () => number = Math.random): number => {
    return Math.floor(Random.range(min, max + 1, rng));
  },
  
  /** Random choice from array */
  choice: <T>(array: T[], rng: () => number = Math.random): T => {
    return array[Math.floor(rng() * array.length)];
  },
  
  /** Shuffle array in place */
  shuffle: <T>(array: T[], rng: () => number = Math.random): T[] => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
};

/**
 * Math utilities
 */
export const MathUtils = {
  /** Linear interpolation */
  lerp: (a: number, b: number, t: number): number => {
    return a + (b - a) * t;
  },
  
  /** Clamp value between min and max */
  clamp: (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
  },
  
  /** Map value from one range to another */
  map: (value: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
    return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
  },
  
  /** Convert degrees to radians */
  degToRad: (degrees: number): number => {
    return degrees * (Math.PI / 180);
  },
  
  /** Convert radians to degrees */
  radToDeg: (radians: number): number => {
    return radians * (180 / Math.PI);
  }
};

// Helper function for path simplification
function pointToLineDistance(point: number[], lineStart: number[], lineEnd: number[]): number {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  
  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
}


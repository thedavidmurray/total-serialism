import { Path } from '../path-optimizer';

/**
 * Base interface for path optimization strategies
 */
export abstract class OptimizationStrategy {
  /**
   * Optimize the order of paths to minimize total travel distance
   */
  abstract optimize(paths: Path[]): Promise<Path[]>;
  
  /**
   * Get strategy name for logging
   */
  abstract getName(): string;
  
  /**
   * Find the nearest unvisited path to the current position
   */
  protected findNearest(
    currentPos: { x: number; y: number }, 
    paths: Path[], 
    visited: Set<number>
  ): number {
    let minDist = Infinity;
    let nearestIndex = -1;
    
    for (let i = 0; i < paths.length; i++) {
      if (visited.has(i)) continue;
      
      const startPoint = paths[i].points[0];
      const dist = this.distance(currentPos, startPoint);
      
      if (dist < minDist) {
        minDist = dist;
        nearestIndex = i;
      }
    }
    
    return nearestIndex;
  }
  
  /**
   * Calculate Euclidean distance between two points
   */
  protected distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Calculate total travel distance for a given path order
   */
  protected calculateTotalDistance(paths: Path[]): number {
    if (paths.length === 0) return 0;
    
    let total = 0;
    
    // Add path lengths
    for (const path of paths) {
      for (let i = 1; i < path.points.length; i++) {
        total += this.distance(path.points[i - 1], path.points[i]);
      }
    }
    
    // Add travel between paths
    for (let i = 0; i < paths.length - 1; i++) {
      const endPoint = paths[i].points[paths[i].points.length - 1];
      const startPoint = paths[i + 1].points[0];
      total += this.distance(endPoint, startPoint);
    }
    
    return total;
  }
}

// Re-export concrete strategies
export { GreedyNearestNeighbor } from './greedy-nearest-neighbor';
export { TwoOptStrategy } from './two-opt';
export { SimulatedAnnealing } from './simulated-annealing';
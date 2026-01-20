import { OptimizationStrategy } from './index';
import { Path } from '../path-optimizer';

/**
 * Greedy Nearest Neighbor optimization strategy
 * Fast but may not find the optimal solution
 */
export class GreedyNearestNeighbor extends OptimizationStrategy {
  getName(): string {
    return 'Greedy Nearest Neighbor';
  }
  
  async optimize(paths: Path[]): Promise<Path[]> {
    if (paths.length <= 1) return paths;
    
    const optimized: Path[] = [];
    const visited = new Set<number>();
    
    // Start from the first path (could be optimized to find best starting point)
    let currentIndex = 0;
    optimized.push(paths[currentIndex]);
    visited.add(currentIndex);
    
    // Current position is the end of the current path
    let currentPos = paths[currentIndex].points[paths[currentIndex].points.length - 1];
    
    // Greedily select the nearest unvisited path
    while (visited.size < paths.length) {
      const nearestIndex = this.findNearest(currentPos, paths, visited);
      
      if (nearestIndex === -1) break; // No more paths to visit
      
      optimized.push(paths[nearestIndex]);
      visited.add(nearestIndex);
      
      const nearestPath = paths[nearestIndex];
      currentPos = nearestPath.points[nearestPath.points.length - 1];
    }
    
    return optimized;
  }
  
  /**
   * Enhanced version that tries multiple starting points
   */
  async optimizeWithMultipleStarts(paths: Path[], numStarts: number = 5): Promise<Path[]> {
    if (paths.length <= 1) return paths;
    
    let bestOrder = paths;
    let bestDistance = this.calculateTotalDistance(paths);
    
    // Try starting from different paths
    const startIndices = this.selectStartingPoints(paths, numStarts);
    
    for (const startIndex of startIndices) {
      const optimized: Path[] = [];
      const visited = new Set<number>();
      
      // Start from selected path
      let currentIndex = startIndex;
      optimized.push(paths[currentIndex]);
      visited.add(currentIndex);
      
      let currentPos = paths[currentIndex].points[paths[currentIndex].points.length - 1];
      
      // Build the rest of the tour
      while (visited.size < paths.length) {
        const nearestIndex = this.findNearest(currentPos, paths, visited);
        
        if (nearestIndex === -1) break;
        
        optimized.push(paths[nearestIndex]);
        visited.add(nearestIndex);
        
        const nearestPath = paths[nearestIndex];
        currentPos = nearestPath.points[nearestPath.points.length - 1];
      }
      
      // Check if this order is better
      const distance = this.calculateTotalDistance(optimized);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestOrder = optimized;
      }
    }
    
    return bestOrder;
  }
  
  /**
   * Select diverse starting points for multi-start optimization
   */
  private selectStartingPoints(paths: Path[], numStarts: number): number[] {
    if (numStarts >= paths.length) {
      return Array.from({ length: paths.length }, (_, i) => i);
    }
    
    const indices: number[] = [0]; // Always include first path
    
    // Add evenly spaced paths
    const step = Math.floor(paths.length / numStarts);
    for (let i = 1; i < numStarts; i++) {
      indices.push(Math.min(i * step, paths.length - 1));
    }
    
    return indices;
  }
}
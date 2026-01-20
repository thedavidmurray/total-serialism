import { OptimizationStrategy } from './index';
import { Path } from '../path-optimizer';

/**
 * 2-opt optimization strategy
 * Iteratively improves path order by swapping pairs of edges
 */
export class TwoOptStrategy extends OptimizationStrategy {
  private maxIterations: number = 1000;
  private improvementThreshold: number = 0.001; // 0.1% improvement
  
  getName(): string {
    return '2-opt';
  }
  
  async optimize(paths: Path[]): Promise<Path[]> {
    if (paths.length <= 3) return paths;
    
    // Start with greedy solution for better initial state
    let currentOrder = await this.getInitialOrder(paths);
    let currentDistance = this.calculateTotalDistance(currentOrder);
    
    let improved = true;
    let iterations = 0;
    
    while (improved && iterations < this.maxIterations) {
      improved = false;
      iterations++;
      
      // Try all possible 2-opt swaps
      for (let i = 0; i < currentOrder.length - 1; i++) {
        for (let j = i + 2; j < currentOrder.length; j++) {
          // Create new order with reversed segment
          const newOrder = this.apply2OptSwap(currentOrder, i, j);
          const newDistance = this.calculateTotalDistance(newOrder);
          
          // Check if improvement is significant
          const improvement = currentDistance - newDistance;
          if (improvement > currentDistance * this.improvementThreshold) {
            currentOrder = newOrder;
            currentDistance = newDistance;
            improved = true;
            break; // Start over with new order
          }
        }
        
        if (improved) break;
      }
    }
    
    return currentOrder;
  }
  
  /**
   * Apply a 2-opt swap by reversing the order of paths between indices i+1 and j
   */
  private apply2OptSwap(paths: Path[], i: number, j: number): Path[] {
    const newOrder = [...paths];
    
    // Reverse the segment between i+1 and j
    let left = i + 1;
    let right = j;
    
    while (left < right) {
      const temp = newOrder[left];
      newOrder[left] = newOrder[right];
      newOrder[right] = temp;
      left++;
      right--;
    }
    
    return newOrder;
  }
  
  /**
   * Get initial order using greedy nearest neighbor
   */
  private async getInitialOrder(paths: Path[]): Promise<Path[]> {
    const optimized: Path[] = [];
    const visited = new Set<number>();
    
    // Start from the first path
    let currentIndex = 0;
    optimized.push(paths[currentIndex]);
    visited.add(currentIndex);
    
    let currentPos = paths[currentIndex].points[paths[currentIndex].points.length - 1];
    
    while (visited.size < paths.length) {
      const nearestIndex = this.findNearest(currentPos, paths, visited);
      
      if (nearestIndex === -1) break;
      
      optimized.push(paths[nearestIndex]);
      visited.add(nearestIndex);
      
      const nearestPath = paths[nearestIndex];
      currentPos = nearestPath.points[nearestPath.points.length - 1];
    }
    
    return optimized;
  }
  
  /**
   * Enhanced 2-opt with path direction optimization
   * Also considers reversing individual paths for better connections
   */
  async optimizeWithDirections(paths: Path[]): Promise<Path[]> {
    if (paths.length <= 1) return paths;
    
    // First, optimize the order
    let optimizedOrder = await this.optimize(paths);
    
    // Then, optimize individual path directions
    const result: Path[] = [];
    
    for (let i = 0; i < optimizedOrder.length; i++) {
      const currentPath = optimizedOrder[i];
      
      if (i === 0) {
        // First path - keep original direction
        result.push(currentPath);
      } else {
        // Check if reversing would create a shorter connection
        const prevEnd = result[i - 1].points[result[i - 1].points.length - 1];
        const currentStart = currentPath.points[0];
        const currentEnd = currentPath.points[currentPath.points.length - 1];
        
        const distToStart = this.distance(prevEnd, currentStart);
        const distToEnd = this.distance(prevEnd, currentEnd);
        
        if (distToEnd < distToStart) {
          // Reverse the path
          result.push({
            ...currentPath,
            points: [...currentPath.points].reverse()
          });
        } else {
          result.push(currentPath);
        }
      }
    }
    
    return result;
  }
}
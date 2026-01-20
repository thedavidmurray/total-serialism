import { OptimizationStrategy } from './index';
import { Path } from '../path-optimizer';

/**
 * Simulated Annealing optimization strategy
 * Best for large path sets where global optimization is important
 */
export class SimulatedAnnealing extends OptimizationStrategy {
  private initialTemperature: number = 1000;
  private coolingRate: number = 0.995;
  private minTemperature: number = 1;
  private iterationsPerTemp: number = 100;
  
  getName(): string {
    return 'Simulated Annealing';
  }
  
  async optimize(paths: Path[]): Promise<Path[]> {
    if (paths.length <= 2) return paths;
    
    // Start with a greedy solution
    let currentSolution = await this.getInitialOrder(paths);
    let currentCost = this.calculateTotalDistance(currentSolution);
    
    let bestSolution = [...currentSolution];
    let bestCost = currentCost;
    
    let temperature = this.initialTemperature;
    
    while (temperature > this.minTemperature) {
      for (let i = 0; i < this.iterationsPerTemp; i++) {
        // Generate a neighbor solution
        const neighbor = this.generateNeighbor(currentSolution);
        const neighborCost = this.calculateTotalDistance(neighbor);
        
        // Calculate cost difference
        const deltaCost = neighborCost - currentCost;
        
        // Accept or reject the neighbor
        if (deltaCost < 0 || Math.random() < Math.exp(-deltaCost / temperature)) {
          currentSolution = neighbor;
          currentCost = neighborCost;
          
          // Update best solution if improved
          if (currentCost < bestCost) {
            bestSolution = [...currentSolution];
            bestCost = currentCost;
          }
        }
      }
      
      // Cool down
      temperature *= this.coolingRate;
    }
    
    return bestSolution;
  }
  
  /**
   * Generate a neighbor solution using various operators
   */
  private generateNeighbor(solution: Path[]): Path[] {
    const neighbor = [...solution];
    const operator = Math.random();
    
    if (operator < 0.4) {
      // Swap two random paths
      this.swapPaths(neighbor);
    } else if (operator < 0.7) {
      // Reverse a random segment
      this.reverseSegment(neighbor);
    } else if (operator < 0.9) {
      // Move a path to a different position
      this.relocatePath(neighbor);
    } else {
      // Apply 2-opt on a small segment
      this.localTwoOpt(neighbor);
    }
    
    return neighbor;
  }
  
  /**
   * Swap two random paths
   */
  private swapPaths(paths: Path[]): void {
    if (paths.length < 2) return;
    
    const i = Math.floor(Math.random() * paths.length);
    let j = Math.floor(Math.random() * paths.length);
    while (j === i) {
      j = Math.floor(Math.random() * paths.length);
    }
    
    const temp = paths[i];
    paths[i] = paths[j];
    paths[j] = temp;
  }
  
  /**
   * Reverse a random segment of the path order
   */
  private reverseSegment(paths: Path[]): void {
    if (paths.length < 2) return;
    
    const i = Math.floor(Math.random() * paths.length);
    const j = Math.floor(Math.random() * paths.length);
    
    const start = Math.min(i, j);
    const end = Math.max(i, j);
    
    // Reverse the segment
    let left = start;
    let right = end;
    
    while (left < right) {
      const temp = paths[left];
      paths[left] = paths[right];
      paths[right] = temp;
      left++;
      right--;
    }
  }
  
  /**
   * Move a path to a different position
   */
  private relocatePath(paths: Path[]): void {
    if (paths.length < 2) return;
    
    const fromIndex = Math.floor(Math.random() * paths.length);
    let toIndex = Math.floor(Math.random() * paths.length);
    
    if (fromIndex === toIndex) return;
    
    const path = paths.splice(fromIndex, 1)[0];
    paths.splice(toIndex, 0, path);
  }
  
  /**
   * Apply 2-opt improvement on a small segment
   */
  private localTwoOpt(paths: Path[]): void {
    if (paths.length < 4) return;
    
    // Select a random segment of reasonable size
    const segmentSize = Math.min(10, Math.floor(paths.length / 2));
    const start = Math.floor(Math.random() * (paths.length - segmentSize));
    
    // Try to improve this segment
    for (let i = start; i < start + segmentSize - 1; i++) {
      for (let j = i + 2; j < Math.min(start + segmentSize, paths.length); j++) {
        const currentDist = this.segmentDistance(paths, i, j);
        
        // Try swap
        this.apply2OptSwap(paths, i, j);
        const newDist = this.segmentDistance(paths, i, j);
        
        // Keep if improved, otherwise revert
        if (newDist >= currentDist) {
          this.apply2OptSwap(paths, i, j); // Revert
        }
      }
    }
  }
  
  /**
   * Apply a 2-opt swap
   */
  private apply2OptSwap(paths: Path[], i: number, j: number): void {
    let left = i + 1;
    let right = j;
    
    while (left < right) {
      const temp = paths[left];
      paths[left] = paths[right];
      paths[right] = temp;
      left++;
      right--;
    }
  }
  
  /**
   * Calculate distance for a segment of the path
   */
  private segmentDistance(paths: Path[], start: number, end: number): number {
    let distance = 0;
    
    for (let i = start; i < end && i < paths.length - 1; i++) {
      const endPoint = paths[i].points[paths[i].points.length - 1];
      const startPoint = paths[i + 1].points[0];
      distance += this.distance(endPoint, startPoint);
    }
    
    return distance;
  }
  
  /**
   * Get initial order using greedy nearest neighbor
   */
  private async getInitialOrder(paths: Path[]): Promise<Path[]> {
    const optimized: Path[] = [];
    const visited = new Set<number>();
    
    // Random starting point for diversity
    let currentIndex = Math.floor(Math.random() * paths.length);
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
   * Configure annealing parameters based on problem size
   */
  configureForProblemSize(numPaths: number): void {
    if (numPaths < 100) {
      this.initialTemperature = 100;
      this.iterationsPerTemp = 50;
    } else if (numPaths < 1000) {
      this.initialTemperature = 1000;
      this.iterationsPerTemp = 100;
    } else {
      this.initialTemperature = 10000;
      this.iterationsPerTemp = 200;
      this.coolingRate = 0.999; // Slower cooling for larger problems
    }
  }
}
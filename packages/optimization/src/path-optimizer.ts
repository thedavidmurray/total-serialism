import { OptimizationStrategy } from './strategies';
import { GreedyNearestNeighbor } from './strategies/greedy-nearest-neighbor';
import { TwoOptStrategy } from './strategies/two-opt';
import { SimulatedAnnealing } from './strategies/simulated-annealing';
import { 
  simplifyPath, 
  smoothPath, 
  distance, 
  pathLength,
  boundingBox,
  mergePaths
} from './utils/geometry';

export interface Point {
  x: number;
  y: number;
}

export interface Path {
  points: Point[];
  id?: string;
  metadata?: any;
}

export interface OptimizationOptions {
  strategy?: 'greedy' | '2-opt' | 'annealing' | 'auto';
  simplificationTolerance?: number;
  smoothingIterations?: number;
  smoothingFactor?: number;
  enableMerging?: boolean;
  mergeDistance?: number;
  mergeAngle?: number;
  verbose?: boolean;
}

export interface OptimizationResult {
  optimizedPaths: Path[];
  originalDistance: number;
  optimizedDistance: number;
  improvement: number;
  timeTaken: number;
  statistics: {
    pathsRemoved: number;
    pointsRemoved: number;
    pathsMerged: number;
  };
}

export class PathOptimizer {
  private strategies: Map<string, OptimizationStrategy>;
  
  constructor() {
    this.strategies = new Map();
    this.strategies.set('greedy', new GreedyNearestNeighbor());
    this.strategies.set('2-opt', new TwoOptStrategy());
    this.strategies.set('annealing', new SimulatedAnnealing());
  }

  /**
   * Optimize a collection of paths for minimal pen travel distance
   */
  async optimize(paths: Path[], options: OptimizationOptions = {}): Promise<OptimizationResult> {
    const startTime = performance.now();
    
    const {
      strategy = 'auto',
      simplificationTolerance = 0.5,
      smoothingIterations = 2,
      smoothingFactor = 0.5,
      enableMerging = true,
      mergeDistance = 2.0,
      mergeAngle = 15,
      verbose = false
    } = options;

    if (verbose) {
      console.log(`Starting optimization with ${paths.length} paths...`);
    }

    // Calculate original distance
    const originalDistance = this.calculateTotalDistance(paths);
    
    // Deep copy paths to avoid modifying originals
    let workingPaths = paths.map(p => ({
      ...p,
      points: [...p.points]
    }));

    const stats = {
      pathsRemoved: 0,
      pointsRemoved: 0,
      pathsMerged: 0
    };

    // Step 1: Simplify paths using Ramer-Douglas-Peucker
    if (simplificationTolerance > 0) {
      const originalPointCount = workingPaths.reduce((sum, p) => sum + p.points.length, 0);
      
      workingPaths = workingPaths.map(path => ({
        ...path,
        points: simplifyPath(path.points, simplificationTolerance)
      }));
      
      // Remove paths that simplified to less than 2 points
      const validPaths = workingPaths.filter(p => p.points.length >= 2);
      stats.pathsRemoved = workingPaths.length - validPaths.length;
      workingPaths = validPaths;
      
      const newPointCount = workingPaths.reduce((sum, p) => sum + p.points.length, 0);
      stats.pointsRemoved = originalPointCount - newPointCount;
      
      if (verbose) {
        console.log(`Simplification removed ${stats.pointsRemoved} points and ${stats.pathsRemoved} paths`);
      }
    }

    // Step 2: Merge nearby parallel paths
    if (enableMerging && workingPaths.length > 1) {
      const mergeResult = mergePaths(workingPaths, mergeDistance, mergeAngle);
      stats.pathsMerged = workingPaths.length - mergeResult.length;
      workingPaths = mergeResult;
      
      if (verbose) {
        console.log(`Merged ${stats.pathsMerged} paths`);
      }
    }

    // Step 3: Smooth paths for better plotter performance
    if (smoothingIterations > 0) {
      workingPaths = workingPaths.map(path => ({
        ...path,
        points: smoothPath(path.points, smoothingIterations, smoothingFactor)
      }));
    }

    // Step 4: Optimize path ordering
    const selectedStrategy = this.selectStrategy(strategy, workingPaths.length);
    const strategyInstance = this.strategies.get(selectedStrategy);
    
    if (!strategyInstance) {
      throw new Error(`Unknown strategy: ${selectedStrategy}`);
    }

    if (verbose) {
      console.log(`Using ${selectedStrategy} strategy for path ordering...`);
    }

    const optimizedPaths = await strategyInstance.optimize(workingPaths);

    // Calculate optimized distance
    const optimizedDistance = this.calculateTotalDistance(optimizedPaths);
    const improvement = ((originalDistance - optimizedDistance) / originalDistance) * 100;

    const result: OptimizationResult = {
      optimizedPaths,
      originalDistance,
      optimizedDistance,
      improvement,
      timeTaken: performance.now() - startTime,
      statistics: stats
    };

    if (verbose) {
      console.log(`Optimization complete:`);
      console.log(`  Original distance: ${originalDistance.toFixed(2)}`);
      console.log(`  Optimized distance: ${optimizedDistance.toFixed(2)}`);
      console.log(`  Improvement: ${improvement.toFixed(1)}%`);
      console.log(`  Time taken: ${result.timeTaken.toFixed(1)}ms`);
    }

    return result;
  }

  /**
   * Calculate total pen travel distance including moves between paths
   */
  private calculateTotalDistance(paths: Path[]): number {
    if (paths.length === 0) return 0;

    let totalDistance = 0;

    // Sum up the length of each path
    for (const path of paths) {
      totalDistance += pathLength(path.points);
    }

    // Add distances between paths (pen-up moves)
    for (let i = 0; i < paths.length - 1; i++) {
      const endPoint = paths[i].points[paths[i].points.length - 1];
      const startPoint = paths[i + 1].points[0];
      totalDistance += distance(endPoint, startPoint);
    }

    return totalDistance;
  }

  /**
   * Select appropriate strategy based on path count and user preference
   */
  private selectStrategy(preference: string, pathCount: number): string {
    if (preference !== 'auto') {
      return preference;
    }

    // Auto-select based on problem size
    if (pathCount <= 50) {
      return '2-opt'; // Good quality, fast for small problems
    } else if (pathCount <= 500) {
      return 'greedy'; // Fast and decent quality
    } else {
      return 'annealing'; // Best for large problems
    }
  }

  /**
   * Analyze paths and provide optimization recommendations
   */
  analyzeOptimizationPotential(paths: Path[]): {
    recommendedTolerance: number;
    estimatedImprovement: number;
    mergeablePaths: number;
    totalPoints: number;
    boundingBox: { min: Point; max: Point };
  } {
    const bounds = paths.reduce((acc, path) => {
      const pathBounds = boundingBox(path.points);
      return {
        min: {
          x: Math.min(acc.min.x, pathBounds.min.x),
          y: Math.min(acc.min.y, pathBounds.min.y)
        },
        max: {
          x: Math.max(acc.max.x, pathBounds.max.x),
          y: Math.max(acc.max.y, pathBounds.max.y)
        }
      };
    }, {
      min: { x: Infinity, y: Infinity },
      max: { x: -Infinity, y: -Infinity }
    });

    const diagonal = distance(bounds.min, bounds.max);
    const recommendedTolerance = diagonal * 0.001; // 0.1% of diagonal
    
    // Estimate improvement based on path distribution
    const totalPoints = paths.reduce((sum, p) => sum + p.points.length, 0);
    const avgPointsPerPath = totalPoints / paths.length;
    const estimatedImprovement = Math.min(50, avgPointsPerPath * 2); // Rough estimate

    // Count potentially mergeable paths (simplified check)
    let mergeablePaths = 0;
    for (let i = 0; i < paths.length - 1; i++) {
      const end1 = paths[i].points[paths[i].points.length - 1];
      const start2 = paths[i + 1].points[0];
      if (distance(end1, start2) < diagonal * 0.01) {
        mergeablePaths++;
      }
    }

    return {
      recommendedTolerance,
      estimatedImprovement,
      mergeablePaths,
      totalPoints,
      boundingBox: bounds
    };
  }
}

// Export convenience functions
export { simplifyPath, smoothPath, mergePaths } from './utils/geometry';
export { OptimizationStrategy } from './strategies';
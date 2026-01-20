// Main exports
export { 
  PathOptimizer,
  Point,
  Path,
  OptimizationOptions,
  OptimizationResult
} from './path-optimizer';

// Geometry utilities
export {
  distance,
  pathLength,
  simplifyPath,
  smoothPath,
  boundingBox,
  lineSegmentsIntersect,
  angleBetween,
  mergePaths,
  centroid,
  nearestPoint
} from './utils/geometry';

// Optimization strategies
export {
  OptimizationStrategy,
  GreedyNearestNeighbor,
  TwoOptStrategy,
  SimulatedAnnealing
} from './strategies';
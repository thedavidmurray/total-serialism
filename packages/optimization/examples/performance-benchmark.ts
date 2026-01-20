import { PathOptimizer, Path, Point } from '../src';

/**
 * Generate random paths for testing
 */
function generateRandomPaths(
  numPaths: number, 
  bounds: { width: number; height: number },
  minPoints: number = 2,
  maxPoints: number = 10
): Path[] {
  const paths: Path[] = [];
  
  for (let i = 0; i < numPaths; i++) {
    const numPoints = minPoints + Math.floor(Math.random() * (maxPoints - minPoints));
    const points: Point[] = [];
    
    // Start at random position
    let x = Math.random() * bounds.width;
    let y = Math.random() * bounds.height;
    
    for (let j = 0; j < numPoints; j++) {
      points.push({ x, y });
      
      // Move to nearby position
      x += (Math.random() - 0.5) * 20;
      y += (Math.random() - 0.5) * 20;
      
      // Keep within bounds
      x = Math.max(0, Math.min(bounds.width, x));
      y = Math.max(0, Math.min(bounds.height, y));
    }
    
    paths.push({
      id: `path-${i}`,
      points
    });
  }
  
  return paths;
}

/**
 * Format time in human-readable format
 */
function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(1)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

/**
 * Format distance in human-readable format
 */
function formatDistance(distance: number): string {
  if (distance < 1000) {
    return `${distance.toFixed(1)} units`;
  } else {
    return `${(distance / 1000).toFixed(2)}k units`;
  }
}

/**
 * Benchmark different optimization strategies
 */
async function benchmarkStrategies() {
  console.log('=== Optimization Strategy Benchmark ===\n');
  
  const pathCounts = [10, 50, 100, 500, 1000];
  const strategies = ['greedy', '2-opt', 'annealing'] as const;
  const optimizer = new PathOptimizer();
  
  // Create results table
  console.log('Path Count | Strategy   | Time      | Distance   | Improvement');
  console.log('-----------|------------|-----------|------------|------------');
  
  for (const count of pathCounts) {
    const paths = generateRandomPaths(count, { width: 1000, height: 1000 });
    
    // Get baseline (no optimization)
    const baseline = await optimizer.optimize(paths, {
      strategy: 'greedy',
      simplificationTolerance: 0,
      smoothingIterations: 0,
      enableMerging: false,
      verbose: false
    });
    
    for (const strategy of strategies) {
      // Skip annealing for large datasets in demo (too slow)
      if (strategy === 'annealing' && count > 100) {
        console.log(`${count.toString().padStart(10)} | ${strategy.padEnd(10)} | (skipped)  | -          | -`);
        continue;
      }
      
      const result = await optimizer.optimize(paths, {
        strategy,
        simplificationTolerance: 0,
        smoothingIterations: 0,
        enableMerging: false,
        verbose: false
      });
      
      console.log(
        `${count.toString().padStart(10)} | ` +
        `${strategy.padEnd(10)} | ` +
        `${formatTime(result.timeTaken).padEnd(9)} | ` +
        `${formatDistance(result.optimizedDistance).padEnd(10)} | ` +
        `${result.improvement.toFixed(1)}%`
      );
    }
    
    console.log(''); // Empty line between groups
  }
}

/**
 * Benchmark path simplification performance
 */
async function benchmarkSimplification() {
  console.log('\n=== Path Simplification Benchmark ===\n');
  
  const optimizer = new PathOptimizer();
  
  // Generate complex paths with many points
  const complexPaths: Path[] = [];
  const numPaths = 50;
  
  for (let i = 0; i < numPaths; i++) {
    const points: Point[] = [];
    const numPoints = 500; // Many points per path
    
    // Generate noisy sine wave
    for (let j = 0; j < numPoints; j++) {
      const x = (j / numPoints) * 1000;
      const y = 500 + Math.sin(x * 0.02) * 100 + (Math.random() - 0.5) * 10;
      points.push({ x, y });
    }
    
    complexPaths.push({
      id: `complex-${i}`,
      points
    });
  }
  
  const totalPoints = complexPaths.reduce((sum, p) => sum + p.points.length, 0);
  console.log(`Testing with ${numPaths} paths, ${totalPoints} total points\n`);
  
  const tolerances = [0, 0.1, 0.5, 1.0, 2.0, 5.0];
  
  console.log('Tolerance | Points After | Reduction | Time      | Distance Change');
  console.log('----------|--------------|-----------|-----------|----------------');
  
  for (const tolerance of tolerances) {
    const result = await optimizer.optimize(complexPaths, {
      strategy: 'greedy', // Use fast strategy
      simplificationTolerance: tolerance,
      smoothingIterations: 0,
      enableMerging: false,
      verbose: false
    });
    
    const pointsAfter = result.optimizedPaths.reduce((sum, p) => sum + p.points.length, 0);
    const reduction = ((totalPoints - pointsAfter) / totalPoints) * 100;
    const distanceChange = ((result.optimizedDistance - result.originalDistance) / result.originalDistance) * 100;
    
    console.log(
      `${tolerance.toString().padStart(9)} | ` +
      `${pointsAfter.toString().padStart(12)} | ` +
      `${reduction.toFixed(1).padStart(8)}% | ` +
      `${formatTime(result.timeTaken).padEnd(9)} | ` +
      `${distanceChange >= 0 ? '+' : ''}${distanceChange.toFixed(1)}%`
    );
  }
}

/**
 * Benchmark complete optimization pipeline
 */
async function benchmarkComplete() {
  console.log('\n\n=== Complete Optimization Pipeline Benchmark ===\n');
  
  const optimizer = new PathOptimizer();
  const paths = generateRandomPaths(200, { width: 1000, height: 1000 }, 5, 50);
  
  console.log(`Testing with ${paths.length} paths...\n`);
  
  // Analyze optimization potential
  const analysis = optimizer.analyzeOptimizationPotential(paths);
  console.log('Analysis Results:');
  console.log(`  Recommended tolerance: ${analysis.recommendedTolerance.toFixed(2)}`);
  console.log(`  Estimated improvement: ${analysis.estimatedImprovement.toFixed(1)}%`);
  console.log(`  Mergeable paths: ${analysis.mergeablePaths}`);
  console.log(`  Total points: ${analysis.totalPoints}`);
  console.log(`  Bounding box: ${analysis.boundingBox.max.x.toFixed(0)}x${analysis.boundingBox.max.y.toFixed(0)}`);
  
  // Run full optimization
  console.log('\nRunning full optimization...');
  
  const result = await optimizer.optimize(paths, {
    strategy: 'auto',
    simplificationTolerance: analysis.recommendedTolerance,
    smoothingIterations: 2,
    smoothingFactor: 0.5,
    enableMerging: true,
    mergeDistance: 2.0,
    mergeAngle: 15,
    verbose: true
  });
  
  console.log('\nFinal Statistics:');
  console.log(`  Paths removed: ${result.statistics.pathsRemoved}`);
  console.log(`  Points removed: ${result.statistics.pointsRemoved}`);
  console.log(`  Paths merged: ${result.statistics.pathsMerged}`);
  console.log(`  Final path count: ${result.optimizedPaths.length}`);
  
  // Calculate plotting time savings (assuming 1 unit/second plotting speed)
  const timeSaved = (result.originalDistance - result.optimizedDistance);
  console.log(`\nEstimated plotting time saved: ${formatTime(timeSaved * 1000)}`);
}

/**
 * Run all benchmarks
 */
async function runBenchmarks() {
  await benchmarkStrategies();
  await benchmarkSimplification();
  await benchmarkComplete();
}

// Run if called directly
if (require.main === module) {
  runBenchmarks().catch(console.error);
}

export { benchmarkStrategies, benchmarkSimplification, benchmarkComplete };
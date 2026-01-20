import { PathOptimizer, Path, Point } from '../src';

/**
 * Basic example showing path optimization
 */
async function basicOptimizationExample() {
  console.log('=== Basic Path Optimization Example ===\n');
  
  // Create some example paths (could be from SVG, generative art, etc.)
  const paths: Path[] = [
    {
      id: 'path1',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ]
    },
    {
      id: 'path2',
      points: [
        { x: 50, y: 50 },
        { x: 60, y: 50 },
        { x: 60, y: 60 },
        { x: 50, y: 60 }
      ]
    },
    {
      id: 'path3',
      points: [
        { x: 20, y: 20 },
        { x: 30, y: 20 },
        { x: 30, y: 30 },
        { x: 20, y: 30 }
      ]
    },
    {
      id: 'path4',
      points: [
        { x: 5, y: 40 },
        { x: 15, y: 40 },
        { x: 15, y: 50 },
        { x: 5, y: 50 }
      ]
    }
  ];
  
  const optimizer = new PathOptimizer();
  
  // Optimize with default settings
  console.log('Optimizing with default settings...');
  const result = await optimizer.optimize(paths, {
    verbose: true
  });
  
  console.log('\nOptimized path order:');
  result.optimizedPaths.forEach((path, index) => {
    console.log(`  ${index + 1}. ${path.id}`);
  });
  
  // Try different strategies
  console.log('\n--- Comparing Different Strategies ---');
  
  const strategies = ['greedy', '2-opt', 'annealing'] as const;
  
  for (const strategy of strategies) {
    const strategyResult = await optimizer.optimize(paths, {
      strategy,
      verbose: false
    });
    
    console.log(`\n${strategy.toUpperCase()} Strategy:`);
    console.log(`  Distance: ${strategyResult.optimizedDistance.toFixed(2)}`);
    console.log(`  Improvement: ${strategyResult.improvement.toFixed(1)}%`);
    console.log(`  Time: ${strategyResult.timeTaken.toFixed(1)}ms`);
  }
}

/**
 * Example with path simplification
 */
async function simplificationExample() {
  console.log('\n\n=== Path Simplification Example ===\n');
  
  // Create a complex path with many points
  const complexPath: Path = {
    id: 'complex',
    points: []
  };
  
  // Generate a noisy circle
  const numPoints = 100;
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const radius = 50 + Math.random() * 2; // Add noise
    complexPath.points.push({
      x: Math.cos(angle) * radius + 100,
      y: Math.sin(angle) * radius + 100
    });
  }
  
  const paths = [complexPath];
  const optimizer = new PathOptimizer();
  
  // Test different simplification tolerances
  const tolerances = [0, 0.5, 1.0, 2.0];
  
  for (const tolerance of tolerances) {
    const result = await optimizer.optimize(paths, {
      simplificationTolerance: tolerance,
      smoothingIterations: 0, // Disable smoothing for this test
      enableMerging: false,
      verbose: false
    });
    
    const originalPoints = complexPath.points.length;
    const simplifiedPoints = result.optimizedPaths[0].points.length;
    const reduction = ((originalPoints - simplifiedPoints) / originalPoints) * 100;
    
    console.log(`Tolerance ${tolerance}:`);
    console.log(`  Original points: ${originalPoints}`);
    console.log(`  Simplified points: ${simplifiedPoints}`);
    console.log(`  Reduction: ${reduction.toFixed(1)}%`);
  }
}

/**
 * Example showing path merging
 */
async function mergingExample() {
  console.log('\n\n=== Path Merging Example ===\n');
  
  // Create several paths that could be merged
  const paths: Path[] = [
    {
      id: 'line1',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 }
      ]
    },
    {
      id: 'line2',
      points: [
        { x: 10.5, y: 0 }, // Close to end of line1
        { x: 20, y: 0 }
      ]
    },
    {
      id: 'line3',
      points: [
        { x: 20.5, y: 0.5 }, // Close and nearly parallel
        { x: 30, y: 0.5 }
      ]
    },
    {
      id: 'line4',
      points: [
        { x: 50, y: 50 }, // Far away, won't merge
        { x: 60, y: 60 }
      ]
    }
  ];
  
  const optimizer = new PathOptimizer();
  
  console.log('Original paths:', paths.length);
  
  const result = await optimizer.optimize(paths, {
    enableMerging: true,
    mergeDistance: 2.0,
    mergeAngle: 15,
    simplificationTolerance: 0, // Disable simplification
    smoothingIterations: 0, // Disable smoothing
    verbose: true
  });
  
  console.log('\nMerged paths:', result.optimizedPaths.length);
  console.log('Paths merged:', result.statistics.pathsMerged);
  
  result.optimizedPaths.forEach((path, index) => {
    console.log(`\nPath ${index + 1}:`);
    console.log(`  Points: ${path.points.length}`);
    if (path.metadata?.merged) {
      console.log(`  Merged from: ${path.metadata.originalPaths.join(', ')}`);
    }
  });
}

/**
 * Run all examples
 */
async function runExamples() {
  await basicOptimizationExample();
  await simplificationExample();
  await mergingExample();
}

// Run if called directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export { basicOptimizationExample, simplificationExample, mergingExample };
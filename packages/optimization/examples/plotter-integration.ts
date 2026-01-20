import { PathOptimizer, Path, Point } from '../src';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Convert paths to G-code for pen plotters
 */
function pathsToGCode(
  paths: Path[],
  options: {
    feedRate?: number;
    penUpHeight?: number;
    penDownHeight?: number;
    scale?: number;
    offset?: { x: number; y: number };
  } = {}
): string {
  const {
    feedRate = 3000,
    penUpHeight = 5,
    penDownHeight = 0,
    scale = 1,
    offset = { x: 0, y: 0 }
  } = options;
  
  let gcode = '';
  
  // Header
  gcode += '; Path Optimizer G-Code Output\n';
  gcode += `; Generated: ${new Date().toISOString()}\n`;
  gcode += `; Paths: ${paths.length}\n`;
  gcode += '\n';
  
  // Initialize
  gcode += 'G90 ; Absolute positioning\n';
  gcode += 'G21 ; Millimeter units\n';
  gcode += `G0 Z${penUpHeight} ; Pen up\n`;
  gcode += 'G0 X0 Y0 ; Home\n';
  gcode += '\n';
  
  // Process each path
  paths.forEach((path, pathIndex) => {
    if (path.points.length < 2) return;
    
    gcode += `; Path ${pathIndex + 1} (${path.id || 'unnamed'})\n`;
    
    // Move to start position (pen up)
    const start = path.points[0];
    const x0 = start.x * scale + offset.x;
    const y0 = start.y * scale + offset.y;
    gcode += `G0 X${x0.toFixed(3)} Y${y0.toFixed(3)}\n`;
    
    // Pen down
    gcode += `G0 Z${penDownHeight}\n`;
    
    // Draw the path
    for (let i = 1; i < path.points.length; i++) {
      const point = path.points[i];
      const x = point.x * scale + offset.x;
      const y = point.y * scale + offset.y;
      gcode += `G1 X${x.toFixed(3)} Y${y.toFixed(3)} F${feedRate}\n`;
    }
    
    // Pen up
    gcode += `G0 Z${penUpHeight}\n`;
    gcode += '\n';
  });
  
  // Footer
  gcode += '; End of paths\n';
  gcode += 'G0 Z20 ; Pen up high\n';
  gcode += 'G0 X0 Y0 ; Return home\n';
  
  return gcode;
}

/**
 * Convert paths to HPGL for vintage plotters
 */
function pathsToHPGL(
  paths: Path[],
  options: {
    scale?: number;
    penSpeed?: number;
  } = {}
): string {
  const { scale = 40, penSpeed = 50 } = options; // HPGL uses 40 units per mm
  
  let hpgl = '';
  
  // Initialize
  hpgl += 'IN;'; // Initialize
  hpgl += `VS${penSpeed};`; // Set pen speed
  hpgl += 'PU;'; // Pen up
  
  paths.forEach(path => {
    if (path.points.length < 2) return;
    
    // Move to start (pen up)
    const start = path.points[0];
    hpgl += `PA${Math.round(start.x * scale)},${Math.round(start.y * scale)};`;
    
    // Pen down and draw
    hpgl += 'PD;';
    
    for (let i = 1; i < path.points.length; i++) {
      const point = path.points[i];
      hpgl += `PA${Math.round(point.x * scale)},${Math.round(point.y * scale)};`;
    }
    
    // Pen up
    hpgl += 'PU;';
  });
  
  // Return to origin
  hpgl += 'PA0,0;';
  
  return hpgl;
}

/**
 * Estimate plotting time based on pen travel
 */
function estimatePlottingTime(
  paths: Path[],
  options: {
    drawSpeed?: number; // mm/s
    travelSpeed?: number; // mm/s
    penUpDownTime?: number; // seconds
  } = {}
): {
  drawTime: number;
  travelTime: number;
  penTime: number;
  totalTime: number;
  formatted: string;
} {
  const {
    drawSpeed = 50, // 50mm/s drawing
    travelSpeed = 100, // 100mm/s travel
    penUpDownTime = 0.5 // 0.5s per pen up/down
  } = options;
  
  let drawDistance = 0;
  let travelDistance = 0;
  let penMoves = 0;
  
  // Calculate draw distance
  paths.forEach(path => {
    for (let i = 1; i < path.points.length; i++) {
      const dx = path.points[i].x - path.points[i - 1].x;
      const dy = path.points[i].y - path.points[i - 1].y;
      drawDistance += Math.sqrt(dx * dx + dy * dy);
    }
  });
  
  // Calculate travel distance
  for (let i = 0; i < paths.length - 1; i++) {
    const end = paths[i].points[paths[i].points.length - 1];
    const start = paths[i + 1].points[0];
    const dx = start.x - end.x;
    const dy = start.y - end.y;
    travelDistance += Math.sqrt(dx * dx + dy * dy);
  }
  
  // Count pen moves
  penMoves = paths.length * 2; // Up and down for each path
  
  // Calculate times
  const drawTime = drawDistance / drawSpeed;
  const travelTime = travelDistance / travelSpeed;
  const penTime = penMoves * penUpDownTime;
  const totalTime = drawTime + travelTime + penTime;
  
  // Format time
  const hours = Math.floor(totalTime / 3600);
  const minutes = Math.floor((totalTime % 3600) / 60);
  const seconds = Math.floor(totalTime % 60);
  
  let formatted = '';
  if (hours > 0) formatted += `${hours}h `;
  if (minutes > 0) formatted += `${minutes}m `;
  formatted += `${seconds}s`;
  
  return {
    drawTime,
    travelTime,
    penTime,
    totalTime,
    formatted
  };
}

/**
 * Example: Optimize and export for plotting
 */
async function plotterWorkflowExample() {
  console.log('=== Plotter Workflow Example ===\n');
  
  // Create output directory
  const outputDir = path.join(__dirname, 'plotter-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate some test artwork
  const paths: Path[] = [];
  
  // Create a geometric pattern
  const rows = 10;
  const cols = 10;
  const spacing = 20;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const centerX = col * spacing + spacing;
      const centerY = row * spacing + spacing;
      const radius = 8;
      const rotation = (row + col) * 0.1;
      
      // Create a rotated square
      const points: Point[] = [];
      for (let i = 0; i <= 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + rotation;
        points.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        });
      }
      
      paths.push({
        id: `square-${row}-${col}`,
        points
      });
    }
  }
  
  console.log(`Created ${paths.length} paths`);
  
  // Estimate original plotting time
  const originalTime = estimatePlottingTime(paths);
  console.log(`\nOriginal plotting time: ${originalTime.formatted}`);
  console.log(`  Draw time: ${originalTime.drawTime.toFixed(1)}s`);
  console.log(`  Travel time: ${originalTime.travelTime.toFixed(1)}s`);
  console.log(`  Pen up/down time: ${originalTime.penTime.toFixed(1)}s`);
  
  // Optimize paths
  const optimizer = new PathOptimizer();
  console.log('\nOptimizing paths...');
  
  const result = await optimizer.optimize(paths, {
    strategy: 'auto',
    simplificationTolerance: 0.1,
    smoothingIterations: 1,
    enableMerging: true,
    verbose: true
  });
  
  // Estimate optimized plotting time
  const optimizedTime = estimatePlottingTime(result.optimizedPaths);
  console.log(`\nOptimized plotting time: ${optimizedTime.formatted}`);
  console.log(`  Draw time: ${optimizedTime.drawTime.toFixed(1)}s`);
  console.log(`  Travel time: ${optimizedTime.travelTime.toFixed(1)}s`);
  console.log(`  Pen up/down time: ${optimizedTime.penTime.toFixed(1)}s`);
  
  const timeSaved = originalTime.totalTime - optimizedTime.totalTime;
  const timeReduction = (timeSaved / originalTime.totalTime) * 100;
  console.log(`\nTime saved: ${timeSaved.toFixed(1)}s (${timeReduction.toFixed(1)}% reduction)`);
  
  // Export to various formats
  console.log('\nExporting files...');
  
  // G-code for modern plotters
  const gcode = pathsToGCode(result.optimizedPaths, {
    feedRate: 3000,
    scale: 1,
    offset: { x: 10, y: 10 }
  });
  fs.writeFileSync(path.join(outputDir, 'optimized.gcode'), gcode);
  console.log('  ✓ G-code exported');
  
  // HPGL for vintage plotters
  const hpgl = pathsToHPGL(result.optimizedPaths, {
    scale: 40,
    penSpeed: 50
  });
  fs.writeFileSync(path.join(outputDir, 'optimized.hpgl'), hpgl);
  console.log('  ✓ HPGL exported');
  
  // SVG for preview
  const svg = pathsToSVG(result.optimizedPaths);
  fs.writeFileSync(path.join(outputDir, 'optimized.svg'), svg);
  console.log('  ✓ SVG exported');
  
  // Statistics report
  const report = `
Path Optimization Report
========================

Input:
  Paths: ${paths.length}
  Total points: ${paths.reduce((sum, p) => sum + p.points.length, 0)}
  
Optimization:
  Strategy: ${result.improvement > 30 ? '2-opt' : 'greedy'}
  Time taken: ${result.timeTaken.toFixed(1)}ms
  
Results:
  Optimized paths: ${result.optimizedPaths.length}
  Points removed: ${result.statistics.pointsRemoved}
  Paths merged: ${result.statistics.pathsMerged}
  
Distance:
  Original: ${result.originalDistance.toFixed(1)}mm
  Optimized: ${result.optimizedDistance.toFixed(1)}mm
  Improvement: ${result.improvement.toFixed(1)}%
  
Plotting Time Estimate:
  Original: ${originalTime.formatted}
  Optimized: ${optimizedTime.formatted}
  Time saved: ${timeSaved.toFixed(1)}s (${timeReduction.toFixed(1)}%)
  
Files Generated:
  - optimized.gcode (G-code for CNC plotters)
  - optimized.hpgl (HPGL for vintage plotters)
  - optimized.svg (Preview)
`;
  
  fs.writeFileSync(path.join(outputDir, 'optimization-report.txt'), report);
  console.log('  ✓ Report generated');
  
  console.log(`\nAll files saved to: ${outputDir}/`);
}

/**
 * Helper function to create SVG
 */
function pathsToSVG(paths: Path[]): string {
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg width="250" height="250" xmlns="http://www.w3.org/2000/svg">\n`;
  svg += `  <rect width="250" height="250" fill="white"/>\n`;
  
  paths.forEach(path => {
    if (path.points.length < 2) return;
    
    let d = `M ${path.points[0].x} ${path.points[0].y}`;
    for (let i = 1; i < path.points.length; i++) {
      d += ` L ${path.points[i].x} ${path.points[i].y}`;
    }
    
    svg += `  <path d="${d}" stroke="black" stroke-width="0.5" fill="none"/>\n`;
  });
  
  svg += `</svg>`;
  return svg;
}

// Run if called directly
if (require.main === module) {
  plotterWorkflowExample().catch(console.error);
}

export { pathsToGCode, pathsToHPGL, estimatePlottingTime, plotterWorkflowExample };
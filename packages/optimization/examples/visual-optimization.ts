import { PathOptimizer, Path, Point } from '../src';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Convert paths to SVG string
 */
function pathsToSVG(
  paths: Path[], 
  options: {
    width?: number;
    height?: number;
    strokeWidth?: number;
    showNumbers?: boolean;
    showDirection?: boolean;
    colorByOrder?: boolean;
  } = {}
): string {
  const {
    width = 800,
    height = 800,
    strokeWidth = 1,
    showNumbers = false,
    showDirection = false,
    colorByOrder = false
  } = options;
  
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
  svg += `  <rect width="${width}" height="${height}" fill="white"/>\n`;
  
  paths.forEach((path, index) => {
    if (path.points.length < 2) return;
    
    // Color based on order if requested
    const color = colorByOrder 
      ? `hsl(${(index / paths.length) * 360}, 70%, 50%)`
      : 'black';
    
    // Create path data
    let d = `M ${path.points[0].x} ${path.points[0].y}`;
    for (let i = 1; i < path.points.length; i++) {
      d += ` L ${path.points[i].x} ${path.points[i].y}`;
    }
    
    svg += `  <path d="${d}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" opacity="0.8"/>\n`;
    
    // Show direction arrows
    if (showDirection && path.points.length >= 2) {
      const start = path.points[0];
      const second = path.points[1];
      const angle = Math.atan2(second.y - start.y, second.x - start.x) * 180 / Math.PI;
      
      svg += `  <g transform="translate(${start.x}, ${start.y}) rotate(${angle})">\n`;
      svg += `    <path d="M 0,0 L -5,-2 L -5,2 Z" fill="${color}"/>\n`;
      svg += `  </g>\n`;
    }
    
    // Show path numbers
    if (showNumbers) {
      const midPoint = path.points[Math.floor(path.points.length / 2)];
      svg += `  <text x="${midPoint.x}" y="${midPoint.y}" font-size="12" fill="${color}" text-anchor="middle">${index + 1}</text>\n`;
    }
  });
  
  // Show pen-up travel lines
  for (let i = 0; i < paths.length - 1; i++) {
    const end = paths[i].points[paths[i].points.length - 1];
    const start = paths[i + 1].points[0];
    svg += `  <line x1="${end.x}" y1="${end.y}" x2="${start.x}" y2="${start.y}" stroke="red" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.5"/>\n`;
  }
  
  svg += `</svg>`;
  return svg;
}

/**
 * Generate example art patterns
 */
function generateArtPattern(type: 'spiral' | 'grid' | 'random' | 'concentric'): Path[] {
  const paths: Path[] = [];
  
  switch (type) {
    case 'spiral': {
      // Generate spiral pattern
      const numSpirals = 5;
      const turnsPerSpiral = 3;
      const pointsPerTurn = 20;
      
      for (let s = 0; s < numSpirals; s++) {
        const points: Point[] = [];
        const startAngle = (s / numSpirals) * Math.PI * 2;
        
        for (let i = 0; i <= turnsPerSpiral * pointsPerTurn; i++) {
          const t = i / pointsPerTurn;
          const angle = startAngle + t * Math.PI * 2;
          const radius = 20 + t * 30;
          
          points.push({
            x: 400 + Math.cos(angle) * radius,
            y: 400 + Math.sin(angle) * radius
          });
        }
        
        paths.push({ id: `spiral-${s}`, points });
      }
      break;
    }
    
    case 'grid': {
      // Generate grid pattern with some randomness
      const gridSize = 10;
      const cellSize = 60;
      const offset = 100;
      
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const x = offset + col * cellSize + (Math.random() - 0.5) * 20;
          const y = offset + row * cellSize + (Math.random() - 0.5) * 20;
          const size = 20 + Math.random() * 20;
          
          // Random shape
          if (Math.random() < 0.5) {
            // Square
            paths.push({
              id: `grid-${row}-${col}`,
              points: [
                { x: x - size/2, y: y - size/2 },
                { x: x + size/2, y: y - size/2 },
                { x: x + size/2, y: y + size/2 },
                { x: x - size/2, y: y + size/2 },
                { x: x - size/2, y: y - size/2 }
              ]
            });
          } else {
            // Circle
            const points: Point[] = [];
            const numPoints = 20;
            for (let i = 0; i <= numPoints; i++) {
              const angle = (i / numPoints) * Math.PI * 2;
              points.push({
                x: x + Math.cos(angle) * size/2,
                y: y + Math.sin(angle) * size/2
              });
            }
            paths.push({ id: `grid-${row}-${col}`, points });
          }
        }
      }
      break;
    }
    
    case 'concentric': {
      // Generate concentric circles
      const numCircles = 20;
      const centerX = 400;
      const centerY = 400;
      
      for (let i = 0; i < numCircles; i++) {
        const points: Point[] = [];
        const radius = 20 + i * 15;
        const numPoints = Math.max(20, Math.floor(radius / 5));
        
        for (let j = 0; j <= numPoints; j++) {
          const angle = (j / numPoints) * Math.PI * 2;
          points.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          });
        }
        
        paths.push({ id: `circle-${i}`, points });
      }
      break;
    }
    
    case 'random': {
      // Generate random walk paths
      const numPaths = 50;
      
      for (let i = 0; i < numPaths; i++) {
        const points: Point[] = [];
        let x = Math.random() * 600 + 100;
        let y = Math.random() * 600 + 100;
        const numPoints = Math.floor(Math.random() * 20) + 5;
        
        for (let j = 0; j < numPoints; j++) {
          points.push({ x, y });
          x += (Math.random() - 0.5) * 50;
          y += (Math.random() - 0.5) * 50;
          x = Math.max(50, Math.min(750, x));
          y = Math.max(50, Math.min(750, y));
        }
        
        paths.push({ id: `random-${i}`, points });
      }
      break;
    }
  }
  
  return paths;
}

/**
 * Generate visual comparison of optimization results
 */
async function generateVisualComparison() {
  console.log('=== Visual Optimization Comparison ===\n');
  
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const patterns = ['spiral', 'grid', 'concentric', 'random'] as const;
  const optimizer = new PathOptimizer();
  
  for (const pattern of patterns) {
    console.log(`\nGenerating ${pattern} pattern...`);
    
    const paths = generateArtPattern(pattern);
    console.log(`  Created ${paths.length} paths`);
    
    // Save original
    const originalSVG = pathsToSVG(paths, {
      showNumbers: true,
      colorByOrder: true
    });
    fs.writeFileSync(
      path.join(outputDir, `${pattern}-original.svg`),
      originalSVG
    );
    
    // Optimize and save
    const result = await optimizer.optimize(paths, {
      strategy: 'auto',
      simplificationTolerance: 0.5,
      smoothingIterations: 2,
      enableMerging: true,
      verbose: false
    });
    
    const optimizedSVG = pathsToSVG(result.optimizedPaths, {
      showNumbers: true,
      colorByOrder: true
    });
    fs.writeFileSync(
      path.join(outputDir, `${pattern}-optimized.svg`),
      optimizedSVG
    );
    
    // Create comparison stats
    const stats = `
Pattern: ${pattern}
Original paths: ${paths.length}
Optimized paths: ${result.optimizedPaths.length}
Original distance: ${result.originalDistance.toFixed(1)}
Optimized distance: ${result.optimizedDistance.toFixed(1)}
Improvement: ${result.improvement.toFixed(1)}%
Paths merged: ${result.statistics.pathsMerged}
Points removed: ${result.statistics.pointsRemoved}
Time taken: ${result.timeTaken.toFixed(1)}ms
`;
    
    fs.writeFileSync(
      path.join(outputDir, `${pattern}-stats.txt`),
      stats
    );
    
    console.log(`  Improvement: ${result.improvement.toFixed(1)}%`);
    console.log(`  Files saved to: ${outputDir}/`);
  }
  
  // Create an HTML viewer
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Path Optimization Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .pattern { margin-bottom: 40px; border: 1px solid #ccc; padding: 20px; }
    .comparison { display: flex; gap: 20px; }
    .svg-container { flex: 1; text-align: center; }
    img { max-width: 100%; border: 1px solid #eee; }
    .stats { background: #f5f5f5; padding: 10px; margin-top: 10px; white-space: pre-wrap; font-family: monospace; }
  </style>
</head>
<body>
  <h1>Path Optimization Visual Comparison</h1>
  ${patterns.map(pattern => `
    <div class="pattern">
      <h2>${pattern.charAt(0).toUpperCase() + pattern.slice(1)} Pattern</h2>
      <div class="comparison">
        <div class="svg-container">
          <h3>Original</h3>
          <img src="${pattern}-original.svg" alt="Original ${pattern}">
        </div>
        <div class="svg-container">
          <h3>Optimized</h3>
          <img src="${pattern}-optimized.svg" alt="Optimized ${pattern}">
        </div>
      </div>
      <div class="stats">
        <iframe src="${pattern}-stats.txt" width="100%" height="200" frameborder="0"></iframe>
      </div>
    </div>
  `).join('')}
</body>
</html>
`;
  
  fs.writeFileSync(path.join(outputDir, 'index.html'), html);
  console.log(`\nViewer created at: ${path.join(outputDir, 'index.html')}`);
}

// Run if called directly
if (require.main === module) {
  generateVisualComparison().catch(console.error);
}

export { pathsToSVG, generateArtPattern, generateVisualComparison };
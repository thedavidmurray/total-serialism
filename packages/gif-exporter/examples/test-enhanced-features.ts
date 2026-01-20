import { EnhancedGifExporter, FrameAnalyzer } from '../src';
import { createCanvas } from 'canvas';

/**
 * Example demonstrating all enhanced features of the GIF exporter
 */
async function testEnhancedFeatures() {
  const width = 400;
  const height = 400;
  
  // Create exporter with all features enabled
  const exporter = new EnhancedGifExporter({
    width,
    height,
    outputPath: './test-enhanced-features.gif',
    
    // Basic options
    delay: 50,
    quality: 10,
    repeat: 0,
    
    // Enhanced features
    adaptiveSampling: true,
    skipSimilarFrames: true,
    similarityThreshold: 0.03, // 3% difference threshold
    smartColorReduction: true,
    maxColors: 64, // Aggressive color reduction for testing
    dithering: true,
    enableInterpolation: true,
    interpolationFrames: 1,
    
    // Detailed progress tracking
    onProgress: (progress) => {
      const bar = '='.repeat(Math.floor(progress.percentage / 5));
      const spaces = ' '.repeat(20 - bar.length);
      console.log(`[${bar}${spaces}] ${progress.percentage.toFixed(1)}% - ${progress.currentPhase}`);
    },
    
    onFrameAnalyzed: (analysis, frameIndex) => {
      if (frameIndex % 10 === 0) {
        console.log(`Frame ${frameIndex} stats:`, {
          complexity: analysis.complexity.toFixed(3),
          motion: analysis.motion.toFixed(3),
          difference: analysis.difference.toFixed(3),
          delay: analysis.recommendedDelay + 'ms'
        });
      }
    }
  });

  console.log('Starting enhanced GIF export test...');
  await exporter.start();

  // Generate test animation frames
  const frameCount = 60;
  for (let i = 0; i < frameCount; i++) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Create animated scene
    drawAnimatedScene(ctx, width, height, i, frameCount);
    
    // Get frame data
    const imageData = ctx.getImageData(0, 0, width, height);
    const frameData = Buffer.from(imageData.data);
    
    await exporter.addFrame({ data: frameData });
  }

  // Process buffered frames and finish
  await exporter.finish();
  
  console.log(`\\nEnhanced GIF created with ${exporter.getFrameCount()} frames`);
  console.log('Features tested:');
  console.log('- Adaptive frame sampling');
  console.log('- Smart color reduction (64 colors)');
  console.log('- Floyd-Steinberg dithering');
  console.log('- Frame interpolation');
  console.log('- Similar frame detection');
}

/**
 * Draw an animated test scene
 */
function drawAnimatedScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: number,
  totalFrames: number
) {
  // Clear background with gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  const hue = (frame / totalFrames) * 360;
  gradient.addColorStop(0, `hsl(${hue}, 50%, 20%)`);
  gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 50%, 40%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Draw rotating circles with motion
  const centerX = width / 2;
  const centerY = height / 2;
  const time = (frame / totalFrames) * Math.PI * 2;
  
  // Orbiting circles
  for (let i = 0; i < 5; i++) {
    const angle = time + (i / 5) * Math.PI * 2;
    const radius = 100;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    // Draw circle with gradient
    const circleGradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
    circleGradient.addColorStop(0, `hsla(${(hue + i * 72) % 360}, 70%, 60%, 0.8)`);
    circleGradient.addColorStop(1, `hsla(${(hue + i * 72) % 360}, 70%, 40%, 0.2)`);
    
    ctx.fillStyle = circleGradient;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Center element with pulsing
  const pulseScale = 1 + Math.sin(time * 2) * 0.2;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(pulseScale, pulseScale);
  
  ctx.fillStyle = `hsla(${(hue + 180) % 360}, 60%, 50%, 0.6)`;
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
  
  // Add some static elements for frame similarity testing
  if (frame < totalFrames / 2) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(10, 10, 50, 50);
  }
}

/**
 * Test frame analyzer independently
 */
async function testFrameAnalyzer() {
  console.log('\\n=== Testing Frame Analyzer ===');
  
  const width = 200;
  const height = 200;
  const analyzer = new FrameAnalyzer(width, height);
  
  // Create two test frames
  const canvas1 = createCanvas(width, height);
  const ctx1 = canvas1.getContext('2d');
  ctx1.fillStyle = 'red';
  ctx1.fillRect(0, 0, width, height);
  ctx1.fillStyle = 'blue';
  ctx1.fillRect(50, 50, 100, 100);
  
  const canvas2 = createCanvas(width, height);
  const ctx2 = canvas2.getContext('2d');
  ctx2.fillStyle = 'red';
  ctx2.fillRect(0, 0, width, height);
  ctx2.fillStyle = 'blue';
  ctx2.fillRect(60, 60, 100, 100); // Slightly moved
  
  const frame1 = Buffer.from(ctx1.getImageData(0, 0, width, height).data);
  const frame2 = Buffer.from(ctx2.getImageData(0, 0, width, height).data);
  
  // Test single frame analysis
  const analysis1 = analyzer.analyzeFrame(frame1);
  console.log('Frame 1 complexity:', analysis1.complexity.toFixed(3));
  
  // Test frame comparison
  const comparison = analyzer.compareFrames(frame2, frame1);
  console.log('Frame comparison:', {
    pixelDifference: (comparison.pixelDifference * 100).toFixed(1) + '%',
    avgColorDiff: comparison.averageColorDifference.toFixed(3),
    motionVectors: comparison.motionVectors.length
  });
  
  // Test full analysis with comparison
  const fullAnalysis = analyzer.analyzeFrameWithComparison(frame2, frame1);
  console.log('Full analysis:', {
    difference: fullAnalysis.difference.toFixed(3),
    motion: fullAnalysis.motion.toFixed(3),
    complexity: fullAnalysis.complexity.toFixed(3),
    recommendedDelay: fullAnalysis.recommendedDelay + 'ms'
  });
  
  // Test optimal frame rate calculation
  const analyses = [];
  for (let i = 0; i < 10; i++) {
    analyses.push({
      difference: Math.random() * 0.5,
      motion: Math.random() * 0.5,
      complexity: Math.random(),
      recommendedDelay: 100
    });
  }
  
  const optimalFps = analyzer.calculateOptimalFrameRate(analyses);
  console.log('Optimal frame rate:', optimalFps + ' fps');
}

// Run tests
if (require.main === module) {
  (async () => {
    try {
      await testEnhancedFeatures();
      await testFrameAnalyzer();
    } catch (error) {
      console.error('Test failed:', error);
    }
  })();
}
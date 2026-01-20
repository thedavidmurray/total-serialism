import { EnhancedGifExporter, FrameAnalysis } from '../src';

// Example: Creating a GIF with adaptive frame sampling and smart color reduction
async function createEnhancedGif() {
  // Create the enhanced exporter with options
  const exporter = new EnhancedGifExporter({
    width: 800,
    height: 600,
    outputPath: './output-enhanced.gif',
    
    // Basic options
    delay: 100, // Default delay
    quality: 10, // GIF quality (1-30, lower is better)
    repeat: 0, // Loop forever
    
    // Enhanced options
    adaptiveSampling: true, // Automatically adjust frame delays
    skipSimilarFrames: true, // Skip frames that are too similar
    similarityThreshold: 0.05, // 5% difference threshold
    
    smartColorReduction: true, // Reduce colors intelligently
    maxColors: 128, // Limit to 128 colors
    dithering: true, // Apply dithering for better gradients
    
    enableInterpolation: true, // Smooth animation with interpolation
    interpolationFrames: 1, // Add 1 frame between keyframes
    
    // Progress callbacks
    onProgress: (progress) => {
      console.log(`Progress: ${progress.percentage.toFixed(1)}% - ${progress.currentPhase}`);
      if (progress.estimatedTimeRemaining > 0) {
        console.log(`Estimated time remaining: ${(progress.estimatedTimeRemaining / 1000).toFixed(1)}s`);
      }
    },
    
    onFrameAnalyzed: (analysis: FrameAnalysis, frameIndex: number) => {
      console.log(`Frame ${frameIndex} analyzed:`, {
        complexity: analysis.complexity.toFixed(3),
        difference: analysis.difference.toFixed(3),
        motion: analysis.motion.toFixed(3),
        recommendedDelay: analysis.recommendedDelay
      });
    }
  });

  try {
    // Start the export process
    await exporter.start();

    // Add frames (in a real scenario, these would be canvas frames or image buffers)
    for (let i = 0; i < 100; i++) {
      // Create a dummy frame (replace with actual frame data)
      const frameData = createDummyFrame(800, 600, i);
      
      await exporter.addFrame({
        data: frameData
      });
    }

    // Finish the export
    await exporter.finish();
    
    console.log(`GIF created successfully with ${exporter.getFrameCount()} frames`);
  } catch (error) {
    console.error('Error creating GIF:', error);
  }
}

// Helper function to create dummy frame data
function createDummyFrame(width: number, height: number, frameIndex: number): Buffer {
  const pixels = Buffer.alloc(width * height * 4);
  
  // Create a simple animated pattern
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      // Create animated gradients
      pixels[index] = (x + frameIndex * 2) % 256; // Red
      pixels[index + 1] = (y + frameIndex) % 256; // Green
      pixels[index + 2] = ((x + y) / 2 + frameIndex * 3) % 256; // Blue
      pixels[index + 3] = 255; // Alpha
    }
  }
  
  return pixels;
}

// Example: Using just the frame analyzer
async function analyzeExistingFrames() {
  const analyzer = new FrameAnalyzer(800, 600);
  
  const frame1 = createDummyFrame(800, 600, 0);
  const frame2 = createDummyFrame(800, 600, 1);
  
  // Analyze single frame
  const singleAnalysis = analyzer.analyzeFrame(frame1);
  console.log('Single frame analysis:', singleAnalysis);
  
  // Compare two frames
  const comparison = analyzer.compareFrames(frame2, frame1);
  console.log('Frame comparison:', {
    pixelDifference: `${(comparison.pixelDifference * 100).toFixed(1)}%`,
    colorDifference: comparison.averageColorDifference.toFixed(3),
    motionVectors: comparison.motionVectors.length
  });
  
  // Analyze with comparison
  const fullAnalysis = analyzer.analyzeFrameWithComparison(frame2, frame1);
  console.log('Full analysis:', fullAnalysis);
}

// Example: Basic usage (backward compatible)
async function createBasicGif() {
  const { GifExporter } = await import('../src');
  
  const exporter = new GifExporter({
    width: 400,
    height: 300,
    outputPath: './output-basic.gif',
    delay: 100,
    quality: 10
  });
  
  await exporter.start();
  
  for (let i = 0; i < 10; i++) {
    const frameData = createDummyFrame(400, 300, i);
    await exporter.addFrame({ data: frameData });
  }
  
  await exporter.finish();
  console.log('Basic GIF created successfully');
}

// Run examples
if (require.main === module) {
  (async () => {
    console.log('=== Enhanced GIF Export Example ===');
    await createEnhancedGif();
    
    console.log('\\n=== Frame Analysis Example ===');
    await analyzeExistingFrames();
    
    console.log('\\n=== Basic GIF Export Example ===');
    await createBasicGif();
  })();
}
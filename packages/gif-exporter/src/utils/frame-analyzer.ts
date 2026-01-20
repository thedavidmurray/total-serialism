export interface FrameAnalysis {
  difference: number; // 0-1, how different from previous frame
  motion: number; // 0-1, amount of motion detected
  complexity: number; // 0-1, visual complexity of the frame
  recommendedDelay: number; // Suggested delay in ms
}

export interface FrameComparisonResult {
  pixelDifference: number; // Percentage of different pixels
  averageColorDifference: number; // Average color difference per pixel
  motionVectors: MotionVector[];
}

export interface MotionVector {
  x: number;
  y: number;
  magnitude: number;
  direction: number; // In radians
}

export class FrameAnalyzer {
  private width: number;
  private height: number;
  private blockSize: number;

  constructor(width: number, height: number, blockSize: number = 16) {
    this.width = width;
    this.height = height;
    this.blockSize = blockSize;
  }

  /**
   * Analyze a single frame for complexity
   */
  analyzeFrame(frameData: Buffer | Uint8Array): FrameAnalysis {
    const pixels = new Uint8Array(frameData);
    const complexity = this.calculateComplexity(pixels);
    
    return {
      difference: 0,
      motion: 0,
      complexity,
      recommendedDelay: this.calculateRecommendedDelay(complexity, 0, 0)
    };
  }

  /**
   * Compare two frames and analyze the differences
   */
  compareFrames(
    currentFrame: Buffer | Uint8Array,
    previousFrame: Buffer | Uint8Array
  ): FrameComparisonResult {
    const current = new Uint8Array(currentFrame);
    const previous = new Uint8Array(previousFrame);
    
    const pixelDifference = this.calculatePixelDifference(current, previous);
    const averageColorDifference = this.calculateAverageColorDifference(current, previous);
    const motionVectors = this.detectMotion(current, previous);

    return {
      pixelDifference,
      averageColorDifference,
      motionVectors
    };
  }

  /**
   * Analyze frame with comparison to previous
   */
  analyzeFrameWithComparison(
    currentFrame: Buffer | Uint8Array,
    previousFrame: Buffer | Uint8Array | null
  ): FrameAnalysis {
    const current = new Uint8Array(currentFrame);
    const complexity = this.calculateComplexity(current);
    
    if (!previousFrame) {
      return {
        difference: 1, // First frame is always "different"
        motion: 0,
        complexity,
        recommendedDelay: 100 // Default delay for first frame
      };
    }

    const comparison = this.compareFrames(currentFrame, previousFrame);
    const motion = this.calculateMotionScore(comparison.motionVectors);
    const difference = this.calculateDifferenceScore(comparison);

    return {
      difference,
      motion,
      complexity,
      recommendedDelay: this.calculateRecommendedDelay(complexity, difference, motion)
    };
  }

  /**
   * Calculate optimal frame rate based on motion analysis
   */
  calculateOptimalFrameRate(analyses: FrameAnalysis[]): number {
    if (analyses.length === 0) return 10; // Default 10 fps

    const avgMotion = analyses.reduce((sum, a) => sum + a.motion, 0) / analyses.length;
    const avgDifference = analyses.reduce((sum, a) => sum + a.difference, 0) / analyses.length;

    // Higher motion and difference = higher frame rate needed
    const score = (avgMotion + avgDifference) / 2;
    
    // Map score to frame rate (5-30 fps)
    return Math.round(5 + score * 25);
  }

  /**
   * Determine if a frame should be skipped based on similarity
   */
  shouldSkipFrame(analysis: FrameAnalysis, threshold: number = 0.05): boolean {
    return analysis.difference < threshold && analysis.motion < threshold;
  }

  private calculateComplexity(pixels: Uint8Array): number {
    // Calculate spatial frequency as a measure of complexity
    let totalDiff = 0;
    const pixelCount = this.width * this.height;
    
    for (let y = 0; y < this.height - 1; y++) {
      for (let x = 0; x < this.width - 1; x++) {
        const idx = (y * this.width + x) * 4;
        const rightIdx = idx + 4;
        const bottomIdx = idx + this.width * 4;
        
        // Calculate differences with neighboring pixels
        for (let c = 0; c < 3; c++) {
          totalDiff += Math.abs(pixels[idx + c] - pixels[rightIdx + c]);
          totalDiff += Math.abs(pixels[idx + c] - pixels[bottomIdx + c]);
        }
      }
    }
    
    // Normalize to 0-1 range
    return Math.min(totalDiff / (pixelCount * 255 * 6), 1);
  }

  private calculatePixelDifference(current: Uint8Array, previous: Uint8Array): number {
    let differentPixels = 0;
    const totalPixels = this.width * this.height;
    
    for (let i = 0; i < totalPixels * 4; i += 4) {
      const rDiff = Math.abs(current[i] - previous[i]);
      const gDiff = Math.abs(current[i + 1] - previous[i + 1]);
      const bDiff = Math.abs(current[i + 2] - previous[i + 2]);
      
      if (rDiff > 10 || gDiff > 10 || bDiff > 10) {
        differentPixels++;
      }
    }
    
    return differentPixels / totalPixels;
  }

  private calculateAverageColorDifference(current: Uint8Array, previous: Uint8Array): number {
    let totalDiff = 0;
    const totalPixels = this.width * this.height;
    
    for (let i = 0; i < totalPixels * 4; i += 4) {
      const rDiff = Math.abs(current[i] - previous[i]);
      const gDiff = Math.abs(current[i + 1] - previous[i + 1]);
      const bDiff = Math.abs(current[i + 2] - previous[i + 2]);
      
      totalDiff += (rDiff + gDiff + bDiff) / 3;
    }
    
    return totalDiff / (totalPixels * 255);
  }

  private detectMotion(current: Uint8Array, previous: Uint8Array): MotionVector[] {
    const vectors: MotionVector[] = [];
    const blocksX = Math.floor(this.width / this.blockSize);
    const blocksY = Math.floor(this.height / this.blockSize);
    
    for (let by = 0; by < blocksY; by++) {
      for (let bx = 0; bx < blocksX; bx++) {
        const motion = this.calculateBlockMotion(
          current,
          previous,
          bx * this.blockSize,
          by * this.blockSize
        );
        
        if (motion.magnitude > 0.1) {
          vectors.push(motion);
        }
      }
    }
    
    return vectors;
  }

  private calculateBlockMotion(
    current: Uint8Array,
    previous: Uint8Array,
    blockX: number,
    blockY: number
  ): MotionVector {
    // Simplified block matching algorithm
    let bestMatch = { x: 0, y: 0, difference: Infinity };
    const searchRadius = 8;
    
    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        const difference = this.compareBlocks(
          current,
          previous,
          blockX,
          blockY,
          blockX + dx,
          blockY + dy
        );
        
        if (difference < bestMatch.difference) {
          bestMatch = { x: dx, y: dy, difference };
        }
      }
    }
    
    const magnitude = Math.sqrt(bestMatch.x * bestMatch.x + bestMatch.y * bestMatch.y) / searchRadius;
    const direction = Math.atan2(bestMatch.y, bestMatch.x);
    
    return {
      x: blockX + this.blockSize / 2,
      y: blockY + this.blockSize / 2,
      magnitude: Math.min(magnitude, 1),
      direction
    };
  }

  private compareBlocks(
    current: Uint8Array,
    previous: Uint8Array,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    let totalDiff = 0;
    let pixelCount = 0;
    
    for (let dy = 0; dy < this.blockSize; dy++) {
      for (let dx = 0; dx < this.blockSize; dx++) {
        const cx = x1 + dx;
        const cy = y1 + dy;
        const px = x2 + dx;
        const py = y2 + dy;
        
        if (cx >= 0 && cx < this.width && cy >= 0 && cy < this.height &&
            px >= 0 && px < this.width && py >= 0 && py < this.height) {
          const cIdx = (cy * this.width + cx) * 4;
          const pIdx = (py * this.width + px) * 4;
          
          for (let c = 0; c < 3; c++) {
            totalDiff += Math.abs(current[cIdx + c] - previous[pIdx + c]);
          }
          pixelCount++;
        }
      }
    }
    
    return pixelCount > 0 ? totalDiff / (pixelCount * 3 * 255) : 1;
  }

  private calculateMotionScore(motionVectors: MotionVector[]): number {
    if (motionVectors.length === 0) return 0;
    
    const avgMagnitude = motionVectors.reduce((sum, v) => sum + v.magnitude, 0) / motionVectors.length;
    return Math.min(avgMagnitude, 1);
  }

  private calculateDifferenceScore(comparison: FrameComparisonResult): number {
    return (comparison.pixelDifference + comparison.averageColorDifference) / 2;
  }

  private calculateRecommendedDelay(complexity: number, difference: number, motion: number): number {
    // Base delay
    let delay = 100;
    
    // Adjust based on motion - faster motion needs shorter delays
    if (motion > 0.5) {
      delay = 50;
    } else if (motion > 0.3) {
      delay = 70;
    }
    
    // Adjust based on difference - small differences can have longer delays
    if (difference < 0.1) {
      delay = Math.min(delay * 2, 200);
    }
    
    // Complex frames might need slightly longer viewing time
    if (complexity > 0.7) {
      delay = Math.min(delay * 1.2, 150);
    }
    
    return Math.round(delay);
  }
}
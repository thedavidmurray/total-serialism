import { GifExporter, GifExporterOptions, Frame } from './gif-exporter';
import { FrameAnalyzer, FrameAnalysis } from './utils/frame-analyzer';

export interface EnhancedGifExporterOptions extends GifExporterOptions {
  // Adaptive frame sampling
  adaptiveSampling?: boolean;
  skipSimilarFrames?: boolean;
  similarityThreshold?: number; // 0-1, lower means more similar

  // Smart color reduction
  smartColorReduction?: boolean;
  maxColors?: number; // Maximum colors in palette
  dithering?: boolean;

  // Progress callbacks
  onProgress?: (progress: ProgressInfo) => void;
  onFrameAnalyzed?: (analysis: FrameAnalysis, frameIndex: number) => void;

  // Frame interpolation
  enableInterpolation?: boolean;
  interpolationFrames?: number; // Number of frames to interpolate between keyframes
}

export interface ProgressInfo {
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  estimatedTimeRemaining: number; // in ms
  currentPhase: 'analyzing' | 'processing' | 'encoding' | 'finishing';
  frameAnalysis?: FrameAnalysis;
}

export interface ColorPalette {
  colors: number[]; // Array of RGB colors (0xRRGGBB)
  count: number;
}

export class EnhancedGifExporter extends GifExporter {
  private enhancedOptions: Required<EnhancedGifExporterOptions>;
  private frameAnalyzer: FrameAnalyzer;
  private frameBuffer: Array<{ frame: Frame; analysis: FrameAnalysis }> = [];
  private previousFrame: Buffer | Uint8Array | null = null;
  private startTime: number = 0;
  private processedFrames: number = 0;
  private totalFramesToProcess: number = 0;
  private colorPalette: ColorPalette | null = null;

  constructor(options: EnhancedGifExporterOptions) {
    super(options);
    
    this.enhancedOptions = {
      adaptiveSampling: true,
      skipSimilarFrames: true,
      similarityThreshold: 0.05,
      smartColorReduction: true,
      maxColors: 256,
      dithering: true,
      enableInterpolation: false,
      interpolationFrames: 2,
      onProgress: () => {},
      onFrameAnalyzed: () => {},
      ...options
    };

    this.frameAnalyzer = new FrameAnalyzer(
      this.options.width,
      this.options.height
    );
  }

  /**
   * Start the enhanced GIF encoding process
   */
  async start(): Promise<void> {
    this.startTime = Date.now();
    await super.start();
  }

  /**
   * Add a frame with analysis and optional processing
   */
  async addFrame(frame: Frame): Promise<void> {
    // Analyze the frame
    const analysis = this.frameAnalyzer.analyzeFrameWithComparison(
      frame.data,
      this.previousFrame
    );

    // Trigger frame analyzed callback
    this.enhancedOptions.onFrameAnalyzed(analysis, this.frameCount);

    // Check if we should skip this frame
    if (this.enhancedOptions.skipSimilarFrames && 
        this.previousFrame &&
        this.frameAnalyzer.shouldSkipFrame(analysis, this.enhancedOptions.similarityThreshold)) {
      this.reportProgress('analyzing');
      return;
    }

    // Store frame in buffer for batch processing if using advanced features
    if (this.enhancedOptions.adaptiveSampling || 
        this.enhancedOptions.smartColorReduction || 
        this.enhancedOptions.enableInterpolation) {
      this.frameBuffer.push({ frame, analysis });
    } else {
      // Direct processing without buffering
      await this.processAndAddFrame(frame, analysis);
    }

    this.previousFrame = Buffer.from(frame.data);
  }

  /**
   * Process buffered frames with advanced features
   */
  async processBufferedFrames(): Promise<void> {
    if (this.frameBuffer.length === 0) return;

    this.totalFramesToProcess = this.frameBuffer.length;
    this.reportProgress('processing');

    // Build color palette if smart color reduction is enabled
    if (this.enhancedOptions.smartColorReduction) {
      this.colorPalette = await this.buildOptimalPalette();
    }

    // Calculate optimal frame rate if adaptive sampling is enabled
    if (this.enhancedOptions.adaptiveSampling) {
      const analyses = this.frameBuffer.map(f => f.analysis);
      const optimalFps = this.frameAnalyzer.calculateOptimalFrameRate(analyses);
      const optimalDelay = Math.round(1000 / optimalFps);
      this.encoder.setDelay(optimalDelay);
    }

    // Process frames with interpolation if enabled
    if (this.enhancedOptions.enableInterpolation) {
      await this.processWithInterpolation();
    } else {
      await this.processWithoutInterpolation();
    }

    this.frameBuffer = [];
  }

  /**
   * Finish the enhanced GIF encoding process
   */
  async finish(): Promise<void> {
    // Process any remaining buffered frames
    await this.processBufferedFrames();
    
    this.reportProgress('finishing');
    await super.finish();
    
    const totalTime = Date.now() - this.startTime;
    console.log(`GIF export completed in ${totalTime}ms`);
  }

  private async processWithoutInterpolation(): Promise<void> {
    for (let i = 0; i < this.frameBuffer.length; i++) {
      const { frame, analysis } = this.frameBuffer[i];
      
      // Apply color reduction if enabled
      const processedFrame = this.enhancedOptions.smartColorReduction
        ? await this.reduceColors(frame)
        : frame;

      // Use adaptive delay if enabled
      if (this.enhancedOptions.adaptiveSampling) {
        processedFrame.delay = analysis.recommendedDelay;
      }

      await super.addFrame(processedFrame);
      this.processedFrames++;
      this.reportProgress('encoding');
    }
  }

  private async processWithInterpolation(): Promise<void> {
    for (let i = 0; i < this.frameBuffer.length; i++) {
      const { frame, analysis } = this.frameBuffer[i];
      
      // Apply color reduction if enabled
      const processedFrame = this.enhancedOptions.smartColorReduction
        ? await this.reduceColors(frame)
        : frame;

      // Add the keyframe
      await super.addFrame(processedFrame);
      this.processedFrames++;
      this.reportProgress('encoding');

      // Interpolate frames if not the last frame
      if (i < this.frameBuffer.length - 1) {
        const nextFrame = this.frameBuffer[i + 1].frame;
        const interpolatedFrames = await this.interpolateFrames(
          frame,
          nextFrame,
          this.enhancedOptions.interpolationFrames
        );

        for (const interpFrame of interpolatedFrames) {
          await super.addFrame(interpFrame);
          this.processedFrames++;
          this.reportProgress('encoding');
        }
      }
    }
  }

  private async processAndAddFrame(frame: Frame, analysis: FrameAnalysis): Promise<void> {
    // Apply color reduction if enabled
    const processedFrame = this.enhancedOptions.smartColorReduction
      ? await this.reduceColors(frame)
      : frame;

    // Use adaptive delay if enabled
    if (this.enhancedOptions.adaptiveSampling) {
      processedFrame.delay = analysis.recommendedDelay;
    }

    await super.addFrame(processedFrame);
    this.processedFrames++;
    this.reportProgress('encoding');
  }

  private async buildOptimalPalette(): Promise<ColorPalette> {
    // Simplified median cut algorithm for color palette generation
    const allColors = new Map<number, number>(); // color -> count

    // Sample colors from all frames
    for (const { frame } of this.frameBuffer) {
      const pixels = new Uint8Array(frame.data);
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const color = (r << 16) | (g << 8) | b;
        
        allColors.set(color, (allColors.get(color) || 0) + 1);
      }
    }

    // Sort colors by frequency and take top N
    const sortedColors = Array.from(allColors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.enhancedOptions.maxColors)
      .map(([color]) => color);

    return {
      colors: sortedColors,
      count: sortedColors.length
    };
  }

  private async reduceColors(frame: Frame): Promise<Frame> {
    if (!this.colorPalette) return frame;

    const pixels = new Uint8Array(frame.data);
    const output = new Uint8Array(pixels.length);
    
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      
      // Find nearest color in palette
      const nearestColor = this.findNearestColor(r, g, b);
      
      output[i] = (nearestColor >> 16) & 0xFF;
      output[i + 1] = (nearestColor >> 8) & 0xFF;
      output[i + 2] = nearestColor & 0xFF;
      output[i + 3] = a;
      
      // Apply Floyd-Steinberg dithering if enabled
      if (this.enhancedOptions.dithering && i < pixels.length - this.options.width * 4) {
        const errorR = r - output[i];
        const errorG = g - output[i + 1];
        const errorB = b - output[i + 2];
        
        // Distribute error to neighboring pixels
        this.distributeError(pixels, i, errorR, errorG, errorB);
      }
    }

    return { ...frame, data: Buffer.from(output) };
  }

  private findNearestColor(r: number, g: number, b: number): number {
    if (!this.colorPalette) return (r << 16) | (g << 8) | b;

    let nearestColor = this.colorPalette.colors[0];
    let minDistance = Infinity;
    
    for (const color of this.colorPalette.colors) {
      const cr = (color >> 16) & 0xFF;
      const cg = (color >> 8) & 0xFF;
      const cb = color & 0xFF;
      
      const distance = Math.sqrt(
        (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestColor = color;
      }
    }
    
    return nearestColor;
  }

  private distributeError(
    pixels: Uint8Array,
    index: number,
    errorR: number,
    errorG: number,
    errorB: number
  ): void {
    const width = this.options.width;
    
    // Floyd-Steinberg error distribution
    const distributions = [
      { offset: 4, factor: 7/16 },                    // Right
      { offset: width * 4 - 4, factor: 3/16 },       // Bottom-left
      { offset: width * 4, factor: 5/16 },           // Bottom
      { offset: width * 4 + 4, factor: 1/16 }        // Bottom-right
    ];
    
    for (const { offset, factor } of distributions) {
      const targetIndex = index + offset;
      
      if (targetIndex < pixels.length) {
        pixels[targetIndex] = Math.max(0, Math.min(255, 
          pixels[targetIndex] + errorR * factor));
        pixels[targetIndex + 1] = Math.max(0, Math.min(255, 
          pixels[targetIndex + 1] + errorG * factor));
        pixels[targetIndex + 2] = Math.max(0, Math.min(255, 
          pixels[targetIndex + 2] + errorB * factor));
      }
    }
  }

  private async interpolateFrames(
    frame1: Frame,
    frame2: Frame,
    count: number
  ): Promise<Frame[]> {
    const interpolated: Frame[] = [];
    const pixels1 = new Uint8Array(frame1.data);
    const pixels2 = new Uint8Array(frame2.data);
    
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1); // Interpolation factor
      const output = new Uint8Array(pixels1.length);
      
      for (let j = 0; j < pixels1.length; j += 4) {
        // Linear interpolation for each channel
        output[j] = Math.round(pixels1[j] * (1 - t) + pixels2[j] * t);
        output[j + 1] = Math.round(pixels1[j + 1] * (1 - t) + pixels2[j + 1] * t);
        output[j + 2] = Math.round(pixels1[j + 2] * (1 - t) + pixels2[j + 2] * t);
        output[j + 3] = Math.round(pixels1[j + 3] * (1 - t) + pixels2[j + 3] * t);
      }
      
      interpolated.push({
        data: Buffer.from(output),
        delay: Math.round((frame1.delay || this.options.delay) * 0.5)
      });
    }
    
    return interpolated;
  }

  private reportProgress(phase: ProgressInfo['currentPhase']): void {
    const currentFrame = this.processedFrames;
    const totalFrames = this.totalFramesToProcess || this.frameBuffer.length || 1;
    const percentage = (currentFrame / totalFrames) * 100;
    
    const elapsed = Date.now() - this.startTime;
    const estimatedTotal = totalFrames > 0 ? (elapsed / currentFrame) * totalFrames : 0;
    const estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed);
    
    const progress: ProgressInfo = {
      currentFrame,
      totalFrames,
      percentage,
      estimatedTimeRemaining,
      currentPhase: phase
    };
    
    this.enhancedOptions.onProgress(progress);
  }
}
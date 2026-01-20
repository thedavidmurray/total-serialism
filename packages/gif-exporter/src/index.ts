// Base GIF exporter
export { GifExporter, GifExporterOptions, Frame } from './gif-exporter';

// Enhanced GIF exporter
export { 
  EnhancedGifExporter, 
  EnhancedGifExporterOptions,
  ProgressInfo,
  ColorPalette 
} from './enhanced-exporter';

// Frame analysis utilities
export { 
  FrameAnalyzer,
  FrameAnalysis,
  FrameComparisonResult,
  MotionVector 
} from './utils/frame-analyzer';

// Re-export commonly used types for convenience
export type { WriteStream } from 'fs';
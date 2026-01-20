import GifEncoder from 'gif-encoder-2';
import { createWriteStream, WriteStream } from 'fs';

export interface GifExporterOptions {
  width: number;
  height: number;
  outputPath: string;
  delay?: number; // Frame delay in ms
  quality?: number; // 1-30, lower is better quality
  repeat?: number; // 0 for repeat, -1 for no repeat
  transparent?: boolean;
  transparentColor?: number; // RGB hex color
}

export interface Frame {
  data: Buffer | Uint8Array;
  delay?: number; // Override delay for this frame
}

export class GifExporter {
  protected encoder: GifEncoder;
  protected stream: WriteStream | null = null;
  protected options: Required<GifExporterOptions>;
  protected frameCount: number = 0;
  protected isStarted: boolean = false;

  constructor(options: GifExporterOptions) {
    this.options = {
      delay: 100,
      quality: 10,
      repeat: 0,
      transparent: false,
      transparentColor: 0x000000,
      ...options
    };

    this.encoder = new GifEncoder(this.options.width, this.options.height);
  }

  /**
   * Start the GIF encoding process
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      throw new Error('GIF exporter already started');
    }

    this.stream = createWriteStream(this.options.outputPath);
    this.encoder.createReadStream().pipe(this.stream);
    
    this.encoder.start();
    this.encoder.setRepeat(this.options.repeat);
    this.encoder.setDelay(this.options.delay);
    this.encoder.setQuality(this.options.quality);
    
    if (this.options.transparent) {
      this.encoder.setTransparent(this.options.transparentColor);
    }

    this.isStarted = true;
  }

  /**
   * Add a frame to the GIF
   */
  async addFrame(frame: Frame): Promise<void> {
    if (!this.isStarted) {
      throw new Error('GIF exporter not started. Call start() first.');
    }

    if (frame.delay !== undefined) {
      this.encoder.setDelay(frame.delay);
    }

    this.encoder.addFrame(frame.data);
    this.frameCount++;

    // Reset delay to default if it was overridden
    if (frame.delay !== undefined) {
      this.encoder.setDelay(this.options.delay);
    }
  }

  /**
   * Finish the GIF encoding process
   */
  async finish(): Promise<void> {
    if (!this.isStarted) {
      throw new Error('GIF exporter not started');
    }

    this.encoder.finish();

    return new Promise((resolve, reject) => {
      if (!this.stream) {
        reject(new Error('No output stream'));
        return;
      }

      this.stream.on('finish', () => {
        this.isStarted = false;
        resolve();
      });

      this.stream.on('error', reject);
    });
  }

  /**
   * Get the number of frames added
   */
  getFrameCount(): number {
    return this.frameCount;
  }
}
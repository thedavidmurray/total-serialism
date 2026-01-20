declare module 'gif-encoder-2' {
  import { Readable } from 'stream';

  class GifEncoder {
    constructor(width: number, height: number);
    
    // Stream methods
    createReadStream(): Readable;
    createWriteStream(options?: any): any;
    
    // Configuration methods
    start(): void;
    finish(): void;
    setRepeat(repeat: number): void;
    setDelay(delay: number): void;
    setQuality(quality: number): void;
    setTransparent(color: number): void;
    setDispose(dispose: number): void;
    setFrameRate(fps: number): void;
    
    // Frame methods
    addFrame(data: Buffer | Uint8Array | ArrayLike<number>): void;
    
    // Properties
    out: any;
    repeat: number;
    delay: number;
    quality: number;
    transparent: number | null;
    dispose: number;
    width: number;
    height: number;
  }

  export = GifEncoder;
}
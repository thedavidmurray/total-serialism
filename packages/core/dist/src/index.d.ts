/**
 * @pen-plotter-art/core
 * Core utilities and types for pen plotter art
 */
export * from './types';
export declare const VERSION = "0.0.1";
/**
 * Core utilities
 */
/**
 * Convert between units
 */
export declare const Units: {
    /** Convert millimeters to pixels */
    mmToPx: (mm: number, dpi?: number) => number;
    /** Convert pixels to millimeters */
    pxToMm: (px: number, dpi?: number) => number;
    /** Convert inches to pixels */
    inToPx: (inches: number, dpi?: number) => number;
    /** Convert pixels to inches */
    pxToIn: (px: number, dpi?: number) => number;
};
/**
 * Path utilities
 */
export declare const PathUtils: {
    /** Calculate bounds of a path */
    getBounds: (path: number[][]) => import("./types").Bounds;
    /** Calculate total length of a path */
    getLength: (path: number[][]) => number;
    /** Simplify path using Douglas-Peucker algorithm */
    simplify: (path: number[][], tolerance?: number) => number[][];
};
/**
 * Random utilities with seed support
 */
export declare const Random: {
    /** Create a seeded random number generator */
    createSeeded: (seed: string | number) => () => number;
    /** Generate random number in range */
    range: (min: number, max: number, rng?: () => number) => number;
    /** Random integer in range */
    rangeInt: (min: number, max: number, rng?: () => number) => number;
    /** Random choice from array */
    choice: <T>(array: T[], rng?: () => number) => T;
    /** Shuffle array in place */
    shuffle: <T>(array: T[], rng?: () => number) => T[];
};
/**
 * Math utilities
 */
export declare const MathUtils: {
    /** Linear interpolation */
    lerp: (a: number, b: number, t: number) => number;
    /** Clamp value between min and max */
    clamp: (value: number, min: number, max: number) => number;
    /** Map value from one range to another */
    map: (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => number;
    /** Convert degrees to radians */
    degToRad: (degrees: number) => number;
    /** Convert radians to degrees */
    radToDeg: (radians: number) => number;
};
//# sourceMappingURL=index.d.ts.map
/**
 * Core type definitions for pen plotter art
 */
export * from './algorithm';
/**
 * 2D point representation
 */
export type Point2D = [number, number];
/**
 * 3D point representation (z can be used for pressure, time, etc.)
 */
export type Point3D = [number, number, number];
/**
 * Bounding box
 */
export interface Bounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
}
/**
 * Color representation
 */
export type Color = string | [number, number, number] | [number, number, number, number];
/**
 * Transform matrix (3x3 for 2D transforms)
 */
export type Matrix2D = [
    [
        number,
        number,
        number
    ],
    [
        number,
        number,
        number
    ],
    [
        number,
        number,
        number
    ]
];
/**
 * Common events emitted by algorithms
 */
export interface AlgorithmEvents {
    /** Progress update */
    progress?: (percent: number, message?: string) => void;
    /** Path generated */
    pathGenerated?: (path: import('./algorithm').PathData | import('./algorithm').SimplePath, index: number, total: number) => void;
    /** Generation complete */
    complete?: (output: import('./algorithm').AlgorithmOutput) => void;
    /** Error occurred */
    error?: (error: Error) => void;
}
/**
 * Storage interface for parameters and presets
 */
export interface StorageAdapter {
    /** Save preset */
    savePreset(preset: import('./algorithm').PresetDefinition): Promise<void>;
    /** Load preset */
    loadPreset(id: string): Promise<import('./algorithm').PresetDefinition | null>;
    /** List presets */
    listPresets(algorithmId?: string): Promise<import('./algorithm').PresetDefinition[]>;
    /** Delete preset */
    deletePreset(id: string): Promise<void>;
}
/**
 * Render context for preview/debug
 */
export interface RenderContext {
    /** Canvas 2D context or similar */
    ctx: CanvasRenderingContext2D | any;
    /** Width */
    width: number;
    /** Height */
    height: number;
    /** Scale factor */
    scale?: number;
    /** Transform matrix */
    transform?: Matrix2D;
}
export type { PathData, SimplePath, ParameterType, ParameterDefinition, ParameterSet, PresetDefinition, AlgorithmOutput, AlgorithmConfig, Algorithm, AlgorithmFactory, LegacyAlgorithmAdapter, AlgorithmRegistry, ExportOptions } from './algorithm';
//# sourceMappingURL=index.d.ts.map
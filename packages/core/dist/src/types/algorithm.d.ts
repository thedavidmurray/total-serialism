/**
 * Core types for pen plotter algorithms
 * Designed to support both legacy and new algorithm patterns
 */
/**
 * Represents a single path to be drawn by the plotter
 * Can be a simple array of points or a more complex structure
 */
export type PathData = {
    /** Array of [x, y] coordinate pairs */
    points: number[][];
    /** Optional styling information */
    style?: {
        strokeWidth?: number;
        strokeColor?: string;
        fillColor?: string;
        opacity?: number;
        [key: string]: any;
    };
    /** Optional metadata about the path */
    metadata?: {
        layer?: string;
        group?: string;
        [key: string]: any;
    };
};
/**
 * Simple path representation for backwards compatibility
 */
export type SimplePath = number[][];
/**
 * Supported parameter types
 */
export type ParameterType = 'number' | 'boolean' | 'string' | 'select' | 'color' | 'range' | 'file';
/**
 * Definition for a single algorithm parameter
 */
export interface ParameterDefinition {
    /** Parameter name/key */
    name: string;
    /** Display label */
    label?: string;
    /** Parameter type */
    type: ParameterType;
    /** Default value */
    defaultValue: any;
    /** Min value (for number/range types) */
    min?: number;
    /** Max value (for number/range types) */
    max?: number;
    /** Step value (for number/range types) */
    step?: number;
    /** Available options (for select type) */
    options?: Array<{
        value: any;
        label: string;
    }> | string[];
    /** Parameter description */
    description?: string;
    /** Group/category for organization */
    group?: string;
    /** Whether parameter triggers re-render */
    liveUpdate?: boolean;
    /** Validation function */
    validate?: (value: any) => boolean;
}
/**
 * Collection of parameters for an algorithm
 */
export type ParameterSet = Record<string, any>;
/**
 * Preset definition for saved parameter sets
 */
export interface PresetDefinition {
    /** Unique preset ID */
    id: string;
    /** Display name */
    name: string;
    /** Algorithm this preset is for */
    algorithm: string;
    /** The parameter values */
    params: ParameterSet;
    /** Optional description */
    description?: string;
    /** Creation timestamp */
    timestamp?: string;
    /** Optional tags for categorization */
    tags?: string[];
    /** Optional preview image */
    thumbnail?: string;
    /** Optional notes */
    notes?: string;
}
/**
 * Output from an algorithm execution
 */
export interface AlgorithmOutput {
    /** The generated paths */
    paths: Array<PathData | SimplePath>;
    /** Optional metadata about the generation */
    metadata?: {
        /** Random seed used */
        seed?: string | number;
        /** Generation timestamp */
        timestamp?: string;
        /** Algorithm version */
        version?: string;
        /** Statistics about the output */
        stats?: {
            pathCount?: number;
            pointCount?: number;
            bounds?: {
                width: number;
                height: number;
            };
            [key: string]: any;
        };
        [key: string]: any;
    };
    /** Optional preview/debug information */
    debug?: any;
}
/**
 * Configuration for algorithm execution
 */
export interface AlgorithmConfig {
    /** Canvas width in pixels */
    width: number;
    /** Canvas height in pixels */
    height: number;
    /** Random seed (optional) */
    seed?: string | number;
    /** Margin from canvas edge */
    margin?: number;
    /** Units (pixels, mm, inches) */
    units?: 'px' | 'mm' | 'in';
    /** DPI for unit conversion */
    dpi?: number;
}
/**
 * Main algorithm interface
 * Supports both class-based and functional algorithms
 */
export interface Algorithm {
    /** Unique algorithm identifier */
    id: string;
    /** Display name */
    name: string;
    /** Algorithm description */
    description?: string;
    /** Algorithm category */
    category?: string;
    /** Tags for search/filter */
    tags?: string[];
    /** Author information */
    author?: {
        name: string;
        url?: string;
    };
    /** Version */
    version?: string;
    /** Parameter definitions */
    parameters: ParameterDefinition[];
    /** Available presets */
    presets?: PresetDefinition[];
    /**
     * Generate paths with given parameters
     * Supports both sync and async execution
     */
    generate(params: ParameterSet, config: AlgorithmConfig): AlgorithmOutput | Promise<AlgorithmOutput>;
    /** Optional validation before generation */
    validate?(params: ParameterSet, config: AlgorithmConfig): boolean | string;
    /** Optional parameter preprocessing */
    preprocessParams?(params: ParameterSet): ParameterSet;
    /** Optional output postprocessing */
    postprocess?(output: AlgorithmOutput, params: ParameterSet, config: AlgorithmConfig): AlgorithmOutput;
}
/**
 * Factory function type for creating algorithm instances
 */
export type AlgorithmFactory = () => Algorithm;
/**
 * Legacy algorithm adapter interface
 * For wrapping existing algorithms that don't follow the new interface
 */
export interface LegacyAlgorithmAdapter {
    /** Wrap a legacy algorithm function */
    wrapFunction(fn: Function, metadata: Partial<Algorithm>): Algorithm;
    /** Wrap a legacy algorithm class */
    wrapClass(AlgorithmClass: new (...args: any[]) => any, metadata: Partial<Algorithm>): Algorithm;
}
/**
 * Algorithm registry interface
 */
export interface AlgorithmRegistry {
    /** Register an algorithm */
    register(algorithm: Algorithm): void;
    /** Get algorithm by ID */
    get(id: string): Algorithm | undefined;
    /** Get all algorithms */
    getAll(): Algorithm[];
    /** Get algorithms by category */
    getByCategory(category: string): Algorithm[];
    /** Get algorithms by tag */
    getByTag(tag: string): Algorithm[];
    /** Search algorithms */
    search(query: string): Algorithm[];
}
/**
 * Export format options
 */
export interface ExportOptions {
    /** Export format */
    format: 'svg' | 'gcode' | 'hpgl' | 'json';
    /** Include metadata */
    includeMetadata?: boolean;
    /** Optimize paths */
    optimize?: boolean;
    /** Scale factor */
    scale?: number;
    /** Additional format-specific options */
    formatOptions?: Record<string, any>;
}
//# sourceMappingURL=algorithm.d.ts.map
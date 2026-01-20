/**
 * Legacy algorithm adapter for wrapping existing algorithms
 */
import type { ParameterDefinition, LegacyAlgorithmAdapter } from '../types';
/**
 * Default parameter definitions for common algorithm parameters
 */
export declare const commonParameters: Record<string, ParameterDefinition>;
/**
 * Create a legacy adapter instance
 */
export declare const createLegacyAdapter: () => LegacyAlgorithmAdapter;
/**
 * Create parameter definitions from a simple object
 */
export declare function createParametersFromObject(params: Record<string, any>): ParameterDefinition[];
//# sourceMappingURL=legacy-adapter.d.ts.map
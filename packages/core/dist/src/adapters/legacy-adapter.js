/**
 * Legacy algorithm adapter for wrapping existing algorithms
 */
/**
 * Default parameter definitions for common algorithm parameters
 */
export const commonParameters = {
    seed: {
        name: 'seed',
        label: 'Random Seed',
        type: 'string',
        defaultValue: Math.random().toString(36).substr(2, 9),
        description: 'Random seed for reproducible results'
    },
    width: {
        name: 'width',
        label: 'Canvas Width',
        type: 'number',
        defaultValue: 800,
        min: 100,
        max: 2000,
        step: 100,
        description: 'Canvas width in pixels'
    },
    height: {
        name: 'height',
        label: 'Canvas Height',
        type: 'number',
        defaultValue: 800,
        min: 100,
        max: 2000,
        step: 100,
        description: 'Canvas height in pixels'
    },
    margin: {
        name: 'margin',
        label: 'Margin',
        type: 'number',
        defaultValue: 50,
        min: 0,
        max: 200,
        step: 10,
        description: 'Margin from canvas edges'
    }
};
/**
 * Create a legacy adapter instance
 */
export const createLegacyAdapter = () => {
    return {
        /**
         * Wrap a legacy algorithm function
         */
        wrapFunction(fn, metadata) {
            return {
                id: metadata.id || 'legacy-function',
                name: metadata.name || 'Legacy Algorithm',
                description: metadata.description,
                category: metadata.category,
                tags: metadata.tags,
                author: metadata.author,
                version: metadata.version || '1.0.0',
                parameters: metadata.parameters || [],
                presets: metadata.presets,
                generate(params, config) {
                    try {
                        // Call the legacy function with parameters and config
                        const result = fn({ ...params, ...config });
                        // If result is already in the correct format, return it
                        if (result && typeof result === 'object' && 'paths' in result) {
                            return result;
                        }
                        // If result is an array of paths, wrap it
                        if (Array.isArray(result)) {
                            return {
                                paths: result,
                                metadata: {
                                    seed: params.seed || config.seed,
                                    timestamp: new Date().toISOString()
                                }
                            };
                        }
                        // Otherwise, assume it's a single path
                        return {
                            paths: [result],
                            metadata: {
                                seed: params.seed || config.seed,
                                timestamp: new Date().toISOString()
                            }
                        };
                    }
                    catch (error) {
                        throw new Error(`Legacy function error: ${error.message}`);
                    }
                },
                validate: metadata.validate,
                preprocessParams: metadata.preprocessParams,
                postprocess: metadata.postprocess
            };
        },
        /**
         * Wrap a legacy algorithm class
         */
        wrapClass(AlgorithmClass, metadata) {
            return {
                id: metadata.id || 'legacy-class',
                name: metadata.name || 'Legacy Algorithm',
                description: metadata.description,
                category: metadata.category,
                tags: metadata.tags,
                author: metadata.author,
                version: metadata.version || '1.0.0',
                parameters: metadata.parameters || [],
                presets: metadata.presets,
                generate(params, config) {
                    try {
                        // Create instance with config
                        const instance = new AlgorithmClass(config.width, config.height, params);
                        // Common method names to try
                        const methodNames = ['generate', 'run', 'execute', 'draw', 'render'];
                        let result = null;
                        for (const methodName of methodNames) {
                            if (typeof instance[methodName] === 'function') {
                                result = instance[methodName]();
                                break;
                            }
                        }
                        // If no method found, try to get paths property
                        if (!result && instance.paths) {
                            result = instance.paths;
                        }
                        // If still no result, try to get grid and convert
                        if (!result && instance.grid) {
                            result = convertGridToPaths(instance.grid);
                        }
                        if (!result) {
                            throw new Error('Could not extract paths from algorithm instance');
                        }
                        // Wrap result in standard format
                        if (result && typeof result === 'object' && 'paths' in result) {
                            return result;
                        }
                        if (Array.isArray(result)) {
                            return {
                                paths: result,
                                metadata: {
                                    seed: params.seed || config.seed,
                                    timestamp: new Date().toISOString(),
                                    algorithmClass: AlgorithmClass.name
                                }
                            };
                        }
                        return {
                            paths: [result],
                            metadata: {
                                seed: params.seed || config.seed,
                                timestamp: new Date().toISOString(),
                                algorithmClass: AlgorithmClass.name
                            }
                        };
                    }
                    catch (error) {
                        throw new Error(`Legacy class error: ${error.message}`);
                    }
                },
                validate: metadata.validate,
                preprocessParams: metadata.preprocessParams,
                postprocess: metadata.postprocess
            };
        }
    };
};
/**
 * Helper function to convert grid data to paths
 */
function convertGridToPaths(grid) {
    const paths = [];
    // Simple conversion: each active cell becomes a small square path
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            if (grid[y][x]) {
                paths.push([
                    [x, y],
                    [x + 1, y],
                    [x + 1, y + 1],
                    [x, y + 1],
                    [x, y] // Close the path
                ]);
            }
        }
    }
    return paths;
}
/**
 * Create parameter definitions from a simple object
 */
export function createParametersFromObject(params) {
    return Object.entries(params).map(([key, value]) => {
        const type = typeof value;
        if (type === 'number') {
            return {
                name: key,
                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                type: 'number',
                defaultValue: value,
                min: 0,
                max: value * 2 || 100,
                step: Number.isInteger(value) ? 1 : 0.1
            };
        }
        else if (type === 'boolean') {
            return {
                name: key,
                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                type: 'boolean',
                defaultValue: value
            };
        }
        else if (Array.isArray(value)) {
            return {
                name: key,
                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                type: 'select',
                defaultValue: value[0],
                options: value
            };
        }
        else {
            return {
                name: key,
                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                type: 'string',
                defaultValue: value
            };
        }
    });
}
//# sourceMappingURL=legacy-adapter.js.map
/**
 * Hybrid Algorithm Engine
 * Combines multiple generative algorithms into a single output
 */

class HybridEngine {
    constructor() {
        this.algorithms = new Map();
        this.layers = [];
        this.blendModes = {
            overlay: this.overlayBlend.bind(this),
            mask: this.maskBlend.bind(this),
            modulate: this.modulateBlend.bind(this),
            intersect: this.intersectBlend.bind(this),
            add: this.addBlend.bind(this),
            multiply: this.multiplyBlend.bind(this),
            difference: this.differenceBlend.bind(this)
        };
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 800;
    }

    /**
     * Register an algorithm for use in hybridization
     */
    registerAlgorithm(name, algorithm) {
        this.algorithms.set(name, algorithm);
    }

    /**
     * Add a layer to the composition
     */
    addLayer(config) {
        const layer = {
            id: Date.now() + Math.random(),
            algorithm: config.algorithm,
            parameters: config.parameters || {},
            blendMode: config.blendMode || 'overlay',
            opacity: config.opacity || 1.0,
            enabled: config.enabled !== false,
            data: null,
            paths: []
        };
        this.layers.push(layer);
        return layer.id;
    }

    /**
     * Update layer configuration
     */
    updateLayer(layerId, updates) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            Object.assign(layer, updates);
        }
    }

    /**
     * Remove a layer
     */
    removeLayer(layerId) {
        this.layers = this.layers.filter(l => l.id !== layerId);
    }

    /**
     * Generate data for all layers
     */
    async generateLayers() {
        for (const layer of this.layers) {
            if (!layer.enabled) continue;
            
            const algorithm = this.algorithms.get(layer.algorithm);
            if (!algorithm) {
                console.warn(`Algorithm ${layer.algorithm} not found`);
                continue;
            }

            try {
                // Generate algorithm output
                const result = await algorithm.generate({
                    ...layer.parameters,
                    width: this.width,
                    height: this.height
                });

                layer.data = result.data || result;
                layer.paths = result.paths || this.dataToPaths(result);
            } catch (error) {
                console.error(`Error generating ${layer.algorithm}:`, error);
            }
        }
    }

    /**
     * Compose all layers into final output
     */
    compose() {
        if (this.layers.length === 0) return { paths: [] };

        // Start with the first enabled layer
        let basePaths = [];
        let baseLayer = null;

        for (const layer of this.layers) {
            if (layer.enabled && layer.paths.length > 0) {
                basePaths = [...layer.paths];
                baseLayer = layer;
                break;
            }
        }

        if (!baseLayer) return { paths: [] };

        // Blend subsequent layers
        for (let i = this.layers.indexOf(baseLayer) + 1; i < this.layers.length; i++) {
            const layer = this.layers[i];
            if (!layer.enabled || layer.paths.length === 0) continue;

            const blendFunc = this.blendModes[layer.blendMode];
            if (blendFunc) {
                basePaths = blendFunc(basePaths, layer.paths, layer.opacity);
            }
        }

        return { paths: basePaths };
    }

    /**
     * Overlay blend mode - combines paths from both layers
     */
    overlayBlend(basePaths, layerPaths, opacity) {
        const result = [...basePaths];
        
        for (const path of layerPaths) {
            if (Math.random() < opacity) {
                result.push(this.applyOpacity(path, opacity));
            }
        }
        
        return result;
    }

    /**
     * Mask blend mode - use layer as mask for base
     */
    maskBlend(basePaths, layerPaths, opacity) {
        const maskBounds = this.createMaskFromPaths(layerPaths);
        const result = [];

        for (const path of basePaths) {
            const maskedPath = this.applyMaskToPath(path, maskBounds, opacity);
            if (maskedPath && maskedPath.length > 1) {
                result.push(maskedPath);
            }
        }

        return result;
    }

    /**
     * Modulate blend mode - use layer to modulate base paths
     */
    modulateBlend(basePaths, layerPaths, opacity) {
        const modField = this.createFieldFromPaths(layerPaths);
        const result = [];

        for (const path of basePaths) {
            const modulatedPath = this.modulatePath(path, modField, opacity);
            result.push(modulatedPath);
        }

        return result;
    }

    /**
     * Intersect blend mode - only keep overlapping areas
     */
    intersectBlend(basePaths, layerPaths, opacity) {
        const result = [];
        const layerBounds = this.createBoundsFromPaths(layerPaths);

        for (const basePath of basePaths) {
            for (const bound of layerBounds) {
                const intersection = this.intersectPathWithBound(basePath, bound);
                if (intersection && intersection.length > 1) {
                    result.push(this.applyOpacity(intersection, opacity));
                }
            }
        }

        return result;
    }

    /**
     * Add blend mode - additive combination
     */
    addBlend(basePaths, layerPaths, opacity) {
        return [...basePaths, ...layerPaths.map(p => this.applyOpacity(p, opacity))];
    }

    /**
     * Multiply blend mode - density multiplication
     */
    multiplyBlend(basePaths, layerPaths, opacity) {
        const grid = this.createDensityGrid(basePaths, 20);
        const layerGrid = this.createDensityGrid(layerPaths, 20);
        const result = [];

        for (let x = 0; x < grid.length; x++) {
            for (let y = 0; y < grid[x].length; y++) {
                const density = grid[x][y] * layerGrid[x][y] * opacity;
                if (density > 0.1) {
                    result.push(...this.generatePathsInCell(x, y, 20, density));
                }
            }
        }

        return result;
    }

    /**
     * Difference blend mode - subtract overlapping areas
     */
    differenceBlend(basePaths, layerPaths, opacity) {
        const result = [];
        const layerBounds = this.createBoundsFromPaths(layerPaths);

        for (const path of basePaths) {
            let currentPath = path;
            for (const bound of layerBounds) {
                const difference = this.subtractBoundFromPath(currentPath, bound, opacity);
                if (difference.length > 0) {
                    currentPath = difference[0];
                } else {
                    currentPath = null;
                    break;
                }
            }
            if (currentPath && currentPath.length > 1) {
                result.push(currentPath);
            }
        }

        return result;
    }

    /**
     * Helper: Apply opacity to path
     */
    applyOpacity(path, opacity) {
        if (opacity >= 1) return path;
        
        // For partial opacity, we can thin out the path
        const thinned = [];
        const step = Math.max(1, Math.floor(1 / opacity));
        
        for (let i = 0; i < path.length; i += step) {
            thinned.push(path[i]);
        }
        
        return thinned;
    }

    /**
     * Helper: Create mask from paths
     */
    createMaskFromPaths(paths) {
        const bounds = [];
        
        for (const path of paths) {
            if (path.length < 3) continue;
            
            const bound = {
                points: path,
                minX: Math.min(...path.map(p => p[0])),
                maxX: Math.max(...path.map(p => p[0])),
                minY: Math.min(...path.map(p => p[1])),
                maxY: Math.max(...path.map(p => p[1]))
            };
            bounds.push(bound);
        }
        
        return bounds;
    }

    /**
     * Helper: Apply mask to path
     */
    applyMaskToPath(path, maskBounds, opacity) {
        const result = [];
        
        for (const point of path) {
            let inMask = false;
            
            for (const bound of maskBounds) {
                if (this.pointInPolygon(point, bound.points)) {
                    inMask = true;
                    break;
                }
            }
            
            if (inMask || Math.random() > opacity) {
                result.push(point);
            }
        }
        
        return result;
    }

    /**
     * Helper: Create field from paths for modulation
     */
    createFieldFromPaths(paths) {
        const field = {};
        const cellSize = 10;
        
        for (const path of paths) {
            for (let i = 1; i < path.length; i++) {
                const [x1, y1] = path[i - 1];
                const [x2, y2] = path[i];
                
                const dx = x2 - x1;
                const dy = y2 - y1;
                const len = Math.sqrt(dx * dx + dy * dy);
                
                if (len > 0) {
                    const cx = Math.floor((x1 + x2) / 2 / cellSize);
                    const cy = Math.floor((y1 + y2) / 2 / cellSize);
                    const key = `${cx},${cy}`;
                    
                    if (!field[key]) {
                        field[key] = { x: 0, y: 0, count: 0 };
                    }
                    
                    field[key].x += dx / len;
                    field[key].y += dy / len;
                    field[key].count++;
                }
            }
        }
        
        // Normalize
        for (const key in field) {
            const f = field[key];
            f.x /= f.count;
            f.y /= f.count;
        }
        
        return field;
    }

    /**
     * Helper: Modulate path using field
     */
    modulatePath(path, field, strength) {
        const result = [];
        const cellSize = 10;
        
        for (const [x, y] of path) {
            const cx = Math.floor(x / cellSize);
            const cy = Math.floor(y / cellSize);
            const key = `${cx},${cy}`;
            
            let newX = x;
            let newY = y;
            
            if (field[key]) {
                newX += field[key].x * strength * 10;
                newY += field[key].y * strength * 10;
            }
            
            result.push([newX, newY]);
        }
        
        return result;
    }

    /**
     * Helper: Point in polygon test
     */
    pointInPolygon(point, polygon) {
        const [x, y] = point;
        let inside = false;
        
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];
            
            if (((yi > y) !== (yj > y)) && 
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }

    /**
     * Helper: Create bounds from paths
     */
    createBoundsFromPaths(paths) {
        return paths.map(path => ({
            points: path,
            minX: Math.min(...path.map(p => p[0])),
            maxX: Math.max(...path.map(p => p[0])),
            minY: Math.min(...path.map(p => p[1])),
            maxY: Math.max(...path.map(p => p[1]))
        }));
    }

    /**
     * Helper: Intersect path with bound
     */
    intersectPathWithBound(path, bound) {
        const result = [];
        let inside = false;
        
        for (let i = 0; i < path.length; i++) {
            const point = path[i];
            const isInside = this.pointInPolygon(point, bound.points);
            
            if (isInside) {
                result.push(point);
                inside = true;
            } else if (inside) {
                // We've left the bound, start a new segment
                break;
            }
        }
        
        return result;
    }

    /**
     * Helper: Create density grid
     */
    createDensityGrid(paths, cellSize) {
        const gridWidth = Math.ceil(this.width / cellSize);
        const gridHeight = Math.ceil(this.height / cellSize);
        const grid = Array(gridWidth).fill(null).map(() => Array(gridHeight).fill(0));
        
        for (const path of paths) {
            for (const [x, y] of path) {
                const gx = Math.floor(x / cellSize);
                const gy = Math.floor(y / cellSize);
                
                if (gx >= 0 && gx < gridWidth && gy >= 0 && gy < gridHeight) {
                    grid[gx][gy] += 1;
                }
            }
        }
        
        // Normalize
        let maxDensity = 0;
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                maxDensity = Math.max(maxDensity, grid[x][y]);
            }
        }
        
        if (maxDensity > 0) {
            for (let x = 0; x < gridWidth; x++) {
                for (let y = 0; y < gridHeight; y++) {
                    grid[x][y] /= maxDensity;
                }
            }
        }
        
        return grid;
    }

    /**
     * Helper: Generate paths in cell based on density
     */
    generatePathsInCell(x, y, cellSize, density) {
        const paths = [];
        const numLines = Math.floor(density * 5);
        
        for (let i = 0; i < numLines; i++) {
            const x1 = x * cellSize + Math.random() * cellSize;
            const y1 = y * cellSize + Math.random() * cellSize;
            const x2 = x * cellSize + Math.random() * cellSize;
            const y2 = y * cellSize + Math.random() * cellSize;
            
            paths.push([[x1, y1], [x2, y2]]);
        }
        
        return paths;
    }

    /**
     * Helper: Subtract bound from path
     */
    subtractBoundFromPath(path, bound, strength) {
        const segments = [];
        let currentSegment = [];
        
        for (const point of path) {
            const inBound = this.pointInPolygon(point, bound.points);
            
            if (!inBound || Math.random() > strength) {
                currentSegment.push(point);
            } else if (currentSegment.length > 0) {
                segments.push(currentSegment);
                currentSegment = [];
            }
        }
        
        if (currentSegment.length > 0) {
            segments.push(currentSegment);
        }
        
        return segments;
    }

    /**
     * Helper: Convert algorithm data to paths
     */
    dataToPaths(data) {
        // This is a fallback converter for algorithms that don't return paths directly
        if (Array.isArray(data)) {
            return data;
        }
        
        if (data.paths) {
            return data.paths;
        }
        
        if (data.lines) {
            return data.lines;
        }
        
        if (data.points) {
            // Convert points to paths
            const paths = [];
            for (let i = 1; i < data.points.length; i++) {
                paths.push([data.points[i - 1], data.points[i]]);
            }
            return paths;
        }
        
        return [];
    }

    /**
     * Export composition as SVG
     */
    exportSVG() {
        const composed = this.compose();
        const paths = composed.paths;
        
        let svg = `<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">\n`;
        svg += `  <rect width="${this.width}" height="${this.height}" fill="white"/>\n`;
        
        // Group paths by layer
        const layerGroups = new Map();
        
        for (let i = 0; i < this.layers.length; i++) {
            const layer = this.layers[i];
            if (!layer.enabled) continue;
            
            svg += `  <g id="layer-${i}-${layer.algorithm}" opacity="${layer.opacity}">\n`;
            
            if (layer.paths) {
                for (const path of layer.paths) {
                    if (path.length < 2) continue;
                    
                    svg += '    <path d="';
                    svg += `M ${path[0][0].toFixed(2)} ${path[0][1].toFixed(2)}`;
                    
                    for (let j = 1; j < path.length; j++) {
                        svg += ` L ${path[j][0].toFixed(2)} ${path[j][1].toFixed(2)}`;
                    }
                    
                    svg += '" stroke="black" stroke-width="0.5" fill="none"/>\n';
                }
            }
            
            svg += '  </g>\n';
        }
        
        svg += '</svg>';
        
        return svg;
    }

    /**
     * Get current configuration
     */
    getConfiguration() {
        return {
            layers: this.layers.map(layer => ({
                id: layer.id,
                algorithm: layer.algorithm,
                parameters: layer.parameters,
                blendMode: layer.blendMode,
                opacity: layer.opacity,
                enabled: layer.enabled
            })),
            width: this.width,
            height: this.height
        };
    }

    /**
     * Load configuration
     */
    loadConfiguration(config) {
        this.layers = [];
        this.width = config.width || 800;
        this.height = config.height || 800;
        
        for (const layerConfig of config.layers) {
            this.addLayer(layerConfig);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HybridEngine;
}
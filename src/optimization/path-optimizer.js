/**
 * Path Optimization System for Pen Plotter
 * Implements TSP solver, path merging, simplification, and multi-color sorting
 */

class PathOptimizer {
    constructor(options = {}) {
        this.options = {
            mergeTolerance: options.mergeTolerance || 0.1,  // Distance threshold for merging paths
            simplifyTolerance: options.simplifyTolerance || 0.5,  // Douglas-Peucker tolerance
            tspIterations: options.tspIterations || 100,  // 2-opt iterations
            ...options
        };
    }

    /**
     * Main optimization pipeline
     * @param {Array} paths - Array of path objects with points and optional color
     * @returns {Object} Optimized paths with statistics
     */
    optimize(paths) {
        const startTime = Date.now();
        let optimizedPaths = [...paths];
        
        // Step 1: Simplify individual paths
        optimizedPaths = this.simplifyPaths(optimizedPaths);
        
        // Step 2: Merge nearby path endpoints
        optimizedPaths = this.mergePaths(optimizedPaths);
        
        // Step 3: Group by color/tool
        const colorGroups = this.groupByColor(optimizedPaths);
        
        // Step 4: Optimize order within each color group
        const orderedGroups = {};
        for (const [color, group] of Object.entries(colorGroups)) {
            orderedGroups[color] = this.optimizePathOrder(group);
        }
        
        // Step 5: Optimize color/tool change order
        const finalPaths = this.optimizeColorOrder(orderedGroups);
        
        // Calculate statistics
        const stats = this.calculateStatistics(paths, finalPaths);
        stats.optimizationTime = Date.now() - startTime;
        
        return {
            paths: finalPaths,
            statistics: stats
        };
    }

    /**
     * Simplify paths using Douglas-Peucker algorithm
     */
    simplifyPaths(paths) {
        return paths.map(path => ({
            ...path,
            points: this.douglasPeucker(path.points, this.options.simplifyTolerance)
        }));
    }

    /**
     * Douglas-Peucker line simplification algorithm
     */
    douglasPeucker(points, tolerance) {
        if (points.length <= 2) return points;
        
        // Find point with maximum distance from line between first and last
        let maxDist = 0;
        let maxIndex = 0;
        
        for (let i = 1; i < points.length - 1; i++) {
            const dist = this.perpendicularDistance(
                points[i], 
                points[0], 
                points[points.length - 1]
            );
            if (dist > maxDist) {
                maxDist = dist;
                maxIndex = i;
            }
        }
        
        // If max distance is greater than tolerance, recursively simplify
        if (maxDist > tolerance) {
            const left = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
            const right = this.douglasPeucker(points.slice(maxIndex), tolerance);
            return [...left.slice(0, -1), ...right];
        }
        
        // Otherwise, return just the endpoints
        return [points[0], points[points.length - 1]];
    }

    /**
     * Calculate perpendicular distance from point to line
     */
    perpendicularDistance(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        
        if (dx === 0 && dy === 0) {
            return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
        }
        
        const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / 
                  (dx * dx + dy * dy);
        
        const closestPoint = {
            x: lineStart.x + t * dx,
            y: lineStart.y + t * dy
        };
        
        return Math.hypot(point.x - closestPoint.x, point.y - closestPoint.y);
    }

    /**
     * Merge paths with nearby endpoints
     */
    mergePaths(paths) {
        const merged = [];
        const used = new Set();
        
        for (let i = 0; i < paths.length; i++) {
            if (used.has(i)) continue;
            
            let currentPath = { ...paths[i], points: [...paths[i].points] };
            used.add(i);
            
            // Try to merge with other paths
            let foundMerge;
            do {
                foundMerge = false;
                for (let j = 0; j < paths.length; j++) {
                    if (used.has(j) || paths[j].color !== currentPath.color) continue;
                    
                    const merge = this.tryMergePaths(currentPath, paths[j]);
                    if (merge) {
                        currentPath = merge;
                        used.add(j);
                        foundMerge = true;
                        break;
                    }
                }
            } while (foundMerge);
            
            merged.push(currentPath);
        }
        
        return merged;
    }

    /**
     * Try to merge two paths if their endpoints are close
     */
    tryMergePaths(path1, path2) {
        const tolerance = this.options.mergeTolerance;
        const p1Start = path1.points[0];
        const p1End = path1.points[path1.points.length - 1];
        const p2Start = path2.points[0];
        const p2End = path2.points[path2.points.length - 1];
        
        // Check all possible connections
        if (this.distance(p1End, p2Start) < tolerance) {
            return {
                ...path1,
                points: [...path1.points, ...path2.points.slice(1)]
            };
        }
        if (this.distance(p1End, p2End) < tolerance) {
            return {
                ...path1,
                points: [...path1.points, ...path2.points.slice(0, -1).reverse()]
            };
        }
        if (this.distance(p1Start, p2End) < tolerance) {
            return {
                ...path1,
                points: [...path2.points, ...path1.points.slice(1)]
            };
        }
        if (this.distance(p1Start, p2Start) < tolerance) {
            return {
                ...path1,
                points: [...path2.points.slice(0, -1).reverse(), ...path1.points]
            };
        }
        
        return null;
    }

    /**
     * Group paths by color/tool
     */
    groupByColor(paths) {
        const groups = {};
        for (const path of paths) {
            const color = path.color || 'default';
            if (!groups[color]) groups[color] = [];
            groups[color].push(path);
        }
        return groups;
    }

    /**
     * Optimize path order using nearest neighbor + 2-opt
     */
    optimizePathOrder(paths) {
        if (paths.length <= 1) return paths;
        
        // Start with nearest neighbor
        let order = this.nearestNeighbor(paths);
        
        // Improve with 2-opt
        for (let iter = 0; iter < this.options.tspIterations; iter++) {
            const improved = this.twoOpt(paths, order);
            if (improved.length === order.length && 
                improved.every((v, i) => v === order[i])) {
                break;  // No improvement
            }
            order = improved;
        }
        
        return order.map(i => paths[i]);
    }

    /**
     * Nearest neighbor TSP heuristic
     */
    nearestNeighbor(paths) {
        const n = paths.length;
        const visited = new Array(n).fill(false);
        const order = [];
        
        // Start from path 0
        let current = 0;
        visited[current] = true;
        order.push(current);
        
        while (order.length < n) {
            let nearest = -1;
            let minDist = Infinity;
            
            const currentEnd = this.getPathEnd(paths[current]);
            
            for (let i = 0; i < n; i++) {
                if (!visited[i]) {
                    const nextStart = this.getPathStart(paths[i]);
                    const dist = this.distance(currentEnd, nextStart);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = i;
                    }
                }
            }
            
            current = nearest;
            visited[current] = true;
            order.push(current);
        }
        
        return order;
    }

    /**
     * 2-opt improvement for TSP
     */
    twoOpt(paths, order) {
        const n = order.length;
        let improved = [...order];
        let bestDist = this.calculateOrderDistance(paths, order);
        
        for (let i = 0; i < n - 1; i++) {
            for (let j = i + 2; j < n; j++) {
                // Try reversing segment between i+1 and j
                const newOrder = [
                    ...order.slice(0, i + 1),
                    ...order.slice(i + 1, j + 1).reverse(),
                    ...order.slice(j + 1)
                ];
                
                const newDist = this.calculateOrderDistance(paths, newOrder);
                if (newDist < bestDist) {
                    improved = newOrder;
                    bestDist = newDist;
                }
            }
        }
        
        return improved;
    }

    /**
     * Calculate total distance for a path order
     */
    calculateOrderDistance(paths, order) {
        let total = 0;
        for (let i = 0; i < order.length - 1; i++) {
            const end = this.getPathEnd(paths[order[i]]);
            const start = this.getPathStart(paths[order[i + 1]]);
            total += this.distance(end, start);
        }
        return total;
    }

    /**
     * Optimize order of color groups to minimize tool changes
     */
    optimizeColorOrder(colorGroups) {
        const colors = Object.keys(colorGroups);
        if (colors.length <= 1) {
            return colors.length === 1 ? colorGroups[colors[0]] : [];
        }
        
        // For now, just order by number of paths (largest groups first)
        // Could implement TSP for color order based on group centroids
        colors.sort((a, b) => colorGroups[b].length - colorGroups[a].length);
        
        const result = [];
        for (const color of colors) {
            result.push(...colorGroups[color]);
        }
        
        return result;
    }

    /**
     * Calculate optimization statistics
     */
    calculateStatistics(originalPaths, optimizedPaths) {
        const stats = {
            original: this.analyzePathSet(originalPaths),
            optimized: this.analyzePathSet(optimizedPaths),
            improvement: {}
        };
        
        // Calculate improvements
        stats.improvement.pathReduction = 
            ((stats.original.pathCount - stats.optimized.pathCount) / 
             stats.original.pathCount * 100).toFixed(1) + '%';
        
        stats.improvement.distanceReduction = 
            ((stats.original.travelDistance - stats.optimized.travelDistance) / 
             stats.original.travelDistance * 100).toFixed(1) + '%';
        
        stats.improvement.penLiftReduction = 
            ((stats.original.penLifts - stats.optimized.penLifts) / 
             stats.original.penLifts * 100).toFixed(1) + '%';
        
        return stats;
    }

    /**
     * Analyze a set of paths
     */
    analyzePathSet(paths) {
        let totalDistance = 0;
        let travelDistance = 0;
        let penLifts = 0;
        let pointCount = 0;
        const colorCounts = {};
        
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            const color = path.color || 'default';
            colorCounts[color] = (colorCounts[color] || 0) + 1;
            
            // Count points and drawing distance
            pointCount += path.points.length;
            for (let j = 1; j < path.points.length; j++) {
                totalDistance += this.distance(path.points[j-1], path.points[j]);
            }
            
            // Count travel distance between paths
            if (i > 0) {
                const prevEnd = this.getPathEnd(paths[i-1]);
                const currStart = this.getPathStart(path);
                travelDistance += this.distance(prevEnd, currStart);
                
                // Count pen lifts (including color changes)
                if (paths[i-1].color !== path.color) {
                    penLifts += 2;  // Lift for tool change
                } else {
                    penLifts += 1;  // Normal lift
                }
            }
        }
        
        return {
            pathCount: paths.length,
            pointCount,
            totalDistance: totalDistance.toFixed(2),
            travelDistance: travelDistance.toFixed(2),
            drawingDistance: totalDistance.toFixed(2),
            penLifts,
            colors: Object.keys(colorCounts).length,
            colorCounts,
            estimatedTime: ((totalDistance + travelDistance) / 1000).toFixed(1) + 's'  // Rough estimate
        };
    }

    /**
     * Utility functions
     */
    distance(p1, p2) {
        return Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }

    getPathStart(path) {
        return path.points[0];
    }

    getPathEnd(path) {
        return path.points[path.points.length - 1];
    }

    /**
     * Export optimized paths to various formats
     */
    exportPaths(paths, format = 'svg') {
        switch (format) {
            case 'svg':
                return this.exportSVG(paths);
            case 'gcode':
                return this.exportGCode(paths);
            case 'json':
                return JSON.stringify(paths, null, 2);
            default:
                throw new Error(`Unknown export format: ${format}`);
        }
    }

    /**
     * Export as SVG
     */
    exportSVG(paths, width = 1000, height = 1000) {
        const colors = this.getUniqueColors(paths);
        const colorMap = colors.length > 1 ? 
            Object.fromEntries(colors.map((c, i) => [c, `hsl(${i * 360 / colors.length}, 70%, 50%)`])) :
            { 'default': '#000' };
        
        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
        
        for (const path of paths) {
            const color = colorMap[path.color || 'default'];
            const d = this.pathToSVGPath(path.points);
            svg += `  <path d="${d}" stroke="${color}" stroke-width="1" fill="none" />\n`;
        }
        
        svg += '</svg>';
        return svg;
    }

    /**
     * Convert points to SVG path string
     */
    pathToSVGPath(points) {
        if (points.length === 0) return '';
        
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            d += ` L ${points[i].x} ${points[i].y}`;
        }
        return d;
    }

    /**
     * Export as G-code (basic implementation)
     */
    exportGCode(paths, options = {}) {
        const {
            feedRate = 1000,
            penUpZ = 5,
            penDownZ = 0,
            scale = 1
        } = options;
        
        let gcode = [];
        gcode.push('G21 ; Set units to mm');
        gcode.push('G90 ; Absolute positioning');
        gcode.push(`G0 Z${penUpZ} ; Pen up`);
        gcode.push('G0 X0 Y0 ; Home');
        
        for (const path of paths) {
            if (path.points.length === 0) continue;
            
            // Move to start
            const start = path.points[0];
            gcode.push(`G0 X${(start.x * scale).toFixed(3)} Y${(start.y * scale).toFixed(3)}`);
            gcode.push(`G0 Z${penDownZ} ; Pen down`);
            
            // Draw path
            for (let i = 1; i < path.points.length; i++) {
                const p = path.points[i];
                gcode.push(`G1 X${(p.x * scale).toFixed(3)} Y${(p.y * scale).toFixed(3)} F${feedRate}`);
            }
            
            // Pen up
            gcode.push(`G0 Z${penUpZ} ; Pen up`);
        }
        
        gcode.push('G0 X0 Y0 ; Return home');
        return gcode.join('\n');
    }

    getUniqueColors(paths) {
        const colors = new Set();
        for (const path of paths) {
            colors.add(path.color || 'default');
        }
        return Array.from(colors);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PathOptimizer;
}
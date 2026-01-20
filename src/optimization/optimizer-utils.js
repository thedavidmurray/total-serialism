/**
 * Utility functions for path optimization
 * Distance calculations, analysis, visualization, and benchmarking
 */

class OptimizerUtils {
    /**
     * Calculate Euclidean distance between two points
     */
    static distance(p1, p2) {
        return Math.hypot(p2.x - p1.x, p2.y - p1.y);
    }

    /**
     * Calculate Manhattan distance between two points
     */
    static manhattanDistance(p1, p2) {
        return Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);
    }

    /**
     * Calculate total path length
     */
    static pathLength(points) {
        let length = 0;
        for (let i = 1; i < points.length; i++) {
            length += this.distance(points[i-1], points[i]);
        }
        return length;
    }

    /**
     * Calculate bounding box of points
     */
    static boundingBox(points) {
        if (points.length === 0) return null;
        
        let minX = points[0].x, maxX = points[0].x;
        let minY = points[0].y, maxY = points[0].y;
        
        for (const p of points) {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        }
        
        return {
            minX, minY, maxX, maxY,
            width: maxX - minX,
            height: maxY - minY,
            center: {
                x: (minX + maxX) / 2,
                y: (minY + maxY) / 2
            }
        };
    }

    /**
     * Calculate centroid of points
     */
    static centroid(points) {
        if (points.length === 0) return null;
        
        let sumX = 0, sumY = 0;
        for (const p of points) {
            sumX += p.x;
            sumY += p.y;
        }
        
        return {
            x: sumX / points.length,
            y: sumY / points.length
        };
    }

    /**
     * Analyze path statistics
     */
    static analyzePaths(paths) {
        const analysis = {
            pathCount: paths.length,
            totalPoints: 0,
            totalLength: 0,
            penLifts: Math.max(0, paths.length - 1),
            travelDistance: 0,
            boundingBox: null,
            pathLengths: [],
            colors: new Set(),
            colorTransitions: 0
        };

        // Collect all points for bounding box
        const allPoints = [];
        
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            
            // Track colors
            if (path.color) {
                analysis.colors.add(path.color);
                if (i > 0 && paths[i-1].color !== path.color) {
                    analysis.colorTransitions++;
                }
            }
            
            // Analyze path
            analysis.totalPoints += path.points.length;
            const pathLength = this.pathLength(path.points);
            analysis.pathLengths.push(pathLength);
            analysis.totalLength += pathLength;
            
            allPoints.push(...path.points);
            
            // Calculate travel distance between paths
            if (i > 0 && paths[i-1].points.length > 0 && path.points.length > 0) {
                const prevEnd = paths[i-1].points[paths[i-1].points.length - 1];
                const currStart = path.points[0];
                analysis.travelDistance += this.distance(prevEnd, currStart);
            }
        }
        
        // Calculate overall bounding box
        analysis.boundingBox = this.boundingBox(allPoints);
        
        // Additional statistics
        analysis.averagePathLength = analysis.pathCount > 0 ? 
            analysis.totalLength / analysis.pathCount : 0;
        
        analysis.efficiency = analysis.totalLength > 0 ?
            analysis.totalLength / (analysis.totalLength + analysis.travelDistance) : 0;
        
        return analysis;
    }

    /**
     * Create visualization data for paths
     */
    static createVisualization(paths, options = {}) {
        const {
            width = 800,
            height = 800,
            padding = 50,
            showTravel = true,
            showStartEnd = true,
            showDirection = false
        } = options;

        // Find bounding box
        const allPoints = paths.flatMap(p => p.points);
        const bbox = this.boundingBox(allPoints);
        
        if (!bbox) return null;

        // Calculate scale to fit in canvas
        const scaleX = (width - 2 * padding) / bbox.width;
        const scaleY = (height - 2 * padding) / bbox.height;
        const scale = Math.min(scaleX, scaleY);

        // Transform function
        const transform = (point) => ({
            x: padding + (point.x - bbox.minX) * scale,
            y: padding + (point.y - bbox.minY) * scale
        });

        // Create visualization data
        const viz = {
            width,
            height,
            scale,
            boundingBox: bbox,
            paths: [],
            travels: [],
            markers: []
        };

        // Process paths
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            const transformedPoints = path.points.map(transform);
            
            viz.paths.push({
                points: transformedPoints,
                color: path.color || 'black',
                originalIndex: i
            });

            // Add travel lines
            if (showTravel && i > 0 && paths[i-1].points.length > 0 && path.points.length > 0) {
                const prevEnd = transform(paths[i-1].points[paths[i-1].points.length - 1]);
                const currStart = transformedPoints[0];
                viz.travels.push({
                    start: prevEnd,
                    end: currStart,
                    distance: this.distance(
                        paths[i-1].points[paths[i-1].points.length - 1],
                        path.points[0]
                    )
                });
            }

            // Add start/end markers
            if (showStartEnd && transformedPoints.length > 0) {
                viz.markers.push({
                    type: 'start',
                    position: transformedPoints[0],
                    pathIndex: i
                });
                viz.markers.push({
                    type: 'end',
                    position: transformedPoints[transformedPoints.length - 1],
                    pathIndex: i
                });
            }

            // Add direction arrows
            if (showDirection && transformedPoints.length >= 2) {
                const arrows = this.createDirectionArrows(transformedPoints, 50);
                viz.markers.push(...arrows.map(arrow => ({
                    type: 'arrow',
                    ...arrow,
                    pathIndex: i
                })));
            }
        }

        return viz;
    }

    /**
     * Create direction arrows for a path
     */
    static createDirectionArrows(points, spacing = 50) {
        const arrows = [];
        let accumulated = 0;

        for (let i = 1; i < points.length; i++) {
            const dist = this.distance(points[i-1], points[i]);
            accumulated += dist;

            if (accumulated >= spacing) {
                const dx = points[i].x - points[i-1].x;
                const dy = points[i].y - points[i-1].y;
                const angle = Math.atan2(dy, dx);
                
                arrows.push({
                    position: points[i],
                    angle: angle * 180 / Math.PI
                });
                
                accumulated = 0;
            }
        }

        return arrows;
    }

    /**
     * Benchmark optimization performance
     */
    static benchmark(optimizer, testCases) {
        const results = [];

        for (const testCase of testCases) {
            const startTime = performance.now();
            const optimized = optimizer.optimize(testCase.paths);
            const endTime = performance.now();

            const beforeStats = this.analyzePaths(testCase.paths);
            const afterStats = this.analyzePaths(optimized.paths);

            results.push({
                name: testCase.name,
                inputPaths: testCase.paths.length,
                outputPaths: optimized.paths.length,
                timeTaken: endTime - startTime,
                improvement: {
                    pathReduction: beforeStats.pathCount - afterStats.pathCount,
                    distanceReduction: beforeStats.travelDistance - afterStats.travelDistance,
                    efficiencyGain: afterStats.efficiency - beforeStats.efficiency
                },
                beforeStats,
                afterStats
            });
        }

        return results;
    }

    /**
     * Generate test paths for benchmarking
     */
    static generateTestPaths(type = 'random', count = 100, options = {}) {
        const paths = [];

        switch (type) {
            case 'random':
                return this.generateRandomPaths(count, options);
            
            case 'grid':
                return this.generateGridPaths(options);
            
            case 'circular':
                return this.generateCircularPaths(count, options);
            
            case 'clustered':
                return this.generateClusteredPaths(count, options);
            
            default:
                throw new Error(`Unknown test path type: ${type}`);
        }
    }

    /**
     * Generate random paths
     */
    static generateRandomPaths(count, options = {}) {
        const {
            width = 1000,
            height = 1000,
            minLength = 5,
            maxLength = 20,
            colors = ['black']
        } = options;

        const paths = [];

        for (let i = 0; i < count; i++) {
            const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
            const points = [];
            
            let x = Math.random() * width;
            let y = Math.random() * height;

            for (let j = 0; j < length; j++) {
                points.push({ x, y });
                x += (Math.random() - 0.5) * 50;
                y += (Math.random() - 0.5) * 50;
                x = Math.max(0, Math.min(width, x));
                y = Math.max(0, Math.min(height, y));
            }

            paths.push({
                points,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }

        return paths;
    }

    /**
     * Generate grid-based paths
     */
    static generateGridPaths(options = {}) {
        const {
            rows = 10,
            cols = 10,
            cellSize = 50,
            padding = 100
        } = options;

        const paths = [];

        // Horizontal lines
        for (let r = 0; r < rows; r++) {
            const y = padding + r * cellSize;
            paths.push({
                points: [
                    { x: padding, y },
                    { x: padding + (cols - 1) * cellSize, y }
                ],
                color: 'black'
            });
        }

        // Vertical lines
        for (let c = 0; c < cols; c++) {
            const x = padding + c * cellSize;
            paths.push({
                points: [
                    { x, y: padding },
                    { x, y: padding + (rows - 1) * cellSize }
                ],
                color: 'black'
            });
        }

        return paths;
    }

    /**
     * Generate circular/radial paths
     */
    static generateCircularPaths(count, options = {}) {
        const {
            centerX = 500,
            centerY = 500,
            minRadius = 100,
            maxRadius = 400,
            pointsPerPath = 50
        } = options;

        const paths = [];

        for (let i = 0; i < count; i++) {
            const radius = minRadius + (maxRadius - minRadius) * (i / (count - 1));
            const points = [];

            for (let j = 0; j < pointsPerPath; j++) {
                const angle = (j / pointsPerPath) * Math.PI * 2;
                points.push({
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius
                });
            }

            paths.push({
                points,
                color: 'black'
            });
        }

        return paths;
    }

    /**
     * Generate clustered paths
     */
    static generateClusteredPaths(count, options = {}) {
        const {
            clusters = 5,
            width = 1000,
            height = 1000,
            clusterRadius = 100
        } = options;

        const paths = [];
        const centers = [];

        // Generate cluster centers
        for (let i = 0; i < clusters; i++) {
            centers.push({
                x: Math.random() * (width - 2 * clusterRadius) + clusterRadius,
                y: Math.random() * (height - 2 * clusterRadius) + clusterRadius
            });
        }

        // Generate paths in clusters
        for (let i = 0; i < count; i++) {
            const center = centers[i % clusters];
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * clusterRadius;
            
            const startX = center.x + Math.cos(angle) * r;
            const startY = center.y + Math.sin(angle) * r;
            
            const points = [];
            let x = startX, y = startY;

            for (let j = 0; j < 10; j++) {
                points.push({ x, y });
                x += (Math.random() - 0.5) * 20;
                y += (Math.random() - 0.5) * 20;
            }

            paths.push({
                points,
                color: `cluster${i % clusters}`
            });
        }

        return paths;
    }

    /**
     * Export visualization as SVG string
     */
    static visualizationToSVG(viz) {
        let svg = `<svg width="${viz.width}" height="${viz.height}" xmlns="http://www.w3.org/2000/svg">\n`;
        
        // Background
        svg += `  <rect width="${viz.width}" height="${viz.height}" fill="white"/>\n`;
        
        // Travel lines
        if (viz.travels.length > 0) {
            svg += '  <g id="travels" opacity="0.3">\n';
            for (const travel of viz.travels) {
                svg += `    <line x1="${travel.start.x}" y1="${travel.start.y}" `;
                svg += `x2="${travel.end.x}" y2="${travel.end.y}" `;
                svg += `stroke="red" stroke-width="1" stroke-dasharray="5,5"/>\n`;
            }
            svg += '  </g>\n';
        }
        
        // Paths
        svg += '  <g id="paths">\n';
        for (const path of viz.paths) {
            const d = path.points.map((p, i) => 
                `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
            ).join(' ');
            
            svg += `    <path d="${d}" stroke="${path.color}" stroke-width="2" fill="none"/>\n`;
        }
        svg += '  </g>\n';
        
        // Markers
        if (viz.markers.length > 0) {
            svg += '  <g id="markers">\n';
            for (const marker of viz.markers) {
                if (marker.type === 'start') {
                    svg += `    <circle cx="${marker.position.x}" cy="${marker.position.y}" `;
                    svg += `r="4" fill="green"/>\n`;
                } else if (marker.type === 'end') {
                    svg += `    <rect x="${marker.position.x - 3}" y="${marker.position.y - 3}" `;
                    svg += `width="6" height="6" fill="red"/>\n`;
                }
            }
            svg += '  </g>\n';
        }
        
        svg += '</svg>';
        return svg;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptimizerUtils;
}
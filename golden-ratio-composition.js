// Golden Ratio Composition System for Total Serialism V3
// Implements sophisticated composition rules for aesthetic placement

class GoldenRatioComposition {
    constructor(width, height, randomFn = Math.random) {
        this.width = width;
        this.height = height;
        this.random = typeof randomFn === 'function' ? randomFn : Math.random;
        
        // Golden ratio constant
        this.phi = (1 + Math.sqrt(5)) / 2; // 1.618...
        this.phiInverse = 1 / this.phi; // 0.618...
        
        // Precalculate key composition points
        this.calculateCompositionGuides();
        
        // Composition analysis
        this.densityMap = null;
        this.focusPoints = [];
        this.visualWeight = 0;
    }
    
    calculateCompositionGuides() {
        // Golden ratio divisions
        this.guides = {
            // Vertical golden sections
            goldenLeft: this.width * this.phiInverse,
            goldenRight: this.width * (1 - this.phiInverse),
            
            // Horizontal golden sections  
            goldenTop: this.height * this.phiInverse,
            goldenBottom: this.height * (1 - this.phiInverse),
            
            // Rule of thirds
            thirdLeft: this.width / 3,
            thirdRight: this.width * 2 / 3,
            thirdTop: this.height / 3,
            thirdBottom: this.height * 2 / 3,
            
            // Center points
            centerX: this.width / 2,
            centerY: this.height / 2,
            
            // Golden spiral centers (4 orientations)
            spiralCenters: [
                { x: this.width * this.phiInverse, y: this.height * this.phiInverse },
                { x: this.width * (1 - this.phiInverse), y: this.height * this.phiInverse },
                { x: this.width * this.phiInverse, y: this.height * (1 - this.phiInverse) },
                { x: this.width * (1 - this.phiInverse), y: this.height * (1 - this.phiInverse) }
            ],
            
            // Dynamic symmetry diagonals
            diagonals: this.calculateDynamicSymmetry(),
            
            // Rabatment squares
            rabatment: this.calculateRabatment()
        };
    }
    
    calculateDynamicSymmetry() {
        // Calculate diagonal guides based on dynamic symmetry
        const diagonals = [];
        
        // Main diagonals
        diagonals.push({
            start: { x: 0, y: 0 },
            end: { x: this.width, y: this.height }
        });
        diagonals.push({
            start: { x: this.width, y: 0 },
            end: { x: 0, y: this.height }
        });
        
        // Reciprocal diagonals
        const reciprocalRatio = this.height / this.width;
        diagonals.push({
            start: { x: 0, y: 0 },
            end: { x: this.width, y: this.width * reciprocalRatio }
        });
        diagonals.push({
            start: { x: 0, y: this.height },
            end: { x: this.height / reciprocalRatio, y: 0 }
        });
        
        return diagonals;
    }
    
    calculateRabatment() {
        // Rabatment of the rectangle (squares within the rectangle)
        const smallerDim = Math.min(this.width, this.height);
        
        return {
            left: { x: smallerDim, y: 0, width: smallerDim, height: this.height },
            right: { x: this.width - smallerDim, y: 0, width: smallerDim, height: this.height },
            top: { x: 0, y: smallerDim, width: this.width, height: smallerDim },
            bottom: { x: 0, y: this.height - smallerDim, width: this.width, height: smallerDim }
        };
    }
    
    // Get the best position according to golden ratio principles
    getBestPosition(preferredX, preferredY, radius, options = {}) {
        const candidates = [];
        
        // Add golden ratio intersection points
        candidates.push(
            { x: this.guides.goldenLeft, y: this.guides.goldenTop, weight: 1.0 },
            { x: this.guides.goldenRight, y: this.guides.goldenTop, weight: 1.0 },
            { x: this.guides.goldenLeft, y: this.guides.goldenBottom, weight: 1.0 },
            { x: this.guides.goldenRight, y: this.guides.goldenBottom, weight: 1.0 }
        );
        
        // Add rule of thirds points
        candidates.push(
            { x: this.guides.thirdLeft, y: this.guides.thirdTop, weight: 0.8 },
            { x: this.guides.thirdRight, y: this.guides.thirdTop, weight: 0.8 },
            { x: this.guides.thirdLeft, y: this.guides.thirdBottom, weight: 0.8 },
            { x: this.guides.thirdRight, y: this.guides.thirdBottom, weight: 0.8 }
        );
        
        // Add spiral centers
        this.guides.spiralCenters.forEach(center => {
            candidates.push({ ...center, weight: 0.9 });
        });
        
        // Find closest candidate to preferred position
        let best = { x: preferredX, y: preferredY };
        let minDistance = Infinity;
        
        candidates.forEach(candidate => {
            const dist = Math.sqrt(
                Math.pow(candidate.x - preferredX, 2) + 
                Math.pow(candidate.y - preferredY, 2)
            );
            
            // Weight by compositional importance and distance
            const weightedDist = dist / candidate.weight;
            
            if (weightedDist < minDistance && this.isValidPosition(candidate.x, candidate.y, radius)) {
                minDistance = weightedDist;
                best = candidate;
            }
        });
        
        // Apply slight randomization if requested
        if (options.randomize) {
            const variance = radius * 0.5;
            best.x += (this.random() - 0.5) * variance;
            best.y += (this.random() - 0.5) * variance;
        }
        
        return best;
    }
    
    // Create a golden spiral path
    createGoldenSpiral(centerX, centerY, startRadius, rotations = 2, points = 100) {
        const path = [];
        const angleStep = (Math.PI * 2 * rotations) / points;
        
        for (let i = 0; i < points; i++) {
            const angle = i * angleStep;
            const radius = startRadius * Math.pow(this.phi, angle / (Math.PI * 2));
            
            path.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                angle: angle,
                radius: radius
            });
        }
        
        return path;
    }
    
    // Create a Fibonacci grid
    createFibonacciGrid(count) {
        const points = [];
        const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 137.5 degrees
        
        for (let i = 0; i < count; i++) {
            const radius = Math.sqrt(i / count) * Math.min(this.width, this.height) * 0.45;
            const angle = i * goldenAngle;
            
            points.push({
                x: this.width / 2 + Math.cos(angle) * radius,
                y: this.height / 2 + Math.sin(angle) * radius,
                index: i,
                radius: radius
            });
        }
        
        return points;
    }
    
    // Analyze visual balance
    analyzeBalance(elements) {
        // Calculate center of visual mass
        let totalWeight = 0;
        let centerX = 0;
        let centerY = 0;
        
        elements.forEach(el => {
            const weight = el.size || el.radius || 1;
            totalWeight += weight;
            centerX += el.x * weight;
            centerY += el.y * weight;
        });
        
        if (totalWeight > 0) {
            centerX /= totalWeight;
            centerY /= totalWeight;
        }
        
        // Calculate balance score (0-1, where 1 is perfectly balanced)
        const idealCenterX = this.width / 2;
        const idealCenterY = this.height / 2;
        
        const offsetX = Math.abs(centerX - idealCenterX) / (this.width / 2);
        const offsetY = Math.abs(centerY - idealCenterY) / (this.height / 2);
        
        const balanceScore = 1 - Math.sqrt(offsetX * offsetX + offsetY * offsetY) / Math.sqrt(2);
        
        return {
            centerOfMass: { x: centerX, y: centerY },
            balanceScore: balanceScore,
            offsetFromCenter: { x: centerX - idealCenterX, y: centerY - idealCenterY }
        };
    }
    
    // Check if position is valid (within bounds)
    isValidPosition(x, y, radius) {
        return x - radius >= 0 && 
               x + radius <= this.width && 
               y - radius >= 0 && 
               y + radius <= this.height;
    }
    
    // Apply golden ratio subdivision to a rectangle
    subdivideRectangle(x, y, width, height, depth = 3) {
        const rectangles = [];
        
        const subdivide = (rx, ry, rw, rh, level) => {
            if (level <= 0) {
                rectangles.push({ x: rx, y: ry, width: rw, height: rh, level: depth - level });
                return;
            }
            
            if (rw > rh) {
                // Subdivide horizontally
                const cut = rw * this.phiInverse;
                subdivide(rx, ry, cut, rh, level - 1);
                subdivide(rx + cut, ry, rw - cut, rh, level - 1);
            } else {
                // Subdivide vertically
                const cut = rh * this.phiInverse;
                subdivide(rx, ry, rw, cut, level - 1);
                subdivide(rx, ry + cut, rw, rh - cut, level - 1);
            }
        };
        
        subdivide(x, y, width, height, depth);
        return rectangles;
    }
    
    // Get compositional suggestions based on existing elements
    getSuggestions(existingElements, targetCount) {
        const balance = this.analyzeBalance(existingElements);
        const suggestions = [];
        
        // If unbalanced, suggest elements on the opposite side
        if (balance.balanceScore < 0.7) {
            const counterX = this.width - balance.centerOfMass.x;
            const counterY = this.height - balance.centerOfMass.y;
            
            suggestions.push({
                x: this.getBestPosition(counterX, counterY, 20).x,
                y: this.getBestPosition(counterX, counterY, 20).y,
                priority: 'high',
                reason: 'balance'
            });
        }
        
        // Suggest positions along golden ratio guides
        const guides = [
            { x: this.guides.goldenLeft, y: this.guides.goldenTop },
            { x: this.guides.goldenRight, y: this.guides.goldenBottom },
            { x: this.guides.goldenLeft, y: this.guides.goldenBottom },
            { x: this.guides.goldenRight, y: this.guides.goldenTop }
        ];
        
        guides.forEach(guide => {
            if (!this.hasElementNear(existingElements, guide.x, guide.y, 50)) {
                suggestions.push({
                    x: guide.x,
                    y: guide.y,
                    priority: 'medium',
                    reason: 'golden_ratio'
                });
            }
        });
        
        return suggestions.slice(0, targetCount);
    }
    
    // Check if there's an element near a position
    hasElementNear(elements, x, y, threshold) {
        return elements.some(el => {
            const dist = Math.sqrt(Math.pow(el.x - x, 2) + Math.pow(el.y - y, 2));
            return dist < threshold;
        });
    }
    
    // Debug visualization
    drawGuides(p5Instance) {
        p5Instance.push();
        p5Instance.strokeWeight(1);
        
        // Golden ratio lines
        p5Instance.stroke(255, 215, 0, 100); // Gold color
        p5Instance.line(this.guides.goldenLeft, 0, this.guides.goldenLeft, this.height);
        p5Instance.line(this.guides.goldenRight, 0, this.guides.goldenRight, this.height);
        p5Instance.line(0, this.guides.goldenTop, this.width, this.guides.goldenTop);
        p5Instance.line(0, this.guides.goldenBottom, this.width, this.guides.goldenBottom);
        
        // Rule of thirds
        p5Instance.stroke(255, 255, 255, 50);
        p5Instance.line(this.guides.thirdLeft, 0, this.guides.thirdLeft, this.height);
        p5Instance.line(this.guides.thirdRight, 0, this.guides.thirdRight, this.height);
        p5Instance.line(0, this.guides.thirdTop, this.width, this.guides.thirdTop);
        p5Instance.line(0, this.guides.thirdBottom, this.width, this.guides.thirdBottom);
        
        // Spiral centers
        p5Instance.noStroke();
        p5Instance.fill(255, 215, 0, 150);
        this.guides.spiralCenters.forEach(center => {
            p5Instance.ellipse(center.x, center.y, 10, 10);
        });
        
        p5Instance.pop();
    }
}

// Export for use in main engine
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoldenRatioComposition;
} else {
    // Browser environment
    window.GoldenRatioComposition = GoldenRatioComposition;
}

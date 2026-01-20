// Collision Detection System for Total Serialism V3
// Implements spatial hashing for O(n) performance with thousands of elements

class CollisionDetectionSystem {
    constructor(width, height, cellSize = 50, randomFn = Math.random) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.grid = {};
        this.occupiedCells = new Set();
        this.random = typeof randomFn === 'function' ? randomFn : Math.random;
        
        // Statistics
        this.stats = {
            totalElements: 0,
            collisionsAvoided: 0,
            spatialEfficiency: 0
        };
    }
    
    // Clear the spatial hash grid
    clear() {
        this.grid = {};
        this.occupiedCells.clear();
        this.stats.totalElements = 0;
    }
    
    // Get hash key for a position
    getKey(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return `${col},${row}`;
    }
    
    // Get all cells that an object occupies (for larger objects)
    getCellsForBounds(x, y, radius) {
        const cells = [];
        const minX = Math.floor((x - radius) / this.cellSize);
        const maxX = Math.floor((x + radius) / this.cellSize);
        const minY = Math.floor((y - radius) / this.cellSize);
        const maxY = Math.floor((y + radius) / this.cellSize);
        
        for (let row = minY; row <= maxY; row++) {
            for (let col = minX; col <= maxX; col++) {
                cells.push(`${col},${row}`);
            }
        }
        return cells;
    }
    
    // Add an element to the spatial hash
    add(element) {
        const cells = this.getCellsForBounds(element.x, element.y, element.radius || element.size || 5);
        this._addToCells(element, cells);
        this.stats.totalElements++;
    }

    _addToCells(element, cells) {
        element.__collisionCells = cells;
        cells.forEach(key => {
            if (!this.grid[key]) {
                this.grid[key] = [];
            }
            this.grid[key].push(element);
            this.occupiedCells.add(key);
        });
    }

    _removeFromCells(element, cells) {
        cells.forEach(key => {
            const bucket = this.grid[key];
            if (!bucket) return;
            const index = bucket.indexOf(element);
            if (index !== -1) {
                bucket.splice(index, 1);
                if (bucket.length === 0) {
                    delete this.grid[key];
                    this.occupiedCells.delete(key);
                }
            }
        });
    }

    update(element) {
        if (!element) return;
        const radius = element.radius || element.size || 5;
        const newCells = this.getCellsForBounds(element.x, element.y, radius);
        const prevCells = element.__collisionCells || [];

        let cellsChanged = newCells.length !== prevCells.length;
        if (!cellsChanged) {
            for (let i = 0; i < newCells.length; i++) {
                if (newCells[i] !== prevCells[i]) {
                    cellsChanged = true;
                    break;
                }
            }
        }

        if (!cellsChanged) {
            return;
        }

        this._removeFromCells(element, prevCells);
        this._addToCells(element, newCells);
    }
    
    // Check if a position would collide with existing elements
    checkCollision(x, y, radius, excludeElement = null) {
        const cells = this.getCellsForBounds(x, y, radius);
        
        for (let key of cells) {
            if (this.grid[key]) {
                for (let element of this.grid[key]) {
                    if (element === excludeElement) continue;
                    
                    const dx = x - element.x;
                    const dy = y - element.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const minDistance = radius + (element.radius || element.size || 5);
                    
                    if (distance < minDistance) {
                        this.stats.collisionsAvoided++;
                        return {
                            collides: true,
                            element: element,
                            distance: distance,
                            overlap: minDistance - distance,
                            system: this
                        };
                    }
                }
            }
        }
        
        return { collides: false };
    }
    
    // Find a valid position near the target position
    findValidPosition(targetX, targetY, radius, maxAttempts = 50) {
        // First check if target position is valid
        if (!this.checkCollision(targetX, targetY, radius).collides) {
            return { x: targetX, y: targetY, found: true };
        }
        
        // Try positions in expanding circles
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const angle = this.random() * Math.PI * 2;
            const distance = radius * 2 + attempt * radius * 0.5;
            
            const x = targetX + Math.cos(angle) * distance;
            const y = targetY + Math.sin(angle) * distance;
            
            // Keep within bounds
            if (x - radius < 0 || x + radius > this.width || 
                y - radius < 0 || y + radius > this.height) {
                continue;
            }
            
            if (!this.checkCollision(x, y, radius).collides) {
                return { x, y, found: true };
            }
        }
        
        return { x: targetX, y: targetY, found: false };
    }
    
    // Get nearby elements for interaction calculations
    getNearbyElements(x, y, searchRadius) {
        const cells = this.getCellsForBounds(x, y, searchRadius);
        const nearby = [];
        const seen = new Set();
        
        cells.forEach(key => {
            if (this.grid[key]) {
                this.grid[key].forEach(element => {
                    if (!seen.has(element)) {
                        const dx = x - element.x;
                        const dy = y - element.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance <= searchRadius) {
                            nearby.push({
                                element: element,
                                distance: distance
                            });
                            seen.add(element);
                        }
                    }
                });
            }
        });
        
        return nearby.sort((a, b) => a.distance - b.distance);
    }
    
    // Advanced: Apply separation forces to prevent clustering
    applySeparationForce(element, separationStrength = 0.5, idealDistance = null) {
        const radius = element.radius || element.size || 5;
        const searchRadius = (idealDistance || radius * 3);
        const nearby = this.getNearbyElements(element.x, element.y, searchRadius);
        
        let forceX = 0;
        let forceY = 0;
        
        nearby.forEach(({ element: other, distance }) => {
            if (other === element || distance === 0) return;
            
            const otherRadius = other.radius || other.size || 5;
            const idealDist = idealDistance || (radius + otherRadius) * 1.5;
            
            if (distance < idealDist) {
                // Calculate repulsion force
                const force = (idealDist - distance) / idealDist * separationStrength;
                const dx = (element.x - other.x) / distance;
                const dy = (element.y - other.y) / distance;
                
                forceX += dx * force;
                forceY += dy * force;
            }
        });
        
        return { x: forceX, y: forceY };
    }
    
    // Calculate spatial efficiency (how well distributed elements are)
    calculateSpatialEfficiency() {
        const occupiedRatio = this.occupiedCells.size / (this.cols * this.rows);
        const avgElementsPerCell = this.stats.totalElements / Math.max(1, this.occupiedCells.size);
        
        // Ideal is elements spread evenly across available space
        this.stats.spatialEfficiency = Math.min(1, occupiedRatio * (1 / Math.max(1, avgElementsPerCell - 1)));
        
        return this.stats.spatialEfficiency;
    }
    
    // Debug visualization helper
    drawDebugGrid(p5Instance) {
        p5Instance.push();
        p5Instance.stroke(255, 50);
        p5Instance.strokeWeight(0.5);
        p5Instance.noFill();
        
        // Draw grid
        for (let i = 0; i <= this.cols; i++) {
            p5Instance.line(i * this.cellSize, 0, i * this.cellSize, this.height);
        }
        for (let j = 0; j <= this.rows; j++) {
            p5Instance.line(0, j * this.cellSize, this.width, j * this.cellSize);
        }
        
        // Highlight occupied cells
        p5Instance.fill(255, 165, 0, 20);
        this.occupiedCells.forEach(key => {
            const [col, row] = key.split(',').map(Number);
            p5Instance.rect(col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
        });
        
        p5Instance.pop();
    }
}

// Collision strategies for different algorithm types
class CollisionStrategies {
    // Flow field particles - soft avoidance
    static flowFieldStrategy(collision, particle) {
        if (collision.collides) {
            // Gently steer away
            const avoidanceAngle = Math.atan2(
                particle.y - collision.element.y,
                particle.x - collision.element.x
            );
            
            return {
                angleAdjustment: avoidanceAngle * 0.3,
                speedMultiplier: 0.8
            };
        }
        return null;
    }
    
    // Ring systems - maintain perfect spacing
    static ringSystemStrategy(collision, ring) {
        if (collision.collides) {
            // Find new position maintaining ring structure
            const angleStep = 0.1;
            for (let a = angleStep; a < Math.PI * 2; a += angleStep) {
                const newX = ring.centerX + Math.cos(ring.angle + a) * ring.radius;
                const newY = ring.centerY + Math.sin(ring.angle + a) * ring.radius;
                
                if (!collision.system.checkCollision(newX, newY, ring.size).collides) {
                    return { angleOffset: a };
                }
            }
        }
        return null;
    }
    
    // Tessellation - strict grid alignment
    static tessellationStrategy(collision, tile) {
        if (collision.collides) {
            // Skip this tile position entirely
            return { skip: true };
        }
        return null;
    }
    
    // Wave interference - blend and merge
    static waveStrategy(collision, wave) {
        if (collision.collides && collision.overlap < wave.radius * 0.5) {
            // Allow partial overlap for interference patterns
            return {
                amplitudeMultiplier: 1 - (collision.overlap / wave.radius),
                phaseShift: collision.distance * 0.1
            };
        }
        return null;
    }
}

// Export for use in main engine
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CollisionDetectionSystem, CollisionStrategies };
} else {
    // Browser environment
    window.CollisionDetectionSystem = CollisionDetectionSystem;
    window.CollisionStrategies = CollisionStrategies;
}

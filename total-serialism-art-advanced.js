// Advanced Total Serialism Generative Art
// Uses actual total-serialism npm package
// Run with: node total-serialism-art-advanced.js

const Ts = require('total-serialism');
const Gen = Ts.Generative;
const Algo = Ts.Algorithmic;
const Rand = Ts.Stochastic;
const Mod = Ts.Transform;
const Stat = Ts.Statistic;
const TL = Ts.Translate;

// Constants
const TWO_PI = Math.PI * 2;

// Generate art parameters using Total Serialism
class TotalSerialismArt {
    constructor() {
        // A3 at 150 DPI
        this.width = 1754;
        this.height = 2480;
        
        // Generate base parameters
        this.seed = Math.random();
        this.generatePalette();
        this.generateStructure();
        this.generateFlowParameters();
    }
    
    generatePalette() {
        // Use chord progressions to generate color harmonies
        const chordProgression = TL.chordsFromNumerals(['I', 'vi', 'IV', 'V'], 'C');
        
        // Map musical intervals to color relationships
        this.palette = chordProgression.map(chord => {
            // Use intervals as hue offsets
            const baseHue = this.seed * 360;
            const hues = chord.map(note => (baseHue + note * 30) % 360);
            
            return hues.map(hue => ({
                h: hue,
                s: 40 + Math.floor(Math.random() * 4) * 10,
                b: 30 + Math.floor(Math.random() * 5) * 10, 
                weight: Rand.random(1)[0]
            }));
        }).flat();
        
        // Sort by weight for Markov chain color selection
        this.palette.sort((a, b) => b.weight - a.weight);
    }
    
    generateStructure() {
        // Use Euclidean rhythms for spatial distribution
        this.rhythms = {
            primary: Algo.euclid(21, 8),    // Main elements
            secondary: Algo.euclid(13, 5),   // Supporting elements
            accent: Algo.euclid(34, 13),     // Accent points
            micro: Algo.euclid(55, 21)       // Fine details
        };
        
        // Fibonacci-based sizing
        this.sizes = Algo.fibonacci(12).slice(5).map(n => n * 2);
        
        // Generate flow zones using available algorithms
        // Note: cellular might not be available in this version
        // Use hex beat patterns instead
        this.zones = Algo.hexBeat('1000101110010001101011001110100011010110100010110');
        
        // Create density map using Perlin-like noise simulation
        this.densityMap = this.generateDensityMap();
    }
    
    generateDensityMap() {
        // Use multiple cosine waves at different frequencies
        const cols = Math.floor(this.width / 20);
        const rows = Math.floor(this.height / 20);
        
        // Generate wave components
        const waves = [
            Gen.cosine(cols * rows, 3),
            Gen.cosine(cols * rows, 5),
            Gen.cosine(cols * rows, 7),
            Gen.cosine(cols * rows, 11)
        ];
        
        // Combine waves with different weights
        const weights = [0.4, 0.3, 0.2, 0.1];
        const combined = waves[0].map((_, i) => 
            waves.reduce((sum, wave, w) => sum + wave[i] * weights[w], 0)
        );
        
        // Normalize
        const min = Math.min(...combined);
        const max = Math.max(...combined);
        return combined.map(v => (v - min) / (max - min));
    }
    
    generateFlowParameters() {
        // Use drunk walk for organic flow variations
        this.flowVariation = Rand.drunk(100, 0.1);
        
        // Markov chain for flow direction changes
        const directions = [0, 45, 90, 135, 180, 225, 270, 315];
        this.flowDirections = [];
        
        let current = Rand.pick(directions);
        for (let i = 0; i < 50; i++) {
            this.flowDirections.push(current);
            // Next direction based on current
            const nearby = directions.filter(d => 
                Math.abs(d - current) <= 90 || Math.abs(d - current) >= 270
            );
            current = Rand.pick(nearby);
        }
        
        // Generate particle parameters
        this.generateParticleSystem();
    }
    
    generateParticleSystem() {
        // Use spread for even distribution
        const particleCount = this.sizes[6] * 3; // ~144 particles
        
        // Generate spawn points using various patterns
        const patterns = {
            grid: this.generateGridPoints(Math.sqrt(particleCount)),
            spiral: this.generateSpiralPoints(particleCount),
            random: this.generateRandomPoints(particleCount),
            clustered: this.generateClusteredPoints(particleCount)
        };
        
        // Choose pattern based on rhythm
        const patternChoice = Algo.hexBeat('x0x0x0xx');
        this.spawnPattern = patternChoice[Math.floor(this.seed * 8)] ? 'spiral' : 'clustered';
        
        this.particles = patterns[this.spawnPattern].map((point, i) => ({
            x: point.x,
            y: point.y,
            color: this.palette[Math.floor(Math.random() * Math.min(5, this.palette.length))],
            size: this.sizes[Math.floor(Math.random() * Math.min(5, this.sizes.length))],
            life: 100 + Math.random() * 400,
            speed: 0.5 + Math.random() * 2.5,
            behavior: ['flow', 'orbit', 'wander', 'attract'][Math.floor(Math.random() * 4)]
        }));
    }
    
    generateGridPoints(gridSize) {
        const points = [];
        const spacing = Math.min(this.width, this.height) / gridSize;
        
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                points.push({
                    x: (x + 0.5) * spacing + (this.width - gridSize * spacing) / 2,
                    y: (y + 0.5) * spacing + (this.height - gridSize * spacing) / 2
                });
            }
        }
        return points;
    }
    
    generateSpiralPoints(count) {
        const points = [];
        const golden = (1 + Math.sqrt(5)) / 2;
        
        for (let i = 0; i < count; i++) {
            const angle = i * golden * TWO_PI;
            const radius = Math.sqrt(i) * 20;
            points.push({
                x: this.width / 2 + Math.cos(angle) * radius,
                y: this.height / 2 + Math.sin(angle) * radius
            });
        }
        return points;
    }
    
    generateRandomPoints(count) {
        return Rand.random(count * 2).map((v, i) => 
            i % 2 === 0 ? {x: v * this.width} : {y: v * this.height}
        ).reduce((acc, val, i) => {
            if (i % 2 === 0) {
                acc.push({x: val.x});
            } else {
                acc[Math.floor(i/2)].y = val.y;
            }
            return acc;
        }, []);
    }
    
    generateClusteredPoints(count) {
        const points = [];
        const clusters = 3 + Math.floor(this.seed * 5);
        const centersX = Rand.random(clusters, 0.2, 0.8).map(v => v * this.width);
        const centersY = Rand.random(clusters, 0.2, 0.8).map(v => v * this.height);
        
        for (let i = 0; i < count; i++) {
            const cluster = i % clusters;
            const spread = 100 + this.seed * 200;
            points.push({
                x: centersX[cluster] + (Rand.random(1)[0] - 0.5) * spread,
                y: centersY[cluster] + (Rand.random(1)[0] - 0.5) * spread
            });
        }
        return points;
    }
    
    getArtParameters() {
        return {
            dimensions: { width: this.width, height: this.height },
            palette: this.palette,
            rhythms: this.rhythms,
            particles: this.particles,
            flowDirections: this.flowDirections,
            flowVariation: this.flowVariation,
            densityMap: this.densityMap,
            zones: this.zones,
            spawnPattern: this.spawnPattern,
            seed: this.seed
        };
    }
}

// Export for use in p5.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TotalSerialismArt;
}

// Generate and log parameters
const art = new TotalSerialismArt();
const params = art.getArtParameters();

console.log('Total Serialism Art Parameters Generated:');
console.log(`- Dimensions: ${params.dimensions.width}x${params.dimensions.height} (A3 @ 150 DPI)`);
console.log(`- Color Palette: ${params.palette.length} harmonic colors`);
console.log(`- Spawn Pattern: ${params.spawnPattern}`);
console.log(`- Particles: ${params.particles.length}`);
console.log(`- Rhythmic Patterns: ${Object.keys(params.rhythms).length} types`);
console.log(`- Seed: ${params.seed}`);
console.log('\nParameters saved to: total-serialism-art-params.json');

// Save parameters to file
const fs = require('fs');
fs.writeFileSync('total-serialism-art-params.json', JSON.stringify(params, null, 2));
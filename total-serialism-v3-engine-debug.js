// Total Serialism v3 Engine - DEBUG VERSION
// This version includes extensive logging to identify where execution fails

console.log('[V3 Debug] Script starting...');

// First, let's skip the module loading logic entirely since we're in browser
console.log('[V3 Debug] Getting dependencies from window...');
const CollisionDetectionSystem = window.CollisionDetectionSystem;
const CollisionStrategies = window.CollisionStrategies;
const GoldenRatioComposition = window.GoldenRatioComposition;

console.log('[V3 Debug] Dependencies:', {
    CollisionDetectionSystem: typeof CollisionDetectionSystem,
    CollisionStrategies: typeof CollisionStrategies,
    GoldenRatioComposition: typeof GoldenRatioComposition
});

// Total Serialism Library Implementation
console.log('[V3 Debug] Creating TS object...');
const TS = {
    Gen: {
        spread: (n) => Array.from({length: n}, (_, i) => i / (n - 1)),
        spreadFloat: (n, min = 0, max = 1) => 
            TS.Gen.spread(n).map(v => min + v * (max - min)),
        spreadExp: (n, exp = 2) => 
            TS.Gen.spread(n).map(v => Math.pow(v, exp)),
        cosine: (n, periods = 1, phase = 0) => 
            Array.from({length: n}, (_, i) => 
                (Math.cos((i / n * periods + phase) * 2 * Math.PI) + 1) / 2),
        sine: (n, periods = 1, phase = 0) => 
            Array.from({length: n}, (_, i) => 
                (Math.sin((i / n * periods + phase) * 2 * Math.PI) + 1) / 2),
        fibonacci: (n) => {
            const seq = [0, 1];
            for (let i = 2; i < n; i++) {
                seq.push(seq[i-1] + seq[i-2]);
            }
            return seq;
        }
    },
    Algo: {
        euclid: (steps, hits) => {
            const pattern = new Array(steps).fill(0);
            const spacing = steps / hits;
            for (let i = 0; i < hits; i++) {
                pattern[Math.floor(i * spacing)] = 1;
            }
            return pattern;
        },
        hexBeat: (pattern) => {
            return pattern.split('').map(c => c === 'x' ? 1 : 0);
        },
        cellular: (size, rule = 30, generations = 1) => {
            let current = Array(size).fill(0).map(() => Math.random() > 0.5 ? 1 : 0);
            const history = [current];
            
            for (let g = 0; g < generations; g++) {
                const next = [];
                for (let i = 0; i < size; i++) {
                    const left = current[(i - 1 + size) % size];
                    const center = current[i];
                    const right = current[(i + 1) % size];
                    const idx = (left << 2) | (center << 1) | right;
                    next.push((rule >> idx) & 1);
                }
                current = next;
                history.push(current);
            }
            return history;
        }
    },
    Rand: {
        seed: null,
        setSeed: (s) => TS.Rand.seed = s,
        random: (n = 1, min = 0, max = 1) => 
            Array.from({length: n}, () => Math.random() * (max - min) + min),
        drunk: (n, step = 0.1, min = 0, max = 1, start = 0.5) => {
            const walk = [start];
            for (let i = 1; i < n; i++) {
                let next = walk[i-1] + (Math.random() - 0.5) * step * 2;
                next = Math.max(min, Math.min(max, next));
                walk.push(next);
            }
            return walk;
        },
        pick: (arr, weights) => {
            if (!weights) return arr[Math.floor(Math.random() * arr.length)];
            const sum = weights.reduce((a, b) => a + b, 0);
            let r = Math.random() * sum;
            for (let i = 0; i < arr.length; i++) {
                r -= weights[i];
                if (r <= 0) return arr[i];
            }
            return arr[arr.length - 1];
        },
        shuffle: (arr) => {
            const result = [...arr];
            for (let i = result.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
            }
            return result;
        }
    }
};

console.log('[V3 Debug] TS object created successfully');

// Now let's create a minimal version of the artwork class to test
console.log('[V3 Debug] Creating TotalSerialismArtwork class...');

class TotalSerialismArtwork {
    constructor() {
        console.log('[V3 Debug] TotalSerialismArtwork constructor called');
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 800;
        this.seed = null;
        this.params = {};
        this.features = [];
        this.palette = null;
        this.algorithm = null;
        this.p5 = null;
        this.collisionSystem = null;
        this.goldenRatio = null;
        this.svgPaths = [];
    }
    
    init() {
        console.log('[V3 Debug] init() called');
        
        // Hide loading, show container
        const loading = document.getElementById('loading');
        const container = document.getElementById('container');
        
        console.log('[V3 Debug] DOM elements:', {
            loading: loading ? 'found' : 'not found',
            container: container ? 'found' : 'not found'
        });
        
        if (loading) loading.style.display = 'none';
        if (container) container.style.display = 'flex';
        
        // Initialize p5.js
        console.log('[V3 Debug] Creating p5 instance...');
        
        try {
            new p5((p) => {
                console.log('[V3 Debug] p5 callback started');
                
                p.setup = () => {
                    console.log('[V3 Debug] p5 setup called');
                    const canvas = p.createCanvas(this.width, this.height);
                    canvas.parent('canvas-container');
                    this.p5 = p;
                    
                    // Initialize systems
                    this.collisionSystem = new CollisionDetectionSystem(this.width, this.height);
                    this.goldenRatio = new GoldenRatioComposition(this.width, this.height);
                    
                    // Setup controls
                    this.setupControls();
                    
                    // Generate initial artwork
                    this.generate();
                    
                    console.log('[V3 Debug] p5 setup complete');
                };
                
                p.draw = () => {
                    // Empty - we handle drawing in generate()
                };
            });
        } catch (error) {
            console.error('[V3 Debug] Error creating p5 instance:', error);
            console.error('[V3 Debug] Stack:', error.stack);
        }
    }
    
    setupControls() {
        console.log('[V3 Debug] setupControls called');
        // Minimal implementation for now
    }
    
    generate() {
        console.log('[V3 Debug] generate called');
        if (!this.p5) {
            console.error('[V3 Debug] p5 not initialized yet');
            return;
        }
        
        // Just draw something simple to test
        this.p5.background(20);
        this.p5.fill(255, 165, 0);
        this.p5.textAlign(this.p5.CENTER, this.p5.CENTER);
        this.p5.textSize(32);
        this.p5.text('V3 Debug Working!', this.width/2, this.height/2);
    }
}

console.log('[V3 Debug] Class defined, exporting to window...');

// Export the class
window.TotalSerialismArtwork = TotalSerialismArtwork;

console.log('[V3 Debug] Creating artwork instance...');

// Initialize artwork system
let artwork;

// Simple initialization without complex timing checks
function initializeArtwork() {
    console.log('[V3 Debug] initializeArtwork called');
    
    try {
        artwork = new TotalSerialismArtwork();
        window.artwork = artwork;
        console.log('[V3 Debug] Artwork instance created');
        
        // Initialize after a short delay
        setTimeout(() => {
            console.log('[V3 Debug] Calling artwork.init()...');
            artwork.init();
        }, 100);
    } catch (error) {
        console.error('[V3 Debug] Error in initializeArtwork:', error);
        console.error('[V3 Debug] Stack:', error.stack);
    }
}

// Wait for window load event
console.log('[V3 Debug] Setting up window load listener...');
window.addEventListener('load', () => {
    console.log('[V3 Debug] Window loaded, initializing artwork...');
    initializeArtwork();
});

console.log('[V3 Debug] Script completed successfully');
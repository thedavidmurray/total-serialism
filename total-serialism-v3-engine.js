// Total Serialism v3 Engine - Maximum Variety & Beauty
// Inspired by Fidenza, QQL, and FxHash best practices

// Import dependencies from window (browser environment)
const CollisionDetectionSystem = window.CollisionDetectionSystem;
const CollisionStrategies = window.CollisionStrategies;
const GoldenRatioComposition = window.GoldenRatioComposition;

// Total Serialism Library Implementation
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
            steps = Math.max(1, Math.floor(steps));
            hits = Math.max(0, Math.min(steps, Math.floor(hits)));
            if (hits === 0) return Array(steps).fill(0);
            if (hits === steps) return Array(steps).fill(1);

            const pattern = [];
            const counts = [];
            const remainders = [hits];
            let divisor = steps - hits;
            let level = 0;

            while (true) {
                counts[level] = Math.floor(divisor / remainders[level]);
                remainders[level + 1] = divisor % remainders[level];
                divisor = remainders[level];
                level++;
                if (remainders[level] <= 1) {
                    break;
                }
            }

            counts[level] = divisor;

            const build = (levelIndex) => {
                if (levelIndex === -1) return [0];
                if (levelIndex === -2) return [1];

                const sequenceA = build(levelIndex - 1);
                const sequenceB = build(levelIndex - 2);
                let result = [];

                for (let i = 0; i < counts[levelIndex]; i++) {
                    result = result.concat(sequenceA);
                }
                if (remainders[levelIndex] > 0) {
                    result = result.concat(sequenceB);
                }
                return result;
            };

            const bjorklund = build(level);
            for (let i = 0; i < steps; i++) {
                pattern.push(bjorklund[i % bjorklund.length]);
            }
            return pattern;
        },
        hexBeat: (pattern) => {
            return pattern.split('').map(c => c === 'x' ? 1 : 0);
        },
        cellular: (size, rule = 30, generations = 1) => {
            let current = Array(size).fill(0).map(() => TS.Rand.float() > 0.5 ? 1 : 0);
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
        seed: 1,
        _state: 0x6D2B79F5,
        _normalizeSeed(value) {
            if (typeof value === 'number' && Number.isFinite(value)) {
                const normalized = value >>> 0;
                return normalized === 0 ? 0x6D2B79F5 : normalized;
            }
            const str = String(value ?? '');
            let hash = 2166136261;
            for (let i = 0; i < str.length; i++) {
                hash ^= str.charCodeAt(i);
                hash = Math.imul(hash, 16777619);
            }
            const normalized = hash >>> 0;
            return normalized === 0 ? 0x6D2B79F5 : normalized;
        },
        setSeed(value) {
            const normalized = TS.Rand._normalizeSeed(value);
            TS.Rand.seed = normalized;
            TS.Rand._state = normalized;
        },
        _randomFloat() {
            let t = TS.Rand._state += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        },
        float(min = 0, max = 1) {
            return min + TS.Rand._randomFloat() * (max - min);
        },
        int(min = 0, max = 1) {
            return Math.floor(TS.Rand.float(min, max));
        },
        bool(bias = 0.5) {
            return TS.Rand.float() < bias;
        },
        random(n = 1, min = 0, max = 1) {
            if (n === 1) {
                return [TS.Rand.float(min, max)];
            }
            return Array.from({length: n}, () => TS.Rand.float(min, max));
        },
        drunk: (n, step = 0.1, min = 0, max = 1, start = 0.5) => {
            const walk = [start];
            for (let i = 1; i < n; i++) {
                let next = walk[i-1] + (TS.Rand.float(-0.5, 0.5)) * step * 2;
                next = Math.max(min, Math.min(max, next));
                walk.push(next);
            }
            return walk;
        },
        pick: (arr, weights) => {
            if (!arr || arr.length === 0) return undefined;
            if (!weights) {
                const idx = Math.floor(TS.Rand.float(0, arr.length));
                return arr[idx];
            }
            const sum = weights.reduce((a, b) => a + b, 0);
            let r = TS.Rand.float(0, sum);
            for (let i = 0; i < arr.length; i++) {
                r -= weights[i];
                if (r <= 0) return arr[i];
            }
            return arr[arr.length - 1];
        },
        weighted: (options) => {
            const keys = Object.keys(options);
            const weights = Object.values(options);
            return TS.Rand.pick(keys, weights);
        },
        coin: (n = 1, bias = 0.5) => {
            if (n === 1) {
                return [TS.Rand.float() < bias ? 1 : 0];
            }
            return Array.from({length: n}, () => (TS.Rand.float() < bias ? 1 : 0));
        }
    },
    Transform: {
        rotate: (arr, n) => {
            n = n % arr.length;
            return [...arr.slice(n), ...arr.slice(0, n)];
        },
        palindrome: (arr) => [...arr, ...arr.slice(0, -1).reverse()],
        lace: (...arrays) => {
            const maxLen = Math.max(...arrays.map(a => a.length));
            const result = [];
            for (let i = 0; i < maxLen; i++) {
                arrays.forEach(arr => {
                    if (i < arr.length) result.push(arr[i]);
                });
            }
            return result;
        }
    }
};

// Global artwork system
class TotalSerialismArtwork {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 800;
        this.seed = null;
        this.params = {};
        this.features = [];
        this.palette = null;
        this.algorithm = null;
        this.elements = [];
        this.svgPaths = [];
        this.collisionSystem = null;
        this.compositionSystem = null;
        this.enableCollisionDetection = true;
        this.enableGoldenRatio = true;
        this.debugCollisions = false;
        this.debugComposition = false;
        
        // Palettes inspired by Fidenza and expanded
        this.palettes = {
            luxe: {
                name: "Luxe",
                colors: ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF', '#06FFB4', '#FF4365', '#00F5FF', '#FE6B35', '#6A0572', '#F71735', '#FCAB10', '#1B998B', '#2D3561', '#F7931E', '#C1292E'],
                weights: [0.15, 0.12, 0.1, 0.08, 0.08, 0.07, 0.06, 0.06, 0.05, 0.05, 0.04, 0.04, 0.03, 0.03, 0.02, 0.02],
                rarity: 'common'
            },
            vintage: {
                name: "Vintage",
                colors: ['#8B4513', '#D2691E', '#DEB887', '#F4A460', '#FFE4B5', '#FFDEAD', '#F5DEB3', '#FFF8DC', '#B8860B', '#DAA520', '#BC8F8F'],
                weights: TS.Gen.spread(11).map(() => 1/11),
                rarity: 'common'
            },
            neon: {
                name: "Neon Dreams",
                colors: ['#FF10F0', '#00FFFF', '#39FF14', '#FF073A', '#FFFF00', '#FF6600', '#00FF00', '#FF00FF', '#1B03A3'],
                weights: [0.2, 0.15, 0.15, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05],
                rarity: 'uncommon'
            },
            earth: {
                name: "Earth Tones",
                colors: ['#8B4513', '#A0522D', '#D2691E', '#CD853F', '#DEB887', '#F4A460', '#B8860B', '#DAA520', '#808000', '#6B8E23', '#556B2F'],
                weights: TS.Gen.spread(11).map(() => 1/11),
                rarity: 'common'
            },
            ocean: {
                name: "Deep Ocean",
                colors: ['#000080', '#0000CD', '#0000FF', '#006994', '#1E90FF', '#00BFFF', '#87CEEB', '#4682B4', '#5F9EA0', '#008B8B', '#48D1CC'],
                weights: TS.Gen.spreadExp(11, 1.5).map(v => v / 10),
                rarity: 'common'
            },
            sunset: {
                name: "Sunset",
                colors: ['#FF4500', '#FF6347', '#FF7F50', '#FFA07A', '#FA8072', '#FFB6C1', '#FF69B4', '#FF1493', '#DB7093'],
                weights: [0.2, 0.15, 0.15, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05],
                rarity: 'common'
            },
            monochrome: {
                name: "Monochrome",
                colors: ['#000000'],
                weights: [1],
                rarity: 'uncommon',
                generateVariations: true
            },
            candy: {
                name: "Candy Shop",
                colors: ['#FF6B9D', '#FFC8DD', '#FFAFCC', '#BDE0FE', '#A2D2FF', '#C77DFF', '#E7C6FF', '#FFEAA7', '#FD79A8'],
                weights: TS.Gen.spread(9).map(() => 1/9),
                rarity: 'uncommon'
            },
            forest: {
                name: "Forest",
                colors: ['#228B22', '#32CD32', '#00FF00', '#7CFC00', '#7FFF00', '#ADFF2F', '#9ACD32', '#556B2F', '#6B8E23', '#808000', '#2E8B57'],
                weights: TS.Gen.spread(11).map(() => 1/11),
                rarity: 'common'
            },
            cosmic: {
                name: "Cosmic",
                colors: ['#0F0C29', '#302B63', '#24243E', '#2C003E', '#8E2DE2', '#4A00E0', '#CE205B', '#EC9F05', '#F76B1C'],
                weights: [0.2, 0.15, 0.15, 0.1, 0.1, 0.1, 0.1, 0.05, 0.05],
                rarity: 'uncommon'
            },
            pastel: {
                name: "Soft Pastel",
                colors: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E0BBE4', '#FEC8D8', '#FFDFD3'],
                weights: TS.Gen.spread(8).map(() => 1/8),
                rarity: 'common'
            },
            jazz: {
                name: "Jazz Club",
                colors: ['#2C1810', '#4A2C2A', '#3E1F47', '#412F4F', '#5D3F6A', '#765285', '#8E679D', '#A67CB5'],
                weights: TS.Gen.spreadExp(8, 0.5),
                rarity: 'uncommon'
            },
            matrix: {
                name: "Matrix",
                colors: ['#003B00', '#008F11', '#00FF41', '#FFFFFF'],
                weights: [0.4, 0.3, 0.25, 0.05],
                rarity: 'uncommon'
            },
            fire: {
                name: "Fire",
                colors: ['#FFFF00', '#FFCC00', '#FF9900', '#FF6600', '#FF3300', '#FF0000', '#CC0000', '#990000'],
                weights: [0.05, 0.1, 0.15, 0.2, 0.2, 0.15, 0.1, 0.05],
                rarity: 'common'
            },
            ice: {
                name: "Ice Crystal",
                colors: ['#F0F8FF', '#E0FFFF', '#B0E0E6', '#87CEEB', '#87CEFA', '#4682B4', '#1E90FF', '#0000FF'],
                weights: TS.Gen.spread(8).map(() => 1/8),
                rarity: 'common'
            },
            royal: {
                name: "Royal",
                colors: ['#4B0082', '#6A0DAD', '#7B68EE', '#9370DB', '#8A2BE2', '#9400D3', '#9932CC', '#BA55D3', '#FFD700'],
                weights: [0.15, 0.15, 0.15, 0.1, 0.1, 0.1, 0.1, 0.1, 0.05],
                rarity: 'uncommon'
            },
            punk: {
                name: "Cyberpunk",
                colors: ['#FF124F', '#FF00A0', '#FE75FE', '#7A04EB', '#120458', '#00D9FF', '#00F0FF', '#FAFF00'],
                weights: [0.15, 0.15, 0.15, 0.15, 0.1, 0.1, 0.1, 0.1],
                rarity: 'uncommon'
            },
            derived: {
                name: "Derived",
                colors: [],
                weights: [],
                rarity: 'rare',
                generate(artwork) {
                    const luxe = artwork?.palettes?.luxe || this;
                    const maxColors = luxe.colors?.length || 0;
                    const count = Math.max(2, Math.min(6, 3 + Math.floor(TS.Rand.float(0, 5))));
                    const indices = new Set();
                    while (indices.size < Math.min(count, maxColors)) {
                        indices.add(Math.floor(TS.Rand.float(0, maxColors)));
                    }
                    const colors = Array.from(indices).map(i => luxe.colors[i]);
                    const rawWeights = colors.map(() => TS.Rand.float(0.1, 1));
                    const weightSum = rawWeights.reduce((acc, val) => acc + val, 0) || 1;
                    return {
                        colors,
                        weights: rawWeights.map(w => w / weightSum)
                    };
                }
            },
            glitch: {
                name: "Glitch",
                colors: [],
                weights: [],
                rarity: 'epic',
                generate() {
                    const count = Math.max(2, Math.min(8, 2 + Math.floor(TS.Rand.float(0, 6))));
                    const colors = Array.from({length: count}, () => {
                        const value = Math.floor(TS.Rand.float(0, 0xFFFFFF + 1));
                        return `#${value.toString(16).padStart(6, '0')}`;
                    });
                    const rawWeights = colors.map(() => TS.Rand.float(0.1, 1));
                    const weightSum = rawWeights.reduce((acc, val) => acc + val, 0) || 1;
                    return {
                        colors,
                        weights: rawWeights.map(w => w / weightSum)
                    };
                }
            }
        };
    }
    
    init() {
        // Hide loading, show container
        const loading = document.getElementById('loading');
        const container = document.getElementById('container');
        
        if (loading) loading.style.display = 'none';
        if (container) container.style.display = 'flex';
        
        // Initialize p5.js
        new p5((p) => {
            p.setup = () => {
                const canvas = p.createCanvas(this.width, this.height);
                canvas.parent('canvas-container');
                this.p5 = p;
                
                // Initial generation
                this.generate();
            };
            
            p.draw = () => {
                // Static artwork, no animation needed
            };
            
            p.keyPressed = () => {
                switch(p.key) {
                    case 'r':
                    case 'R':
                        this.generate();
                        break;
                    case 'p':
                    case 'P':
                        this.saveImage();
                        break;
                    case 's':
                    case 'S':
                        this.saveSVG();
                        break;
                    case ' ':
                        this.surprise();
                        break;
                    case 'm':
                    case 'M':
                        this.mutate();
                        break;
                }
            };
        });
        
        // Setup parameter listeners
        this.setupControls();
    }
    
    setupControls() {
        // Parameter sliders
        ['complexity', 'density', 'chaos', 'scale', 'saturation', 'brightness'].forEach(param => {
            const slider = document.getElementById(param);
            const value = document.getElementById(`${param}-value`);
            
            slider.addEventListener('input', (e) => {
                value.textContent = e.target.value;
                this.params[param] = parseFloat(e.target.value);
            });
            
            // Initialize
            this.params[param] = parseFloat(slider.value);
        });
        
        // Checkbox controls
        // Checkbox controls with null checks
        const checkboxes = [
            { id: 'collision-detection', prop: 'enableCollisionDetection' },
            { id: 'debug-collisions', prop: 'debugCollisions' },
            { id: 'golden-ratio', prop: 'enableGoldenRatio' },
            { id: 'debug-composition', prop: 'debugComposition' }
        ];
        
        checkboxes.forEach(({ id, prop }) => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this[prop] = e.target.checked;
                    this.generate();
                });
            }
        });
    }
    
    generate(seedOverride = null) {
        // Generate new seed with time and entropy fallback unless overridden
        if (seedOverride !== null && seedOverride !== undefined) {
            this.seed = seedOverride;
        } else {
            let entropy = 0;
            if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
                const buffer = new Uint32Array(1);
                window.crypto.getRandomValues(buffer);
                entropy = buffer[0];
            } else if (typeof performance !== 'undefined' && performance.now) {
                entropy = Math.floor(performance.now() * 1000) >>> 0;
            } else {
                entropy = (Date.now() >>> 0);
            }
            this.seed = `${Date.now()}-${entropy}`;
        }
        TS.Rand.setSeed(this.seed);
        
        // Clear
        this.elements = [];
        this.features = [];
        this.svgPaths = [];
        
        // Initialize collision detection system
        if (this.enableCollisionDetection && CollisionDetectionSystem) {
            this.collisionSystem = new CollisionDetectionSystem(
                this.width,
                this.height,
                40,
                () => TS.Rand.float()
            );
        }

        // Initialize golden ratio composition system
        if (this.enableGoldenRatio && GoldenRatioComposition) {
            this.compositionSystem = new GoldenRatioComposition(
                this.width,
                this.height,
                () => TS.Rand.float()
            );
        }
        
        // Select algorithm
        this.selectAlgorithm();
        
        // Select palette
        this.selectPalette();
        
        // Generate features
        this.generateFeatures();
        
        // Execute algorithm
        this.executeAlgorithm();
        
        // Update UI
        this.updateStats();
    }
    
    selectAlgorithm() {
        const select = document.getElementById('algorithm-select');
        
        if (!select || select.value === 'auto') {
            // Weighted random selection
            this.algorithm = TS.Rand.weighted({
                'flow': 30,
                'rings': 25,
                'particles': 20,
                'tessellation': 15,
                'waves': 15,
                'hybrid': 5
            });
        } else {
            this.algorithm = select.value;
        }
    }
    
    selectPalette() {
        const select = document.getElementById('palette-select');
        
        const buildPalette = (paletteKey) => {
            const paletteDef = this.palettes[paletteKey];
            if (!paletteDef) return null;
            const generated = paletteDef.generate ? paletteDef.generate(this) : {};
            const colors = generated.colors || paletteDef.colors || [];
            const weights = generated.weights || paletteDef.weights || [];
            return {
                name: paletteDef.name,
                rarity: paletteDef.rarity,
                colors: [...colors],
                weights: [...weights],
                generateVariations: generated.generateVariations ?? paletteDef.generateVariations ?? false
            };
        };

        if (!select || select.value === 'auto') {
            // Weighted by rarity
            const weights = {
                'common': 70,
                'uncommon': 25,
                'rare': 4,
                'epic': 1
            };
            
            const rarity = TS.Rand.weighted(weights);
            const available = Object.keys(this.palettes).filter(k => 
                this.palettes[k].rarity === rarity
            );
            
            const key = TS.Rand.pick(available);
            this.palette = buildPalette(key) || this.palettes[key];
        } else {
            this.palette = buildPalette(select.value) || this.palettes[select.value];
        }

        // Apply modifications
        this.modifyPalette();
    }
    
    modifyPalette() {
        // Create working copy
        const basePalette = {...this.palette};
        this.palette = {
            name: basePalette.name,
            colors: [...basePalette.colors],
            weights: [...basePalette.weights],
            rarity: basePalette.rarity
        };
        
        // Apply saturation and brightness
        const sat = this.params.saturation;
        const bright = this.params.brightness;
        
        this.palette.colors = this.palette.colors.map(hex => {
            const rgb = this.hexToRgb(hex);
            const hsb = this.rgbToHsb(rgb.r, rgb.g, rgb.b);
            
            hsb.s *= sat;
            hsb.b = hsb.b * 0.5 + bright * 0.5;
            
            const newRgb = this.hsbToRgb(hsb.h, hsb.s, hsb.b);
            return this.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        });
        
        // Add variations for monochrome
        if (this.palette.generateVariations) {
            const base = this.palette.colors[0];
            this.palette.colors = [];
            this.palette.weights = [];
            
            for (let i = 0; i < 8; i++) {
                const brightness = i / 7;
                const rgb = this.hexToRgb(base);
                const gray = (rgb.r + rgb.g + rgb.b) / 3;
                const value = Math.floor(gray + (255 - gray) * brightness);
                this.palette.colors.push(this.rgbToHex(value, value, value));
                this.palette.weights.push(1/8);
            }
        }
    }
    
    generateFeatures() {
        // Core features that affect all algorithms
        const features = {
            // Structure
            'structured': { weight: 40, applies: ['all'] },
            'chaotic': { weight: 30, applies: ['all'] },
            'minimal': { weight: 20, applies: ['all'] },
            'maximal': { weight: 10, applies: ['all'] },
            
            // Density
            'sparse': { weight: 25, applies: ['all'] },
            'balanced': { weight: 50, applies: ['all'] },
            'dense': { weight: 25, applies: ['all'] },
            
            // Special effects (rare)
            'glitch': { weight: 2, applies: ['all'], rarity: 'rare' },
            'blur': { weight: 3, applies: ['flow', 'particles'], rarity: 'rare' },
            'pixelated': { weight: 2, applies: ['all'], rarity: 'rare' },
            'distorted': { weight: 1, applies: ['all'], rarity: 'epic' },
            
            // Algorithm specific
            'spirals': { weight: 15, applies: ['flow'] },
            'vortex': { weight: 10, applies: ['flow'] },
            'concentric': { weight: 20, applies: ['rings'] },
            'overlapping': { weight: 30, applies: ['rings'] },
            'flocking': { weight: 25, applies: ['particles'] },
            'orbital': { weight: 15, applies: ['particles'] },
            'regular': { weight: 30, applies: ['tessellation'] },
            'irregular': { weight: 20, applies: ['tessellation'] },
            'interference': { weight: 35, applies: ['waves'] },
            'standing': { weight: 15, applies: ['waves'] }
        };
        
        // Select features based on algorithm
        Object.keys(features).forEach(feature => {
            const def = features[feature];
            if (def.applies.includes('all') || def.applies.includes(this.algorithm)) {
                if (TS.Rand.float(0, 100) < def.weight) {
                    this.features.push({
                        name: feature,
                        rarity: def.rarity || 'common'
                    });
                }
            }
        });
        
        // Ensure at least one structure and density feature
        if (!this.features.some(f => ['structured', 'chaotic', 'minimal', 'maximal'].includes(f.name))) {
            this.features.push({ name: 'balanced', rarity: 'common' });
        }
    }
    
    executeAlgorithm() {
        const p = this.p5;
        
        // Clear canvas
        p.background(20);
        
        // Execute based on algorithm
        switch(this.algorithm) {
            case 'flow':
                this.executeFlowFields();
                break;
            case 'rings':
                this.executeRingSystem();
                break;
            case 'particles':
                this.executeParticleSwarm();
                break;
            case 'tessellation':
                this.executeTessellation();
                break;
            case 'waves':
                this.executeWaveInterference();
                break;
            case 'hybrid':
                this.executeHybrid();
                break;
        }
        
        // Apply post-processing effects
        this.applyEffects();
        
        // Debug collision grid if enabled
        if (this.debugCollisions && this.collisionSystem) {
            this.collisionSystem.drawDebugGrid(p);
        }
        
        // Debug composition guides if enabled
        if (this.debugComposition && this.compositionSystem) {
            this.compositionSystem.drawGuides(p);
        }
    }
    
    executeFlowFields() {
        const p = this.p5;
        const complexity = this.params.complexity;
        const density = this.params.density;
        const chaos = this.params.chaos;
        const scale = this.params.scale;
        
        // Generate flow field
        const resolution = 20 * (1 - complexity * 0.5);
        const cols = Math.ceil(this.width / resolution);
        const rows = Math.ceil(this.height / resolution);
        
        // Multi-layer flow field
        const layers = 2 + Math.floor(complexity * 5);
        const flowField = [];
        
        for (let y = 0; y < rows; y++) {
            flowField[y] = [];
            for (let x = 0; x < cols; x++) {
                let angle = 0;
                
                // Combine multiple wave functions
                for (let l = 0; l < layers; l++) {
                    const freq = (l + 1) * 0.5;
                    const amp = 1 / (l + 1);
                    angle += Math.sin(x * freq * 0.1) * amp;
                    angle += Math.cos(y * freq * 0.1) * amp;
                }
                
                // Add chaos
                angle += TS.Rand.float(-0.5, 0.5) * chaos * Math.PI;
                
                // Special features
                if (this.hasFeature('spirals')) {
                    const dx = x - cols/2;
                    const dy = y - rows/2;
                    angle += Math.atan2(dy, dx) * 0.5;
                }
                
                if (this.hasFeature('vortex')) {
                    const dx = x - cols/2;
                    const dy = y - rows/2;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    angle += 1 / (dist * 0.1 + 1);
                }
                
                flowField[y][x] = angle;
            }
        }
        
        // Generate particles
        const particleCount = Math.floor(100 * density * density);
        const particles = [];
        
        // Spawn patterns
        const spawnPattern = TS.Rand.pick(['golden', 'grid', 'random', 'clusters']);
        
        for (let i = 0; i < particleCount; i++) {
            let x, y;
            
            switch(spawnPattern) {
                case 'golden':
                    if (this.compositionSystem) {
                        // Use Fibonacci grid for golden ratio distribution
                        const fibGrid = this.compositionSystem.createFibonacciGrid(particleCount);
                        if (fibGrid[i]) {
                            x = fibGrid[i].x;
                            y = fibGrid[i].y;
                        } else {
                            x = TS.Rand.float(0, this.width);
                            y = TS.Rand.float(0, this.height);
                        }
                    } else {
                        const golden = (1 + Math.sqrt(5)) / 2;
                        const angle = i * golden * Math.PI * 2;
                        const radius = Math.sqrt(i) * 10 * scale;
                        x = this.width/2 + Math.cos(angle) * radius;
                        y = this.height/2 + Math.sin(angle) * radius;
                    }
                    
                    // Check collision and find valid position
                    if (this.collisionSystem) {
                        const particleRadius = 2 + TS.Rand.float(0, 3) * scale;
                        const validPos = this.collisionSystem.findValidPosition(x, y, particleRadius);
                        x = validPos.x;
                        y = validPos.y;
                    }
                    break;
                    
                case 'grid':
                    const gridSize = Math.ceil(Math.sqrt(particleCount));
                    const cellSize = Math.min(this.width, this.height) / gridSize;
                    x = (i % gridSize + 0.5) * cellSize;
                    y = (Math.floor(i / gridSize) + 0.5) * cellSize;
                    x += TS.Rand.float(-0.5, 0.5) * cellSize * 0.5;
                    y += TS.Rand.float(-0.5, 0.5) * cellSize * 0.5;
                    break;
                    
                case 'clusters':
                    const cluster = Math.floor(i / 20);
                    const clusterX = TS.Rand.float(0, this.width);
                    const clusterY = TS.Rand.float(0, this.height);
                    const spread = 50 + TS.Rand.float(0, 100);
                    const a = TS.Rand.float(0, Math.PI * 2);
                    const r = TS.Rand.float(0, spread);
                    x = clusterX + Math.cos(a) * r;
                    y = clusterY + Math.sin(a) * r;
                    break;
                    
                default:
                    x = TS.Rand.float(0, this.width);
                    y = TS.Rand.float(0, this.height);
            }
            
            const particle = {
                x: x,
                y: y,
                prevX: x,
                prevY: y,
                color: this.pickColor(),
                size: 1 + TS.Rand.float(0, 3) * scale,
                life: 50 + TS.Rand.float(0, 200),
                speed: 0.5 + TS.Rand.float(0, 2),
                radius: 1 + TS.Rand.float(0, 3) * scale
            };
            
            particles.push(particle);
            
            // Add to collision system
            if (this.collisionSystem) {
                this.collisionSystem.add(particle);
            }
        }
        
        // Draw particles following flow field
        p.push();
        particles.forEach(particle => {
            for (let step = 0; step < particle.life; step++) {
                const col = Math.floor(particle.x / resolution);
                const row = Math.floor(particle.y / resolution);
                
                if (flowField[row] && flowField[row][col]) {
                    let angle = flowField[row][col];
                    let speed = particle.speed;
                    
                    // Check for collisions and adjust movement
                    if (this.collisionSystem) {
                        const collision = this.collisionSystem.checkCollision(
                            particle.x + Math.cos(angle) * speed,
                            particle.y + Math.sin(angle) * speed,
                            particle.radius,
                            particle
                        );
                        
                        if (collision.collides && CollisionStrategies) {
                            const strategy = CollisionStrategies.flowFieldStrategy(collision, particle);
                            if (strategy) {
                                angle += strategy.angleAdjustment || 0;
                                speed *= strategy.speedMultiplier || 1;
                            }
                        }
                    }
                    
                    particle.x += Math.cos(angle) * speed;
                    particle.y += Math.sin(angle) * speed;
                    
                    // Wrap around edges
                    if (particle.x < 0) particle.x = this.width;
                    if (particle.x > this.width) particle.x = 0;
                    if (particle.y < 0) particle.y = this.height;
                    if (particle.y > this.height) particle.y = 0;
                    
                    // Draw
                    const alpha = (1 - step / particle.life) * 0.1;
                    p.stroke(particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
                    p.strokeWeight(particle.size);
                    p.line(particle.prevX, particle.prevY, particle.x, particle.y);
                    
                    // Record for SVG
                    this.svgPaths.push({
                        type: 'line',
                        x1: particle.prevX,
                        y1: particle.prevY,
                        x2: particle.x,
                        y2: particle.y,
                        stroke: particle.color,
                        strokeWidth: particle.size,
                        opacity: alpha
                    });
                    
                    particle.prevX = particle.x;
                    particle.prevY = particle.y;

                    if (this.collisionSystem) {
                        this.collisionSystem.update(particle);
                    }
                }
            }
        });
        p.pop();
    }
    
    executeRingSystem() {
        const p = this.p5;
        const complexity = this.params.complexity;
        const density = this.params.density;
        const chaos = this.params.chaos;
        const scale = this.params.scale;
        
        // Generate rings
        const ringCount = Math.floor(20 * density + 10);
        const rings = [];
        
        // Ring patterns
        const pattern = this.hasFeature('concentric') ? 'concentric' : 
                       this.hasFeature('overlapping') ? 'overlapping' : 
                       TS.Rand.pick(['scattered', 'clustered', 'grid']);
        
        for (let i = 0; i < ringCount; i++) {
            let x, y, r;
            
            switch(pattern) {
                case 'concentric':
                    if (this.compositionSystem) {
                        // Use golden ratio center
                        const center = this.compositionSystem.guides.spiralCenters[i % 4];
                        x = center.x + TS.Rand.float(-0.5, 0.5) * chaos * 100;
                        y = center.y + TS.Rand.float(-0.5, 0.5) * chaos * 100;
                    } else {
                        x = this.width/2 + TS.Rand.float(-0.5, 0.5) * chaos * 100;
                        y = this.height/2 + TS.Rand.float(-0.5, 0.5) * chaos * 100;
                    }
                    r = (i + 1) * 20 * scale;
                    break;
                    
                case 'overlapping':
                    if (this.compositionSystem) {
                        // Use golden spiral for ring placement
                        const spiral = this.compositionSystem.createGoldenSpiral(
                            this.width/2, this.height/2, 20, 1.5, 50
                        );
                        if (spiral[i % spiral.length]) {
                            x = spiral[i % spiral.length].x;
                            y = spiral[i % spiral.length].y;
                        } else {
                            x = TS.Rand.float(0, this.width);
                            y = TS.Rand.float(0, this.height);
                        }
                    } else {
                        const angle = i * 0.618 * Math.PI * 2;
                        const dist = Math.sqrt(i) * 20;
                        x = this.width/2 + Math.cos(angle) * dist;
                        y = this.height/2 + Math.sin(angle) * dist;
                    }
                    r = 20 + TS.Rand.float(0, 100) * scale;
                    break;
                    
                case 'grid':
                    const gridSize = Math.ceil(Math.sqrt(ringCount));
                    const cellSize = Math.min(this.width, this.height) / gridSize;
                    x = (i % gridSize + 0.5) * cellSize;
                    y = (Math.floor(i / gridSize) + 0.5) * cellSize;
                    r = cellSize * 0.3 * scale;
                    break;
                    
                default:
                    x = TS.Rand.float(0, this.width);
                    y = TS.Rand.float(0, this.height);
                    r = 10 + TS.Rand.float(0, 100) * scale;
            }
            
            // Check collision for ring placement
            if (this.collisionSystem) {
                const validPos = this.collisionSystem.findValidPosition(x, y, r);
                if (validPos.found) {
                    x = validPos.x;
                    y = validPos.y;
                } else if (pattern !== 'concentric') {
                    // Skip this ring if we can't find a valid position
                    continue;
                }
            }
            
            const ring = {
                x: x,
                y: y,
                r: r,
                radius: r,
                color: this.pickColor(),
                strokeWeight: 1 + TS.Rand.float(0, 5) * complexity,
                segments: Math.floor(3 + TS.Rand.float(0, 20) * complexity),
                rotation: TS.Rand.float(0, Math.PI * 2),
                speed: TS.Rand.float(-0.5, 0.5) * 0.02
            };
            
            rings.push(ring);
            
            // Add to collision system
            if (this.collisionSystem) {
                this.collisionSystem.add(ring);
            }
        }
        
        // Draw rings
        p.push();
        p.noFill();
        
        rings.forEach(ring => {
            p.push();
            p.translate(ring.x, ring.y);
            p.rotate(ring.rotation);
            
            // Draw segmented or full ring
            if (ring.segments > 15) {
                // Full ring
                p.stroke(ring.color);
                p.strokeWeight(ring.strokeWeight);
                p.ellipse(0, 0, ring.r * 2, ring.r * 2);
                
                // SVG
                this.svgPaths.push({
                    type: 'circle',
                    cx: ring.x,
                    cy: ring.y,
                    r: ring.r,
                    stroke: ring.color,
                    strokeWidth: ring.strokeWeight,
                    fill: 'none'
                });
            } else {
                // Segmented ring
                const angleStep = Math.PI * 2 / ring.segments;
                
                for (let s = 0; s < ring.segments; s++) {
                    if (TS.Rand.bool(0.7)) {
                        const a1 = s * angleStep;
                        const a2 = (s + 0.8) * angleStep;
                        
                        p.stroke(ring.color);
                        p.strokeWeight(ring.strokeWeight);
                        p.arc(0, 0, ring.r * 2, ring.r * 2, a1, a2);
                    }
                }
            }
            
            p.pop();
        });
        
        p.pop();
        
        // Calculate spatial efficiency (available via this.collisionSystem.calculateSpatialEfficiency())
        // Removed console.log for production
    }
    
    executeParticleSwarm() {
        const p = this.p5;
        const complexity = this.params.complexity;
        const density = this.params.density;
        const chaos = this.params.chaos;
        const scale = this.params.scale;
        
        // Particle swarm with flocking behavior
        const particleCount = Math.floor(50 + density * 150);
        const particles = [];
        
        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            let x, y;
            
            if (this.compositionSystem && this.hasFeature('orbital')) {
                // Start from golden ratio points for orbital patterns
                const center = this.compositionSystem.guides.spiralCenters[i % 4];
                const angle = TS.Rand.float(0, Math.PI * 2);
                const radius = 20 + TS.Rand.float(0, 50);
                x = center.x + Math.cos(angle) * radius;
                y = center.y + Math.sin(angle) * radius;
            } else {
                // Random spawn with clustering
                const cluster = Math.floor(i / (particleCount / 5));
                const clusterX = (cluster + 0.5) * this.width / 5;
                const clusterY = TS.Rand.float(0, this.height);
                x = clusterX + TS.Rand.float(-0.5, 0.5) * 100;
                y = clusterY + TS.Rand.float(-0.5, 0.5) * 100;
            }
            
            // Check collision if enabled
            if (this.collisionSystem) {
                const validPos = this.collisionSystem.findValidPosition(x, y, 5);
                x = validPos.x;
                y = validPos.y;
            }
            
            particles.push({
                x: x,
                y: y,
                vx: TS.Rand.float(-0.5, 0.5) * 2,
                vy: TS.Rand.float(-0.5, 0.5) * 2,
                ax: 0,
                ay: 0,
                color: this.pickColor(),
                size: 2 + TS.Rand.float(0, 4) * scale,
                maxSpeed: 2 + TS.Rand.float(0, 2),
                maxForce: 0.05 + TS.Rand.float(0, 0.05),
                radius: 5,
                trail: []
            });
            
            if (this.collisionSystem) {
                this.collisionSystem.add(particles[particles.length - 1]);
            }
        }
        
        // Flocking parameters
        const flockingParams = {
            separationRadius: 25 * scale,
            alignmentRadius: 50 * scale,
            cohesionRadius: 50 * scale,
            separationWeight: 1.5,
            alignmentWeight: 1.0,
            cohesionWeight: 1.0,
            wanderWeight: 0.1 + chaos * 0.3
        };
        
        // Simulate flocking behavior
        const steps = 100 + complexity * 200;
        
        for (let step = 0; step < steps; step++) {
            // Update each particle
            particles.forEach((particle, i) => {
                // Reset acceleration
                particle.ax = 0;
                particle.ay = 0;
                
                // Get nearby particles
                const neighbors = [];
                particles.forEach((other, j) => {
                    if (i !== j) {
                        const dx = other.x - particle.x;
                        const dy = other.y - particle.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < flockingParams.cohesionRadius) {
                            neighbors.push({ particle: other, distance: dist });
                        }
                    }
                });
                
                if (neighbors.length > 0) {
                    // Separation (avoid crowding)
                    let sepX = 0, sepY = 0;
                    let sepCount = 0;
                    
                    neighbors.forEach(({ particle: other, distance }) => {
                        if (distance < flockingParams.separationRadius && distance > 0) {
                            const dx = particle.x - other.x;
                            const dy = particle.y - other.y;
                            sepX += dx / distance;
                            sepY += dy / distance;
                            sepCount++;
                        }
                    });
                    
                    if (sepCount > 0) {
                        sepX /= sepCount;
                        sepY /= sepCount;
                        const mag = Math.sqrt(sepX * sepX + sepY * sepY);
                        if (mag > 0) {
                            sepX = sepX / mag * particle.maxSpeed;
                            sepY = sepY / mag * particle.maxSpeed;
                            sepX -= particle.vx;
                            sepY -= particle.vy;
                            particle.ax += sepX * flockingParams.separationWeight;
                            particle.ay += sepY * flockingParams.separationWeight;
                        }
                    }
                    
                    // Alignment (match velocity)
                    let alignX = 0, alignY = 0;
                    let alignCount = 0;
                    
                    neighbors.forEach(({ particle: other, distance }) => {
                        if (distance < flockingParams.alignmentRadius) {
                            alignX += other.vx;
                            alignY += other.vy;
                            alignCount++;
                        }
                    });
                    
                    if (alignCount > 0) {
                        alignX /= alignCount;
                        alignY /= alignCount;
                        const mag = Math.sqrt(alignX * alignX + alignY * alignY);
                        if (mag > 0) {
                            alignX = alignX / mag * particle.maxSpeed;
                            alignY = alignY / mag * particle.maxSpeed;
                            alignX -= particle.vx;
                            alignY -= particle.vy;
                            particle.ax += alignX * flockingParams.alignmentWeight;
                            particle.ay += alignY * flockingParams.alignmentWeight;
                        }
                    }
                    
                    // Cohesion (move toward center)
                    let cohX = 0, cohY = 0;
                    let cohCount = 0;
                    
                    neighbors.forEach(({ particle: other, distance }) => {
                        if (distance < flockingParams.cohesionRadius) {
                            cohX += other.x;
                            cohY += other.y;
                            cohCount++;
                        }
                    });
                    
                    if (cohCount > 0) {
                        cohX = cohX / cohCount - particle.x;
                        cohY = cohY / cohCount - particle.y;
                        const mag = Math.sqrt(cohX * cohX + cohY * cohY);
                        if (mag > 0) {
                            cohX = cohX / mag * particle.maxSpeed;
                            cohY = cohY / mag * particle.maxSpeed;
                            cohX -= particle.vx;
                            cohY -= particle.vy;
                            particle.ax += cohX * flockingParams.cohesionWeight;
                            particle.ay += cohY * flockingParams.cohesionWeight;
                        }
                    }
                }
                
                // Add wander force
                const wanderAngle = TS.Rand.float(0, Math.PI * 2);
                particle.ax += Math.cos(wanderAngle) * flockingParams.wanderWeight;
                particle.ay += Math.sin(wanderAngle) * flockingParams.wanderWeight;
                
                // Limit acceleration
                const accMag = Math.sqrt(particle.ax * particle.ax + particle.ay * particle.ay);
                if (accMag > particle.maxForce) {
                    particle.ax = particle.ax / accMag * particle.maxForce;
                    particle.ay = particle.ay / accMag * particle.maxForce;
                }
                
                // Update velocity
                particle.vx += particle.ax;
                particle.vy += particle.ay;
                
                // Limit speed
                const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
                if (speed > particle.maxSpeed) {
                    particle.vx = particle.vx / speed * particle.maxSpeed;
                    particle.vy = particle.vy / speed * particle.maxSpeed;
                }
                
                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // Wrap around edges
                if (particle.x < 0) particle.x = this.width;
                if (particle.x > this.width) particle.x = 0;
                if (particle.y < 0) particle.y = this.height;
                if (particle.y > this.height) particle.y = 0;

                if (this.collisionSystem) {
                    this.collisionSystem.update(particle);
                }

                // Store trail (limited length)
                particle.trail.push({ x: particle.x, y: particle.y });
                if (particle.trail.length > 20) {
                    particle.trail.shift();
                }
            });
        }
        
        // Draw particle trails and connections
        p.push();
        
        // Draw trails
        particles.forEach(particle => {
            p.noFill();
            p.stroke(particle.color);
            
            for (let i = 1; i < particle.trail.length; i++) {
                const alpha = i / particle.trail.length * 0.3;
                p.stroke(particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
                p.strokeWeight(particle.size * (i / particle.trail.length));
                p.line(
                    particle.trail[i-1].x, particle.trail[i-1].y,
                    particle.trail[i].x, particle.trail[i].y
                );
                
                // SVG path
                this.svgPaths.push({
                    type: 'line',
                    x1: particle.trail[i-1].x,
                    y1: particle.trail[i-1].y,
                    x2: particle.trail[i].x,
                    y2: particle.trail[i].y,
                    stroke: particle.color,
                    strokeWidth: particle.size * (i / particle.trail.length),
                    opacity: alpha
                });
            }
        });
        
        // Draw connections between nearby particles
        if (this.hasFeature('flocking')) {
            particles.forEach((p1, i) => {
                particles.forEach((p2, j) => {
                    if (i < j) {
                        const dx = p2.x - p1.x;
                        const dy = p2.y - p1.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < 30 * scale) {
                            const alpha = (1 - dist / (30 * scale)) * 0.1;
                            p.stroke(255, alpha * 255);
                            p.strokeWeight(0.5);
                            p.line(p1.x, p1.y, p2.x, p2.y);
                        }
                    }
                });
            });
        }
        
        // Draw particles
        particles.forEach(particle => {
            p.fill(particle.color);
            p.noStroke();
            p.ellipse(particle.x, particle.y, particle.size * 2);
            
            // SVG circle
            this.svgPaths.push({
                type: 'circle',
                cx: particle.x,
                cy: particle.y,
                r: particle.size,
                fill: particle.color
            });
        });
        
        p.pop();
    }
    
    executeTessellation() {
        const p = this.p5;
        const complexity = this.params.complexity;
        const density = this.params.density;
        const chaos = this.params.chaos;
        const scale = this.params.scale;
        
        // Tessellation type based on features
        const tessType = this.hasFeature('regular') ? 'voronoi' :
                        this.hasFeature('irregular') ? 'delaunay' :
                        TS.Rand.pick(['voronoi', 'delaunay', 'penrose', 'islamic']);
        
        switch(tessType) {
            case 'voronoi':
                this.executeVoronoi(p, complexity, density, chaos, scale);
                break;
            case 'delaunay':
                this.executeDelaunay(p, complexity, density, chaos, scale);
                break;
            case 'penrose':
                this.executePenrose(p, complexity, density, chaos, scale);
                break;
            case 'islamic':
                this.executeIslamicPattern(p, complexity, density, chaos, scale);
                break;
        }
    }
    
    executeVoronoi(p, complexity, density, chaos, scale) {
        // Generate seed points
        const pointCount = Math.floor(20 + density * 80);
        const points = [];
        
        // Use golden ratio or random placement
        if (this.compositionSystem && TS.Rand.float() > chaos) {
            const fibPoints = this.compositionSystem.createFibonacciGrid(pointCount);
            fibPoints.forEach(pt => {
                points.push({
                    x: pt.x + TS.Rand.float(-0.5, 0.5) * chaos * 50,
                    y: pt.y + TS.Rand.float(-0.5, 0.5) * chaos * 50,
                    color: this.pickColor(),
                    size: 2 + TS.Rand.float(0, 5) * scale
                });
            });
        } else {
            // Random points with optional collision detection
            for (let i = 0; i < pointCount; i++) {
                let x = TS.Rand.float(0, this.width);
                let y = TS.Rand.float(0, this.height);
                
                if (this.collisionSystem) {
                    const validPos = this.collisionSystem.findValidPosition(x, y, 20);
                    x = validPos.x;
                    y = validPos.y;
                }
                
                points.push({
                    x: x,
                    y: y,
                    color: this.pickColor(),
                    size: 2 + TS.Rand.float(0, 5) * scale
                });
                
                if (this.collisionSystem) {
                    this.collisionSystem.add(points[points.length - 1]);
                }
            }
        }
        
        // Simple Voronoi implementation using distance fields
        const cellSize = 2; // Resolution of distance field
        const cols = Math.ceil(this.width / cellSize);
        const rows = Math.ceil(this.height / cellSize);
        
        // Draw Voronoi cells
        p.push();
        p.noStroke();
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const px = x * cellSize;
                const py = y * cellSize;
                
                // Find closest point
                let minDist = Infinity;
                let closestPoint = null;
                
                points.forEach(point => {
                    const d = Math.sqrt(
                        Math.pow(px - point.x, 2) + 
                        Math.pow(py - point.y, 2)
                    );
                    if (d < minDist) {
                        minDist = d;
                        closestPoint = point;
                    }
                });
                
                if (closestPoint) {
                    // Color based on distance and point color
                    const normalizedDist = minDist / (Math.sqrt(this.width * this.width + this.height * this.height) * 0.5);
                    const brightness = 1 - normalizedDist * complexity;
                    
                    p.fill(closestPoint.color + Math.floor(brightness * 255).toString(16).padStart(2, '0'));
                    p.rect(px, py, cellSize, cellSize);
                }
            }
        }
        
        // Draw cell boundaries (approximate)
        p.stroke(255, 50);
        p.strokeWeight(1);
        p.noFill();
        
        // Draw the seed points
        points.forEach(point => {
            p.fill(point.color);
            p.noStroke();
            p.ellipse(point.x, point.y, point.size);
            
            // SVG
            this.svgPaths.push({
                type: 'circle',
                cx: point.x,
                cy: point.y,
                r: point.size / 2,
                fill: point.color
            });
        });
        
        p.pop();
    }
    
    executeDelaunay(p, complexity, density, chaos, scale) {
        // Generate points
        const pointCount = Math.floor(30 + density * 120);
        const points = [];
        
        // Create points
        for (let i = 0; i < pointCount; i++) {
            let x, y;
            
            if (this.compositionSystem && i < pointCount * 0.3) {
                // Some points on golden ratio positions
                const guide = TS.Rand.pick(this.compositionSystem.guides.spiralCenters);
                x = guide.x + TS.Rand.float(-0.5, 0.5) * 100 * chaos;
                y = guide.y + TS.Rand.float(-0.5, 0.5) * 100 * chaos;
            } else {
                x = TS.Rand.float(0, this.width);
                y = TS.Rand.float(0, this.height);
            }
            
            points.push({ x, y, color: this.pickColor() });
        }
        
        // Simple Delaunay triangulation (Bowyer-Watson algorithm approximation)
        // For production, would use a proper library, but implementing basic version
        const triangles = this.simpleTriangulate(points);
        
        // Draw triangles
        p.push();
        
        triangles.forEach(triangle => {
            const alpha = 0.3 + TS.Rand.float(0, 0.4);
            
            if (TS.Rand.bool(0.7)) {
                // Fill some triangles
                p.fill(triangle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
                p.noStroke();
            } else {
                // Stroke others
                p.noFill();
                p.stroke(triangle.color);
                p.strokeWeight(0.5 + TS.Rand.float(0, 2) * scale);
            }
            
            p.triangle(
                triangle.p1.x, triangle.p1.y,
                triangle.p2.x, triangle.p2.y,
                triangle.p3.x, triangle.p3.y
            );
            
            // SVG
            this.svgPaths.push({
                type: 'polygon',
                points: `${triangle.p1.x},${triangle.p1.y} ${triangle.p2.x},${triangle.p2.y} ${triangle.p3.x},${triangle.p3.y}`,
                fill: TS.Rand.bool(0.7) ? triangle.color : 'none',
                stroke: TS.Rand.bool(0.7) ? 'none' : triangle.color,
                strokeWidth: 0.5 + TS.Rand.float(0, 2) * scale,
                opacity: alpha
            });
        });
        
        p.pop();
    }
    
    executePenrose(p, complexity, density, chaos, scale) {
        // Penrose tiling using substitution rules
        const tileSize = 20 * scale;
        
        // Initialize with a few large triangles
        let triangles = [];
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const initialRadius = Math.min(this.width, this.height) * 0.4;
        
        // Create initial wheel of triangles
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI * 2) / 10;
            const angle2 = ((i + 1) * Math.PI * 2) / 10;
            
            triangles.push({
                type: i % 2 === 0 ? 'thin' : 'thick',
                p1: { x: centerX, y: centerY },
                p2: {
                    x: centerX + Math.cos(angle) * initialRadius,
                    y: centerY + Math.sin(angle) * initialRadius
                },
                p3: {
                    x: centerX + Math.cos(angle2) * initialRadius,
                    y: centerY + Math.sin(angle2) * initialRadius
                },
                level: 0,
                color: this.pickColor()
            });
        }
        
        // Subdivide triangles based on complexity
        const iterations = Math.floor(2 + complexity * 3);
        
        for (let iter = 0; iter < iterations; iter++) {
            const newTriangles = [];
            
            triangles.forEach(tri => {
                if (tri.level < iterations) {
                    // Subdivide using Penrose rules
                    const subdivided = this.subdividePenroseTriangle(tri);
                    subdivided.forEach(sub => {
                        sub.level = tri.level + 1;
                        sub.color = TS.Rand.bool(0.3) ? this.pickColor() : tri.color;
                        newTriangles.push(sub);
                    });
                } else {
                    newTriangles.push(tri);
                }
            });
            
            triangles = newTriangles;
        }
        
        // Draw the Penrose tiling
        p.push();
        
        triangles.forEach(tri => {
            const alpha = 0.6 + TS.Rand.float(0, 0.4);
            
            // Apply slight chaos to positions
            const p1 = {
                x: tri.p1.x + TS.Rand.float(-0.5, 0.5) * chaos * 5,
                y: tri.p1.y + TS.Rand.float(-0.5, 0.5) * chaos * 5
            };
            const p2 = {
                x: tri.p2.x + TS.Rand.float(-0.5, 0.5) * chaos * 5,
                y: tri.p2.y + TS.Rand.float(-0.5, 0.5) * chaos * 5
            };
            const p3 = {
                x: tri.p3.x + TS.Rand.float(-0.5, 0.5) * chaos * 5,
                y: tri.p3.y + TS.Rand.float(-0.5, 0.5) * chaos * 5
            };
            
            if (tri.type === 'thin') {
                p.fill(tri.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
                p.stroke(255, 30);
                p.strokeWeight(0.5);
            } else {
                p.fill(tri.color + Math.floor(alpha * 0.7 * 255).toString(16).padStart(2, '0'));
                p.stroke(255, 20);
                p.strokeWeight(0.3);
            }
            
            p.triangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
            
            // SVG
            this.svgPaths.push({
                type: 'polygon',
                points: `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`,
                fill: tri.color,
                stroke: '#ffffff',
                strokeWidth: tri.type === 'thin' ? 0.5 : 0.3,
                opacity: alpha
            });
        });
        
        p.pop();
    }
    
    executeIslamicPattern(p, complexity, density, chaos, scale) {
        // Islamic geometric pattern based on polygons and stars
        const gridSize = Math.floor(30 / density) * scale;
        const cols = Math.ceil(this.width / gridSize);
        const rows = Math.ceil(this.height / gridSize);
        
        p.push();
        
        // Create grid of polygons
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * gridSize + gridSize / 2;
                const y = row * gridSize + gridSize / 2;
                
                // Skip some cells randomly
                if (TS.Rand.float() < chaos * 0.3) continue;
                
                // Check collision if enabled
                if (this.collisionSystem) {
                    const collision = this.collisionSystem.checkCollision(x, y, gridSize / 2);
                    if (collision.collides) continue;
                }
                
                const color = this.pickColor();
                const sides = TS.Rand.pick([6, 8, 12], [0.5, 0.3, 0.2]);
                const rotation = (row + col) * 0.1 + TS.Rand.float(0, chaos);
                
                // Draw star polygon
                p.push();
                p.translate(x, y);
                p.rotate(rotation);
                
                // Outer polygon
                p.fill(color + '40');
                p.stroke(color);
                p.strokeWeight(1);
                this.drawPolygon(p, 0, 0, gridSize * 0.4, sides);
                
                // Inner star
                if (complexity > 0.5) {
                    p.fill(color + '80');
                    this.drawStar(p, 0, 0, gridSize * 0.3, gridSize * 0.15, sides);
                }
                
                // Central decoration
                if (complexity > 0.7) {
                    p.fill(color);
                    p.noStroke();
                    p.ellipse(0, 0, gridSize * 0.1);
                }
                
                p.pop();
            }
        }
        
        // Add connecting lines
        if (density > 0.5) {
            p.stroke(255, 30);
            p.strokeWeight(0.5);
            
            // Horizontal connections
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols - 1; col++) {
                    if (TS.Rand.float() > chaos) {
                        const x1 = col * gridSize + gridSize;
                        const y1 = row * gridSize + gridSize / 2;
                        const x2 = (col + 1) * gridSize;
                        const y2 = y1;
                        p.line(x1, y1, x2, y2);
                    }
                }
            }
        }
        
        p.pop();
    }
    
    // Helper function for simple triangulation
    simpleTriangulate(points) {
        const triangles = [];
        
        // Super simple approach - just connect nearby points
        // For real implementation would use Delaunay library
        for (let i = 0; i < points.length - 2; i++) {
            for (let j = i + 1; j < points.length - 1; j++) {
                for (let k = j + 1; k < points.length; k++) {
                    if (TS.Rand.float() < 0.3) { // Randomly create some triangles
                        const p1 = points[i];
                        const p2 = points[j];
                        const p3 = points[k];
                        
                        // Check triangle is not too large
                        const maxDist = 150;
                        const d1 = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
                        const d2 = Math.sqrt(Math.pow(p2.x - p3.x, 2) + Math.pow(p2.y - p3.y, 2));
                        const d3 = Math.sqrt(Math.pow(p3.x - p1.x, 2) + Math.pow(p3.y - p1.y, 2));
                        
                        if (d1 < maxDist && d2 < maxDist && d3 < maxDist) {
                            triangles.push({
                                p1: p1,
                                p2: p2,
                                p3: p3,
                                color: TS.Rand.pick([p1.color, p2.color, p3.color])
                            });
                        }
                    }
                }
            }
        }
        
        return triangles;
    }
    
    // Helper function for Penrose subdivision
    subdividePenroseTriangle(tri) {
        const subdivided = [];
        const phi = (1 + Math.sqrt(5)) / 2;
        
        if (tri.type === 'thick') {
            // Subdivide thick triangle into one thick and one thin
            const midpoint = {
                x: tri.p1.x + (tri.p2.x - tri.p1.x) / phi,
                y: tri.p1.y + (tri.p2.y - tri.p1.y) / phi
            };
            
            subdivided.push({
                type: 'thick',
                p1: tri.p1,
                p2: midpoint,
                p3: tri.p3
            });
            
            subdivided.push({
                type: 'thin',
                p1: midpoint,
                p2: tri.p2,
                p3: tri.p3
            });
        } else {
            // Subdivide thin triangle into one thick and two thin
            const midpoint1 = {
                x: tri.p2.x + (tri.p1.x - tri.p2.x) / phi,
                y: tri.p2.y + (tri.p1.y - tri.p2.y) / phi
            };
            const midpoint2 = {
                x: tri.p2.x + (tri.p3.x - tri.p2.x) / phi,
                y: tri.p2.y + (tri.p3.y - tri.p2.y) / phi
            };
            
            subdivided.push({
                type: 'thin',
                p1: midpoint1,
                p2: tri.p3,
                p3: midpoint2
            });
            
            subdivided.push({
                type: 'thin',
                p1: tri.p1,
                p2: midpoint1,
                p3: tri.p3
            });
            
            subdivided.push({
                type: 'thick',
                p1: midpoint1,
                p2: tri.p2,
                p3: midpoint2
            });
        }
        
        return subdivided;
    }
    
    // Helper function to draw regular polygon
    drawPolygon(p, x, y, radius, sides) {
        p.beginShape();
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            p.vertex(px, py);
        }
        p.endShape(p.CLOSE);
    }
    
    // Helper function to draw star
    drawStar(p, x, y, outerRadius, innerRadius, points) {
        p.beginShape();
        for (let i = 0; i < points * 2; i++) {
            const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            p.vertex(px, py);
        }
        p.endShape(p.CLOSE);
    }
    
    executeTessellation() {
        // Implementation for tessellation algorithm
        const p = this.p5;
        
        // Simplified implementation for now
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("Tessellation (Coming Soon)", this.width/2, this.height/2);
    }
    
    executeWaveInterference() {
        const p = this.p5;
        const complexity = this.params.complexity;
        const density = this.params.density;
        const chaos = this.params.chaos;
        const scale = this.params.scale;
        
        // Wave sources
        const sourceCount = Math.floor(3 + density * 7);
        const sources = [];
        
        // Place wave sources
        for (let i = 0; i < sourceCount; i++) {
            let x, y;
            
            if (this.compositionSystem && i < 4) {
                // First few sources at golden ratio points
                const guide = this.compositionSystem.guides.spiralCenters[i];
                x = guide.x;
                y = guide.y;
            } else {
                x = TS.Rand.float(0, this.width);
                y = TS.Rand.float(0, this.height);
            }
            
            sources.push({
                x: x,
                y: y,
                frequency: 0.01 + TS.Rand.float(0, 0.03) * complexity,
                amplitude: 20 + TS.Rand.float(0, 80) * scale,
                phase: TS.Rand.float(0, Math.PI * 2),
                color: this.pickColor(),
                wavelength: 20 + TS.Rand.float(0, 40)
            });
        }
        
        // Calculate wave interference pattern
        const resolution = Math.floor(5 - complexity * 3);
        const cols = Math.ceil(this.width / resolution);
        const rows = Math.ceil(this.height / resolution);
        
        p.push();
        p.noStroke();
        
        // Features affect rendering
        const hasInterference = this.hasFeature('interference');
        const hasStanding = this.hasFeature('standing');
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const px = x * resolution;
                const py = y * resolution;
                
                let totalWave = 0;
                let colorMix = { r: 0, g: 0, b: 0 };
                let totalWeight = 0;
                
                // Calculate interference from all sources
                sources.forEach(source => {
                    const dx = px - source.x;
                    const dy = py - source.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Wave equation
                    let wave = source.amplitude * Math.sin(
                        distance * source.frequency + source.phase
                    ) / (1 + distance * 0.001);
                    
                    // Standing wave pattern
                    if (hasStanding) {
                        wave *= Math.sin(distance / source.wavelength);
                    }
                    
                    totalWave += wave;
                    
                    // Color mixing based on wave contribution
                    const weight = Math.abs(wave);
                    const rgb = this.hexToRgb(source.color);
                    colorMix.r += rgb.r * weight;
                    colorMix.g += rgb.g * weight;
                    colorMix.b += rgb.b * weight;
                    totalWeight += weight;
                });
                
                // Normalize wave value
                const normalized = (totalWave / sources.length + 1) / 2;
                
                // Apply chaos
                const finalValue = normalized + TS.Rand.float(-0.5, 0.5) * chaos * 0.2;
                
                // Color based on interference
                if (totalWeight > 0) {
                    colorMix.r /= totalWeight;
                    colorMix.g /= totalWeight;
                    colorMix.b /= totalWeight;
                    
                    const alpha = Math.min(1, Math.abs(finalValue - 0.5) * 2 + 0.1);
                    const color = this.rgbToHex(
                        Math.floor(colorMix.r),
                        Math.floor(colorMix.g),
                        Math.floor(colorMix.b)
                    );
                    
                    p.fill(color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
                    p.rect(px, py, resolution, resolution);
                    
                    // SVG (sample every few pixels)
                    if (x % 5 === 0 && y % 5 === 0) {
                        this.svgPaths.push({
                            type: 'rect',
                            x: px,
                            y: py,
                            width: resolution * 5,
                            height: resolution * 5,
                            fill: color,
                            opacity: alpha
                        });
                    }
                }
            }
        }
        
        // Draw wave sources
        sources.forEach(source => {
            p.fill(source.color);
            p.noStroke();
            p.ellipse(source.x, source.y, 10 * scale);
            
            // Ripple rings
            p.noFill();
            p.stroke(source.color + '40');
            for (let r = 1; r <= 3; r++) {
                p.strokeWeight(0.5);
                p.ellipse(source.x, source.y, source.wavelength * r * 2);
            }
            
            // SVG
            this.svgPaths.push({
                type: 'circle',
                cx: source.x,
                cy: source.y,
                r: 5 * scale,
                fill: source.color
            });
        });
        
        p.pop();
    }
    
    executeHybrid() {
        const p = this.p5;
        
        // Hybrid mode combines 2-3 algorithms
        const algorithms = ['flow', 'rings', 'particles', 'tessellation', 'waves'];
        const selected = [];
        
        // Pick 2-3 algorithms
        const count = 2 + TS.Rand.int(0, 2);
        while (selected.length < count) {
            const algo = TS.Rand.pick(algorithms);
            if (!selected.includes(algo)) {
                selected.push(algo);
            }
        }
        
        // Execute each with reduced intensity
        const originalDensity = this.params.density;
        const originalComplexity = this.params.complexity;
        
        selected.forEach((algo, index) => {
            // Reduce parameters for layering
            this.params.density = originalDensity * (0.3 + index * 0.2);
            this.params.complexity = originalComplexity * (0.5 + index * 0.2);
            
            // Add transparency for layering
            p.push();
            if (index > 0) {
                p.drawingContext.globalAlpha = 0.7 / index;
            }
            
            switch(algo) {
                case 'flow':
                    this.executeFlowFields();
                    break;
                case 'rings':
                    this.executeRingSystem();
                    break;
                case 'particles':
                    this.executeParticleSwarm();
                    break;
                case 'tessellation':
                    this.executeTessellation();
                    break;
                case 'waves':
                    this.executeWaveInterference();
                    break;
            }
            
            p.pop();
        });
        
        // Restore original parameters
        this.params.density = originalDensity;
        this.params.complexity = originalComplexity;
        
        // Update stats to show hybrid algorithms
        if (document.getElementById('current-algorithm')) {
            document.getElementById('current-algorithm').textContent = `Hybrid: ${selected.join(' + ')}`;
        }
    }
    
    applyEffects() {
        // Apply special effects based on features
        if (this.hasFeature('glitch')) {
            // Glitch effect implementation
        }
        
        if (this.hasFeature('blur')) {
            // Blur effect implementation
        }
    }
    
    // Utility functions
    hasFeature(name) {
        return this.features.some(f => f.name === name);
    }
    
    pickColor() {
        return TS.Rand.pick(this.palette.colors, this.palette.weights);
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    rgbToHsb(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        let h = 0;
        let s = max === 0 ? 0 : delta / max;
        let v = max;
        
        if (delta !== 0) {
            if (max === r) {
                h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
            } else if (max === g) {
                h = ((b - r) / delta + 2) / 6;
            } else {
                h = ((r - g) / delta + 4) / 6;
            }
        }
        
        return { h: h, s: s, b: v };
    }
    
    hsbToRgb(h, s, b) {
        let r, g, blue;
        
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = b * (1 - s);
        const q = b * (1 - f * s);
        const t = b * (1 - (1 - f) * s);
        
        switch (i % 6) {
            case 0: r = b, g = t, blue = p; break;
            case 1: r = q, g = b, blue = p; break;
            case 2: r = p, g = b, blue = t; break;
            case 3: r = p, g = q, blue = b; break;
            case 4: r = t, g = p, blue = b; break;
            case 5: r = b, g = p, blue = q; break;
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(blue * 255)
        };
    }
    
    updateStats() {
        // Update UI with current stats
        const updateElement = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        
        if (this.algorithm) {
            updateElement('current-algorithm', 
                this.algorithm.charAt(0).toUpperCase() + this.algorithm.slice(1));
        }
        if (this.palette) {
            updateElement('current-palette', this.palette.name);
        }
        updateElement('complexity-score', Math.floor(this.params.complexity * 100) + '%');
        if (this.seed) {
            updateElement('current-seed', this.seed.toString().slice(-8));
        }
        
        // Update features
        const featuresEl = document.getElementById('active-features');
        if (featuresEl) {
            featuresEl.innerHTML = '';
            
            this.features.forEach(feature => {
                const badge = document.createElement('div');
                badge.className = 'feature-badge';
                if (feature.rarity === 'rare') badge.className += ' rare';
                if (feature.rarity === 'epic') badge.className += ' epic';
                badge.textContent = feature.name;
                featuresEl.appendChild(badge);
            });
        }
    }
    
    // Control functions
    setAlgorithm(algo) {
        this.generate();
    }
    
    setPalette(palette) {
        this.generate();
    }
    
    mutate() {
        // Slightly modify current parameters
        Object.keys(this.params).forEach(key => {
            if (TS.Rand.float() < 0.3) {
                const current = this.params[key];
                const change = TS.Rand.float(-0.5, 0.5) * 0.2;
                this.params[key] = Math.max(0, Math.min(1, current + change));
                
                // Update UI
                const slider = document.getElementById(key);
                const value = document.getElementById(`${key}-value`);
                if (slider) {
                    slider.value = this.params[key];
                    value.textContent = this.params[key].toFixed(2);
                }
            }
        });
        
        this.generate();
    }
    
    surprise() {
        // Randomize everything
        Object.keys(this.params).forEach(key => {
            this.params[key] = TS.Rand.float();
            
            // Update UI
            const slider = document.getElementById(key);
            const value = document.getElementById(`${key}-value`);
            if (slider) {
                slider.value = this.params[key];
                value.textContent = this.params[key].toFixed(2);
            }
        });
        
        // Random algorithm and palette
        document.getElementById('algorithm-select').value = 'auto';
        document.getElementById('palette-select').value = 'auto';
        
        this.generate();
    }
    
    saveImage() {
        this.p5.save(`total-serialism-v3-${this.seed}.png`);
    }
    
    saveSVG() {
        let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
<rect width="${this.width}" height="${this.height}" fill="#141414"/>
<g>`;

        this.svgPaths.forEach(path => {
            if (path.type === 'line') {
                svg += `\n<line x1="${path.x1}" y1="${path.y1}" x2="${path.x2}" y2="${path.y2}" stroke="${path.stroke}" stroke-width="${path.strokeWidth}" opacity="${path.opacity || 1}" stroke-linecap="round"/>`;
            } else if (path.type === 'circle') {
                const fill = path.fill || 'none';
                const stroke = path.stroke || 'none';
                const strokeWidth = path.strokeWidth || 1;
                const opacity = path.opacity || 1;
                svg += `\n<circle cx="${path.cx}" cy="${path.cy}" r="${path.r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`;
            } else if (path.type === 'polygon') {
                const fill = path.fill || 'none';
                const stroke = path.stroke || 'none';
                const strokeWidth = path.strokeWidth || 1;
                const opacity = path.opacity || 1;
                svg += `\n<polygon points="${path.points}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`;
            } else if (path.type === 'rect') {
                const fill = path.fill || 'none';
                const opacity = path.opacity || 1;
                svg += `\n<rect x="${path.x}" y="${path.y}" width="${path.width}" height="${path.height}" fill="${fill}" opacity="${opacity}"/>`;
            }
        });
        
        svg += '\n</g>\n</svg>';
        
        // Download
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `total-serialism-v3-${this.seed}.svg`;
        link.click();
        URL.revokeObjectURL(url);
    }
}

// Export the class for browser environment
if (typeof window !== 'undefined') {
    window.TotalSerialismArtwork = TotalSerialismArtwork;
}

// Initialize artwork system
let artwork;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        artwork = new TotalSerialismArtwork();
        window.artwork = artwork;
        artwork.init();
    });
} else {
    // DOM already loaded
    artwork = new TotalSerialismArtwork();
    window.artwork = artwork;
    artwork.init();
}

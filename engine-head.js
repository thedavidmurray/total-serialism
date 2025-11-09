// Total Serialism v3 Engine - Maximum Variety & Beauty
// Inspired by Fidenza, QQL, and FxHash best practices

// Import collision detection system
let CollisionDetectionSystem, CollisionStrategies;
if (typeof require !== 'undefined' && typeof module !== 'undefined' && module.exports) {
    const collision = require('./collision-detection.js');
    CollisionDetectionSystem = collision.CollisionDetectionSystem;
    CollisionStrategies = collision.CollisionStrategies;
} else {
    // For browser environment, assume it's loaded separately
    CollisionDetectionSystem = window.CollisionDetectionSystem;
    CollisionStrategies = window.CollisionStrategies;
}

// Import golden ratio composition system
let GoldenRatioComposition;
if (typeof require !== 'undefined' && typeof module !== 'undefined' && module.exports) {
    GoldenRatioComposition = require('./golden-ratio-composition.js');
} else {
    GoldenRatioComposition = window.GoldenRatioComposition;
}

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

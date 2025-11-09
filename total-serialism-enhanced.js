// Total Serialism Enhanced - v2 with SVG export and advanced controls

// Total Serialism implementation
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
                (Math.sin((i / n * periods + phase) * 2 * Math.PI) + 1) / 2)
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
        fibonacci: (n) => {
            const seq = [0, 1];
            for (let i = 2; i < n; i++) {
                seq.push(seq[i-1] + seq[i-2]);
            }
            return seq;
        },
        hexBeat: (pattern) => {
            return pattern.split('').map(c => c === 'x' ? 1 : 0);
        }
    },
    Rand: {
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

// Global variables
let flowField = [];
let particles = [];
let palette = [];
let rhythmPatterns = {};
let isPaused = false;
let showDebug = false;
let svgPaths = [];
let isRecordingSVG = false;

// A3 dimensions at 150 DPI
const A3_WIDTH = 1754;
const A3_HEIGHT = 2480;
const SCALE_FACTOR = 0.35;

// Display dimensions
const DISPLAY_WIDTH = A3_WIDTH * SCALE_FACTOR;
const DISPLAY_HEIGHT = A3_HEIGHT * SCALE_FACTOR;

// Control parameters with defaults
let params = {
    particleCount: 168,
    minSize: 1,
    maxSize: 8,
    speedRange: 2,
    lifeRange: 500,
    flowStrength: 1,
    flowComplexity: 3,
    turbulence: 0.5,
    fieldResolution: 15,
    colorScheme: 0,
    saturation: 60,
    brightness: 50,
    alphaRange: 40,
    mainRhythm: 16,
    accentPattern: 23,
    rhythmInfluence: 0.5,
    bgDensity: 0.3,
    textureScale: 40,
    renderMode: 'flow',
    blendMode: 'normal'
};

// SVG recording functions
function startSVGRecording() {
    svgPaths = [];
    isRecordingSVG = true;
}

function recordSVGPath(x1, y1, x2, y2, color, strokeWeight, alpha) {
    if (!isRecordingSVG) return;
    
    svgPaths.push({
        type: 'line',
        x1: x1 / SCALE_FACTOR,
        y1: y1 / SCALE_FACTOR,
        x2: x2 / SCALE_FACTOR,
        y2: y2 / SCALE_FACTOR,
        stroke: `hsla(${color.h}, ${color.s}%, ${color.b}%, ${alpha / 100})`,
        strokeWidth: strokeWeight / SCALE_FACTOR
    });
}

function recordSVGEllipse(x, y, w, h, color, alpha) {
    if (!isRecordingSVG) return;
    
    svgPaths.push({
        type: 'ellipse',
        cx: x / SCALE_FACTOR,
        cy: y / SCALE_FACTOR,
        rx: w / 2 / SCALE_FACTOR,
        ry: h / 2 / SCALE_FACTOR,
        fill: `hsla(${color.h}, ${color.s}%, ${color.b}%, ${alpha / 100})`
    });
}

function generateSVG() {
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${A3_WIDTH}" height="${A3_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
<rect width="${A3_WIDTH}" height="${A3_HEIGHT}" fill="white"/>
<g>`;

    svgPaths.forEach(path => {
        if (path.type === 'line') {
            svg += `\n<line x1="${path.x1}" y1="${path.y1}" x2="${path.x2}" y2="${path.y2}" stroke="${path.stroke}" stroke-width="${path.strokeWidth}" stroke-linecap="round"/>`;
        } else if (path.type === 'ellipse') {
            svg += `\n<ellipse cx="${path.cx}" cy="${path.cy}" rx="${path.rx}" ry="${path.ry}" fill="${path.fill}"/>`;
        }
    });
    
    svg += '\n</g>\n</svg>';
    return svg;
}

// p5.js functions
function setup() {
    const canvas = createCanvas(DISPLAY_WIDTH, DISPLAY_HEIGHT);
    canvas.parent('canvas-container');
    pixelDensity(2);
    
    setupControls();
    regenerate();
}

function setupControls() {
    // Add event listeners to all controls
    Object.keys(params).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.addEventListener('input', (e) => {
                const value = e.target.type === 'range' ? parseFloat(e.target.value) : e.target.value;
                params[key] = value;
                
                // Update value display
                const valueDisplay = document.getElementById(`${key}-value`);
                if (valueDisplay) {
                    if (key === 'mainRhythm') {
                        valueDisplay.textContent = `${value}/${Math.floor(value * 0.4375)}`;
                    } else if (key === 'accentPattern') {
                        valueDisplay.textContent = `${value}/${Math.floor(value * 0.39)}`;
                    } else {
                        valueDisplay.textContent = value;
                    }
                }
                
                // Regenerate for certain parameters
                if (['colorScheme', 'fieldResolution', 'flowComplexity'].includes(key)) {
                    regenerate();
                }
            });
        }
    });
}

function regenerate() {
    clear();
    particles = [];
    svgPaths = [];
    
    generateHarmonicPalette();
    generateRhythmPatterns();
    createBackground();
    generateFlowField();
    createParticles();
    
    // Start SVG recording for initial generation
    startSVGRecording();
    
    // Render initial frame
    push();
    colorMode(HSB);
    
    particles.forEach((p, i) => {
        for (let j = 0; j < 5; j++) {
            updateParticle(p, i);
            drawParticle(p);
        }
    });
    
    pop();
    
    isRecordingSVG = false;
}

function generateHarmonicPalette() {
    const schemes = [
        { base: 0, intervals: [0, 60, 120, 180, 240], name: "Complementary" },
        { base: 30, intervals: [0, 30, 60, 150, 180], name: "Analogous" },
        { base: 200, intervals: [0, 120, 240], name: "Triadic" },
        { base: 120, intervals: [0, 90, 180, 270], name: "Square" },
        { base: 300, intervals: [0, 15, 30, 45, 180], name: "Split Comp" },
        { base: random(360), intervals: [0, 5, 10, 15, 20], name: "Monochromatic" },
        { base: random(360), intervals: TS.Rand.random(5, 0, 360), name: "Random Harmonic" }
    ];
    
    const scheme = schemes[params.colorScheme];
    const satWeights = TS.Gen.spreadExp(5, 1.5);
    const brightWeights = TS.Gen.cosine(5, 0.5, 0.25);
    
    // Add more variation factors
    const hueShift = TS.Rand.drunk(5, 0.02, -1, 1, 0);
    const satVariation = TS.Rand.random(5, 0.8, 1.2);
    const brightVariation = TS.Rand.random(5, 0.9, 1.1);
    
    palette = scheme.intervals.map((interval, i) => {
        const hue = (scheme.base + interval + hueShift[i] * 30) % 360;
        
        return {
            h: hue,
            s: Math.min(100, params.saturation * satWeights[i] * satVariation[i] / 60),
            b: Math.min(100, params.brightness * brightWeights[i] * brightVariation[i] / 50),
            weight: Math.random(),
            scheme: scheme.name
        };
    });
    
    // Sort by weight
    palette.sort((a, b) => b.weight - a.weight);
}

function generateRhythmPatterns() {
    const mainHits = Math.floor(params.mainRhythm * 0.4375);
    const accentHits = Math.floor(params.accentPattern * 0.39);
    
    rhythmPatterns = {
        main: TS.Algo.euclid(params.mainRhythm, mainHits),
        accent: TS.Algo.euclid(params.accentPattern, accentHits),
        micro: TS.Algo.euclid(31, 13),
        pulse: TS.Algo.hexBeat('x..x..x.xx.x..x.'),
        fibonacci: TS.Algo.fibonacci(16).map(n => n % 2)
    };
}

function createBackground() {
    push();
    colorMode(HSB);
    
    const bgColor = palette[0];
    background(bgColor.h, bgColor.s * 0.2, 95);
    
    if (params.bgDensity > 0) {
        noStroke();
        
        // Create texture grid
        for (let y = 0; y < height; y += params.textureScale) {
            for (let x = 0; x < width; x += params.textureScale) {
                if (Math.random() < params.bgDensity) {
                    const color = TS.Rand.pick(palette, palette.map(p => p.weight));
                    const alpha = 5 + Math.random() * 15;
                    fill(color.h, color.s * 0.3, 90, alpha);
                    
                    const size = params.textureScale * (0.5 + Math.random() * 0.5);
                    ellipse(x + params.textureScale/2, y + params.textureScale/2, size);
                    
                    recordSVGEllipse(
                        x + params.textureScale/2, 
                        y + params.textureScale/2, 
                        size, size, 
                        {h: color.h, s: color.s * 0.3, b: 90}, 
                        alpha
                    );
                }
            }
        }
    }
    
    pop();
}

function generateFlowField() {
    const cols = Math.ceil(width / params.fieldResolution);
    const rows = Math.ceil(height / params.fieldResolution);
    
    // Generate multiple wave layers based on complexity
    const waveLayers = [];
    for (let i = 0; i < params.flowComplexity; i++) {
        waveLayers.push({
            xWave: TS.Gen.cosine(cols, 2 + i, i * 0.3),
            yWave: TS.Gen.sine(rows, 1 + i * 0.5, i * 0.2),
            weight: 1 / (i + 1)
        });
    }
    
    // Add turbulence
    const turbulenceField = TS.Rand.drunk(cols * rows, params.turbulence * 0.3);
    
    flowField = [];
    for (let y = 0; y < rows; y++) {
        flowField[y] = [];
        for (let x = 0; x < cols; x++) {
            const idx = y * cols + x;
            
            // Combine wave layers
            let angle = 0;
            waveLayers.forEach(layer => {
                const xInfluence = layer.xWave[x % layer.xWave.length];
                const yInfluence = layer.yWave[y % layer.yWave.length];
                angle += (xInfluence + yInfluence) * layer.weight;
            });
            
            // Add rhythm influence
            const rhythmIdx = idx % rhythmPatterns.main.length;
            angle += rhythmPatterns.main[rhythmIdx] * params.rhythmInfluence;
            
            // Add turbulence
            angle += turbulenceField[idx % turbulenceField.length];
            
            flowField[y][x] = angle * TWO_PI * params.flowStrength;
        }
    }
}

function createParticles() {
    particles = [];
    
    // Generate spawn patterns with more variation
    const spawnMethods = [
        generateGoldenSpiral,
        generateRhythmicGrid,
        generateClusteredPoints,
        generateFlowLines,
        generatePhyllotaxis,
        generateLissajous
    ];
    
    const points = TS.Rand.pick(spawnMethods)(params.particleCount);
    
    particles = points.map((point, i) => {
        const color = TS.Rand.pick(palette, palette.map(p => p.weight));
        const rhythm = rhythmPatterns.accent[i % rhythmPatterns.accent.length];
        
        // More size variation
        const sizeVariation = TS.Rand.pick([0.5, 0.7, 1, 1.3, 1.5, 2]);
        const baseSize = params.minSize + Math.random() * (params.maxSize - params.minSize);
        
        return {
            x: point.x,
            y: point.y,
            prevX: point.x,
            prevY: point.y,
            color: color,
            size: baseSize * sizeVariation,
            life: 100 + Math.random() * params.lifeRange,
            speed: 0.5 + Math.random() * params.speedRange,
            age: 0,
            behavior: TS.Rand.pick(['flow', 'flow', 'flow', 'spiral', 'wave', 'orbit']),
            variation: Math.random(),
            phase: Math.random() * TWO_PI,
            amplitude: 5 + Math.random() * 20
        };
    });
}

function generateGoldenSpiral(count) {
    const points = [];
    const golden = (1 + Math.sqrt(5)) / 2;
    const angleStep = TWO_PI / golden;
    
    for (let i = 0; i < count; i++) {
        const radius = sqrt(i) * 10;
        const angle = i * angleStep;
        
        points.push({
            x: width / 2 + cos(angle) * radius,
            y: height / 2 + sin(angle) * radius
        });
    }
    return points;
}

function generateRhythmicGrid(count) {
    const points = [];
    const gridSize = Math.ceil(Math.sqrt(count));
    const cellSize = Math.min(width, height) / gridSize;
    
    let i = 0;
    for (let y = 0; y < gridSize && i < count; y++) {
        for (let x = 0; x < gridSize && i < count; x++) {
            const rhythmX = rhythmPatterns.main[x % rhythmPatterns.main.length];
            const rhythmY = rhythmPatterns.accent[y % rhythmPatterns.accent.length];
            
            if (rhythmX || rhythmY || Math.random() < 0.3) {
                const jitter = TS.Rand.random(2, -cellSize * 0.3, cellSize * 0.3);
                points.push({
                    x: (x + 0.5) * cellSize + jitter[0],
                    y: (y + 0.5) * cellSize + jitter[1]
                });
                i++;
            }
        }
    }
    
    while (points.length < count) {
        points.push({
            x: Math.random() * width,
            y: Math.random() * height
        });
    }
    
    return points;
}

function generateClusteredPoints(count) {
    const points = [];
    const clusters = 3 + Math.floor(Math.random() * 4);
    const centersX = TS.Rand.random(clusters, width * 0.15, width * 0.85);
    const centersY = TS.Rand.random(clusters, height * 0.15, height * 0.85);
    const spreads = TS.Gen.spreadFloat(clusters, 50, 250);
    
    for (let i = 0; i < count; i++) {
        const cluster = i % clusters;
        const angle = Math.random() * TWO_PI;
        const dist = Math.random() * spreads[cluster];
        
        points.push({
            x: centersX[cluster] + cos(angle) * dist,
            y: centersY[cluster] + sin(angle) * dist
        });
    }
    return points;
}

function generateFlowLines(count) {
    const points = [];
    const lines = 5 + Math.floor(Math.random() * 5);
    const pointsPerLine = Math.floor(count / lines);
    
    for (let l = 0; l < lines; l++) {
        const startX = Math.random() * width;
        const amplitude = 50 + Math.random() * 200;
        const frequency = 1 + Math.random() * 3;
        const phase = Math.random() * TWO_PI;
        
        for (let p = 0; p < pointsPerLine; p++) {
            const t = p / pointsPerLine;
            points.push({
                x: startX + sin(t * frequency * TWO_PI + phase) * amplitude,
                y: t * height
            });
        }
    }
    return points;
}

function generatePhyllotaxis(count) {
    const points = [];
    const angle = 137.5 * Math.PI / 180; // Golden angle
    const scaling = 8;
    
    for (let i = 0; i < count; i++) {
        const radius = scaling * sqrt(i);
        const theta = i * angle;
        
        points.push({
            x: width / 2 + cos(theta) * radius,
            y: height / 2 + sin(theta) * radius
        });
    }
    return points;
}

function generateLissajous(count) {
    const points = [];
    const a = 3 + Math.floor(Math.random() * 5);
    const b = 2 + Math.floor(Math.random() * 5);
    const delta = Math.random() * Math.PI;
    
    for (let i = 0; i < count; i++) {
        const t = (i / count) * TWO_PI;
        points.push({
            x: width / 2 + sin(a * t + delta) * width * 0.4,
            y: height / 2 + sin(b * t) * height * 0.4
        });
    }
    return points;
}

function draw() {
    if (isPaused) return;
    
    push();
    colorMode(HSB);
    
    // Set blend mode
    if (params.blendMode !== 'normal') {
        switch(params.blendMode) {
            case 'multiply': blendMode(MULTIPLY); break;
            case 'screen': blendMode(SCREEN); break;
            case 'overlay': blendMode(OVERLAY); break;
        }
    }
    
    // Draw particles
    particles.forEach((p, i) => {
        if (p.age < p.life) {
            updateParticle(p, i);
            drawParticle(p);
            p.age++;
        }
    });
    
    // Add accent shapes periodically
    if (frameCount % 60 === 0) {
        drawAccentShapes();
    }
    
    // Debug info
    if (showDebug) {
        drawDebugInfo();
    }
    
    pop();
}

function updateParticle(p, index) {
    const col = Math.floor(p.x / params.fieldResolution);
    const row = Math.floor(p.y / params.fieldResolution);
    
    if (flowField[row] && flowField[row][col]) {
        const angle = flowField[row][col];
        
        switch (p.behavior) {
            case 'flow':
                p.x += cos(angle) * p.speed;
                p.y += sin(angle) * p.speed;
                break;
                
            case 'spiral':
                const spiralAngle = angle + p.age * 0.05;
                p.x += cos(spiralAngle) * p.speed;
                p.y += sin(spiralAngle) * p.speed;
                break;
                
            case 'wave':
                const waveOffset = sin(p.age * 0.1 + p.phase) * p.amplitude;
                p.x += cos(angle) * p.speed + cos(angle + PI/2) * waveOffset * 0.1;
                p.y += sin(angle) * p.speed + sin(angle + PI/2) * waveOffset * 0.1;
                break;
                
            case 'orbit':
                const orbitRadius = 20 + sin(p.age * 0.05) * 10;
                const orbitAngle = p.age * 0.1;
                p.x += cos(angle) * p.speed + cos(orbitAngle) * orbitRadius * 0.1;
                p.y += sin(angle) * p.speed + sin(orbitAngle) * orbitRadius * 0.1;
                break;
        }
        
        // Add micro rhythm influence
        const microRhythm = rhythmPatterns.micro[index % rhythmPatterns.micro.length];
        if (microRhythm) {
            p.x += (Math.random() - 0.5) * p.variation * 2;
            p.y += (Math.random() - 0.5) * p.variation * 2;
        }
    }
    
    // Boundary behavior
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
}

function drawParticle(p) {
    const alpha = params.alphaRange * (1 - p.age / p.life);
    
    switch (params.renderMode) {
        case 'flow':
            strokeWeight(p.size);
            stroke(p.color.h, p.color.s, p.color.b, alpha);
            line(p.prevX, p.prevY, p.x, p.y);
            recordSVGPath(p.prevX, p.prevY, p.x, p.y, p.color, p.size, alpha);
            break;
            
        case 'dots':
            noStroke();
            fill(p.color.h, p.color.s, p.color.b, alpha);
            ellipse(p.x, p.y, p.size * 2);
            recordSVGEllipse(p.x, p.y, p.size * 2, p.size * 2, p.color, alpha);
            break;
            
        case 'ribbons':
            strokeWeight(p.size * 3);
            stroke(p.color.h, p.color.s, p.color.b, alpha * 0.5);
            line(p.prevX, p.prevY, p.x, p.y);
            recordSVGPath(p.prevX, p.prevY, p.x, p.y, p.color, p.size * 3, alpha * 0.5);
            break;
            
        case 'curves':
            noFill();
            strokeWeight(p.size);
            stroke(p.color.h, p.color.s, p.color.b, alpha);
            const cp1x = p.prevX + (p.x - p.prevX) * 0.5;
            const cp1y = p.prevY + (p.y - p.prevY) * 0.5 + sin(p.age * 0.1) * 10;
            bezier(p.prevX, p.prevY, cp1x, cp1y, cp1x, cp1y, p.x, p.y);
            break;
            
        case 'mixed':
            if (p.variation < 0.3) {
                strokeWeight(p.size);
                stroke(p.color.h, p.color.s, p.color.b, alpha);
                line(p.prevX, p.prevY, p.x, p.y);
                recordSVGPath(p.prevX, p.prevY, p.x, p.y, p.color, p.size, alpha);
            } else if (p.variation < 0.6) {
                noStroke();
                fill(p.color.h, p.color.s, p.color.b, alpha);
                ellipse(p.x, p.y, p.size * 2);
                recordSVGEllipse(p.x, p.y, p.size * 2, p.size * 2, p.color, alpha);
            } else {
                strokeWeight(p.size * 2);
                stroke(p.color.h, p.color.s, p.color.b, alpha * 0.7);
                line(p.prevX, p.prevY, p.x, p.y);
                recordSVGPath(p.prevX, p.prevY, p.x, p.y, p.color, p.size * 2, alpha * 0.7);
            }
            break;
    }
    
    // Update previous position
    p.prevX = p.x;
    p.prevY = p.y;
}

function drawAccentShapes() {
    const pulseIndex = Math.floor(frameCount / 60) % rhythmPatterns.pulse.length;
    
    if (rhythmPatterns.pulse[pulseIndex]) {
        push();
        noStroke();
        const color = TS.Rand.pick(palette, palette.map(p => p.weight));
        const alpha = 10 + Math.random() * 20;
        fill(color.h, color.s * 0.7, color.b, alpha);
        
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = TS.Rand.pick(TS.Algo.fibonacci(8).slice(4)) * 15;
        
        ellipse(x, y, size, size * 0.618);
        recordSVGEllipse(x, y, size, size * 0.618, 
            {h: color.h, s: color.s * 0.7, b: color.b}, alpha);
        pop();
    }
}

function drawDebugInfo() {
    push();
    fill(0);
    noStroke();
    rect(10, 10, 200, 100);
    fill(255);
    textAlign(LEFT, TOP);
    text(`Particles: ${particles.filter(p => p.age < p.life).length}`, 15, 15);
    text(`FPS: ${Math.round(frameRate())}`, 15, 30);
    text(`Frame: ${frameCount}`, 15, 45);
    text(`SVG Paths: ${svgPaths.length}`, 15, 60);
    pop();
}

// Control functions
function regenerate() {
    setup();
}

function saveAsPNG() {
    save(`total-serialism-${Date.now()}.png`);
}

function saveAsSVG() {
    // Record current frame to SVG
    startSVGRecording();
    
    // Redraw all particles with their current state
    push();
    colorMode(HSB);
    
    // Redraw background
    svgPaths = [];
    createBackground();
    
    // Draw all active particles
    particles.forEach((p, i) => {
        if (p.age < p.life) {
            drawParticle(p);
        }
    });
    
    pop();
    isRecordingSVG = false;
    
    // Generate and download SVG
    const svgContent = generateSVG();
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `total-serialism-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
}

function togglePause() {
    isPaused = !isPaused;
}

// Preset functions
function savePreset() {
    const preset = {
        ...params,
        timestamp: Date.now(),
        version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `total-serialism-preset-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function loadPreset() {
    document.getElementById('presetFile').click();
}

function loadPresetFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const preset = JSON.parse(e.target.result);
            
            // Apply preset values
            Object.keys(preset).forEach(key => {
                if (params.hasOwnProperty(key)) {
                    params[key] = preset[key];
                    
                    // Update UI
                    const element = document.getElementById(key);
                    if (element) {
                        element.value = preset[key];
                        
                        // Update value display
                        const valueDisplay = document.getElementById(`${key}-value`);
                        if (valueDisplay) {
                            if (key === 'mainRhythm') {
                                valueDisplay.textContent = `${preset[key]}/${Math.floor(preset[key] * 0.4375)}`;
                            } else if (key === 'accentPattern') {
                                valueDisplay.textContent = `${preset[key]}/${Math.floor(preset[key] * 0.39)}`;
                            } else {
                                valueDisplay.textContent = preset[key];
                            }
                        }
                    }
                }
            });
            
            regenerate();
        } catch (err) {
            console.error('Error loading preset:', err);
            alert('Error loading preset file');
        }
    };
    reader.readAsText(file);
}

function randomizeAll() {
    // Randomize all parameters
    params.particleCount = Math.floor(50 + Math.random() * 450);
    params.minSize = 0.5 + Math.random() * 4.5;
    params.maxSize = Math.max(params.minSize + 1, 2 + Math.random() * 18);
    params.speedRange = 0.5 + Math.random() * 4.5;
    params.lifeRange = 100 + Math.random() * 900;
    params.flowStrength = Math.random() * 3;
    params.flowComplexity = Math.floor(1 + Math.random() * 6);
    params.turbulence = Math.random() * 2;
    params.fieldResolution = 5 + Math.floor(Math.random() * 6) * 5;
    params.colorScheme = Math.floor(Math.random() * 7);
    params.saturation = Math.random() * 100;
    params.brightness = 20 + Math.random() * 60;
    params.alphaRange = 10 + Math.random() * 90;
    params.mainRhythm = 8 + Math.floor(Math.random() * 24);
    params.accentPattern = 13 + Math.floor(Math.random() * 21);
    params.rhythmInfluence = Math.random();
    params.bgDensity = Math.random();
    params.textureScale = 10 + Math.floor(Math.random() * 10) * 10;
    params.renderMode = ['flow', 'dots', 'ribbons', 'curves', 'mixed'][Math.floor(Math.random() * 5)];
    params.blendMode = ['normal', 'multiply', 'screen', 'overlay'][Math.floor(Math.random() * 4)];
    
    // Update all UI elements
    Object.keys(params).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = params[key];
            
            // Update value display
            const valueDisplay = document.getElementById(`${key}-value`);
            if (valueDisplay) {
                if (key === 'mainRhythm') {
                    valueDisplay.textContent = `${params[key]}/${Math.floor(params[key] * 0.4375)}`;
                } else if (key === 'accentPattern') {
                    valueDisplay.textContent = `${params[key]}/${Math.floor(params[key] * 0.39)}`;
                } else {
                    valueDisplay.textContent = params[key];
                }
            }
        }
    });
    
    regenerate();
}

// Keyboard controls
function keyPressed() {
    switch (key) {
        case 'r':
        case 'R':
            regenerate();
            break;
            
        case 'p':
        case 'P':
            saveAsPNG();
            break;
            
        case 's':
        case 'S':
            saveAsSVG();
            break;
            
        case ' ':
            togglePause();
            break;
            
        case 'd':
        case 'D':
            showDebug = !showDebug;
            break;
            
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
            params.colorScheme = parseInt(key) - 1;
            document.getElementById('colorScheme').value = params.colorScheme;
            regenerate();
            break;
    }
}
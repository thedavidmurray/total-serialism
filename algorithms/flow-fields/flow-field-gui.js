const canvasSketch = require('canvas-sketch');
const { lerp } = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');

// Import dat.GUI
let gui;
if (typeof window !== 'undefined') {
  const dat = require('dat.gui');
  gui = new dat.GUI();
}

// Configurable parameters with defaults
const params = {
  seed: random.getRandomSeed(),
  // Flow field
  noiseScale: 0.002,
  noiseStrength: 1,
  fieldType: 'curl', // 'curl', 'perlin', 'turbulent'
  // Particles
  particleCount: 2000,
  stepLength: 2,
  steps: 100,
  lineWidth: 0.5,
  // Starting position
  startPattern: 'random', // 'random', 'grid', 'circle', 'edge'
  // Grid
  margin: 20,
  // Aesthetics
  fadeEdges: true,
  fadeStrength: 50,
  // Actions
  regenerate: () => generateAndDraw(),
  exportSVG: () => exportCurrentSVG(),
  saveParams: () => saveParameters(),
  randomize: () => randomizeParams()
};

let currentSketch = null;
let currentProps = null;

// Set up GUI
if (gui) {
  const fieldFolder = gui.addFolder('Flow Field');
  fieldFolder.add(params, 'noiseScale', 0.0001, 0.01).onChange(generateAndDraw);
  fieldFolder.add(params, 'noiseStrength', 0.1, 3).onChange(generateAndDraw);
  fieldFolder.add(params, 'fieldType', ['curl', 'perlin', 'turbulent']).onChange(generateAndDraw);
  fieldFolder.open();
  
  const particleFolder = gui.addFolder('Particles');
  particleFolder.add(params, 'particleCount', 100, 10000).step(100).onChange(generateAndDraw);
  particleFolder.add(params, 'stepLength', 0.5, 10).onChange(generateAndDraw);
  particleFolder.add(params, 'steps', 10, 500).step(10).onChange(generateAndDraw);
  particleFolder.add(params, 'lineWidth', 0.1, 2).onChange(generateAndDraw);
  particleFolder.add(params, 'startPattern', ['random', 'grid', 'circle', 'edge']).onChange(generateAndDraw);
  particleFolder.open();
  
  const aestheticFolder = gui.addFolder('Aesthetics');
  aestheticFolder.add(params, 'margin', 0, 100).onChange(generateAndDraw);
  aestheticFolder.add(params, 'fadeEdges').onChange(generateAndDraw);
  aestheticFolder.add(params, 'fadeStrength', 10, 200).onChange(generateAndDraw);
  
  const actionFolder = gui.addFolder('Actions');
  actionFolder.add(params, 'regenerate').name('Regenerate (same seed)');
  actionFolder.add(params, 'randomize').name('Randomize Params');
  actionFolder.add(params, 'exportSVG').name('Export SVG');
  actionFolder.add(params, 'saveParams').name('Save Parameters');
  actionFolder.add(params, 'seed').listen().name('Current Seed');
  actionFolder.open();
}

// Save current parameters
function saveParameters() {
  const paramData = {
    algorithm: 'flow-field-gui',
    timestamp: new Date().toISOString(),
    params: { ...params }
  };
  
  // Remove functions from saved params
  delete paramData.params.regenerate;
  delete paramData.params.exportSVG;
  delete paramData.params.saveParams;
  delete paramData.params.randomize;
  
  console.log('=== SAVED PARAMETERS ===');
  console.log(JSON.stringify(paramData, null, 2));
  console.log('======================');
  
  // Also save to localStorage
  const savedParams = JSON.parse(localStorage.getItem('flowFieldParams') || '[]');
  savedParams.push(paramData);
  localStorage.setItem('flowFieldParams', JSON.stringify(savedParams));
  
  alert('Parameters saved! Check console for JSON.');
}

// Randomize parameters
function randomizeParams() {
  params.noiseScale = random.range(0.0001, 0.01);
  params.noiseStrength = random.range(0.1, 3);
  params.particleCount = Math.floor(random.range(100, 5000));
  params.stepLength = random.range(0.5, 10);
  params.steps = Math.floor(random.range(10, 500));
  
  // Update GUI
  if (gui) {
    gui.updateDisplay();
  }
  
  generateAndDraw();
}

// Export current canvas as SVG
function exportCurrentSVG() {
  if (currentProps) {
    currentProps.exportFrame();
  }
}

// Generate and draw
function generateAndDraw() {
  if (currentSketch && currentProps) {
    const output = currentSketch(currentProps);
    if (output && typeof output === 'function') {
      output(currentProps);
    }
  }
}

const settings = {
  dimensions: 'A3',
  units: 'mm',
  pixelsPerInch: 300,
  orientation: 'landscape'
};

const sketch = (props) => {
  const { width, height } = props;
  currentProps = props;
  
  // Set random seed
  random.setSeed(params.seed);
  console.log('Seed:', params.seed);
  
  // Generate flow field
  const generateFlowField = (x, y) => {
    switch (params.fieldType) {
      case 'curl':
        // Curl noise for organic flow
        const eps = 0.0001;
        const n1 = random.noise3D(x, y - eps, 0, params.noiseScale);
        const n2 = random.noise3D(x, y + eps, 0, params.noiseScale);
        const a = (n1 - n2) / (2 * eps);
        
        const n3 = random.noise3D(x - eps, y, 0, params.noiseScale);
        const n4 = random.noise3D(x + eps, y, 0, params.noiseScale);
        const b = (n3 - n4) / (2 * eps);
        
        return Math.atan2(b, a);
        
      case 'perlin':
        // Standard Perlin noise
        return random.noise2D(x * params.noiseScale, y * params.noiseScale) * Math.PI * 2 * params.noiseStrength;
        
      case 'turbulent':
        // Turbulent noise (absolute value)
        const turb = Math.abs(random.noise2D(x * params.noiseScale, y * params.noiseScale));
        return turb * Math.PI * 2 * params.noiseStrength;
    }
  };
  
  // Generate starting positions based on pattern
  const generateStartPositions = () => {
    const positions = [];
    
    switch (params.startPattern) {
      case 'random':
        for (let i = 0; i < params.particleCount; i++) {
          positions.push({
            x: random.range(params.margin, width - params.margin),
            y: random.range(params.margin, height - params.margin)
          });
        }
        break;
        
      case 'grid':
        const gridSize = Math.sqrt(params.particleCount);
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            positions.push({
              x: lerp(params.margin, width - params.margin, i / (gridSize - 1)),
              y: lerp(params.margin, height - params.margin, j / (gridSize - 1))
            });
          }
        }
        break;
        
      case 'circle':
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;
        for (let i = 0; i < params.particleCount; i++) {
          const angle = (i / params.particleCount) * Math.PI * 2;
          positions.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          });
        }
        break;
        
      case 'edge':
        const perSide = params.particleCount / 4;
        // Top edge
        for (let i = 0; i < perSide; i++) {
          positions.push({
            x: lerp(params.margin, width - params.margin, i / perSide),
            y: params.margin
          });
        }
        // Right edge
        for (let i = 0; i < perSide; i++) {
          positions.push({
            x: width - params.margin,
            y: lerp(params.margin, height - params.margin, i / perSide)
          });
        }
        // Bottom edge
        for (let i = 0; i < perSide; i++) {
          positions.push({
            x: lerp(width - params.margin, params.margin, i / perSide),
            y: height - params.margin
          });
        }
        // Left edge
        for (let i = 0; i < perSide; i++) {
          positions.push({
            x: params.margin,
            y: lerp(height - params.margin, params.margin, i / perSide)
          });
        }
        break;
    }
    
    return positions;
  };
  
  // Generate particles
  const particles = [];
  const startPositions = generateStartPositions();
  
  startPositions.forEach(pos => {
    particles.push({
      x: pos.x,
      y: pos.y,
      path: []
    });
  });
  
  // Trace particle paths
  particles.forEach(particle => {
    let x = particle.x;
    let y = particle.y;
    
    for (let step = 0; step < params.steps; step++) {
      particle.path.push([x, y]);
      
      // Get flow direction
      const angle = generateFlowField(x, y);
      
      // Move particle
      x += Math.cos(angle) * params.stepLength;
      y += Math.sin(angle) * params.stepLength;
      
      // Stop if out of bounds
      if (x < 0 || x > width || y < 0 || y > height) break;
    }
  });
  
  const drawFunction = ({ context }) => {
    // Clear canvas
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);
    
    // Set up drawing style
    context.strokeStyle = 'black';
    context.lineWidth = params.lineWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    // Draw particle paths
    particles.forEach(particle => {
      if (particle.path.length < 2) return;
      
      context.beginPath();
      particle.path.forEach((point, i) => {
        const [x, y] = point;
        
        // Apply edge fade if enabled
        let alpha = 1;
        if (params.fadeEdges) {
          const edgeDist = Math.min(
            x - params.margin,
            y - params.margin,
            width - params.margin - x,
            height - params.margin - y
          );
          alpha = Math.max(0, Math.min(1, edgeDist / params.fadeStrength));
        }
        
        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.globalAlpha = alpha;
          context.lineTo(x, y);
        }
      });
      
      context.stroke();
      context.globalAlpha = 1;
    });
  };
  
  return drawFunction;
};

currentSketch = sketch;

canvasSketch(sketch, settings);
const canvasSketch = require('canvas-sketch');
const { lerp } = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');

// Import dat.GUI
let gui;
if (typeof window !== 'undefined') {
  const dat = require('dat.gui');
  gui = new dat.GUI();
}

// Configurable parameters
const params = {
  seed: random.getRandomSeed(),
  // Tree structure
  trunkLength: 40,
  branchAngle: 25,
  branchRatio: 0.7,
  minBranchLength: 2,
  maxDepth: 8,
  // Variations
  angleVariation: 0.15,
  lengthVariation: 0.1,
  // Aesthetics
  lineWidth: 0.5,
  taper: true,
  taperRatio: 0.8,
  // Wind effect
  windStrength: 0,
  windFrequency: 0.1,
  // Multiple trees
  treeCount: 1,
  spacing: 'even', // 'even', 'random', 'clustered'
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
  const treeFolder = gui.addFolder('Tree Structure');
  treeFolder.add(params, 'trunkLength', 10, 80).onChange(generateAndDraw);
  treeFolder.add(params, 'branchAngle', 10, 45).onChange(generateAndDraw);
  treeFolder.add(params, 'branchRatio', 0.5, 0.9).onChange(generateAndDraw);
  treeFolder.add(params, 'minBranchLength', 0.5, 10).onChange(generateAndDraw);
  treeFolder.add(params, 'maxDepth', 3, 12).step(1).onChange(generateAndDraw);
  treeFolder.open();
  
  const variationFolder = gui.addFolder('Variations');
  variationFolder.add(params, 'angleVariation', 0, 0.5).onChange(generateAndDraw);
  variationFolder.add(params, 'lengthVariation', 0, 0.3).onChange(generateAndDraw);
  
  const aestheticFolder = gui.addFolder('Aesthetics');
  aestheticFolder.add(params, 'lineWidth', 0.1, 3).onChange(generateAndDraw);
  aestheticFolder.add(params, 'taper').onChange(generateAndDraw);
  aestheticFolder.add(params, 'taperRatio', 0.5, 0.95).onChange(generateAndDraw);
  
  const windFolder = gui.addFolder('Wind Effect');
  windFolder.add(params, 'windStrength', 0, 30).onChange(generateAndDraw);
  windFolder.add(params, 'windFrequency', 0.01, 0.5).onChange(generateAndDraw);
  
  const forestFolder = gui.addFolder('Forest');
  forestFolder.add(params, 'treeCount', 1, 20).step(1).onChange(generateAndDraw);
  forestFolder.add(params, 'spacing', ['even', 'random', 'clustered']).onChange(generateAndDraw);
  
  const actionFolder = gui.addFolder('Actions');
  actionFolder.add(params, 'regenerate').name('Regenerate');
  actionFolder.add(params, 'randomize').name('Randomize');
  actionFolder.add(params, 'exportSVG').name('Export SVG');
  actionFolder.add(params, 'saveParams').name('Save Parameters');
  actionFolder.add(params, 'seed').listen().name('Seed');
  actionFolder.open();
}

// Save parameters
function saveParameters() {
  const paramData = {
    algorithm: 'recursive-tree',
    timestamp: new Date().toISOString(),
    params: { ...params }
  };
  
  // Remove functions
  delete paramData.params.regenerate;
  delete paramData.params.exportSVG;
  delete paramData.params.saveParams;
  delete paramData.params.randomize;
  
  console.log('=== SAVED TREE PARAMETERS ===');
  console.log(JSON.stringify(paramData, null, 2));
  console.log('===========================');
  
  alert('Parameters saved! Check console for JSON.');
}

// Randomize parameters
function randomizeParams() {
  params.seed = random.getRandomSeed();
  params.trunkLength = random.range(20, 60);
  params.branchAngle = random.range(15, 40);
  params.branchRatio = random.range(0.6, 0.85);
  params.angleVariation = random.range(0, 0.3);
  params.lengthVariation = random.range(0, 0.2);
  params.windStrength = random.range(0, 20);
  params.maxDepth = random.rangeFloor(5, 10);
  
  if (gui) {
    gui.updateDisplay();
  }
  
  generateAndDraw();
}

// Export SVG
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
  
  const drawFunction = ({ context }) => {
    // Set random seed
    random.setSeed(params.seed);
    
    // Generate tree positions
    const generateTreePositions = () => {
      const positions = [];
      const groundY = height * 0.85;
      
      switch (params.spacing) {
        case 'even':
          for (let i = 0; i < params.treeCount; i++) {
            const x = lerp(width * 0.1, width * 0.9, i / Math.max(1, params.treeCount - 1));
            positions.push({ x, y: groundY });
          }
          break;
          
        case 'random':
          for (let i = 0; i < params.treeCount; i++) {
            positions.push({
              x: random.range(width * 0.1, width * 0.9),
              y: groundY + random.range(-10, 10)
            });
          }
          break;
          
        case 'clustered':
          const clusters = Math.ceil(params.treeCount / 3);
          for (let c = 0; c < clusters; c++) {
            const centerX = random.range(width * 0.2, width * 0.8);
            const treesInCluster = Math.min(3, params.treeCount - c * 3);
            for (let t = 0; t < treesInCluster; t++) {
              positions.push({
                x: centerX + random.range(-30, 30),
                y: groundY + random.range(-5, 5)
              });
            }
          }
          break;
      }
      
      return positions;
    };
  
    // Recursive tree drawing function
    const drawBranch = (context, x, y, length, angle, depth, maxDepth, thickness) => {
      if (depth > maxDepth || length < params.minBranchLength) return;
      
      // Apply wind effect
      const windOffset = params.windStrength * 
        Math.sin(y * params.windFrequency) * 
        (depth / maxDepth) * 0.1;
      
      // Calculate end position
      const endX = x + Math.cos(angle + windOffset) * length;
      const endY = y - Math.sin(angle + windOffset) * length;
      
      // Draw branch
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(endX, endY);
      context.lineWidth = thickness;
      context.stroke();
      
      // Generate child branches
      const branchCount = depth < 3 ? 2 : random.rangeFloor(1, 3);
      
      for (let i = 0; i < branchCount; i++) {
        // Calculate branch parameters with variation
        const angleVar = random.range(-params.angleVariation, params.angleVariation);
        const lengthVar = random.range(-params.lengthVariation, params.lengthVariation);
        
        const newAngle = angle + (i === 0 ? 1 : -1) * 
          (params.branchAngle * Math.PI / 180) * (1 + angleVar);
        const newLength = length * params.branchRatio * (1 + lengthVar);
        const newThickness = params.taper ? thickness * params.taperRatio : thickness;
        
        // Recursive call
        drawBranch(context, endX, endY, newLength, newAngle, depth + 1, maxDepth, newThickness);
      }
    };
    
    // Clear canvas
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);
    
    // Set up drawing style
    context.strokeStyle = 'black';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    // Store tree data
    const trees = [];
    const positions = generateTreePositions();
    
    positions.forEach((pos, index) => {
      // Add slight variation to each tree
      const treeVar = random.range(0.8, 1.2);
      trees.push({
        x: pos.x,
        y: pos.y,
        trunkLength: params.trunkLength * treeVar,
        maxDepth: params.maxDepth + random.rangeFloor(-1, 1),
        angle: Math.PI / 2 + random.range(-0.1, 0.1)
      });
    });
    
    // Draw each tree
    trees.forEach(tree => {
      drawBranch(
        context,
        tree.x,
        tree.y,
        tree.trunkLength,
        tree.angle,
        0,
        tree.maxDepth,
        params.lineWidth
      );
    });
    
    // Optional: Draw ground line
    if (params.treeCount > 1) {
      context.beginPath();
      context.moveTo(0, height * 0.85);
      context.lineTo(width, height * 0.85);
      context.lineWidth = 0.5;
      context.stroke();
    }
  };
  
  return drawFunction;
};

currentSketch = sketch;

canvasSketch(sketch, settings);
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
  // Tree structure (in mm for A3 paper)
  trunkLength: 80,
  branchAngle: 25,
  branchRatio: 0.7,
  minBranchLength: 5,
  maxDepth: 8,
  // Variations
  angleVariation: 0.15,
  lengthVariation: 0.1,
  // Aesthetics
  lineWidth: 1,
  taper: true,
  taperRatio: 0.8,
  // Wind effect
  windStrength: 0,
  windFrequency: 0.002,
  // Multiple trees
  treeCount: 1,
  spacing: 'even', // 'even', 'random', 'clustered'
};

let manager;

// Set up GUI
if (gui) {
  const treeFolder = gui.addFolder('Tree Structure');
  treeFolder.add(params, 'trunkLength', 20, 150).name('Trunk Length (mm)');
  treeFolder.add(params, 'branchAngle', 10, 45).name('Branch Angle');
  treeFolder.add(params, 'branchRatio', 0.5, 0.9).name('Branch Ratio');
  treeFolder.add(params, 'minBranchLength', 2, 20).name('Min Branch (mm)');
  treeFolder.add(params, 'maxDepth', 3, 12).step(1).name('Max Depth');
  treeFolder.open();
  
  const variationFolder = gui.addFolder('Variations');
  variationFolder.add(params, 'angleVariation', 0, 0.5);
  variationFolder.add(params, 'lengthVariation', 0, 0.3);
  
  const aestheticFolder = gui.addFolder('Aesthetics');
  aestheticFolder.add(params, 'lineWidth', 0.3, 3);
  aestheticFolder.add(params, 'taper');
  aestheticFolder.add(params, 'taperRatio', 0.5, 0.95);
  
  const windFolder = gui.addFolder('Wind Effect');
  windFolder.add(params, 'windStrength', 0, 30);
  windFolder.add(params, 'windFrequency', 0.001, 0.01);
  
  const forestFolder = gui.addFolder('Forest');
  forestFolder.add(params, 'treeCount', 1, 20).step(1);
  forestFolder.add(params, 'spacing', ['even', 'random', 'clustered']);
  
  const actionFolder = gui.addFolder('Actions');
  actionFolder.add({
    regenerate: () => {
      params.seed = random.getRandomSeed();
      if (manager) manager.render();
    }
  }, 'regenerate').name('Regenerate');
  
  actionFolder.add({
    randomize: () => {
      params.seed = random.getRandomSeed();
      params.trunkLength = random.range(40, 120);
      params.branchAngle = random.range(15, 40);
      params.branchRatio = random.range(0.6, 0.85);
      params.angleVariation = random.range(0, 0.3);
      params.lengthVariation = random.range(0, 0.2);
      params.windStrength = random.range(0, 20);
      params.maxDepth = random.rangeFloor(5, 10);
      gui.updateDisplay();
      if (manager) manager.render();
    }
  }, 'randomize').name('Randomize');
  
  actionFolder.add({
    exportSVG: () => {
      if (manager) manager.exportFrame();
    }
  }, 'exportSVG').name('Export SVG');
  
  actionFolder.add({
    saveParams: () => {
      const paramData = {
        algorithm: 'recursive-tree-fixed',
        timestamp: new Date().toISOString(),
        params: { ...params }
      };
      
      console.log('=== SAVED TREE PARAMETERS ===');
      console.log(JSON.stringify(paramData, null, 2));
      console.log('===========================');
      
      alert('Parameters saved! Check console for JSON.');
    }
  }, 'saveParams').name('Save Parameters');
  
  actionFolder.add(params, 'seed').listen().name('Seed');
  actionFolder.open();
  
  // Update on any parameter change
  Object.keys(params).forEach(key => {
    const controller = gui.__controllers.find(c => c.property === key);
    if (controller) {
      controller.onChange(() => {
        if (manager) manager.render();
      });
    }
  });
}

const settings = {
  dimensions: 'A3',
  units: 'mm',
  pixelsPerInch: 300,
  orientation: 'landscape'
};

const sketch = ({ width, height }) => {
  
  // Recursive tree drawing function
  const drawBranch = (context, x, y, length, angle, depth, maxDepth, thickness) => {
    if (depth > maxDepth || length < params.minBranchLength) return;
    
    // Apply wind effect
    const windOffset = params.windStrength * 
      Math.sin(y * params.windFrequency) * 
      (depth / maxDepth) * 0.01;
    
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
  
  return ({ context }) => {
    // Set random seed
    random.setSeed(params.seed);
    
    // Clear canvas
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);
    
    // Set up drawing style
    context.strokeStyle = 'black';
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    // Generate tree positions
    const trees = [];
    const groundY = height * 0.85;
    
    switch (params.spacing) {
      case 'even':
        for (let i = 0; i < params.treeCount; i++) {
          const x = lerp(width * 0.1, width * 0.9, i / Math.max(1, params.treeCount - 1));
          trees.push({ x, y: groundY });
        }
        break;
        
      case 'random':
        for (let i = 0; i < params.treeCount; i++) {
          trees.push({
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
            trees.push({
              x: centerX + random.range(-30, 30),
              y: groundY + random.range(-5, 5)
            });
          }
        }
        break;
    }
    
    // Draw each tree
    trees.forEach((tree, index) => {
      // Add slight variation to each tree
      const treeVar = random.range(0.8, 1.2);
      
      drawBranch(
        context,
        tree.x,
        tree.y,
        params.trunkLength * treeVar,
        -Math.PI / 2 + random.range(-0.1, 0.1), // Point upward
        0,
        params.maxDepth + random.rangeFloor(-1, 1),
        params.lineWidth
      );
    });
    
    // Optional: Draw ground line
    if (params.treeCount > 1) {
      context.beginPath();
      context.moveTo(0, groundY);
      context.lineTo(width, groundY);
      context.lineWidth = 0.5;
      context.stroke();
    }
  };
};

canvasSketch(sketch, settings).then(m => {
  manager = m;
});
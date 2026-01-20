const canvasSketch = require('canvas-sketch');
const { lerp } = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');

// Configurable parameters
const params = {
  seed: random.getRandomSeed(),
  // Flow field
  noiseScale: 0.002,
  noiseStrength: 1,
  // Particles
  particleCount: 2000,
  stepLength: 2,
  steps: 100,
  lineWidth: 0.5,
  // Grid
  margin: 20,
  // Aesthetics
  curlNoise: true,
  fadeEdges: true
};

const settings = {
  dimensions: 'A3',
  units: 'mm',
  pixelsPerInch: 300,
  orientation: 'landscape'
};

const sketch = ({ width, height }) => {
  // Set random seed
  random.setSeed(params.seed);
  console.log('Seed:', params.seed);
  
  // Generate flow field
  const generateFlowField = (x, y) => {
    if (params.curlNoise) {
      // Curl noise for more organic flow
      const eps = 0.0001;
      const n1 = random.noise3D(x, y - eps, 0, params.noiseScale);
      const n2 = random.noise3D(x, y + eps, 0, params.noiseScale);
      const a = (n1 - n2) / (2 * eps);
      
      const n3 = random.noise3D(x - eps, y, 0, params.noiseScale);
      const n4 = random.noise3D(x + eps, y, 0, params.noiseScale);
      const b = (n3 - n4) / (2 * eps);
      
      return Math.atan2(b, a);
    } else {
      // Standard Perlin noise
      return random.noise2D(x * params.noiseScale, y * params.noiseScale) * Math.PI * 2 * params.noiseStrength;
    }
  };
  
  // Generate particles
  const particles = [];
  for (let i = 0; i < params.particleCount; i++) {
    particles.push({
      x: random.range(params.margin, width - params.margin),
      y: random.range(params.margin, height - params.margin),
      path: []
    });
  }
  
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
  
  return ({ context }) => {
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
          alpha = Math.max(0, Math.min(1, edgeDist / 50));
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
};

canvasSketch(sketch, settings);
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const catalogPath = path.join(repoRoot, 'algorithm-catalog.json');
const penPlotterRoot = path.join(repoRoot, 'pen-plotter');

const categoryDefaults = {
  advanced: {
    medium: 'systems',
    plotterReadiness: 'adaptable',
    colorDependency: 'optional',
    penCount: 'variable',
    motifFamilies: ['simulation', 'field', 'wave'],
    visualTraits: ['dense', 'scientific', 'chaotic'],
    status: 'experimental',
  },
  ai: {
    medium: 'screen',
    plotterReadiness: 'screen-first',
    colorDependency: 'core',
    penCount: 'variable',
    motifFamilies: ['ml', 'image-derived', 'adaptive'],
    visualTraits: ['screen-based', 'layered', 'experimental'],
    status: 'experimental',
  },
  'cellular-automata': {
    medium: 'systems',
    plotterReadiness: 'adaptable',
    colorDependency: 'optional',
    penCount: 'single',
    motifFamilies: ['cellular', 'grid', 'rules'],
    visualTraits: ['layered', 'emergent', 'structured'],
    status: 'stable',
  },
  chemical: {
    medium: 'systems',
    plotterReadiness: 'adaptable',
    colorDependency: 'optional',
    penCount: 'variable',
    motifFamilies: ['reaction', 'field', 'contour'],
    visualTraits: ['organic', 'diffusive', 'dense'],
    status: 'experimental',
  },
  curves: {
    medium: 'plotter',
    plotterReadiness: 'native',
    colorDependency: 'none',
    penCount: 'single',
    motifFamilies: ['curves', 'parametric', 'recursion'],
    visualTraits: ['continuous', 'geometric', 'rhythmic'],
    status: 'stable',
  },
  'flow-fields': {
    medium: 'plotter',
    plotterReadiness: 'native',
    colorDependency: 'optional',
    penCount: 'single',
    motifFamilies: ['field', 'streamlines', 'particles'],
    visualTraits: ['directional', 'flowing', 'continuous'],
    status: 'stable',
  },
  'fluid-dynamics': {
    medium: 'systems',
    plotterReadiness: 'adaptable',
    colorDependency: 'core',
    penCount: 'variable',
    motifFamilies: ['fluid', 'particles', 'field'],
    visualTraits: ['turbulent', 'layered', 'dynamic'],
    status: 'experimental',
  },
  fractals: {
    medium: 'plotter',
    plotterReadiness: 'adaptable',
    colorDependency: 'optional',
    penCount: 'single',
    motifFamilies: ['fractal', 'contour', 'recursion'],
    visualTraits: ['recursive', 'mathematical', 'dense'],
    status: 'stable',
  },
  geometric: {
    medium: 'plotter',
    plotterReadiness: 'native',
    colorDependency: 'none',
    penCount: 'single',
    motifFamilies: ['grid', 'tiling', 'curves'],
    visualTraits: ['geometric', 'structured', 'precise'],
    status: 'stable',
  },
  hybrid: {
    medium: 'systems',
    plotterReadiness: 'adaptable',
    colorDependency: 'optional',
    penCount: 'variable',
    motifFamilies: ['composition', 'system-mix'],
    visualTraits: ['layered', 'configurable', 'hybrid'],
    status: 'experimental',
  },
  'image-processing': {
    medium: 'plotter',
    plotterReadiness: 'adaptable',
    colorDependency: 'optional',
    penCount: 'variable',
    motifFamilies: ['image-derived', 'contour', 'hatching'],
    visualTraits: ['textural', 'layered', 'high-contrast'],
    status: 'stable',
  },
  natural: {
    medium: 'plotter',
    plotterReadiness: 'native',
    colorDependency: 'optional',
    penCount: 'single',
    motifFamilies: ['growth', 'branching', 'particles'],
    visualTraits: ['organic', 'emergent', 'flowing'],
    status: 'stable',
  },
  packing: {
    medium: 'plotter',
    plotterReadiness: 'native',
    colorDependency: 'none',
    penCount: 'single',
    motifFamilies: ['packing', 'motif-placement', 'collision'],
    visualTraits: ['dense', 'modular', 'directional'],
    status: 'stable',
  },
  physics: {
    medium: 'systems',
    plotterReadiness: 'adaptable',
    colorDependency: 'optional',
    penCount: 'variable',
    motifFamilies: ['particles', 'forces', 'interference'],
    visualTraits: ['dynamic', 'field-driven', 'layered'],
    status: 'experimental',
  },
  'reaction-diffusion': {
    medium: 'systems',
    plotterReadiness: 'adaptable',
    colorDependency: 'optional',
    penCount: 'variable',
    motifFamilies: ['reaction', 'cells', 'contour'],
    visualTraits: ['organic', 'cellular', 'dense'],
    status: 'experimental',
  },
  symmetry: {
    medium: 'plotter',
    plotterReadiness: 'native',
    colorDependency: 'none',
    penCount: 'single',
    motifFamilies: ['tiling', 'ornament', 'lattice'],
    visualTraits: ['symmetrical', 'geometric', 'modular'],
    status: 'stable',
  },
  textures: {
    medium: 'plotter',
    plotterReadiness: 'native',
    colorDependency: 'none',
    penCount: 'single',
    motifFamilies: ['texture', 'hatching', 'fill'],
    visualTraits: ['dense', 'textural', 'repetitive'],
    status: 'stable',
  },
  tools: {
    medium: 'tools',
    plotterReadiness: 'tool',
    colorDependency: 'none',
    penCount: 'n/a',
    motifFamilies: ['utility'],
    visualTraits: ['functional'],
    status: 'stable',
  },
  'trees-lsystems': {
    medium: 'plotter',
    plotterReadiness: 'native',
    colorDependency: 'none',
    penCount: 'single',
    motifFamilies: ['branching', 'grammar', 'growth'],
    visualTraits: ['organic', 'recursive', 'botanical'],
    status: 'stable',
  },
  voronoi: {
    medium: 'plotter',
    plotterReadiness: 'native',
    colorDependency: 'none',
    penCount: 'single',
    motifFamilies: ['cells', 'stippling', 'routes'],
    visualTraits: ['cellular', 'structured', 'dense'],
    status: 'stable',
  },
};

const algorithmOverrides = {
  arrows: {
    motifFamilies: ['directional', 'crossing-aware', 'field'],
    visualTraits: ['braided', 'directional'],
    relatedSeeds: ['circle-packing', 'flow-field-collision', 'string-art', 'moir-patterns'],
  },
  'circle-packing': {
    motifFamilies: ['circles', 'packing'],
    visualTraits: ['radial', 'dense'],
    relatedSeeds: ['arrows', 'phyllotaxis', 'voronoi-stippling'],
  },
  'circle-rays': {
    motifFamilies: ['radial', 'burst', 'circles'],
    visualTraits: ['radial', 'high-contrast'],
    relatedSeeds: ['spirotron', 'string-art', 'perlin-circles'],
  },
  spirotron: {
    motifFamilies: ['curves', 'radial', 'parametric'],
    visualTraits: ['continuous', 'radial', 'layered'],
    relatedSeeds: ['lissajous-curves', 'harmonograph', 'circle-rays'],
  },
  'moir-patterns': {
    motifFamilies: ['interference', 'lines', 'wave'],
    visualTraits: ['high-contrast', 'layered'],
    relatedSeeds: ['wave-interference', 'string-art', 'circle-rays'],
  },
  'flow-field-collision': {
    medium: 'systems',
    plotterReadiness: 'native',
    motifFamilies: ['field', 'collision', 'streamlines'],
    visualTraits: ['directional', 'dense'],
    relatedSeeds: ['arrows', 'boids-flocking', 'physarum-slime'],
  },
  'flow-field-p5': {
    motifFamilies: ['field', 'streamlines'],
    visualTraits: ['flowing', 'directional'],
    relatedSeeds: ['flow-field-collision', 'perlin-spiral', 'physarum-slime'],
  },
  'sound-waveform': {
    medium: 'systems',
    plotterReadiness: 'adaptable',
    inputs: ['audio'],
    motifFamilies: ['wave', 'audio', 'signal'],
    visualTraits: ['rhythmic', 'scientific'],
    relatedSeeds: ['chladni-patterns', 'wave-interference', 'harmonograph'],
  },
  'chladni-patterns': {
    motifFamilies: ['wave', 'interference', 'contour'],
    visualTraits: ['scientific', 'dense'],
    relatedSeeds: ['sound-waveform', 'wave-interference', 'strange-attractors'],
  },
  'parametric-surfaces': {
    motifFamilies: ['surfaces', 'contour', 'projection'],
    visualTraits: ['layered', 'mathematical'],
    relatedSeeds: ['topographic-contours', 'mandelbrot-and-julia', 'lorenz-attractor'],
  },
  'strange-attractors': {
    motifFamilies: ['attractor', 'chaos', 'curves'],
    visualTraits: ['chaotic', 'continuous'],
    relatedSeeds: ['lorenz-attractor', 'harmonograph', 'spirotron'],
  },
  'lorenz-attractor': {
    motifFamilies: ['attractor', 'chaos', 'field'],
    visualTraits: ['chaotic', 'scientific'],
    relatedSeeds: ['strange-attractors', 'parametric-surfaces', 'particle-system'],
  },
  'vortex-street': {
    motifFamilies: ['fluid', 'wave', 'particles'],
    visualTraits: ['turbulent', 'directional'],
    relatedSeeds: ['fluid-dynamics', 'wave-interference', 'magnetic-fields'],
  },
  'ml5-patterns': {
    inputs: ['image', 'ml'],
    outputs: ['canvas', 'png'],
    relatedSeeds: ['neural-network-art', 'ascii-art', 'image-to-ascii'],
  },
  'neural-network-art': {
    inputs: ['image', 'ml'],
    outputs: ['canvas', 'png'],
    relatedSeeds: ['ml5-patterns', 'ascii-art', 'dithering'],
  },
  'elementary-ca': {
    relatedSeeds: ['elementary-ca-layers', 'game-of-life', 'reaction-diffusion-layers'],
  },
  'elementary-ca-layers': {
    relatedSeeds: ['elementary-ca', 'game-of-life-layers', 'reaction-diffusion-layers'],
  },
  'game-of-life': {
    relatedSeeds: ['game-of-life-layers', 'elementary-ca', 'reaction-diffusion'],
  },
  'game-of-life-layers': {
    relatedSeeds: ['game-of-life', 'elementary-ca-layers', 'reaction-diffusion-layers'],
  },
  'belousov-zhabotinsky': {
    relatedSeeds: ['reaction-diffusion', 'liesegang-rings', 'crystallization'],
  },
  chromatography: {
    motifFamilies: ['diffusion', 'bands', 'contour'],
    visualTraits: ['organic', 'layered'],
    relatedSeeds: ['mixing-patterns', 'liesegang-rings', 'flow-hatching'],
  },
  'convection-cells': {
    motifFamilies: ['cells', 'fluid', 'field'],
    visualTraits: ['cellular', 'organic'],
    relatedSeeds: ['vortex-street', 'reaction-diffusion', 'voronoi-stippling'],
  },
  crystallization: {
    motifFamilies: ['growth', 'crystal', 'branching'],
    visualTraits: ['angular', 'organic'],
    relatedSeeds: ['crystal-growth', 'belousov-zhabotinsky', 'snowflakes'],
  },
  'liesegang-rings': {
    motifFamilies: ['rings', 'contour', 'diffusion'],
    visualTraits: ['radial', 'layered'],
    relatedSeeds: ['chromatography', 'reaction-diffusion', 'circle-rays'],
  },
  'mixing-patterns': {
    motifFamilies: ['fluid', 'diffusion', 'interference'],
    visualTraits: ['organic', 'layered'],
    relatedSeeds: ['chromatography', 'fluid-dynamics', 'belousov-zhabotinsky'],
  },
  harmonograph: {
    motifFamilies: ['curves', 'oscillation', 'parametric'],
    visualTraits: ['continuous', 'rhythmic'],
    relatedSeeds: ['lissajous-curves', 'spirotron', 'rose-curves'],
  },
  'hilbert-curve': {
    motifFamilies: ['space-filling', 'recursion', 'grid'],
    visualTraits: ['continuous', 'structured'],
    relatedSeeds: ['space-filling-curves', 'space-filling-standard', 'maze-generator'],
  },
  'lissajous-curves': {
    motifFamilies: ['curves', 'oscillation', 'parametric'],
    visualTraits: ['continuous', 'symmetrical'],
    relatedSeeds: ['harmonograph', 'rose-curves', 'spirotron'],
  },
  'rose-curves': {
    motifFamilies: ['curves', 'radial', 'parametric'],
    visualTraits: ['symmetrical', 'radial'],
    relatedSeeds: ['lissajous-curves', 'spirotron', 'circle-rays'],
  },
  'space-filling-standard': {
    motifFamilies: ['space-filling', 'recursion', 'grid'],
    visualTraits: ['structured', 'continuous'],
    relatedSeeds: ['space-filling-curves', 'hilbert-curve', 'maze-generator'],
  },
  'space-filling-curves': {
    motifFamilies: ['space-filling', 'recursion', 'grid'],
    visualTraits: ['structured', 'continuous', 'dense'],
    relatedSeeds: ['space-filling-standard', 'hilbert-curve', 'maze-generator'],
  },
  'mandelbrot-and-julia': {
    motifFamilies: ['fractal', 'contour', 'iteration'],
    visualTraits: ['recursive', 'mathematical'],
    relatedSeeds: ['parametric-surfaces', 'topographic-contours', 'strange-attractors'],
  },
  '10print': {
    motifFamilies: ['grid', 'texture', 'maze'],
    visualTraits: ['high-contrast', 'repetitive'],
    relatedSeeds: ['10print-simple', 'hash-tiles', 'truchet-tiles'],
  },
  '10print-simple': {
    motifFamilies: ['grid', 'texture', 'maze'],
    visualTraits: ['high-contrast', 'repetitive'],
    relatedSeeds: ['10print', 'hash-tiles', 'truchet-tiles'],
  },
  'circle-twist': {
    motifFamilies: ['circles', 'radial', 'curves'],
    visualTraits: ['radial', 'geometric'],
    relatedSeeds: ['circle-rays', 'perlin-circles', 'spirotron'],
  },
  'circuit-pattern': {
    motifFamilies: ['grid', 'routes', 'lattice'],
    visualTraits: ['structured', 'angular'],
    relatedSeeds: ['maze-generator', 'string-art', 'topographic-contours'],
  },
  'grid-landscape': {
    motifFamilies: ['grid', 'topography', 'waves'],
    visualTraits: ['layered', 'structured'],
    relatedSeeds: ['topographic-contours', 'perlin-landscape', 'spiral-fill'],
  },
  'hash-tiles': {
    motifFamilies: ['tiling', 'grid', 'texture'],
    visualTraits: ['modular', 'high-contrast'],
    relatedSeeds: ['10print', 'truchet-tiles', 'aperiodic-tilings'],
  },
  'islamic-patterns': {
    motifFamilies: ['ornament', 'tiling', 'lattice'],
    visualTraits: ['symmetrical', 'geometric'],
    relatedSeeds: ['kumiko-pattern', 'zellige-pattern', 'penrose-tiling'],
  },
  'maze-generator': {
    motifFamilies: ['maze', 'grid', 'routes'],
    visualTraits: ['structured', 'continuous'],
    relatedSeeds: ['circuit-pattern', 'space-filling-curves', '10print'],
  },
  'penrose-tiling': {
    motifFamilies: ['tiling', 'aperiodic', 'lattice'],
    visualTraits: ['structured', 'geometric'],
    relatedSeeds: ['aperiodic-tilings', 'islamic-patterns', 'zellige-pattern'],
  },
  'perlin-circles': {
    motifFamilies: ['circles', 'noise', 'curves'],
    visualTraits: ['organic', 'radial'],
    relatedSeeds: ['circle-twist', 'perlin-spiral', 'circle-rays'],
  },
  'perlin-landscape': {
    motifFamilies: ['noise', 'topography', 'field'],
    visualTraits: ['layered', 'organic'],
    relatedSeeds: ['topographic-contours', 'grid-landscape', 'flow-field-p5'],
  },
  'perlin-spiral': {
    motifFamilies: ['spiral', 'noise', 'curves'],
    visualTraits: ['continuous', 'organic'],
    relatedSeeds: ['spiral-burst', 'perlin-circles', 'flow-field-p5'],
  },
  snowflakes: {
    motifFamilies: ['branching', 'radial', 'symmetry'],
    visualTraits: ['symmetrical', 'delicate'],
    relatedSeeds: ['crystallization', 'zellige-pattern', 'phyllotaxis'],
  },
  'spiral-burst': {
    motifFamilies: ['spiral', 'burst', 'radial'],
    visualTraits: ['radial', 'energetic'],
    relatedSeeds: ['perlin-spiral', 'circle-rays', 'spirotron'],
  },
  'spiral-fill': {
    motifFamilies: ['spiral', 'fill', 'contour'],
    visualTraits: ['continuous', 'dense'],
    relatedSeeds: ['spiral-burst', 'grid-landscape', 'topographic-contours'],
  },
  'string-art': {
    motifFamilies: ['lines', 'interference', 'routes'],
    visualTraits: ['high-contrast', 'geometric'],
    relatedSeeds: ['circle-rays', 'moir-patterns', 'arrows'],
  },
  'topographic-contours': {
    motifFamilies: ['contour', 'topography', 'field'],
    visualTraits: ['layered', 'dense'],
    relatedSeeds: ['perlin-landscape', 'grid-landscape', 'parametric-surfaces'],
  },
  'hybrid-composer': {
    medium: 'systems',
    plotterReadiness: 'adaptable',
    motifFamilies: ['composition', 'layers', 'system-mix'],
    visualTraits: ['configurable', 'layered'],
    relatedSeeds: ['plotter-prep', 'path-optimizer', 'flow-field-collision'],
  },
  'ascii-art': {
    inputs: ['image'],
    plotterReadiness: 'screen-first',
    relatedSeeds: ['image-to-ascii', 'dithering', 'neural-network-art'],
  },
  'contour-lines': {
    inputs: ['image'],
    relatedSeeds: ['flow-hatching', 'halftone', 'topographic-contours'],
  },
  dithering: {
    inputs: ['image'],
    relatedSeeds: ['halftone', 'ascii-art', 'image-to-ascii'],
  },
  'flow-hatching': {
    inputs: ['image'],
    relatedSeeds: ['hatching', 'contour-lines', 'topographic-contours'],
  },
  halftone: {
    inputs: ['image'],
    relatedSeeds: ['dithering', 'hatching', 'contour-lines'],
  },
  hatching: {
    inputs: ['image'],
    relatedSeeds: ['flow-hatching', 'halftone', 'contour-lines'],
  },
  'image-to-ascii': {
    inputs: ['image'],
    plotterReadiness: 'screen-first',
    relatedSeeds: ['ascii-art', 'dithering', 'neural-network-art'],
  },
  squigglecam: {
    medium: 'screen',
    plotterReadiness: 'adaptable',
    inputs: ['camera', 'image'],
    colorDependency: 'core',
    relatedSeeds: ['flow-hatching', 'contour-lines', 'ml5-patterns'],
  },
  astronomy: {
    motifFamilies: ['radial', 'orbits', 'fields'],
    visualTraits: ['layered', 'delicate'],
    relatedSeeds: ['phyllotaxis', 'circle-rays', 'strange-attractors'],
  },
  'coral-growth': {
    motifFamilies: ['growth', 'branching', 'cells'],
    visualTraits: ['organic', 'dense'],
    relatedSeeds: ['differential-growth', 'crystal-growth', 'space-colonization'],
  },
  'crystal-growth': {
    motifFamilies: ['growth', 'crystal', 'branching'],
    visualTraits: ['organic', 'angular'],
    relatedSeeds: ['coral-growth', 'crystallization', 'snowflakes'],
  },
  'differential-growth': {
    motifFamilies: ['growth', 'curves', 'collision'],
    visualTraits: ['organic', 'dense'],
    relatedSeeds: ['coral-growth', 'physarum-slime', 'arrows'],
  },
  'dla-growth': {
    motifFamilies: ['growth', 'aggregation', 'particles'],
    visualTraits: ['organic', 'branching'],
    relatedSeeds: ['crystal-growth', 'physarum-slime', 'reaction-diffusion'],
  },
  lightning: {
    motifFamilies: ['branching', 'field', 'routes'],
    visualTraits: ['high-contrast', 'directional'],
    relatedSeeds: ['tree-gui', 'space-colonization', 'magnetic-fields'],
  },
  phyllotaxis: {
    motifFamilies: ['spiral', 'packing', 'radial'],
    visualTraits: ['radial', 'organic'],
    relatedSeeds: ['circle-packing', 'astronomy', 'perlin-circles'],
  },
  'physarum-slime': {
    motifFamilies: ['growth', 'network', 'field'],
    visualTraits: ['organic', 'web-like'],
    relatedSeeds: ['differential-growth', 'flow-field-collision', 'boids-flocking'],
  },
  'space-colonization': {
    motifFamilies: ['branching', 'growth', 'network'],
    visualTraits: ['organic', 'botanical'],
    relatedSeeds: ['tree-gui', 'lightning', 'physarum-slime'],
  },
  'boids-flocking': {
    medium: 'systems',
    motifFamilies: ['particles', 'swarm', 'field'],
    visualTraits: ['dynamic', 'directional'],
    relatedSeeds: ['flow-field-collision', 'particle-system', 'physarum-slime'],
  },
  'cloth-simulation': {
    medium: 'screen',
    plotterReadiness: 'screen-first',
    colorDependency: 'core',
    motifFamilies: ['mesh', 'fabric', 'simulation'],
    visualTraits: ['dynamic', 'layered'],
    relatedSeeds: ['particle-system', 'fluid-dynamics', 'wave-interference'],
  },
  'magnetic-fields': {
    medium: 'systems',
    motifFamilies: ['field', 'lines', 'interference'],
    visualTraits: ['directional', 'layered'],
    relatedSeeds: ['flow-field-collision', 'wave-interference', 'lightning'],
  },
  'particle-system': {
    medium: 'systems',
    motifFamilies: ['particles', 'swarm', 'field'],
    visualTraits: ['dynamic', 'layered'],
    relatedSeeds: ['boids-flocking', 'cloth-simulation', 'magnetic-fields'],
  },
  'wave-interference': {
    medium: 'systems',
    motifFamilies: ['wave', 'interference', 'contour'],
    visualTraits: ['layered', 'scientific'],
    relatedSeeds: ['moir-patterns', 'chladni-patterns', 'sound-waveform'],
  },
  'reaction-diffusion': {
    relatedSeeds: ['reaction-diffusion-enhanced', 'reaction-diffusion-layers', 'belousov-zhabotinsky'],
  },
  'reaction-diffusion-enhanced': {
    relatedSeeds: ['reaction-diffusion', 'reaction-diffusion-layers', 'belousov-zhabotinsky'],
  },
  'reaction-diffusion-layers': {
    relatedSeeds: ['reaction-diffusion', 'reaction-diffusion-enhanced', 'game-of-life-layers'],
  },
  'aperiodic-tilings': {
    relatedSeeds: ['penrose-tiling', 'truchet-tiles', 'hash-tiles'],
  },
  'kumiko-pattern': {
    relatedSeeds: ['islamic-patterns', 'zellige-pattern', 'quilting-patterns'],
  },
  'quilting-patterns': {
    relatedSeeds: ['kumiko-pattern', 'truchet-tiles', 'hash-tiles'],
  },
  'truchet-tiles': {
    relatedSeeds: ['10print', 'hash-tiles', 'aperiodic-tilings'],
  },
  'zellige-pattern': {
    relatedSeeds: ['islamic-patterns', 'kumiko-pattern', 'penrose-tiling'],
  },
  'canvas-runner': {
    outputs: ['canvas'],
    inputs: ['canvas'],
  },
  'debug-preview': {
    outputs: ['canvas', 'svg'],
  },
  'path-optimizer': {
    outputs: ['svg'],
    inputs: ['svg'],
  },
  'plot-simulator': {
    outputs: ['preview'],
    inputs: ['svg'],
  },
  'plotter-export': {
    outputs: ['svg', 'png', 'plotter'],
    inputs: ['svg'],
  },
  'plotter-prep': {
    outputs: ['svg', 'plotter'],
    inputs: ['svg'],
  },
  'plotter-preview': {
    outputs: ['preview'],
    inputs: ['svg'],
  },
  'lsystem-simple': {
    relatedSeeds: ['tree-gui', 'tree-working', 'space-colonization'],
  },
  'tree-gui': {
    relatedSeeds: ['tree-working', 'lsystem-simple', 'space-colonization'],
  },
  'tree-working': {
    relatedSeeds: ['tree-gui', 'lsystem-simple', 'lightning'],
  },
  'tsp-art': {
    inputs: ['image'],
    relatedSeeds: ['voronoi-stippling', 'string-art', 'circle-packing'],
  },
  'voronoi-stippling': {
    inputs: ['image'],
    relatedSeeds: ['tsp-art', 'circle-packing', 'flow-hatching'],
  },
};

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function mergeArrays(...groups) {
  return unique(groups.flat());
}

function sortValues(values) {
  return [...values].sort((a, b) => String(a).localeCompare(String(b)));
}

function readAlgorithmSource(relativePath) {
  // Catalog paths are relative to the repo root; older entries were
  // relative to pen-plotter/, so fall back there for compatibility.
  const candidates = [
    path.join(repoRoot, relativePath),
    path.join(penPlotterRoot, relativePath),
  ];
  for (const absolutePath of candidates) {
    if (fs.existsSync(absolutePath)) {
      return fs.readFileSync(absolutePath, 'utf8');
    }
  }
  return '';
}

function detectEngines(source) {
  const engines = [];

  if (/ml5(?:\.min)?\.js|ml5\./i.test(source)) {
    engines.push('ml5');
  }
  if (/(?:^|[\s"'`])three(?:\.min)?\.js|THREE\./i.test(source)) {
    engines.push('three');
  }
  if (/p5(?:\.min)?\.js|new p5|createCanvas\s*\(|function setup\s*\(|function draw\s*\(/i.test(source)) {
    engines.push('p5');
  }
  if (engines.length === 0) {
    engines.push('vanilla');
  }

  return unique(engines);
}

function detectOutputs(source, algo) {
  const outputs = new Set(algo.hasExport || []);

  if (/downloadPNG|TSExport\.downloadPNG|saveCanvas\s*\(|toDataURL\(/i.test(source)) {
    outputs.add('png');
  }
  if (/downloadSVG|TSExport\.downloadSVG|buildSvgPaths|createPlotterSVG|svg/i.test(source)) {
    outputs.add('svg');
  }
  if (/gif\.js|Encoding GIF|generateGIFFrames|toggleGifRecording/i.test(source)) {
    outputs.add('gif');
  }
  if (/requestAnimationFrame|setInterval|function draw\s*\(/i.test(source)) {
    outputs.add('canvas');
  }

  return sortValues(outputs);
}

function detectInputs(source, algo) {
  const inputs = [];

  if (algo.requiresImage || /accept=["'][^"']*image|loadImage\s*\(|type=["']file["']|imageUpload|imageInput/i.test(source)) {
    inputs.push('image');
  }
  if (/AudioContext|getUserMedia|microphone|analyser|audio/i.test(source)) {
    inputs.push('audio');
  }
  if (/getUserMedia|video|webcam|camera/i.test(source)) {
    inputs.push('camera');
  }
  if (/ml5(?:\.min)?\.js|ml5\./i.test(source)) {
    inputs.push('ml');
  }

  return sortValues(unique(inputs));
}

function inferPlotterReadiness(algo, defaults) {
  if (algo.category === 'tools') {
    return 'tool';
  }
  if (defaults.plotterReadiness) {
    return defaults.plotterReadiness;
  }
  return algo.plotterSafe ? 'native' : 'adaptable';
}

function inferColorDependency(algo, defaults) {
  if (defaults.colorDependency) {
    return defaults.colorDependency;
  }
  return algo.plotterSafe ? 'none' : 'optional';
}

function buildAlgorithm(algo) {
  const defaults = categoryDefaults[algo.category] || {};
  const overrides = algorithmOverrides[algo.id] || {};
  const source = readAlgorithmSource(algo.path);

  const engine = sortValues(unique(overrides.engine || detectEngines(source)));
  const outputs = sortValues(mergeArrays(defaults.outputs, detectOutputs(source, algo), overrides.outputs));
  const inputs = sortValues(mergeArrays(detectInputs(source, algo), defaults.inputs, overrides.inputs));

  return {
    ...algo,
    medium: overrides.medium || defaults.medium || 'plotter',
    engine,
    outputs,
    inputs,
    plotterReadiness: overrides.plotterReadiness || inferPlotterReadiness(algo, defaults),
    colorDependency: overrides.colorDependency || inferColorDependency(algo, defaults),
    penCount: overrides.penCount || defaults.penCount || (algo.category === 'tools' ? 'n/a' : 'single'),
    motifFamilies: sortValues(mergeArrays(defaults.motifFamilies, overrides.motifFamilies)),
    visualTraits: sortValues(mergeArrays(defaults.visualTraits, overrides.visualTraits)),
    relatedSeeds: sortValues(mergeArrays(defaults.relatedSeeds, overrides.relatedSeeds)),
    status: overrides.status || defaults.status || 'stable',
  };
}

function computeStats(algorithms, categories) {
  const mediumCounts = {};
  const readinessCounts = {};

  algorithms.forEach((algo) => {
    mediumCounts[algo.medium] = (mediumCounts[algo.medium] || 0) + 1;
    readinessCounts[algo.plotterReadiness] = (readinessCounts[algo.plotterReadiness] || 0) + 1;
  });

  return {
    totalAlgorithms: algorithms.length,
    totalCategories: Object.keys(categories).length,
    featuredCount: algorithms.filter((algo) => algo.featured).length,
    plotterSafeCount: algorithms.filter((algo) => algo.plotterSafe).length,
    mediumCounts,
    plotterReadinessCounts: readinessCounts,
  };
}

function main() {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const algorithms = catalog.algorithms.map(buildAlgorithm);
  const nextCatalog = {
    ...catalog,
    version: '2.1.0',
    lastUpdated: new Date().toISOString().slice(0, 10),
    algorithms,
    stats: computeStats(algorithms, catalog.categories),
  };

  fs.writeFileSync(catalogPath, `${JSON.stringify(nextCatalog, null, 2)}\n`);
  console.log(`Enriched ${algorithms.length} algorithms in ${path.relative(repoRoot, catalogPath)}`);
}

main();

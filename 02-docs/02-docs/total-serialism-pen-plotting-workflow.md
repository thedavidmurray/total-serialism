# Total Serialism + Pen Plotting Workflow
Inspired by Tyler Hobbs' generative art philosophy

## Core Concept: Systematic Variation
Combine Total Serialism's algorithmic rigor with Hobbs' appreciation for analog imperfection.

## Workflow Pipeline

### 1. Algorithmic Composition (Total Serialism)
```javascript
// Use Total Serialism for core structure
const Tone = require('total-serialism/tone');
const Algo = require('total-serialism/algorithmic');
const Trans = require('total-serialism/transform');

// Generate base patterns
const melody = Algo.euclid(16, 5); // Euclidean rhythm
const harmony = Trans.rotate(melody, 3);
const dynamics = Algo.fibonacci(8);
```

### 2. Convert to Visual (Hobbs-inspired)
```javascript
// Map musical parameters to visual
function musicToVisual(notes, rhythm) {
  return {
    // Position from pitch
    x: note => map(note, 0, 127, 0, width),
    y: time => map(time, 0, duration, 0, height),
    
    // Flow from dynamics
    turbulence: dynamics => map(dynamics, 0, 1, 0.1, 2.0),
    
    // Thickness from velocity
    strokeWeight: velocity => map(velocity, 0, 127, 0.5, 5)
  };
}
```

### 3. Apply Systematic Deviations
```javascript
// Hobbs-style "hand wobble"
function addHumanVariation(path) {
  return path.map(point => ({
    x: point.x + noise(point.x * 0.01) * wobbleAmount,
    y: point.y + noise(point.y * 0.01) * wobbleAmount
  }));
}
```

### 4. Flow Field Integration
```javascript
// Generate flow field from harmonic progressions
function harmonicFlowField(chords) {
  // Each chord creates a field influence
  return (x, y) => {
    let angle = 0;
    chords.forEach(chord => {
      // Chord intervals affect field direction
      angle += chord.intervals * noise(x * 0.1, y * 0.1);
    });
    return angle;
  };
}
```

### 5. Curation Process
- Generate 100-1000 variations
- Use your trait generator to preview
- Select based on:
  - Visual balance
  - Plotting efficiency  
  - Aesthetic surprise
  - Technical feasibility

## Practical Examples

### Example 1: Rhythmic Textures
```javascript
// Euclidean rhythm → visual pattern
const rhythm = Algo.euclid(32, 13);
const pattern = rhythm.map((hit, i) => {
  if (hit) {
    return drawFlowLine(i * spacing, 0, flowField);
  }
});
```

### Example 2: Harmonic Fields
```javascript
// Chord progression → flow field
const progression = ['Cmaj7', 'Am7', 'Dm7', 'G7'];
const field = createHarmonicField(progression);
drawFlowPaths(field, density = 50);
```

### Example 3: Melodic Contours
```javascript
// Melody → continuous path
const melody = Gen.sine(32); // Generate sine wave melody
const path = melodyToPath(melody);
const humanized = addHandWobble(path);
exportForPlotter(humanized);
```

## Tool Integration Points

### Your Trait Generator + Pen Plotting:
1. Add music parameter inputs (scale, rhythm, tempo)
2. Implement flow field drawing from audio
3. Preview with "pen plotter" simulation mode
4. Export optimized SVG for plotting

### Workflow Enhancements:
1. **Musical Masks**: Use rhythm patterns as layer masks
2. **Harmonic Colors**: Map chord progressions to pen changes
3. **Dynamic Thickness**: Velocity/dynamics control stroke weight
4. **Temporal Layers**: Each musical phrase on separate layer

## Next Steps:
1. Experiment with simple euclid() → visual patterns
2. Build flow field tool into your generator
3. Test with actual pen plotter
4. Document deviations and feed back into algorithm
5. Create parameter presets for different musical styles
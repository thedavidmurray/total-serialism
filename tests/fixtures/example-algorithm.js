/**
 * Example pen plotter algorithm for testing demonstration
 * Creates a spiral pattern with configurable parameters
 */

function createSpiral(params = {}) {
  // Define and validate parameters
  const schema = ParameterValidator.schema({
    width: {
      type: 'number',
      required: true,
      min: 50,
      max: 2000,
      description: 'Canvas width'
    },
    height: {
      type: 'number',
      required: true,
      min: 50,
      max: 2000,
      description: 'Canvas height'
    },
    turns: {
      type: 'number',
      default: 10,
      min: 1,
      max: 50,
      description: 'Number of spiral turns'
    },
    segments: {
      type: 'integer',
      default: 200,
      min: 10,
      max: 1000,
      description: 'Number of line segments'
    },
    innerRadius: {
      type: 'number',
      default: 10,
      min: 0,
      description: 'Inner spiral radius'
    },
    seed: {
      type: 'integer',
      default: 12345,
      description: 'Random seed for variations'
    }
  });

  // Validate parameters
  const validation = ParameterValidator.validate(params, schema);
  if (!validation.valid) {
    throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
  }

  const { width, height, turns, segments, innerRadius, seed } = validation.validated;
  
  // Create seeded random for variations
  const rng = DeterminismTester.createSeededRandom(seed);
  
  // Calculate spiral
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - 20;
  const radiusStep = (maxRadius - innerRadius) / segments;
  const angleStep = (turns * 2 * Math.PI) / segments;
  
  // Generate points
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const angle = i * angleStep;
    const radius = innerRadius + i * radiusStep;
    
    // Add slight variation
    const variation = rng.randomRange(-2, 2);
    
    const x = centerX + Math.cos(angle) * (radius + variation);
    const y = centerY + Math.sin(angle) * (radius + variation);
    
    points.push({ x, y });
  }
  
  // Convert to SVG path
  let pathData = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathData += ` L ${points[i].x} ${points[i].y}`;
  }
  
  // Create SVG
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <path d="${pathData}" stroke="black" stroke-width="1" fill="none"/>
  </svg>`;
  
  return {
    svg,
    points,
    params: validation.validated
  };
}

// Test suite for the spiral algorithm
describe('Spiral Algorithm', () => {
  it('should generate valid SVG', () => {
    const result = createSpiral({
      width: 300,
      height: 300,
      turns: 5
    });
    
    const validation = SVGValidator.isValidSVG(result.svg);
    expect(validation.valid).toBeTruthy();
  });
  
  it('should be pen plotter compatible', () => {
    const result = createSpiral({
      width: 300,
      height: 300
    });
    
    const plottable = SVGValidator.validateForPenPlotter(result.svg);
    expect(plottable.valid).toBeTruthy();
    expect(plottable.issues).toHaveLength(0);
  });
  
  it('should be deterministic', async () => {
    const params = {
      width: 200,
      height: 200,
      turns: 3,
      segments: 50,
      seed: 42
    };
    
    const determinism = await DeterminismTester.testDeterminism(
      () => createSpiral(params),
      params.seed,
      5
    );
    
    expect(determinism.isDeterministic).toBeTruthy();
  });
  
  it('should validate parameters', () => {
    // Invalid width
    expect(() => {
      createSpiral({ width: -100, height: 200 });
    }).toThrow();
    
    // Missing required parameter
    expect(() => {
      createSpiral({ width: 200 });
    }).toThrow();
    
    // Valid with defaults
    const result = createSpiral({
      width: 200,
      height: 200
    });
    expect(result.params.turns).toBe(10);
    expect(result.params.segments).toBe(200);
  });
  
  it('should generate correct number of points', () => {
    const result = createSpiral({
      width: 200,
      height: 200,
      segments: 100
    });
    
    expect(result.points).toHaveLength(101); // segments + 1
  });
  
  it('should keep points within bounds', () => {
    const result = createSpiral({
      width: 400,
      height: 300,
      turns: 20,
      segments: 500
    });
    
    result.points.forEach(point => {
      expect(point.x).toBeGreaterThan(-5); // Small tolerance for variations
      expect(point.x).toBeLessThan(405);
      expect(point.y).toBeGreaterThan(-5);
      expect(point.y).toBeLessThan(305);
    });
  });
  
  it('should perform well', async () => {
    const benchmark = await PerformanceBenchmark.benchmark(
      () => createSpiral({
        width: 1000,
        height: 1000,
        turns: 30,
        segments: 1000
      }),
      {
        iterations: 10,
        warmup: 3,
        name: 'Large spiral'
      }
    );
    
    // Should complete in reasonable time
    expect(benchmark.stats.median).toBeLessThan(100);
    console.log(`Spiral generation time: ${benchmark.stats.median.toFixed(2)}ms`);
  });
  
  it('should scale linearly with segments', async () => {
    const complexity = await PerformanceBenchmark.profileComplexity(
      (size) => () => createSpiral({
        width: 500,
        height: 500,
        segments: size
      }),
      [100, 200, 400, 800],
      { iterations: 5 }
    );
    
    expect(complexity.complexity.type).toBe('O(n)');
  });
});
/**
 * Integration tests for pen plotter algorithms
 */

describe('Algorithm Integration Tests', () => {
  // Mock algorithm for testing
  const createGridAlgorithm = (params) => {
    const schema = ParameterValidator.schema({
      width: { type: 'number', required: true },
      height: { type: 'number', required: true },
      rows: { type: 'integer', default: 10, min: 1 },
      cols: { type: 'integer', default: 10, min: 1 },
      margin: { type: 'number', default: 20 },
      seed: { type: 'integer', default: 12345 }
    });

    const validation = ParameterValidator.validate(params, schema);
    if (!validation.valid) {
      throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
    }

    const { width, height, rows, cols, margin, seed } = validation.validated;
    const rng = DeterminismTester.createSeededRandom(seed);

    // Generate grid points
    const points = [];
    const cellWidth = (width - 2 * margin) / cols;
    const cellHeight = (height - 2 * margin) / rows;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = margin + col * cellWidth + cellWidth / 2;
        const y = margin + row * cellHeight + cellHeight / 2;
        
        // Add some randomness
        const jitter = 5;
        points.push({
          x: x + rng.randomRange(-jitter, jitter),
          y: y + rng.randomRange(-jitter, jitter)
        });
      }
    }

    // Convert to SVG
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += '<g stroke="black" stroke-width="1" fill="none">';
    
    // Draw points as small circles
    points.forEach(p => {
      svg += `<circle cx="${p.x}" cy="${p.y}" r="2"/>`;
    });
    
    svg += '</g></svg>';

    return { points, svg };
  };

  it('should generate valid SVG output', () => {
    const result = createGridAlgorithm({
      width: 200,
      height: 200,
      rows: 5,
      cols: 5
    });

    const validation = SVGValidator.isValidSVG(result.svg);
    expect(validation.valid).toBeTruthy();

    const plottable = SVGValidator.validateForPenPlotter(result.svg);
    expect(plottable.valid).toBeTruthy();
  });

  it('should be deterministic with same seed', async () => {
    const algorithmFactory = () => createGridAlgorithm({
      width: 100,
      height: 100,
      rows: 3,
      cols: 3,
      seed: 42
    });

    const determinism = await DeterminismTester.testDeterminism(
      algorithmFactory,
      42,
      5
    );

    expect(determinism.isDeterministic).toBeTruthy();
  });

  it('should produce different output with different seeds', () => {
    const result1 = createGridAlgorithm({
      width: 100,
      height: 100,
      seed: 1
    });

    const result2 = createGridAlgorithm({
      width: 100,
      height: 100,
      seed: 2
    });

    const comparison = SVGValidator.compareSVGs(result1.svg, result2.svg);
    expect(comparison.similar).toBeFalsy();
  });

  it('should perform well with reasonable parameters', async () => {
    const benchmark = await PerformanceBenchmark.benchmark(
      () => createGridAlgorithm({
        width: 500,
        height: 500,
        rows: 20,
        cols: 20
      }),
      {
        iterations: 10,
        warmup: 3,
        name: 'Grid Algorithm (20x20)'
      }
    );

    expect(benchmark.stats.median).toBeLessThan(50); // Should be fast
    console.log(`Grid algorithm median time: ${benchmark.stats.median.toFixed(2)}ms`);
  });

  it('should scale linearly with grid size', async () => {
    const algorithmFactory = (size) => {
      return () => createGridAlgorithm({
        width: 500,
        height: 500,
        rows: size,
        cols: size
      });
    };

    const complexity = await PerformanceBenchmark.profileComplexity(
      algorithmFactory,
      [5, 10, 15, 20],
      { iterations: 5 }
    );

    // Grid algorithm should be O(n) where n is rows*cols
    expect(['O(n)', 'O(n log n)']).toContain(complexity.complexity.type);
  });

  it('should handle edge cases gracefully', () => {
    // Minimum size
    const small = createGridAlgorithm({
      width: 50,
      height: 50,
      rows: 1,
      cols: 1
    });
    expect(small.points).toHaveLength(1);

    // Large grid
    const large = createGridAlgorithm({
      width: 1000,
      height: 1000,
      rows: 50,
      cols: 50
    });
    expect(large.points).toHaveLength(2500);

    // Non-square
    const rectangular = createGridAlgorithm({
      width: 200,
      height: 400,
      rows: 5,
      cols: 10
    });
    expect(rectangular.points).toHaveLength(50);
  });

  it('should integrate multiple algorithms', () => {
    // Create a flow field algorithm
    const createFlowField = (params) => {
      const { width, height, gridSize = 20, seed } = params;
      const rng = DeterminismTester.createSeededRandom(seed);
      
      let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
      svg += '<g stroke="black" stroke-width="0.5" fill="none">';
      
      for (let x = 0; x < width; x += gridSize) {
        for (let y = 0; y < height; y += gridSize) {
          const angle = rng.random() * Math.PI * 2;
          const length = gridSize * 0.8;
          const x2 = x + Math.cos(angle) * length;
          const y2 = y + Math.sin(angle) * length;
          svg += `<path d="M ${x} ${y} L ${x2} ${y2}"/>`;
        }
      }
      
      svg += '</g></svg>';
      return svg;
    };

    // Test both algorithms together
    const grid = createGridAlgorithm({
      width: 300,
      height: 300,
      rows: 10,
      cols: 10,
      seed: 123
    });

    const flow = createFlowField({
      width: 300,
      height: 300,
      gridSize: 30,
      seed: 123
    });

    // Both should produce valid SVG
    expect(SVGValidator.isValidSVG(grid.svg).valid).toBeTruthy();
    expect(SVGValidator.isValidSVG(flow).valid).toBeTruthy();
  });

  it('should validate algorithm output properties', () => {
    const result = createGridAlgorithm({
      width: 200,
      height: 200,
      rows: 4,
      cols: 4,
      margin: 20
    });

    // Check all points are within bounds
    result.points.forEach(point => {
      expect(point.x).toBeGreaterThan(15); // margin - jitter
      expect(point.x).toBeLessThan(185);   // width - margin + jitter
      expect(point.y).toBeGreaterThan(15);
      expect(point.y).toBeLessThan(185);
    });

    // Check SVG structure
    const paths = SVGValidator.extractPaths(result.svg);
    expect(result.svg).toContain('stroke="black"');
    expect(result.svg).toContain('fill="none"');
  });
});
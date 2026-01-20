/**
 * Unit tests for algorithm determinism
 */

describe('Determinism Testing', () => {
  it('should test basic determinism', async () => {
    const testAlgorithm = () => {
      const rng = DeterminismTester.createSeededRandom(12345);
      const points = [];
      for (let i = 0; i < 10; i++) {
        points.push({
          x: rng.randomRange(0, 100),
          y: rng.randomRange(0, 100)
        });
      }
      return points;
    };

    const result = await DeterminismTester.testDeterminism(testAlgorithm, 12345);
    expect(result.isDeterministic).toBeTruthy();
  });

  it('should detect non-deterministic behavior', async () => {
    const nonDeterministicAlgorithm = () => {
      // Using Math.random() instead of seeded random
      const points = [];
      for (let i = 0; i < 5; i++) {
        points.push({
          x: Math.random() * 100,
          y: Math.random() * 100
        });
      }
      return points;
    };

    const result = await DeterminismTester.testDeterminism(nonDeterministicAlgorithm, 12345);
    expect(result.isDeterministic).toBeFalsy();
  });

  it('should create consistent seeded random', () => {
    const rng1 = DeterminismTester.createSeededRandom(42);
    const rng2 = DeterminismTester.createSeededRandom(42);

    const values1 = [];
    const values2 = [];

    for (let i = 0; i < 10; i++) {
      values1.push(rng1.random());
      values2.push(rng2.random());
    }

    expect(values1).toEqual(values2);
  });

  it('should generate consistent random ranges', () => {
    const rng = DeterminismTester.createSeededRandom(999);
    
    const ranges = [];
    for (let i = 0; i < 5; i++) {
      ranges.push(rng.randomRange(10, 20));
    }

    // All values should be within range
    ranges.forEach(value => {
      expect(value).toBeGreaterThan(9.99);
      expect(value).toBeLessThan(20.01);
    });

    // Reset and verify same sequence
    rng.reset();
    const ranges2 = [];
    for (let i = 0; i < 5; i++) {
      ranges2.push(rng.randomRange(10, 20));
    }

    expect(ranges).toEqual(ranges2);
  });

  it('should find differences between outputs', () => {
    const output1 = {
      points: [{ x: 10, y: 20 }, { x: 30, y: 40 }],
      color: 'red'
    };

    const output2 = {
      points: [{ x: 10, y: 20 }, { x: 35, y: 40 }],
      color: 'red'
    };

    const differences = DeterminismTester.findDifferences(output1, output2);
    expect(differences.length).toBeGreaterThan(0);
    expect(differences[0].path).toBe('points[1].x');
  });

  it('should handle p5.js determinism testing', async () => {
    // Mock p5.js sketch that generates points
    const sketchFunction = (p) => {
      const points = [];
      for (let i = 0; i < 5; i++) {
        points.push({
          x: p.random(0, 100),
          y: p.random(0, 100)
        });
      }
      return points;
    };

    // Note: This test would need actual p5.js to run properly
    // For now, we'll test the structure
    expect(DeterminismTester.testP5Determinism).toBeDefined();
  });

  it('should analyze output differences', () => {
    const outputs = [
      { value: 100, items: [1, 2, 3] },
      { value: 100, items: [1, 2, 3] },
      { value: 101, items: [1, 2, 3] }
    ];

    const analysis = DeterminismTester.analyzeOutputs(outputs);
    expect(analysis.totalOutputs).toBe(3);
    expect(analysis.uniqueOutputs).toBe(2);
    expect(analysis.differences.length).toBeGreaterThan(0);
  });
});
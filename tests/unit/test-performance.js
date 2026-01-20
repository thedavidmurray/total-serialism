/**
 * Unit tests for performance benchmarking
 */

describe('Performance Benchmarking', () => {
  it('should benchmark a simple function', async () => {
    const testFunction = () => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        sum += i;
      }
      return sum;
    };

    const result = await PerformanceBenchmark.benchmark(testFunction, {
      iterations: 5,
      warmup: 2,
      name: 'Sum calculation'
    });

    expect(result.name).toBe('Sum calculation');
    expect(result.times).toHaveLength(5);
    expect(result.stats.mean).toBeGreaterThan(0);
    expect(result.stats.median).toBeGreaterThan(0);
  });

  it('should compare multiple functions', async () => {
    const functions = {
      'Array push': () => {
        const arr = [];
        for (let i = 0; i < 100; i++) {
          arr.push(i);
        }
      },
      'Array pre-allocated': () => {
        const arr = new Array(100);
        for (let i = 0; i < 100; i++) {
          arr[i] = i;
        }
      }
    };

    const comparison = await PerformanceBenchmark.compareFunctions(functions, {
      iterations: 10,
      warmup: 3
    });

    expect(comparison.results).toHaveLength(2);
    expect(comparison.results[0].stats.relative).toBe(1); // Fastest is baseline
    expect(comparison.summary).toContain('Performance Comparison');
  });

  it('should calculate statistics correctly', () => {
    const times = [10, 12, 11, 13, 15, 11, 12, 14, 13, 11];
    const stats = PerformanceBenchmark.calculateStats(times);

    expect(stats.min).toBe(10);
    expect(stats.max).toBe(15);
    expect(stats.mean).toBeCloseTo(12.2, 1);
    expect(stats.median).toBe(12);
    expect(stats.stdDev).toBeGreaterThan(0);
  });

  it('should profile algorithm complexity', async () => {
    // O(n) algorithm
    const linearAlgorithm = (size) => {
      return () => {
        let sum = 0;
        for (let i = 0; i < size; i++) {
          sum += i;
        }
        return sum;
      };
    };

    const result = await PerformanceBenchmark.profileComplexity(
      linearAlgorithm,
      [100, 200, 400, 800],
      { iterations: 3 }
    );

    expect(result.results).toHaveLength(4);
    expect(result.complexity).toBeDefined();
    expect(result.chart).toContain('Time (ms) vs Input Size');
  });

  it('should detect O(n²) complexity', async () => {
    // O(n²) algorithm
    const quadraticAlgorithm = (size) => {
      return () => {
        let sum = 0;
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            sum += i * j;
          }
        }
        return sum;
      };
    };

    const result = await PerformanceBenchmark.profileComplexity(
      quadraticAlgorithm,
      [10, 20, 30, 40],
      { iterations: 2 }
    );

    // For small sizes, might detect as O(n²) or polynomial
    expect(['O(n²)', 'O(n²+)']).toContain(result.complexity.type);
  });

  it('should handle benchmark with setup and teardown', async () => {
    let setupCalled = 0;
    let teardownCalled = 0;

    const result = await PerformanceBenchmark.benchmark(
      () => {
        // Main function
        return 42;
      },
      {
        iterations: 3,
        warmup: 1,
        setup: () => {
          setupCalled++;
        },
        teardown: () => {
          teardownCalled++;
        }
      }
    );

    expect(setupCalled).toBe(4); // 1 warmup + 3 iterations
    expect(teardownCalled).toBe(4);
    expect(result.times).toHaveLength(3);
  });

  it('should create complexity chart', () => {
    const results = [
      { size: 100, time: 5 },
      { size: 200, time: 12 },
      { size: 400, time: 28 },
      { size: 800, time: 65 }
    ];

    const chart = PerformanceBenchmark.createComplexityChart(results);
    
    expect(chart).toContain('Time (ms) vs Input Size');
    expect(chart).toContain('65.0ms'); // Max time
    expect(chart).toContain('0ms'); // Min time
    expect(chart).toContain('Input sizes');
  });

  it('should get correct percentiles', () => {
    const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    expect(PerformanceBenchmark.getPercentile(sorted, 0.5)).toBe(5); // Median
    expect(PerformanceBenchmark.getPercentile(sorted, 0.9)).toBe(9); // 90th percentile
    expect(PerformanceBenchmark.getPercentile(sorted, 0.95)).toBe(10); // 95th percentile
  });
});
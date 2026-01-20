/**
 * Performance benchmarking utilities for pen plotter algorithms
 */

class PerformanceBenchmark {
  /**
   * Benchmark a function's execution time
   */
  static async benchmark(fn, options = {}) {
    const {
      iterations = 10,
      warmup = 3,
      setup = null,
      teardown = null,
      name = 'Anonymous function'
    } = options;
    
    const results = {
      name,
      iterations,
      times: [],
      stats: null
    };
    
    // Warmup runs
    for (let i = 0; i < warmup; i++) {
      if (setup) await setup();
      await fn();
      if (teardown) await teardown();
    }
    
    // Actual benchmark runs
    for (let i = 0; i < iterations; i++) {
      if (setup) await setup();
      
      const startTime = performance.now();
      await fn();
      const endTime = performance.now();
      
      if (teardown) await teardown();
      
      results.times.push(endTime - startTime);
    }
    
    // Calculate statistics
    results.stats = this.calculateStats(results.times);
    
    return results;
  }

  /**
   * Compare performance of multiple functions
   */
  static async compareFunctions(functions, options = {}) {
    const results = [];
    
    for (const [name, fn] of Object.entries(functions)) {
      const result = await this.benchmark(fn, { ...options, name });
      results.push(result);
    }
    
    // Sort by median time
    results.sort((a, b) => a.stats.median - b.stats.median);
    
    // Add relative performance
    const fastestTime = results[0].stats.median;
    results.forEach(result => {
      result.stats.relative = result.stats.median / fastestTime;
    });
    
    return {
      results,
      summary: this.createComparisonSummary(results)
    };
  }

  /**
   * Calculate statistics from time measurements
   */
  static calculateStats(times) {
    const sorted = [...times].sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / times.length,
      median: this.getMedian(sorted),
      p95: this.getPercentile(sorted, 0.95),
      p99: this.getPercentile(sorted, 0.99),
      stdDev: this.getStandardDeviation(times),
      cv: null // Coefficient of variation (will be calculated)
    };
  }

  /**
   * Get median from sorted array
   */
  static getMedian(sorted) {
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Get percentile from sorted array
   */
  static getPercentile(sorted, percentile) {
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.min(index, sorted.length - 1)];
  }

  /**
   * Calculate standard deviation
   */
  static getStandardDeviation(times) {
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    const squaredDiffs = times.map(t => Math.pow(t - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / times.length;
    return Math.sqrt(variance);
  }

  /**
   * Create comparison summary
   */
  static createComparisonSummary(results) {
    const lines = ['Performance Comparison Summary:', ''];
    
    results.forEach((result, index) => {
      const emoji = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      const relativeStr = index === 0 ? '' : ` (${result.stats.relative.toFixed(2)}x slower)`;
      
      lines.push(
        `${emoji} ${result.name}: ${result.stats.median.toFixed(2)}ms${relativeStr}`
      );
    });
    
    return lines.join('\n');
  }

  /**
   * Benchmark memory usage (where available)
   */
  static async benchmarkMemory(fn, options = {}) {
    if (!performance.memory) {
      return {
        error: 'Memory profiling not available in this browser',
        hint: 'Try running in Chrome with --enable-precise-memory-info flag'
      };
    }
    
    const before = {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize
    };
    
    await fn();
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const after = {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize
    };
    
    return {
      before,
      after,
      delta: {
        usedJSHeapSize: after.usedJSHeapSize - before.usedJSHeapSize,
        totalJSHeapSize: after.totalJSHeapSize - before.totalJSHeapSize
      }
    };
  }

  /**
   * Profile algorithm complexity by testing with different input sizes
   */
  static async profileComplexity(algorithmFactory, inputSizes, options = {}) {
    const results = [];
    
    for (const size of inputSizes) {
      const fn = () => algorithmFactory(size);
      const benchmark = await this.benchmark(fn, {
        ...options,
        name: `Size ${size}`
      });
      
      results.push({
        size,
        time: benchmark.stats.median
      });
    }
    
    // Analyze complexity
    const complexity = this.analyzeComplexity(results);
    
    return {
      results,
      complexity,
      chart: this.createComplexityChart(results)
    };
  }

  /**
   * Analyze algorithm complexity from results
   */
  static analyzeComplexity(results) {
    if (results.length < 3) {
      return { type: 'unknown', message: 'Need at least 3 data points' };
    }
    
    // Calculate ratios between consecutive measurements
    const ratios = [];
    for (let i = 1; i < results.length; i++) {
      const sizeRatio = results[i].size / results[i-1].size;
      const timeRatio = results[i].time / results[i-1].time;
      ratios.push({ sizeRatio, timeRatio });
    }
    
    // Analyze ratios to determine complexity
    const avgTimeRatio = ratios.reduce((sum, r) => sum + r.timeRatio, 0) / ratios.length;
    const avgSizeRatio = ratios.reduce((sum, r) => sum + r.sizeRatio, 0) / ratios.length;
    
    // Rough complexity detection
    if (avgTimeRatio < 1.5) {
      return { type: 'O(1)', description: 'Constant time' };
    } else if (avgTimeRatio < avgSizeRatio * 1.2) {
      return { type: 'O(n)', description: 'Linear time' };
    } else if (avgTimeRatio < Math.pow(avgSizeRatio, 1.5) * 1.2) {
      return { type: 'O(n log n)', description: 'Linearithmic time' };
    } else if (avgTimeRatio < Math.pow(avgSizeRatio, 2) * 1.2) {
      return { type: 'O(n²)', description: 'Quadratic time' };
    } else {
      return { type: 'O(n²+)', description: 'Polynomial or worse' };
    }
  }

  /**
   * Create ASCII chart of complexity results
   */
  static createComplexityChart(results) {
    const maxTime = Math.max(...results.map(r => r.time));
    const chartHeight = 10;
    const chartWidth = 50;
    
    const chart = [];
    chart.push('Time (ms) vs Input Size');
    chart.push('│');
    
    for (let row = chartHeight; row >= 0; row--) {
      let line = '│';
      const threshold = (row / chartHeight) * maxTime;
      
      results.forEach(result => {
        const normalized = result.time / maxTime;
        const height = normalized * chartHeight;
        line += height >= row ? '█' : ' ';
      });
      
      if (row === chartHeight) {
        line += ` ${maxTime.toFixed(1)}ms`;
      } else if (row === 0) {
        line += ' 0ms';
      }
      
      chart.push(line);
    }
    
    chart.push('└' + '─'.repeat(results.length));
    chart.push(' ' + results.map(r => r.size.toString().padEnd(1)).join(''));
    chart.push(' Input sizes');
    
    return chart.join('\n');
  }
}
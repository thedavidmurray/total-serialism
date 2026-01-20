/**
 * Example usage of the performance monitoring system
 * Demonstrates various ways to use performance monitoring and profiling
 */

import { perfMonitor, measureMethod } from './performance';
import { profiler, profileMethod, analyzeAsyncPerformance } from './profiler';

/**
 * Example class demonstrating performance monitoring decorators
 */
class DataProcessor {
  private data: number[] = [];

  /**
   * Method with automatic performance measurement
   */
  @measureMethod
  async processData(count: number): Promise<void> {
    // Simulate data processing
    this.data = Array.from({ length: count }, (_, i) => Math.random() * i);
    
    // Sort data (intentionally inefficient for demo)
    for (let i = 0; i < this.data.length; i++) {
      for (let j = 0; j < this.data.length - 1; j++) {
        if (this.data[j] > this.data[j + 1]) {
          [this.data[j], this.data[j + 1]] = [this.data[j + 1], this.data[j]];
        }
      }
    }
  }

  /**
   * Method with profiling to detect bottlenecks
   */
  @profileMethod
  async analyzeData(): Promise<{ min: number; max: number; avg: number }> {
    await profiler.profile('validation', () => {
      if (this.data.length === 0) throw new Error('No data to analyze');
    });

    let min: number, max: number, sum: number;

    await profiler.profile('statistics', async () => {
      min = await this.findMin();
      max = await this.findMax();
      sum = await this.calculateSum();
    });

    return { min: min!, max: max!, avg: sum! / this.data.length };
  }

  @profileMethod
  private async findMin(): Promise<number> {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 10));
    return Math.min(...this.data);
  }

  @profileMethod
  private async findMax(): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 10));
    return Math.max(...this.data);
  }

  @profileMethod
  private async calculateSum(): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 5));
    return this.data.reduce((a, b) => a + b, 0);
  }
}

/**
 * Example animation loop with FPS tracking
 */
async function animationExample(): Promise<void> {
  console.log('\n=== Animation Performance Example ===');
  
  const frameCount = 60;
  let slowFrames = 0;

  for (let i = 0; i < frameCount; i++) {
    perfMonitor.start(`frame-${i}`);
    
    // Simulate frame rendering with variable performance
    const complexity = Math.random() > 0.8 ? 50 : 10; // 20% chance of complex frame
    await new Promise(resolve => setTimeout(resolve, complexity));
    
    const frameTime = perfMonitor.end(`frame-${i}`)!;
    const fps = perfMonitor.trackFrame();
    
    if (fps < 30) {
      slowFrames++;
    }
  }

  console.log(`Average FPS: ${perfMonitor.getAverageFPS().toFixed(1)}`);
  console.log(`Slow frames (<30 FPS): ${slowFrames}/${frameCount}`);
}

/**
 * Example of manual performance monitoring
 */
async function manualMonitoringExample(): Promise<void> {
  console.log('\n=== Manual Performance Monitoring Example ===');

  // Simple measurement
  await perfMonitor.measure('simple-task', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  // Nested measurements
  perfMonitor.start('parent-task');
  
  await perfMonitor.measure('child-task-1', async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  
  await perfMonitor.measure('child-task-2', async () => {
    await new Promise(resolve => setTimeout(resolve, 75));
  });
  
  perfMonitor.end('parent-task');

  // Generate report
  console.log('\n' + perfMonitor.generateReport());
}

/**
 * Example of async performance analysis
 */
async function asyncAnalysisExample(): Promise<void> {
  console.log('\n=== Async Performance Analysis Example ===');

  // Analyze performance over multiple runs
  await analyzeAsyncPerformance('network-request', async () => {
    // Simulate variable network latency
    const latency = 50 + Math.random() * 100;
    await new Promise(resolve => setTimeout(resolve, latency));
    return { status: 200, data: 'success' };
  }, 20); // Run 20 iterations
}

/**
 * Main example runner
 */
export async function runPerformanceExamples(): Promise<void> {
  // Only run in development
  if (process.env.NODE_ENV === 'production') {
    console.log('Performance monitoring examples are disabled in production');
    return;
  }

  console.log('Running Performance Monitoring Examples...\n');

  // Example 1: Class with decorators
  const processor = new DataProcessor();
  await processor.processData(1000);
  const stats = await processor.analyzeData();
  console.log('Data analysis results:', stats);

  // Example 2: Animation performance
  await animationExample();

  // Example 3: Manual monitoring
  await manualMonitoringExample();

  // Example 4: Async analysis
  await asyncAnalysisExample();

  // Generate final reports
  console.log('\n=== Final Performance Report ===');
  console.log(perfMonitor.generateReport());
  
  console.log('\n=== Final Profiler Report ===');
  console.log(profiler.generateReport({
    sortBy: 'totalTime',
    minTime: 10 // Only show operations > 10ms
  }));

  // Detect bottlenecks
  const bottlenecks = profiler.detectBottlenecks(15); // 15% threshold
  if (bottlenecks.length > 0) {
    console.log('\n=== Detected Bottlenecks ===');
    bottlenecks.forEach(b => {
      console.log(`${b.name}: ${b.percentOfTotal.toFixed(1)}% (${b.calls} calls, avg ${b.averageTime.toFixed(2)}ms)`);
    });
  }

  // Clean up
  perfMonitor.clear();
  profiler.clear();
}

// Run examples if this file is executed directly
if (require.main === module) {
  runPerformanceExamples().catch(console.error);
}
/**
 * Code profiling utilities for performance analysis
 * Provides bottleneck detection and detailed performance reports
 */

import { perfMonitor, PerformanceMonitor } from './performance';

interface ProfilerNode {
  name: string;
  calls: number;
  totalTime: number;
  selfTime: number;
  children: Map<string, ProfilerNode>;
  parent?: ProfilerNode;
}

interface Bottleneck {
  name: string;
  totalTime: number;
  selfTime: number;
  calls: number;
  averageTime: number;
  percentOfTotal: number;
}

export class Profiler {
  private static instance: Profiler;
  private rootNode: ProfilerNode;
  private currentNode: ProfilerNode;
  private callStack: ProfilerNode[] = [];
  private enabled: boolean;
  private startTime: number = 0;

  private constructor() {
    this.enabled = process.env.NODE_ENV !== 'production';
    this.rootNode = this.createNode('root');
    this.currentNode = this.rootNode;
  }

  static getInstance(): Profiler {
    if (!Profiler.instance) {
      Profiler.instance = new Profiler();
    }
    return Profiler.instance;
  }

  /**
   * Start profiling a code section
   */
  start(name: string): void {
    if (!this.enabled) return;

    if (this.callStack.length === 0) {
      this.startTime = performance.now();
    }

    let childNode = this.currentNode.children.get(name);
    if (!childNode) {
      childNode = this.createNode(name, this.currentNode);
      this.currentNode.children.set(name, childNode);
    }

    childNode.calls++;
    this.callStack.push(this.currentNode);
    this.currentNode = childNode;

    perfMonitor.start(`profiler_${name}_${childNode.calls}`);
  }

  /**
   * End profiling a code section
   */
  end(name: string): void {
    if (!this.enabled) return;

    if (this.currentNode.name !== name) {
      console.warn(`[Profiler] Mismatched end call. Expected: ${this.currentNode.name}, Got: ${name}`);
      return;
    }

    const duration = perfMonitor.end(`profiler_${name}_${this.currentNode.calls}`) || 0;
    this.currentNode.totalTime += duration;
    this.currentNode.selfTime += duration;

    if (this.callStack.length > 0) {
      const parent = this.callStack.pop()!;
      parent.selfTime -= duration;
      this.currentNode = parent;
    }
  }

  /**
   * Profile a function execution
   */
  async profile<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    if (!this.enabled) return fn();

    this.start(name);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Decorator for profiling methods
   */
  static profileMethod(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const profiler = Profiler.getInstance();

    descriptor.value = async function (...args: any[]) {
      const name = `${target.constructor.name}.${propertyKey}`;
      return profiler.profile(name, () => originalMethod.apply(this, args));
    };

    return descriptor;
  }

  /**
   * Detect performance bottlenecks
   */
  detectBottlenecks(threshold: number = 10): Bottleneck[] {
    if (!this.enabled) return [];

    const totalTime = performance.now() - this.startTime;
    const bottlenecks: Bottleneck[] = [];

    this.traverseNodes(this.rootNode, (node) => {
      if (node.name === 'root') return;

      const percentOfTotal = (node.totalTime / totalTime) * 100;
      
      if (percentOfTotal >= threshold) {
        bottlenecks.push({
          name: node.name,
          totalTime: node.totalTime,
          selfTime: node.selfTime,
          calls: node.calls,
          averageTime: node.totalTime / node.calls,
          percentOfTotal
        });
      }
    });

    return bottlenecks.sort((a, b) => b.totalTime - a.totalTime);
  }

  /**
   * Generate a detailed profiling report
   */
  generateReport(options: {
    sortBy?: 'totalTime' | 'selfTime' | 'calls' | 'average';
    minTime?: number;
    maxDepth?: number;
  } = {}): string {
    if (!this.enabled) return 'Profiling disabled in production';

    const { sortBy = 'totalTime', minTime = 0, maxDepth = Infinity } = options;
    const report: string[] = ['=== Profiler Report ==='];
    
    const totalTime = performance.now() - this.startTime;
    report.push(`Total Execution Time: ${totalTime.toFixed(2)}ms\n`);

    // Collect all nodes
    const allNodes: ProfilerNode[] = [];
    this.traverseNodes(this.rootNode, (node) => {
      if (node.name !== 'root' && node.totalTime >= minTime) {
        allNodes.push(node);
      }
    });

    // Sort nodes
    allNodes.sort((a, b) => {
      switch (sortBy) {
        case 'selfTime':
          return b.selfTime - a.selfTime;
        case 'calls':
          return b.calls - a.calls;
        case 'average':
          return (b.totalTime / b.calls) - (a.totalTime / a.calls);
        default:
          return b.totalTime - a.totalTime;
      }
    });

    // Add header
    report.push('Function                          Calls    Total(ms)    Self(ms)    Avg(ms)    %Total');
    report.push('-'.repeat(85));

    // Add node data
    allNodes.forEach(node => {
      const avgTime = node.totalTime / node.calls;
      const percentTotal = (node.totalTime / totalTime) * 100;
      
      const name = node.name.padEnd(32).substring(0, 32);
      const calls = node.calls.toString().padStart(6);
      const total = node.totalTime.toFixed(2).padStart(11);
      const self = node.selfTime.toFixed(2).padStart(10);
      const avg = avgTime.toFixed(2).padStart(9);
      const percent = percentTotal.toFixed(1).padStart(8);

      report.push(`${name} ${calls} ${total} ${self} ${avg} ${percent}%`);
    });

    // Add bottlenecks section
    const bottlenecks = this.detectBottlenecks();
    if (bottlenecks.length > 0) {
      report.push('\n=== Bottlenecks (>10% of total time) ===');
      bottlenecks.forEach(bottleneck => {
        report.push(`  ${bottleneck.name}: ${bottleneck.percentOfTotal.toFixed(1)}% (${bottleneck.totalTime.toFixed(2)}ms)`);
      });
    }

    // Add call tree
    report.push('\n=== Call Tree ===');
    this.addCallTree(report, this.rootNode, 0, maxDepth);

    return report.join('\n');
  }

  /**
   * Generate a flame graph compatible data structure
   */
  generateFlameGraphData(): any {
    if (!this.enabled) return null;

    const convertNode = (node: ProfilerNode): any => {
      return {
        name: node.name,
        value: node.selfTime,
        children: Array.from(node.children.values()).map(convertNode)
      };
    };

    return convertNode(this.rootNode);
  }

  /**
   * Clear all profiling data
   */
  clear(): void {
    this.rootNode = this.createNode('root');
    this.currentNode = this.rootNode;
    this.callStack = [];
    this.startTime = 0;
  }

  /**
   * Create a new profiler node
   */
  private createNode(name: string, parent?: ProfilerNode): ProfilerNode {
    return {
      name,
      calls: 0,
      totalTime: 0,
      selfTime: 0,
      children: new Map(),
      parent
    };
  }

  /**
   * Traverse all nodes in the tree
   */
  private traverseNodes(node: ProfilerNode, callback: (node: ProfilerNode) => void): void {
    callback(node);
    node.children.forEach(child => this.traverseNodes(child, callback));
  }

  /**
   * Add call tree to report
   */
  private addCallTree(report: string[], node: ProfilerNode, depth: number, maxDepth: number): void {
    if (depth > maxDepth) return;

    const indent = '  '.repeat(depth);
    if (node.name !== 'root') {
      const time = node.totalTime.toFixed(2);
      const calls = node.calls;
      report.push(`${indent}${node.name} (${calls} calls, ${time}ms)`);
    }

    // Sort children by total time
    const sortedChildren = Array.from(node.children.values())
      .sort((a, b) => b.totalTime - a.totalTime);

    sortedChildren.forEach(child => {
      this.addCallTree(report, child, depth + 1, maxDepth);
    });
  }

  /**
   * Enable/disable profiling at runtime
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled && process.env.NODE_ENV !== 'production';
  }

  /**
   * Check if profiling is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const profiler = Profiler.getInstance();

// Export decorator
export const profileMethod = Profiler.profileMethod;

/**
 * Utility function to analyze async performance
 */
export async function analyzeAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>,
  iterations: number = 10
): Promise<{
  result: T;
  analysis: {
    min: number;
    max: number;
    average: number;
    median: number;
    standardDeviation: number;
  };
}> {
  const times: number[] = [];
  let result: T;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    result = await fn();
    const duration = performance.now() - start;
    times.push(duration);
  }

  times.sort((a, b) => a - b);

  const min = times[0];
  const max = times[times.length - 1];
  const average = times.reduce((a, b) => a + b, 0) / times.length;
  const median = times[Math.floor(times.length / 2)];
  
  const variance = times.reduce((acc, time) => {
    return acc + Math.pow(time - average, 2);
  }, 0) / times.length;
  
  const standardDeviation = Math.sqrt(variance);

  console.log(`[AsyncPerf] ${name}:`);
  console.log(`  Min: ${min.toFixed(2)}ms`);
  console.log(`  Max: ${max.toFixed(2)}ms`);
  console.log(`  Avg: ${average.toFixed(2)}ms`);
  console.log(`  Median: ${median.toFixed(2)}ms`);
  console.log(`  StdDev: ${standardDeviation.toFixed(2)}ms`);

  return {
    result: result!,
    analysis: {
      min,
      max,
      average,
      median,
      standardDeviation
    }
  };
}
/**
 * Utilities for testing algorithm determinism (same seed = same output)
 */

class DeterminismTester {
  /**
   * Test if a function produces deterministic output with a seeded random
   */
  static async testDeterminism(algorithmFunction, seed, iterations = 3) {
    const outputs = [];
    
    for (let i = 0; i < iterations; i++) {
      // Reset random seed before each run
      if (typeof randomSeed === 'function') {
        randomSeed(seed);
      } else if (typeof Math.seedrandom === 'function') {
        Math.seedrandom(seed);
      }
      
      // Run the algorithm
      const output = await algorithmFunction();
      outputs.push(output);
    }
    
    // Check if all outputs are identical
    const firstOutput = JSON.stringify(outputs[0]);
    const isDeterministic = outputs.every(output => 
      JSON.stringify(output) === firstOutput
    );
    
    return {
      isDeterministic,
      outputs,
      analysis: this.analyzeOutputs(outputs)
    };
  }

  /**
   * Analyze outputs for differences
   */
  static analyzeOutputs(outputs) {
    if (outputs.length < 2) {
      return { message: 'Need at least 2 outputs to analyze' };
    }
    
    const analysis = {
      totalOutputs: outputs.length,
      uniqueOutputs: new Set(outputs.map(o => JSON.stringify(o))).size,
      differences: []
    };
    
    // Compare each output with the first one
    const firstOutput = outputs[0];
    for (let i = 1; i < outputs.length; i++) {
      const diff = this.findDifferences(firstOutput, outputs[i]);
      if (diff.length > 0) {
        analysis.differences.push({
          comparedWith: i,
          differences: diff
        });
      }
    }
    
    return analysis;
  }

  /**
   * Find differences between two objects/arrays
   */
  static findDifferences(obj1, obj2, path = '') {
    const differences = [];
    
    // Handle different types
    if (typeof obj1 !== typeof obj2) {
      differences.push({
        path,
        type: 'type_mismatch',
        value1: typeof obj1,
        value2: typeof obj2
      });
      return differences;
    }
    
    // Handle primitives
    if (typeof obj1 !== 'object' || obj1 === null) {
      if (obj1 !== obj2) {
        differences.push({
          path,
          type: 'value_mismatch',
          value1: obj1,
          value2: obj2
        });
      }
      return differences;
    }
    
    // Handle arrays
    if (Array.isArray(obj1)) {
      if (!Array.isArray(obj2)) {
        differences.push({
          path,
          type: 'type_mismatch',
          value1: 'array',
          value2: 'not_array'
        });
        return differences;
      }
      
      if (obj1.length !== obj2.length) {
        differences.push({
          path,
          type: 'length_mismatch',
          value1: obj1.length,
          value2: obj2.length
        });
      }
      
      const maxLength = Math.max(obj1.length, obj2.length);
      for (let i = 0; i < maxLength; i++) {
        differences.push(...this.findDifferences(
          obj1[i], 
          obj2[i], 
          `${path}[${i}]`
        ));
      }
      
      return differences;
    }
    
    // Handle objects
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);
    
    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;
      
      if (!(key in obj1)) {
        differences.push({
          path: newPath,
          type: 'missing_in_first',
          value2: obj2[key]
        });
      } else if (!(key in obj2)) {
        differences.push({
          path: newPath,
          type: 'missing_in_second',
          value1: obj1[key]
        });
      } else {
        differences.push(...this.findDifferences(
          obj1[key], 
          obj2[key], 
          newPath
        ));
      }
    }
    
    return differences;
  }

  /**
   * Test determinism of p5.js sketches
   */
  static async testP5Determinism(sketchFunction, seed, iterations = 3) {
    const outputs = [];
    
    for (let i = 0; i < iterations; i++) {
      // Create a temporary container for p5
      const container = document.createElement('div');
      container.style.display = 'none';
      document.body.appendChild(container);
      
      let capturedOutput = null;
      
      // Create p5 instance with seed
      const sketch = (p) => {
        p.setup = function() {
          p.randomSeed(seed);
          p.noiseSeed(seed);
          
          // Call the sketch function
          const result = sketchFunction(p);
          capturedOutput = result;
          
          // Stop the sketch
          p.noLoop();
        };
      };
      
      // Run the sketch
      const p5Instance = new p5(sketch, container);
      
      // Wait a bit for sketch to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clean up
      p5Instance.remove();
      container.remove();
      
      outputs.push(capturedOutput);
    }
    
    return this.testDeterminism.call(this, () => outputs[0], seed, iterations);
  }

  /**
   * Create a seeded random number generator for testing
   */
  static createSeededRandom(seed) {
    let state = seed;
    
    return {
      random: function() {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
      },
      
      randomRange: function(min, max) {
        return min + this.random() * (max - min);
      },
      
      randomInt: function(min, max) {
        return Math.floor(this.randomRange(min, max + 1));
      },
      
      reset: function() {
        state = seed;
      }
    };
  }
}
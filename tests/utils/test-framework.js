/**
 * Simple browser-based testing framework for pen plotter art
 * Inspired by Jest but designed to run directly in the browser
 */

class TestFramework {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  describe(description, testFunction) {
    const suite = {
      description,
      tests: []
    };
    
    // Temporarily store current suite context
    this.currentSuite = suite;
    testFunction();
    this.currentSuite = null;
    
    this.tests.push(suite);
  }

  it(description, testFunction) {
    const test = {
      description,
      testFunction,
      status: 'pending'
    };
    
    if (this.currentSuite) {
      this.currentSuite.tests.push(test);
    } else {
      // Allow standalone tests
      this.tests.push({
        description: 'Standalone Tests',
        tests: [test]
      });
    }
  }

  async runTests() {
    console.log('🧪 Running tests...\n');
    
    for (const suite of this.tests) {
      console.log(`\n📦 ${suite.description}`);
      
      for (const test of suite.tests) {
        try {
          await test.testFunction();
          test.status = 'passed';
          this.results.passed++;
          console.log(`  ✅ ${test.description}`);
        } catch (error) {
          test.status = 'failed';
          test.error = error;
          this.results.failed++;
          console.error(`  ❌ ${test.description}`);
          console.error(`     ${error.message}`);
        }
        this.results.total++;
      }
    }
    
    this.printSummary();
    return this.results;
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary:');
    console.log(`Total: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log('='.repeat(50) + '\n');
  }

  // Assertion utilities
  expect(actual) {
    return {
      toBe(expected) {
        if (actual !== expected) {
          throw new Error(`Expected ${actual} to be ${expected}`);
        }
      },
      
      toEqual(expected) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
        }
      },
      
      toBeCloseTo(expected, precision = 2) {
        const diff = Math.abs(actual - expected);
        const maxDiff = Math.pow(10, -precision) / 2;
        if (diff > maxDiff) {
          throw new Error(`Expected ${actual} to be close to ${expected} (difference: ${diff})`);
        }
      },
      
      toContain(expected) {
        if (Array.isArray(actual)) {
          if (!actual.includes(expected)) {
            throw new Error(`Expected array to contain ${expected}`);
          }
        } else if (typeof actual === 'string') {
          if (!actual.includes(expected)) {
            throw new Error(`Expected string to contain "${expected}"`);
          }
        } else {
          throw new Error('toContain can only be used with arrays or strings');
        }
      },
      
      toHaveLength(expected) {
        if (actual.length !== expected) {
          throw new Error(`Expected length ${actual.length} to be ${expected}`);
        }
      },
      
      toBeTruthy() {
        if (!actual) {
          throw new Error(`Expected ${actual} to be truthy`);
        }
      },
      
      toBeFalsy() {
        if (actual) {
          throw new Error(`Expected ${actual} to be falsy`);
        }
      },
      
      toThrow() {
        if (typeof actual !== 'function') {
          throw new Error('toThrow can only be used with functions');
        }
        let thrown = false;
        try {
          actual();
        } catch (e) {
          thrown = true;
        }
        if (!thrown) {
          throw new Error('Expected function to throw');
        }
      }
    };
  }
}

// Create global test instance
const testFramework = new TestFramework();

// Export global functions
const describe = testFramework.describe.bind(testFramework);
const it = testFramework.it.bind(testFramework);
const expect = testFramework.expect.bind(testFramework);
const runTests = testFramework.runTests.bind(testFramework);
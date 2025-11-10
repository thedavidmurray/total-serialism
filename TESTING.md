# Testing Guide - Total Serialism

Comprehensive testing setup for validating all components of the Total Serialism project.

## 🎯 Overview

We use **Jest** for unit testing with the following coverage:
- PathOptimizer algorithms
- PresetManager functionality
- Algorithm catalog validation
- Integration tests

### Test Coverage Goals

- **Branches**: 70%+
- **Functions**: 75%+
- **Lines**: 75%+
- **Statements**: 75%+

---

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

This installs:
- `jest` - Test framework
- `@jest/globals` - Jest testing utilities
- `jest-environment-jsdom` - DOM environment for browser code
- `eslint` - Code linting

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### View Coverage Report

After running `npm run test:coverage`, open:
```bash
open coverage/lcov-report/index.html
```

---

## 📁 Test Structure

```
total-serialism/
├── __tests__/
│   ├── path-optimizer.test.js       # PathOptimizer unit tests
│   ├── preset-manager.test.js       # PresetManager unit tests
│   ├── algorithm-catalog.test.js    # Catalog validation tests
│   └── integration.test.js          # End-to-end tests (future)
├── .github/
│   └── workflows/
│       └── test.yml                 # CI/CD configuration
└── coverage/                        # Generated coverage reports
```

---

## 🧪 Test Suites

### 1. PathOptimizer Tests

**File**: `__tests__/path-optimizer.test.js`

**What's tested:**
- ✅ Constructor and initialization
- ✅ Distance calculations
- ✅ Line merge algorithm (connect paths)
- ✅ Line sort algorithm (minimize travel)
- ✅ Reloop algorithm (prevent ink blots)
- ✅ Line simplification (Douglas-Peucker)
- ✅ SVG parsing and generation
- ✅ Statistics calculation
- ✅ Time estimation
- ✅ Integration test with all optimizations

**Key test cases:**
```javascript
// Example: Testing line merge
test('should merge paths that share endpoints', () => {
  const paths = [
    { points: [{x:0,y:0}, {x:5,y:0}], closed: false },
    { points: [{x:5,y:0}, {x:10,y:0}], closed: false }
  ];

  const merged = optimizer.mergePaths(paths);
  expect(merged.length).toBeLessThan(paths.length);
});
```

**Run individually:**
```bash
npm test path-optimizer
```

### 2. PresetManager Tests

**File**: `__tests__/preset-manager.test.js`

**What's tested:**
- ✅ Preset save/load/delete
- ✅ Rename functionality
- ✅ Export/import JSON
- ✅ LocalStorage persistence
- ✅ Name conflict resolution
- ✅ Data integrity (cloning, IDs)
- ✅ HTML escaping (XSS prevention)
- ✅ Error handling

**Key test cases:**
```javascript
// Example: Testing preset persistence
test('should persist to localStorage on save', () => {
  presetManager.save('Test Preset');

  const stored = localStorage.getItem('total-serialism-presets-test');
  expect(stored).toBeDefined();

  const parsed = JSON.parse(stored);
  expect(parsed.length).toBe(1);
});
```

**Run individually:**
```bash
npm test preset-manager
```

### 3. Algorithm Catalog Tests

**File**: `__tests__/algorithm-catalog.test.js`

**What's tested:**
- ✅ JSON structure validation
- ✅ Required properties presence
- ✅ ID uniqueness
- ✅ Path format validation
- ✅ Complexity levels
- ✅ Statistics accuracy
- ✅ Data quality checks
- ✅ No duplicate names

**Key test cases:**
```javascript
// Example: Testing unique IDs
test('algorithm IDs should be unique', () => {
  const ids = allAlgorithms.map(a => a.id);
  const uniqueIds = new Set(ids);

  expect(uniqueIds.size).toBe(ids.length);
});
```

**Run individually:**
```bash
npm test algorithm-catalog
```

---

## 🔄 Continuous Integration

### GitHub Actions

Tests run automatically on:
- Every push to `main`, `master`, or `claude/**` branches
- Every pull request
- Multiple Node.js versions (18.x, 20.x)

**Workflow file**: `.github/workflows/test.yml`

**What it does:**
1. Checks out code
2. Sets up Node.js
3. Installs dependencies
4. Runs linter (if available)
5. Runs all tests
6. Generates coverage report
7. Uploads coverage to Codecov
8. Validates JSON files

**View results:**
- Check the "Actions" tab on GitHub
- Green checkmark = all tests passed
- Red X = tests failed (click for details)

---

## ✍️ Writing New Tests

### Test File Template

```javascript
/**
 * Unit tests for MyNewFeature
 */

describe('MyNewFeature', () => {
  let feature;

  beforeEach(() => {
    // Setup before each test
    feature = new MyNewFeature();
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Constructor', () => {
    test('should initialize correctly', () => {
      expect(feature).toBeDefined();
    });
  });

  describe('myMethod', () => {
    test('should return expected value', () => {
      const result = feature.myMethod();
      expect(result).toBe('expected');
    });

    test('should handle edge cases', () => {
      expect(() => feature.myMethod(null)).toThrow();
    });
  });
});
```

### Best Practices

1. **Test behavior, not implementation**
   ```javascript
   // Good: Tests what it does
   test('should optimize paths to reduce plot time', () => {
     const result = optimizer.optimize(paths);
     expect(result.timeSaved).toBeGreaterThan(0);
   });

   // Bad: Tests how it does it
   test('should call mergePaths function', () => {
     // Too implementation-specific
   });
   ```

2. **Use descriptive test names**
   ```javascript
   // Good
   test('should throw error when preset name is empty', () => {

   });

   // Bad
   test('test1', () => {

   });
   ```

3. **Test edge cases**
   - Empty arrays
   - Null/undefined values
   - Boundary values
   - Invalid input

4. **Keep tests independent**
   - Each test should work in isolation
   - Use `beforeEach` for setup
   - Don't rely on test execution order

5. **Mock external dependencies**
   ```javascript
   // Mock localStorage
   global.localStorage = {
     getItem: jest.fn(),
     setItem: jest.fn()
   };
   ```

---

## 📊 Coverage Reports

### Understanding Coverage

**4 types of coverage:**

1. **Statement Coverage**: Percentage of statements executed
2. **Branch Coverage**: Percentage of branches (if/else) tested
3. **Function Coverage**: Percentage of functions called
4. **Line Coverage**: Percentage of lines executed

**Example report:**
```
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|--------
path-optimizer.js     |   85.2  |   78.5   |   90.0  |   84.8
preset-manager.js     |   92.3  |   85.0   |   95.0  |   91.9
----------------------|---------|----------|---------|--------
All files             |   88.5  |   82.0   |   92.5  |   88.2
```

### Improving Coverage

1. **Identify uncovered lines**
   ```bash
   npm run test:coverage
   # Open coverage/lcov-report/index.html
   # Red lines = not covered
   ```

2. **Add tests for uncovered code**
   ```javascript
   // If error handling is uncovered, test it:
   test('should handle file read errors', () => {
     // ... test error case
   });
   ```

3. **Remove dead code**
   - If code can't be covered, maybe it's not needed

---

## 🐛 Debugging Tests

### Run specific test file

```bash
npm test path-optimizer
```

### Run specific test

```bash
npm test -- -t "should merge paths"
```

### Run in debug mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome.

### Use `console.log` for debugging

```javascript
test('debugging test', () => {
  console.log('Debug info:', myVariable);
  expect(myVariable).toBe('expected');
});
```

---

## 🎭 Mocking

### Mock localStorage

```javascript
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};

global.localStorage = localStorageMock;
```

### Mock DOM APIs

```javascript
global.document = {
  createElement: jest.fn(() => ({
    click: jest.fn(),
    appendChild: jest.fn()
  })),
  querySelector: jest.fn()
};
```

### Mock functions

```javascript
const mockFn = jest.fn();
mockFn.mockReturnValue('result');
mockFn.mockImplementation((x) => x * 2);

expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('argument');
```

---

## 📝 Common Test Patterns

### Testing async code

```javascript
test('should load preset async', async () => {
  const result = await presetManager.import(file);
  expect(result).toBeDefined();
});
```

### Testing exceptions

```javascript
test('should throw on invalid input', () => {
  expect(() => optimizer.optimize(null)).toThrow();
  expect(() => optimizer.optimize(null)).toThrow('Invalid input');
});
```

### Testing arrays

```javascript
test('should contain expected items', () => {
  const result = ['a', 'b', 'c'];

  expect(result).toContain('b');
  expect(result).toHaveLength(3);
  expect(result[0]).toBe('a');
});
```

### Testing objects

```javascript
test('should have expected properties', () => {
  const result = { id: 1, name: 'test' };

  expect(result).toHaveProperty('id');
  expect(result).toMatchObject({ name: 'test' });
  expect(result.id).toBe(1);
});
```

---

## 🚧 Future Test Plans

### Integration Tests

Test complete workflows end-to-end:
- Upload SVG → Optimize → Download
- Create preset → Save → Load → Verify
- Browse algorithms → Filter → Launch

### Visual Regression Tests

Compare rendered outputs:
- Screenshot comparison
- Canvas pixel matching
- SVG diff checking

### Performance Tests

Benchmark critical operations:
- Optimization of large SVGs
- Preset load/save speed
- Search/filter performance

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Jest Matchers](https://jestjs.io/docs/expect)
- [Mocking Guide](https://jestjs.io/docs/mock-functions)

---

## ⚡ Quick Commands

```bash
# Run all tests
npm test

# Watch mode (auto-rerun)
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test file
npm test path-optimizer

# Run specific test by name
npm test -- -t "should merge paths"

# Update snapshots (if using snapshot tests)
npm test -- -u

# Verbose output
npm test -- --verbose

# List all tests without running
npm test -- --listTests
```

---

## ✅ Checklist for New Features

When adding a new feature, ensure:

- [ ] Unit tests written
- [ ] Edge cases covered
- [ ] Error handling tested
- [ ] Integration test added (if applicable)
- [ ] Tests pass locally (`npm test`)
- [ ] Coverage maintained (>75%)
- [ ] Documentation updated

---

**Happy Testing! 🎉**

For questions or issues, check the GitHub issues or create a new one.

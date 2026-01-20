# Playwright E2E Tests for Pen Plotter Art Hub

## Overview

I've created comprehensive end-to-end tests using Playwright to ensure all the newly implemented algorithms work correctly. The test suite covers functionality, performance, and accessibility.

## Test Structure

### 1. Algorithm Tests (`tests/algorithms.spec.js`)
- **Image Processing**: Tests for SquiggleCam, Hatching, and Halftone converters
- **Hub Integration**: Verifies algorithms appear in the hub with correct filtering
- **Path Optimizer**: Validates the optimization utility functions
- **Spiral Fill**: Tests the newest geometric algorithm
- **Export Functionality**: Ensures SVG and PNG exports work correctly
- **Responsive Design**: Checks mobile viewport compatibility

### 2. Performance Tests (`tests/performance.spec.js`)
- **Large Image Handling**: Tests SquiggleCam with 1000x1000 images
- **Complex Path Optimization**: Validates performance with thousands of points
- **Concurrent Execution**: Tests multiple algorithms running simultaneously

### 3. Accessibility Tests (`tests/accessibility.spec.js`)
- **WCAG Compliance**: Uses axe-core for automated accessibility testing
- **Keyboard Navigation**: Ensures all controls are keyboard accessible
- **Screen Reader Support**: Validates ARIA labels and live regions
- **Focus Management**: Checks visible focus indicators

## Running the Tests

### Setup
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Run Tests
```bash
# Run all tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test tests/algorithms.spec.js
```

### Start Test Server
```bash
# In a separate terminal, start the web server
npm run serve
```

## Test Coverage

### Functional Testing
- ✅ All image processing algorithms load and process test images
- ✅ Parameter controls update visualizations in real-time
- ✅ Export functions generate valid SVG/PNG files
- ✅ Path optimization completes efficiently
- ✅ Hub filtering and search work correctly

### Performance Benchmarks
- SquiggleCam: < 10s for 1000x1000 images
- Path Optimizer: < 5s for complex spirals with 50 turns
- Memory Usage: < 500MB heap size

### Accessibility Standards
- WCAG 2.1 Level AA compliance
- Full keyboard navigation support
- Screen reader compatibility
- Proper focus management

## Configuration

### `playwright.config.js`
- Uses Chromium for testing
- Automatic screenshots on failure
- Video recording for failed tests
- Built-in web server on port 8080
- HTML reporter for results

### Test Utilities
- Canvas creation for test images
- Performance metrics collection
- Accessibility scanning with axe-core

## CI/CD Integration

The tests are configured to work in CI environments:
- Retries on failure (2 attempts in CI)
- Single worker in CI mode
- Automatic trace collection

## Debugging Failed Tests

When tests fail:
1. Check the HTML report: `npx playwright show-report`
2. Review screenshots in `test-results/`
3. Watch video recordings of failures
4. Use `--debug` flag for step-by-step debugging

## Best Practices

1. **Page Object Model**: Consider implementing for complex tests
2. **Test Data**: Use consistent test images/patterns
3. **Assertions**: Use Playwright's auto-waiting assertions
4. **Cleanup**: Tests clean up generated files automatically

## Future Enhancements

1. **Visual Regression**: Add screenshot comparison tests
2. **Cross-browser**: Test on Firefox and Safari
3. **Mobile Testing**: Enhanced mobile viewport tests
4. **API Testing**: Test export formats programmatically
5. **Load Testing**: Stress test with many simultaneous users

## Summary

The Playwright test suite ensures the Pen Plotter Art Hub remains stable and accessible as new features are added. All tests are designed to run quickly while providing comprehensive coverage of critical functionality.
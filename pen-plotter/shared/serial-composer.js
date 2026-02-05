/**
 * SERIAL COMPOSER
 * Implements true total serialism composition techniques for generative art
 * Based on 12-tone and total serialism music composition methods
 *
 * In total serialism, all parameters are organized into series where
 * each value must be used before any value repeats. This creates
 * structured variation and guaranteed parameter coverage.
 */

class SerialComposer {
  constructor() {
    this.series = {};
    this.currentIndices = {};
    this.matrices = {};
  }

  /**
   * Create a parameter series
   * All values must be used before any value repeats
   * @param {string} paramName - Name of the parameter (e.g., 'x', 'size', 'rotation')
   * @param {array} values - Array of values to cycle through
   * @param {object} options - Options like retrograde, inversion, etc.
   */
  createSeries(paramName, values, options = {}) {
    if (values.length === 0) {
      throw new Error('Series must have at least one value');
    }

    const series = {
      prime: [...values], // Original series
      current: [...values], // Working copy
      index: 0,
      options: options,
      transforms: []
    };

    // Apply transformations if requested
    if (options.retrograde) {
      series.transforms.push('retrograde');
    }
    if (options.inversion) {
      series.transforms.push('inversion');
    }

    this.series[paramName] = series;
    this.currentIndices[paramName] = 0;

    console.log(`Created series "${paramName}" with ${values.length} values`);
    return series;
  }

  /**
   * Get next value from a series
   * Automatically cycles when series is exhausted
   */
  next(paramName) {
    const series = this.series[paramName];
    if (!series) {
      throw new Error(`Series "${paramName}" not found`);
    }

    const value = series.current[series.index];
    series.index++;

    // Reset when series is exhausted
    if (series.index >= series.current.length) {
      series.index = 0;

      // Apply transformations on reset if configured
      if (series.options.transformOnCycle) {
        this.applyNextTransform(paramName);
      }
    }

    return value;
  }

  /**
   * Peek at next value without advancing
   */
  peek(paramName, offset = 0) {
    const series = this.series[paramName];
    if (!series) {
      throw new Error(`Series "${paramName}" not found`);
    }

    const index = (series.index + offset) % series.current.length;
    return series.current[index];
  }

  /**
   * Reset a series to beginning
   */
  reset(paramName) {
    const series = this.series[paramName];
    if (series) {
      series.index = 0;
      series.current = [...series.prime];
    }
  }

  /**
   * Reset all series
   */
  resetAll() {
    Object.keys(this.series).forEach(name => this.reset(name));
  }

  /**
   * Apply retrograde (reverse) transformation
   */
  retrograde(paramName) {
    const series = this.series[paramName];
    if (!series) return;

    series.current = [...series.current].reverse();
    series.index = 0;
    console.log(`Applied retrograde to "${paramName}"`);
  }

  /**
   * Apply inversion transformation
   * For numeric series, inverts around the midpoint
   */
  inversion(paramName) {
    const series = this.series[paramName];
    if (!series) return;

    // Find min and max for numeric inversion
    const values = series.current;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mid = (min + max) / 2;

    series.current = values.map(v => mid + (mid - v));
    series.index = 0;
    console.log(`Applied inversion to "${paramName}" around ${mid}`);
  }

  /**
   * Apply rotation transformation
   * Rotates series by N positions
   */
  rotation(paramName, positions = 1) {
    const series = this.series[paramName];
    if (!series) return;

    const pos = positions % series.current.length;
    series.current = [
      ...series.current.slice(pos),
      ...series.current.slice(0, pos)
    ];
    series.index = 0;
    console.log(`Rotated "${paramName}" by ${positions} positions`);
  }

  /**
   * Create a 12x12 transformation matrix (like 12-tone matrix)
   * Provides 12 different variations of a series
   */
  createMatrix(paramName, size = 12) {
    const series = this.series[paramName];
    if (!series) {
      throw new Error(`Series "${paramName}" not found`);
    }

    const matrix = [];
    const prime = series.prime.slice(0, size);

    // Generate matrix rows
    for (let row = 0; row < size; row++) {
      const rowSeries = [];
      for (let col = 0; col < size; col++) {
        const index = (row + col) % size;
        rowSeries.push(prime[index]);
      }
      matrix.push(rowSeries);
    }

    this.matrices[paramName] = matrix;
    console.log(`Created ${size}x${size} matrix for "${paramName}"`);
    return matrix;
  }

  /**
   * Get a row from the transformation matrix
   */
  getMatrixRow(paramName, rowIndex) {
    const matrix = this.matrices[paramName];
    if (!matrix) {
      throw new Error(`Matrix for "${paramName}" not found`);
    }
    return matrix[rowIndex % matrix.length];
  }

  /**
   * Apply next transform in sequence
   */
  applyNextTransform(paramName) {
    const series = this.series[paramName];
    if (!series || !series.transforms.length) return;

    const transform = series.transforms[Math.floor(Math.random() * series.transforms.length)];

    switch (transform) {
      case 'retrograde':
        this.retrograde(paramName);
        break;
      case 'inversion':
        this.inversion(paramName);
        break;
      case 'rotation':
        this.rotation(paramName, Math.floor(Math.random() * series.current.length));
        break;
    }
  }

  /**
   * Create complementary series for related parameters
   * E.g., if x uses [0,1,2,3], create y using [3,2,1,0]
   */
  createComplementary(sourceName, targetName) {
    const source = this.series[sourceName];
    if (!source) {
      throw new Error(`Source series "${sourceName}" not found`);
    }

    const complementary = [...source.prime].reverse();
    return this.createSeries(targetName, complementary);
  }

  /**
   * Serialize flow field using multiple parameter series
   * Example usage for generative art
   */
  serialFlowField(canvas, options = {}) {
    const {
      xSteps = 12,
      ySteps = 12,
      width = canvas.width,
      height = canvas.height
    } = options;

    // Create series for all parameters
    const xSeries = this.generateRange(0, width, xSteps);
    const ySeries = this.generateRange(0, height, ySteps);
    const angleSeries = this.generateRange(0, 360, 12);
    const lengthSeries = this.generateRange(10, 50, 8);

    this.createSeries('x', xSeries);
    this.createSeries('y', ySeries);
    this.createSeries('angle', angleSeries, { transformOnCycle: true, retrograde: true });
    this.createSeries('length', lengthSeries, { transformOnCycle: true, inversion: true });

    const paths = [];

    // Generate flow field with serialized parameters
    for (let i = 0; i < xSteps * ySteps; i++) {
      const x = this.next('x');
      const y = this.next('y');
      const angle = this.next('angle');
      const length = this.next('length');

      // Create flow line
      const path = this.createFlowLine(x, y, angle, length);
      paths.push(path);
    }

    return paths;
  }

  /**
   * Helper: Generate evenly spaced range
   */
  generateRange(start, end, steps) {
    const range = [];
    const step = (end - start) / (steps - 1);
    for (let i = 0; i < steps; i++) {
      range.push(start + step * i);
    }
    return range;
  }

  /**
   * Helper: Create a flow line
   */
  createFlowLine(x, y, angle, length) {
    const rad = angle * Math.PI / 180;
    return [
      { x, y },
      { x: x + Math.cos(rad) * length, y: y + Math.sin(rad) * length }
    ];
  }

  /**
   * Create serialized geometric pattern
   */
  serialGeometric(canvas, options = {}) {
    const {
      shapeCount = 12,
      width = canvas.width,
      height = canvas.height
    } = options;

    // Series for geometric parameters
    const sizes = [20, 40, 30, 60, 25, 50, 35, 55, 45, 65, 70, 80];
    const rotations = [0, 30, 15, 45, 60, 90, 75, 105, 120, 135, 150, 165];
    const xPos = this.generateRange(width * 0.1, width * 0.9, 12);
    const yPos = this.generateRange(height * 0.1, height * 0.9, 12);

    this.createSeries('size', sizes);
    this.createSeries('rotation', rotations);
    this.createSeries('xPos', xPos);
    this.createSeries('yPos', yPos);

    const shapes = [];

    for (let i = 0; i < shapeCount; i++) {
      shapes.push({
        x: this.next('xPos'),
        y: this.next('yPos'),
        size: this.next('size'),
        rotation: this.next('rotation'),
        type: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'square' : 'triangle'
      });
    }

    return shapes;
  }

  /**
   * Export current series state
   */
  exportState() {
    return {
      series: JSON.parse(JSON.stringify(this.series)),
      matrices: this.matrices
    };
  }

  /**
   * Import series state
   */
  importState(state) {
    this.series = state.series;
    this.matrices = state.matrices;
    Object.keys(this.series).forEach(name => {
      this.currentIndices[name] = this.series[name].index;
    });
  }
}

// Global instance
const serialComposer = new SerialComposer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SerialComposer;
}

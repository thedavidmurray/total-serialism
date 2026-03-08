/**
 * Unit tests for the canonical algorithm catalog.
 */

const fs = require('fs');
const path = require('path');

describe('Algorithm Catalog', () => {
  let catalog;

  beforeAll(() => {
    const catalogPath = path.join(__dirname, '..', 'algorithm-catalog.json');
    catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  });

  test('has the expected top-level shape', () => {
    expect(catalog).toHaveProperty('version');
    expect(catalog).toHaveProperty('lastUpdated');
    expect(catalog).toHaveProperty('categories');
    expect(catalog).toHaveProperty('algorithms');
    expect(catalog).toHaveProperty('stats');

    expect(catalog.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(Array.isArray(catalog.algorithms)).toBe(true);
    expect(typeof catalog.categories).toBe('object');
    expect(Object.keys(catalog.categories).length).toBeGreaterThan(0);
  });

  test('defines rich category metadata', () => {
    Object.entries(catalog.categories).forEach(([key, category]) => {
      expect(key).toBe(key.toLowerCase());
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('shortLabel');
      expect(category).toHaveProperty('icon');
      expect(category).toHaveProperty('description');

      expect(typeof category.name).toBe('string');
      expect(typeof category.shortLabel).toBe('string');
      expect(typeof category.icon).toBe('string');
      expect(typeof category.description).toBe('string');
      expect(category.description.length).toBeGreaterThan(10);
    });
  });

  test('defines valid algorithms', () => {
    const validComplexities = ['beginner', 'intermediate', 'advanced'];
    const ids = new Set();

    catalog.algorithms.forEach((algo) => {
      expect(algo).toHaveProperty('id');
      expect(algo).toHaveProperty('name');
      expect(algo).toHaveProperty('category');
      expect(algo).toHaveProperty('path');
      expect(algo).toHaveProperty('description');
      expect(algo).toHaveProperty('complexity');

      expect(algo.id).toMatch(/^[a-z0-9-]+$/);
      expect(typeof algo.name).toBe('string');
      expect(typeof algo.category).toBe('string');
      expect(catalog.categories[algo.category]).toBeDefined();
      expect(algo.path).toMatch(/\.html?$/);
      expect(algo.path.startsWith('/')).toBe(false);
      expect(algo.description.length).toBeGreaterThan(10);
      expect(validComplexities).toContain(algo.complexity);

      if ('hasPresets' in algo) {
        expect(typeof algo.hasPresets).toBe('boolean');
      }
      if ('featured' in algo) {
        expect(typeof algo.featured).toBe('boolean');
      }
      if ('hasExport' in algo) {
        expect(Array.isArray(algo.hasExport)).toBe(true);
      }

      expect(ids.has(algo.id)).toBe(false);
      ids.add(algo.id);
    });
  });

  test('stats match the actual catalog contents', () => {
    expect(catalog.stats.totalAlgorithms).toBe(catalog.algorithms.length);
    expect(catalog.stats.totalCategories).toBe(Object.keys(catalog.categories).length);
    expect(catalog.stats.featuredCount).toBe(catalog.algorithms.filter((algo) => algo.featured).length);
  });

  test('contains a mix of complexity levels', () => {
    const buckets = new Set(catalog.algorithms.map((algo) => algo.complexity));
    expect(buckets.has('beginner')).toBe(true);
    expect(buckets.has('intermediate')).toBe(true);
    expect(buckets.has('advanced')).toBe(true);
  });
});

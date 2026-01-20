/**
 * Unit tests for Algorithm Catalog JSON
 */

const fs = require('fs');
const path = require('path');

describe('Algorithm Catalog', () => {
  let catalog;

  beforeAll(() => {
    const catalogPath = path.join(__dirname, '..', 'algorithm-catalog.json');
    const catalogJson = fs.readFileSync(catalogPath, 'utf8');
    catalog = JSON.parse(catalogJson);
  });

  describe('Structure', () => {
    test('should have required top-level properties', () => {
      expect(catalog).toHaveProperty('version');
      expect(catalog).toHaveProperty('lastUpdated');
      expect(catalog).toHaveProperty('categories');
      expect(catalog).toHaveProperty('stats');
    });

    test('should have valid version', () => {
      expect(catalog.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('should have valid date format for lastUpdated', () => {
      expect(() => new Date(catalog.lastUpdated)).not.toThrow();
    });

    test('should have categories object', () => {
      expect(typeof catalog.categories).toBe('object');
      expect(Object.keys(catalog.categories).length).toBeGreaterThan(0);
    });
  });

  describe('Categories', () => {
    test('each category should have required properties', () => {
      Object.entries(catalog.categories).forEach(([key, category]) => {
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('icon');
        expect(category).toHaveProperty('algorithms');

        expect(typeof category.name).toBe('string');
        expect(typeof category.description).toBe('string');
        expect(typeof category.icon).toBe('string');
        expect(Array.isArray(category.algorithms)).toBe(true);
      });
    });

    test('category keys should be lowercase', () => {
      Object.keys(catalog.categories).forEach(key => {
        expect(key).toBe(key.toLowerCase());
      });
    });
  });

  describe('Algorithms', () => {
    let allAlgorithms = [];

    beforeAll(() => {
      Object.values(catalog.categories).forEach(category => {
        allAlgorithms.push(...category.algorithms);
      });
    });

    test('each algorithm should have required properties', () => {
      allAlgorithms.forEach(algo => {
        expect(algo).toHaveProperty('id');
        expect(algo).toHaveProperty('name');
        expect(algo).toHaveProperty('description');
        expect(algo).toHaveProperty('path');
        expect(algo).toHaveProperty('complexity');

        expect(typeof algo.id).toBe('string');
        expect(typeof algo.name).toBe('string');
        expect(typeof algo.description).toBe('string');
        expect(typeof algo.path).toBe('string');
        expect(typeof algo.complexity).toBe('string');
      });
    });

    test('algorithm IDs should be unique', () => {
      const ids = allAlgorithms.map(a => a.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    test('algorithm IDs should be lowercase with hyphens', () => {
      allAlgorithms.forEach(algo => {
        expect(algo.id).toMatch(/^[a-z0-9-]+$/);
      });
    });

    test('complexity should be valid value', () => {
      const validComplexities = ['beginner', 'intermediate', 'advanced'];

      allAlgorithms.forEach(algo => {
        expect(validComplexities).toContain(algo.complexity);
      });
    });

    test('paths should have valid extensions', () => {
      const validExtensions = ['.html', '.htm'];

      allAlgorithms.forEach(algo => {
        const hasValidExtension = validExtensions.some(ext =>
          algo.path.endsWith(ext)
        );
        expect(hasValidExtension).toBe(true);
      });
    });

    test('featured flag should be boolean if present', () => {
      allAlgorithms.forEach(algo => {
        if ('featured' in algo) {
          expect(typeof algo.featured).toBe('boolean');
        }
      });
    });

    test('descriptions should be meaningful', () => {
      allAlgorithms.forEach(algo => {
        expect(algo.description.length).toBeGreaterThan(10);
        expect(algo.description.length).toBeLessThan(200);
      });
    });
  });

  describe('Stats', () => {
    test('should have correct algorithm count', () => {
      let totalCount = 0;

      Object.values(catalog.categories).forEach(category => {
        totalCount += category.algorithms.length;
      });

      expect(catalog.stats.totalAlgorithms).toBe(totalCount);
    });

    test('should have correct category count', () => {
      const categoryCount = Object.keys(catalog.categories).length;
      expect(catalog.stats.totalCategories).toBe(categoryCount);
    });

    test('should have correct featured count', () => {
      let featuredCount = 0;

      Object.values(catalog.categories).forEach(category => {
        category.algorithms.forEach(algo => {
          if (algo.featured) featuredCount++;
        });
      });

      expect(catalog.stats.featuredCount).toBe(featuredCount);
    });
  });

  describe('Data Quality', () => {
    test('should not have duplicate algorithm names', () => {
      const allAlgorithms = [];

      Object.values(catalog.categories).forEach(category => {
        allAlgorithms.push(...category.algorithms);
      });

      const names = allAlgorithms.map(a => a.name);
      const uniqueNames = new Set(names);

      if (names.length !== uniqueNames.size) {
        const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
        console.log('Duplicate names found:', duplicates);
      }

      expect(uniqueNames.size).toBe(names.length);
    });

    test('should have at least one featured algorithm', () => {
      expect(catalog.stats.featuredCount).toBeGreaterThan(0);
    });

    test('should have algorithms in each category', () => {
      Object.entries(catalog.categories).forEach(([key, category]) => {
        expect(category.algorithms.length).toBeGreaterThan(0);
      });
    });

    test('paths should not have leading slashes', () => {
      const allAlgorithms = [];

      Object.values(catalog.categories).forEach(category => {
        allAlgorithms.push(...category.algorithms);
      });

      allAlgorithms.forEach(algo => {
        expect(algo.path).not.toMatch(/^\//);
      });
    });
  });

  describe('Complexity Distribution', () => {
    test('should have mix of complexity levels', () => {
      const allAlgorithms = [];

      Object.values(catalog.categories).forEach(category => {
        allAlgorithms.push(...category.algorithms);
      });

      const complexityCount = {
        beginner: 0,
        intermediate: 0,
        advanced: 0
      };

      allAlgorithms.forEach(algo => {
        complexityCount[algo.complexity]++;
      });

      // Should have at least one of each
      expect(complexityCount.beginner).toBeGreaterThan(0);
      expect(complexityCount.intermediate).toBeGreaterThan(0);
      expect(complexityCount.advanced).toBeGreaterThan(0);
    });
  });
});

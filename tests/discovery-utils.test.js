const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadDiscovery() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'discovery-utils.js'), 'utf8');
  const sandbox = {
    window: { location: { search: '' } },
    URLSearchParams,
  };

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.window.TSDiscovery;
}

describe('discovery utils', () => {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'algorithm-catalog.json'), 'utf8')
  );
  const TSDiscovery = loadDiscovery();

  test('produces trail suggestions for arrows', () => {
    const trails = TSDiscovery.getTrailSuggestions(catalog, 'arrows');
    expect(trails.length).toBeGreaterThan(1);
    expect(trails.every((trail) => trail.algo && trail.algo.id)).toBe(true);
    expect(trails.some((trail) => trail.label === 'Preset Route')).toBe(true);
  });

  test('builds spotlight sections with algorithm entries', () => {
    const sections = TSDiscovery.getSpotlightSections(catalog);
    expect(sections.length).toBeGreaterThanOrEqual(3);
    sections.forEach((section) => {
      expect(section.algorithms.length).toBeGreaterThan(0);
      expect(typeof section.title).toBe('string');
      expect(typeof section.description).toBe('string');
    });
  });

  test('buildPreviewStyle returns inline CSS for a card swatch', () => {
    const arrows = catalog.algorithms.find((algo) => algo.id === 'arrows');
    const style = TSDiscovery.buildPreviewStyle(arrows);
    expect(style).toMatch(/background-image:/);
    expect(style).toMatch(/background-size:/);
  });
});

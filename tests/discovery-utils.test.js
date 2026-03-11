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

  test('builds a plotter workflow for native and screen-first algorithms', () => {
    const arrowsSteps = TSDiscovery.getWorkflowSteps(catalog, 'arrows');
    expect(arrowsSteps.map((step) => step.id)).toEqual(['plotter-prep', 'path-optimizer', 'plotter-preview']);

    const neuralSteps = TSDiscovery.getWorkflowSteps(catalog, 'neural-network-art');
    expect(neuralSteps.map((step) => step.id)).toContain('plotter-export');
    expect(neuralSteps.map((step) => step.id)).toContain('plotter-prep');
  });

  test('generates plotter summaries and ideation prompts', () => {
    const arrows = catalog.algorithms.find((algo) => algo.id === 'arrows');
    const summary = TSDiscovery.getPlotterSummary(arrows);
    const prompts = TSDiscovery.getIdeationPrompts(arrows);

    expect(summary).toMatch(/pen plotting|SVG|cleanup|plotting/i);
    expect(prompts.length).toBe(3);
    prompts.forEach((prompt) => {
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(30);
    });
  });
});

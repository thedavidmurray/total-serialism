const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadPageChrome() {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'pen-plotter', 'shared', 'algorithm-page-chrome.js'),
    'utf8'
  );

  const sandbox = {
    window: {
      location: {
        pathname: '/total-serialism/pen-plotter/algorithms/packing/arrows-gui.html',
        href: 'https://thedavidmurray.github.io/total-serialism/pen-plotter/algorithms/packing/arrows-gui.html',
      },
      addEventListener: () => {},
    },
    document: {
      readyState: 'loading',
      addEventListener: () => {},
      querySelector: () => null,
      getElementById: () => null,
      scripts: [],
      head: { appendChild: () => {} },
      createElement: () => ({ set src(value) { this._src = value; }, set onload(fn) { this._onload = fn; }, set onerror(fn) { this._onerror = fn; } }),
      body: { prepend: () => {} },
    },
    fetch: () => Promise.resolve({ ok: false }),
    URL,
  };

  sandbox.window.document = sandbox.document;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.window.TSPageChromeUtils;
}

describe('algorithm page chrome utils', () => {
  const utils = loadPageChrome();
  const catalog = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'algorithm-catalog.json'), 'utf8')
  );

  test('computes repo root relative paths for algorithm and tool pages', () => {
    expect(
      utils.getRepoRootRelativePath('/total-serialism/pen-plotter/algorithms/packing/arrows-gui.html')
    ).toBe('../../../');
    expect(
      utils.getRepoRootRelativePath('/total-serialism/pen-plotter/tools/plotter-preview-gui.html')
    ).toBe('../../');
  });

  test('builds root asset urls from the current page path', () => {
    const urls = utils.getRootAssetUrls(
      '/total-serialism/pen-plotter/algorithms/packing/arrows-gui.html',
      'https://thedavidmurray.github.io/total-serialism/pen-plotter/algorithms/packing/arrows-gui.html'
    );

    expect(urls.relativeRoot).toBe('../../../');
    expect(urls.catalogUrl).toBe('https://thedavidmurray.github.io/total-serialism/algorithm-catalog.json');
    expect(urls.browseUrl).toBe('../../../browse.html');
    expect(urls.indexUrl).toBe('../../../index.html');
  });

  test('matches the current algorithm from the catalog path', () => {
    const match = utils.findCurrentAlgorithm(
      catalog,
      '/total-serialism/pen-plotter/algorithms/packing/arrows-gui.html'
    );

    expect(match).toBeDefined();
    expect(match.id).toBe('arrows');
  });

  test('all catalog pages include the shared page chrome script', () => {
    catalog.algorithms.forEach((algo) => {
      const filePath = path.join(__dirname, '..', algo.path);
      const html = fs.readFileSync(filePath, 'utf8');
      expect(html.includes('algorithm-page-chrome.js')).toBe(true);
    });
  });
});

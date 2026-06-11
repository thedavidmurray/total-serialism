(function initAlgorithmPageChrome(global) {
  function normalizePath(value) {
    return String(value || '')
      .replace(/\\/g, '/')
      .replace(/\/+/g, '/');
  }

  function getPathSegments(pathname) {
    return normalizePath(pathname).split('/').filter(Boolean);
  }

  function getRepoRootRelativePath(pathname) {
    const segments = getPathSegments(pathname);
    const penPlotterIndex = segments.lastIndexOf('pen-plotter');
    if (penPlotterIndex === -1) {
      return '';
    }

    const depth = segments.length - penPlotterIndex - 1;
    return '../'.repeat(Math.max(depth, 0));
  }

  function getRootAssetUrls(pathname, href) {
    const relativeRoot = getRepoRootRelativePath(pathname);
    return {
      relativeRoot,
      catalogUrl: new URL(`${relativeRoot}algorithm-catalog.json`, href).toString(),
      browseUrl: `${relativeRoot}browse.html`,
      indexUrl: `${relativeRoot}index.html`,
      discoveryUtilsUrl: new URL(`${relativeRoot}discovery-utils.js`, href).toString(),
    };
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function truncate(value, maxLength) {
    const text = String(value || '');
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength - 1).trimEnd()}…`;
  }

  function findCurrentAlgorithm(catalog, pathname) {
    const currentPath = normalizePath(pathname);
    return (catalog.algorithms || []).find((algo) => currentPath.endsWith(algo.path));
  }

  function resolveAlgorithmHref(relativeRoot, algorithmPath) {
    // Catalog paths are app-root-relative; pages live in nested folders,
    // so raw paths would resolve relative to the current folder.
    return `${relativeRoot}${normalizePath(algorithmPath)}`;
  }

  function loadScript(src) {
    if ([...document.scripts].some((script) => script.src === src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function ensureBackLink(indexUrl) {
    const backLink = document.querySelector('.back-link');
    if (!backLink) {
      return;
    }

    backLink.setAttribute('href', indexUrl);
    backLink.setAttribute('title', 'Return to the Total Serialism index');
    backLink.textContent = 'Back to Library';
  }

  function renderBadge(label, className) {
    return `<span class="ts-discovery-badge${className ? ` ${className}` : ''}">${escapeHtml(label)}</span>`;
  }

  function renderTrailLinks(catalog, currentAlgorithm, relativeRoot) {
    return global.TSDiscovery.getTrailSuggestions(catalog, currentAlgorithm.id)
      .map((trail) => `
        <a
          href="${resolveAlgorithmHref(relativeRoot, trail.algo.path)}"
          class="ts-discovery-trail"
          title="${escapeHtml(trail.description)}"
        >
          <span>${escapeHtml(trail.label)}</span>
          <strong>${escapeHtml(trail.algo.name)}</strong>
        </a>
      `)
      .join('');
  }

  function renderRelatedCards(catalog, currentAlgorithm, relativeRoot) {
    return global.TSDiscovery.getRelatedAlgorithms(catalog, currentAlgorithm.id, 3)
      .map((algo) => `
        <a href="${resolveAlgorithmHref(relativeRoot, algo.path)}" class="ts-discovery-card">
          <div class="ts-discovery-card-swatch" style="${global.TSDiscovery.buildPreviewStyle(algo)}"></div>
          <div class="ts-discovery-card-body">
            <div class="ts-discovery-card-name">${escapeHtml(algo.name)}</div>
            <div class="ts-discovery-card-copy">${escapeHtml(truncate(algo.description, 94))}</div>
            <div class="ts-discovery-card-meta">
              ${renderBadge(global.TSDiscovery.getMediumLabel(algo.medium))}
              ${renderBadge(global.TSDiscovery.getPlotterReadinessLabel(algo.plotterReadiness))}
            </div>
          </div>
        </a>
      `)
      .join('');
  }

  function renderWorkflowSteps(catalog, currentAlgorithm, relativeRoot) {
    return global.TSDiscovery.getWorkflowSteps(catalog, currentAlgorithm)
      .map((tool) => `
        <a href="${resolveAlgorithmHref(relativeRoot, tool.path)}" class="ts-guidance-link">
          <span class="ts-guidance-link-name">${escapeHtml(tool.name)}</span>
          <span class="ts-guidance-link-copy">${escapeHtml(tool.guidance)}</span>
        </a>
      `)
      .join('');
  }

  function renderPromptList(currentAlgorithm) {
    return global.TSDiscovery.getIdeationPrompts(currentAlgorithm)
      .map((prompt) => `<li>${escapeHtml(prompt)}</li>`)
      .join('');
  }

  function renderUseCases(currentAlgorithm) {
    return global.TSDiscovery.getUseCaseLabels(currentAlgorithm)
      .map((label) => renderBadge(label, 'is-subtle'))
      .join('');
  }

  function buildPanelMarkup(catalog, currentAlgorithm, browseUrl, relativeRoot) {
    const accent = global.TSDiscovery.getPreviewAccent(currentAlgorithm);
    const trails = renderTrailLinks(catalog, currentAlgorithm, relativeRoot);
    const relatedCards = renderRelatedCards(catalog, currentAlgorithm, relativeRoot);
    const workflowSteps = renderWorkflowSteps(catalog, currentAlgorithm, relativeRoot);
    const promptList = renderPromptList(currentAlgorithm);
    const useCases = renderUseCases(currentAlgorithm);
    const plotterSummary = global.TSDiscovery.getPlotterSummary(currentAlgorithm);

    return `
      <details class="ts-discovery-panel">
        <summary class="ts-discovery-summary">
          <span class="ts-discovery-summary-copy">
            <span class="ts-discovery-summary-kicker">Explore Next</span>
            <span class="ts-discovery-summary-title">${escapeHtml(currentAlgorithm.name)}</span>
          </span>
          <span class="ts-discovery-summary-action">Ideate</span>
        </summary>
        <div class="ts-discovery-panel-body">
          <div class="ts-discovery-hero" style="${global.TSDiscovery.buildPreviewStyle(currentAlgorithm)}">
            <span class="ts-discovery-hero-pill">${escapeHtml((accent.primary || currentAlgorithm.category).replace(/-/g, ' '))}</span>
            <span class="ts-discovery-hero-pill">${escapeHtml(global.TSDiscovery.getMediumLabel(currentAlgorithm.medium))}</span>
          </div>
          <div class="ts-discovery-copy">
            ${escapeHtml(currentAlgorithm.description)}
          </div>
          <div class="ts-discovery-badges">
            ${renderBadge(global.TSDiscovery.getMediumLabel(currentAlgorithm.medium))}
            ${renderBadge(global.TSDiscovery.getPlotterReadinessLabel(currentAlgorithm.plotterReadiness))}
            ${renderBadge(currentAlgorithm.complexity)}
            ${currentAlgorithm.hasPresets ? renderBadge('Presets') : ''}
            ${(currentAlgorithm.engine || []).slice(0, 1).map((engine) => renderBadge(engine.toUpperCase())).join('')}
          </div>
          ${useCases ? `<div class="ts-guidance-chip-row">${useCases}</div>` : ''}
          <div class="ts-guidance-grid">
            <section class="ts-guidance-block">
              <div class="ts-guidance-title">Plotter Path</div>
              <div class="ts-guidance-copy">${escapeHtml(plotterSummary)}</div>
              ${workflowSteps ? `<div class="ts-guidance-links">${workflowSteps}</div>` : ''}
            </section>
            <section class="ts-guidance-block">
              <div class="ts-guidance-title">Try This Next</div>
              ${promptList ? `<ul class="ts-guidance-prompts">${promptList}</ul>` : '<div class="ts-guidance-copy">Change one control family at a time and keep the first seed that survives simplification.</div>'}
            </section>
          </div>
          ${trails ? `<div class="ts-discovery-trails">${trails}</div>` : ''}
          ${relatedCards ? `<div class="ts-discovery-grid">${relatedCards}</div>` : ''}
          <div class="ts-discovery-actions">
            <a href="${browseUrl}?related=${currentAlgorithm.id}" class="ts-discovery-browser-link">Open ideation browser</a>
          </div>
        </div>
      </details>
    `;
  }

  function mountPanel(catalog, currentAlgorithm, urls) {
    const mountPoint =
      document.getElementById('controls') ||
      document.querySelector('.ts-controls') ||
      document.querySelector('.ts-control-panel') ||
      document.body;

    if (!mountPoint || mountPoint.querySelector('.ts-discovery-panel')) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildPanelMarkup(catalog, currentAlgorithm, urls.browseUrl, urls.relativeRoot);
    const panel = wrapper.firstElementChild;

    // Discovery content is secondary to the working controls: mount it
    // collapsed at the end of the panel so the tool comes first.
    mountPoint.append(panel);
  }

  async function enhancePage() {
    const urls = getRootAssetUrls(global.location.pathname, global.location.href);
    ensureBackLink(urls.indexUrl);

    if (!global.TSDiscovery) {
      await loadScript(urls.discoveryUtilsUrl);
    }

    const response = await fetch(urls.catalogUrl);
    if (!response.ok) {
      return;
    }

    const catalog = await response.json();
    const currentAlgorithm = findCurrentAlgorithm(catalog, global.location.pathname);
    if (!currentAlgorithm) {
      return;
    }

    mountPanel(catalog, currentAlgorithm, urls);
  }

  global.TSPageChromeUtils = {
    findCurrentAlgorithm,
    getRepoRootRelativePath,
    getRootAssetUrls,
    normalizePath,
    resolveAlgorithmHref,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      enhancePage().catch(() => {});
    }, { once: true });
  } else {
    enhancePage().catch(() => {});
  }
})(window);

/**
 * Shared canvas layout utilities for paper sizing and fit calculations.
 * Works without build tooling; attach to window as CanvasLayout.
 */
(function () {
  // Base paper presets (portrait orientation by default)
  const paperPresets = {
    a5:   { width: 874,  height: 1240, label: 'A5 (148×210mm)', mm: '148×210' },
    a4:   { width: 1240, height: 1754, label: 'A4 (210×297mm)', mm: '210×297' },
    a3:   { width: 1754, height: 2480, label: 'A3 (297×420mm)', mm: '297×420' },
    letter: { width: 1275, height: 1650, label: 'US Letter (216×279mm)', mm: '216×279' },
    square: { width: 1772, height: 1772, label: 'Square (300×300mm)', mm: '300×300' },
    custom: { width: 800, height: 600, label: 'Custom', mm: '800×600px' }
  };

  // Extended presets with orientation and common sizes
  const extendedPresets = {
    // Square sizes
    square800: { width: 800, height: 800, label: 'Square (800×800)', mm: '800×800px' },
    square1200: { width: 1200, height: 1200, label: 'Square (1200×1200)', mm: '1200×1200px' },
    square_medium: { width: 800, height: 800, label: 'Square (800×800)', mm: '800×800px' },
    square_large: { width: 1200, height: 1200, label: 'Square (1200×1200)', mm: '1200×1200px' },
    // Landscape generic
    landscape800x600: { width: 800, height: 600, label: 'Landscape (800×600)', mm: '800×600px' },
    // A5 variants
    a5portrait: { width: 874, height: 1240, label: 'A5 Portrait', mm: '148×210' },
    a5landscape: { width: 1240, height: 874, label: 'A5 Landscape', mm: '210×148' },
    A5_portrait: { width: 874, height: 1240, label: 'A5 Portrait', mm: '148×210' },
    A5_landscape: { width: 1240, height: 874, label: 'A5 Landscape', mm: '210×148' },
    // A4 variants
    a4portrait: { width: 1240, height: 1754, label: 'A4 Portrait', mm: '210×297' },
    a4landscape: { width: 1754, height: 1240, label: 'A4 Landscape', mm: '297×210' },
    A4_portrait: { width: 1240, height: 1754, label: 'A4 Portrait', mm: '210×297' },
    A4_landscape: { width: 1754, height: 1240, label: 'A4 Landscape', mm: '297×210' },
    // A3 variants
    a3portrait: { width: 1754, height: 2480, label: 'A3 Portrait', mm: '297×420' },
    a3landscape: { width: 2480, height: 1754, label: 'A3 Landscape', mm: '420×297' },
    A3_portrait: { width: 1754, height: 2480, label: 'A3 Portrait', mm: '297×420' },
    A3_landscape: { width: 2480, height: 1754, label: 'A3 Landscape', mm: '420×297' },
    // Letter variants
    letterportrait: { width: 1275, height: 1650, label: 'Letter Portrait', mm: '216×279' },
    letterlandscape: { width: 1650, height: 1275, label: 'Letter Landscape', mm: '279×216' },
    letter_portrait: { width: 1275, height: 1650, label: 'Letter Portrait', mm: '216×279' },
    letter_landscape: { width: 1650, height: 1275, label: 'Letter Landscape', mm: '279×216' },
    // Landscape shorthands (A3L, letterL, ...)
    a5l: { width: 1240, height: 874, label: 'A5 Landscape', mm: '210×148' },
    a4l: { width: 1754, height: 1240, label: 'A4 Landscape', mm: '297×210' },
    a3l: { width: 2480, height: 1754, label: 'A3 Landscape', mm: '420×297' },
    letterl: { width: 1650, height: 1275, label: 'Letter Landscape', mm: '279×216' },
    // US sizes beyond letter
    legal: { width: 1275, height: 2102, label: 'US Legal (216×356mm)', mm: '216×356' },
    tabloid: { width: 1650, height: 2551, label: 'US Tabloid (279×432mm)', mm: '279×432' },
    // Square mm variants
    square_small: { width: 1181, height: 1181, label: 'Square Small (200×200mm)', mm: '200×200' }
  };

  // Pages spell presets inconsistently (a3-landscape, a3landscape,
  // A3_landscape, "A3 Landscape"); resolve them all to one entry instead
  // of silently falling back to the 800×600 custom size.
  function normalizeKey(preset) {
    return String(preset || '').toLowerCase().replace(/[-_\s]/g, '');
  }

  const normalizedPresets = {};
  [paperPresets, extendedPresets].forEach((table) => {
    Object.keys(table).forEach((key) => {
      normalizedPresets[normalizeKey(key)] = table[key];
    });
  });

  function getSize(preset = 'custom') {
    // Check extended presets first (handles orientation variants)
    if (extendedPresets[preset]) {
      return extendedPresets[preset];
    }
    if (paperPresets[preset]) {
      return paperPresets[preset];
    }
    // Alias-tolerant lookup before giving up
    const normalized = normalizedPresets[normalizeKey(preset)];
    if (normalized) {
      return normalized;
    }
    // Literal pixel dimensions like "800x600"
    const pixelMatch = /^(\d{2,5})x(\d{2,5})$/.exec(String(preset || '').trim());
    if (pixelMatch) {
      const width = parseInt(pixelMatch[1], 10);
      const height = parseInt(pixelMatch[2], 10);
      return { width, height, label: `${width}×${height}px`, mm: `${width}×${height}px` };
    }
    return paperPresets.custom;
  }

  function fitToPaper({ artWidth, artHeight, preset = 'custom', margin = 0 }) {
    const { width, height } = getSize(preset);
    const innerW = Math.max(1, width - margin * 2);
    const innerH = Math.max(1, height - margin * 2);
    const scale = Math.min(innerW / artWidth, innerH / artHeight, 1);
    const scaledW = artWidth * scale;
    const scaledH = artHeight * scale;
    return {
      width,
      height,
      scale,
      offsetX: (width - scaledW) / 2,
      offsetY: (height - scaledH) / 2
    };
  }

  /**
   * Compute a transform that places 2D points onto paper.
   * mode 'fit'  — scale uniformly so all points sit inside the margins;
   * mode 'fill' — scale uniformly to cover the inner area (may crop).
   * Returns { scale, dx, dy }: apply as x * scale + dx, y * scale + dy.
   */
  function fitPointsToPaper(points, { width, height, margin = 0, mode = 'fit' } = {}) {
    if (!points || points.length === 0 || !width || !height) {
      return { scale: 1, dx: (width || 0) / 2, dy: (height || 0) / 2 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const artWidth = Math.max(maxX - minX, 1e-9);
    const artHeight = Math.max(maxY - minY, 1e-9);
    const safeMargin = Math.min(margin, (Math.min(width, height) - 2) / 2);
    const innerW = width - safeMargin * 2;
    const innerH = height - safeMargin * 2;

    const scale = mode === 'fill'
      ? Math.max(innerW / artWidth, innerH / artHeight)
      : Math.min(innerW / artWidth, innerH / artHeight);

    return {
      scale,
      dx: width / 2 - scale * (minX + maxX) / 2,
      dy: height / 2 - scale * (minY + maxY) / 2
    };
  }

  function drawFrame(p5Instance, options = {}) {
    if (!p5Instance) return;
    const { width, height, margin = 0, color = [0, 200, 0], weight = 2 } = options;
    p5Instance.push();
    p5Instance.noFill();
    p5Instance.stroke(...color);
    p5Instance.strokeWeight(weight);
    p5Instance.rect(margin, margin, width - margin * 2, height - margin * 2);
    p5Instance.pop();
  }

  /**
   * Attach fit/zoom controls to a canvas inside a container.
   * container: HTMLElement that scrolls; canvasEl: the <canvas> element.
   * options: { fitToggle?: HTMLElement, zoomInput?: HTMLElement, padding?: number }
   */
  function attachFitZoom({ container, canvasEl, fitToggle, zoomInput, padding = 16 }) {
    if (!container || !canvasEl) return;
    let fitMode = true;
    let zoom = 1;

    container.style.overflow = container.style.overflow || 'auto';
    container.style.display = container.style.display || 'flex';
    container.style.alignItems = container.style.alignItems || 'center';
    container.style.justifyContent = container.style.justifyContent || 'center';

    const applyTransform = () => {
      const scale = fitMode ? computeFitScale() : zoom;
      canvasEl.style.transform = `scale(${scale})`;
      canvasEl.style.transformOrigin = 'top left';
      canvasEl.style.margin = `${padding}px`;
    };

    const computeFitScale = () => {
      const cw = canvasEl.offsetWidth || canvasEl.width || 1;
      const ch = canvasEl.offsetHeight || canvasEl.height || 1;
      const availW = container.clientWidth - padding * 2;
      const availH = container.clientHeight - padding * 2;
      return Math.min(availW / cw, availH / ch, 1);
    };

    const onResize = () => applyTransform();
    window.addEventListener('resize', onResize);

    if (fitToggle) {
      fitToggle.addEventListener('click', () => {
        fitMode = !fitMode;
        if (fitToggle.dataset && 'state' in fitToggle.dataset) {
          fitToggle.dataset.state = fitMode ? 'fit' : 'manual';
        }
        applyTransform();
      });
    }

    if (zoomInput) {
      zoomInput.addEventListener('input', (e) => {
        zoom = parseFloat(e.target.value) || 1;
        fitMode = false;
        applyTransform();
      });
    }

    // Initial fit
    applyTransform();

    return {
      setFit(value) { fitMode = value; applyTransform(); },
      setZoom(value) { zoom = value; fitMode = false; applyTransform(); },
      destroy() {
        window.removeEventListener('resize', onResize);
      }
    };
  }

  window.CanvasLayout = { paperPresets, extendedPresets, getSize, normalizeKey, fitToPaper, fitPointsToPaper, drawFrame, attachFitZoom };
})();

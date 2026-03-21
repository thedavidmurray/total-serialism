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
    letter_landscape: { width: 1650, height: 1275, label: 'Letter Landscape', mm: '279×216' }
  };

  function getSize(preset = 'custom') {
    // Check extended presets first (handles orientation variants)
    if (extendedPresets[preset]) {
      return extendedPresets[preset];
    }
    // Fall back to base presets
    return paperPresets[preset] || paperPresets.custom;
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

  /**
   * Mount a paper size <select> into a container element.
   * When the user changes the selection, resizes the canvas via CanvasLayout.getSize()
   * and calls an optional onResize callback.
   *
   * options:
   *   container    HTMLElement  The #controls div to append into
   *   algorithmName string      Used for the label
   *   getCanvas    () => HTMLCanvasElement | null
   *   onResize     (preset) => void  Optional callback after resize
   */
  function mountSelector({ container, algorithmName = '', getCanvas, onResize } = {}) {
    if (!container) return;

    // Build the options list from base paperPresets
    const presetKeys = Object.keys(paperPresets);
    const options = presetKeys
      .map(k => `<option value="${k}">${paperPresets[k].label}</option>`)
      .join('\n');

    const wrapper = document.createElement('div');
    wrapper.className = 'control-group ts-paper-size-selector';
    wrapper.innerHTML = `
      <h3 style="margin:0 0 8px 0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.05em;">Paper Size</h3>
      <select id="ts-paper-preset" style="width:100%;padding:5px;background:#333;color:#fff;border:1px solid #555;border-radius:4px;">
        ${options}
      </select>
    `;

    container.appendChild(wrapper);

    const select = wrapper.querySelector('#ts-paper-preset');
    select.addEventListener('change', () => {
      const preset = select.value;
      const size = getSize(preset);
      const canvas = typeof getCanvas === 'function' ? getCanvas() : null;
      if (canvas) {
        canvas.width = size.width;
        canvas.height = size.height;
        // Trigger a redraw if p5 is available
        if (typeof redraw === 'function') {
          redraw();
        }
      }
      if (typeof onResize === 'function') {
        onResize(preset, size);
      }
    });

    return wrapper;
  }

  window.CanvasLayout = { paperPresets, extendedPresets, getSize, fitToPaper, drawFrame, attachFitZoom, mountSelector };
})();

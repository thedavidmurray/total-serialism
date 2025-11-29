/**
 * Shared canvas layout utilities for paper sizing and fit calculations.
 * Works without build tooling; attach to window as CanvasLayout.
 */
(function () {
  const paperPresets = {
    a5:   { width: 874,  height: 1240, label: 'A5 (148×210mm)', mm: '148×210' },
    a4:   { width: 1240, height: 1754, label: 'A4 (210×297mm)', mm: '210×297' },
    a3:   { width: 1754, height: 2480, label: 'A3 (297×420mm)', mm: '297×420' },
    letter: { width: 1275, height: 1650, label: 'US Letter (216×279mm)', mm: '216×279' },
    square: { width: 1772, height: 1772, label: 'Square (300×300mm)', mm: '300×300' },
    custom: { width: 800, height: 600, label: 'Custom', mm: '800×600px' }
  };

  function getSize(preset = 'custom') {
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

  window.CanvasLayout = { paperPresets, getSize, fitToPaper, drawFrame };
})();

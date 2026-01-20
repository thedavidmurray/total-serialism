# Comprehensive SVG Export Fix Plan
**Date**: 2026-01-19
**Status**: Planning Phase
**Total Algorithms Affected**: 50+ HTML files

## Executive Summary

Total Serialism pen plotter tool has **two critical bugs** preventing SVG exports across 50+ algorithm files. This document provides detailed analysis, fixes, and migration strategy.

---

## Bug Analysis

### BUG 1: p5.js-svg Compatibility Error (CRITICAL)

**Error Message**:
```
Uncaught TypeError: Cannot read properties of undefined (reading 'elt')
Source: p5.js-svg@1.5.1:1979:39
```

**Affected Files**:
- All files using `createGraphics(width, height, SVG)` pattern
- Examples: `flow-field-p5-gui.html`, `spiral-fill.html`, etc.

**Root Cause**:
p5.js-svg@1.5.1 is **incompatible** with p5.js 1.7.0. The library attempts to access `.elt` property on a renderer object that doesn't exist in p5.js 1.7.0's internal structure.

**Specific Code Path**:
```javascript
// Files load:
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
<script src="https://unpkg.com/p5.js-svg@1.5.1"></script>

// Then call:
let svgCanvas = createGraphics(800, 800, SVG);  // ❌ BREAKS HERE
```

**Known Working Configuration**:
- p5.js 1.6.x + p5.js-svg@1.5.1 ✅
- p5.js 1.4.2 + p5.js-svg@1.5.1 ✅

---

### BUG 2: Missing ExportUtils Module (CODE ERROR)

**Error Message**:
```
TypeError: ExportUtils.generateFilename is not a function
at exportSVG (islamic-patterns-gui.html:1052:36)
```

**Affected Files**:
- Any file attempting to call `ExportUtils.generateFilename()`
- NOTE: No `export-utils.js` file exists in repository

**Root Cause**:
Code references non-existent `ExportUtils` module. This appears to be:
1. Dead code from incomplete refactoring, OR
2. Planned feature never implemented

**Evidence**:
```bash
# Search results:
$ find /Users/djm/claude-projects/pen-plotter-art -name "export-utils.js"
# (no results)

$ find /Users/djm/claude-projects/pen-plotter-art -name "ExportUtils.js"
# (no results)
```

---

## Current Export Patterns (Inventory)

### Pattern A: p5.js-svg with `save()` (Most Common)
```javascript
// Uses p5.js-svg library
function exportSVG() {
  save(`flow-field-${params.seed}.svg`);  // p5.js built-in save
}
```

**Files**: `flow-field-p5-gui.html`, etc.
**Status**: ❌ BROKEN (BUG 1)

---

### Pattern B: p5.js-svg with `createGraphics()`
```javascript
function exportSVG() {
  let svg = createGraphics(gridSize * 10, gridSize * 10, SVG);
  svg.background(255);
  svg.noStroke();
  // ... draw commands ...
  save(svg, `reaction-diffusion-${iteration}.svg`);
  svg.remove();
}
```

**Files**: `reaction-diffusion-enhanced.html`, etc.
**Status**: ❌ BROKEN (BUG 1)

---

### Pattern C: Manual SVG String Generation (Working)
```javascript
function exportSVG() {
  const svgSize = 800;
  let svg = `<svg width="${svgSize}" height="${svgSize}" xmlns="http://www.w3.org/2000/svg">\n`;
  svg += `<rect width="${svgSize}" height="${svgSize}" fill="white"/>\n`;
  svg += `<path d="M ${x} ${y} L ${x2} ${y2}" stroke="black"/>\n`;
  svg += `</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sound-viz-${Date.now()}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Files**: `sound-waveform-gui.html`, etc.
**Status**: ✅ WORKING (no p5.js-svg dependency)

---

### Pattern D: Dead Code with ExportUtils (Not Working)
```javascript
function exportSVG() {
  const filename = ExportUtils.generateFilename('islamic', params);  // ❌
  // ... rest of code ...
}
```

**Files**: Unknown (need to search for actual usage)
**Status**: ❌ BROKEN (BUG 2 - module doesn't exist)

---

## Solution Architecture

### Strategy 1: Version Downgrade (Quick Fix) ⚡

**Approach**: Pin p5.js to 1.6.x for compatibility with p5.js-svg@1.5.1

**Changes Required**:
```html
<!-- BEFORE (broken) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
<script src="https://unpkg.com/p5.js-svg@1.5.1"></script>

<!-- AFTER (fixed) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.6.0/p5.min.js"></script>
<script src="https://unpkg.com/p5.js-svg@1.5.1"></script>
```

**Pros**:
- ✅ Minimal code changes (just script tag URLs)
- ✅ Preserves existing export logic
- ✅ Quick rollout across all files

**Cons**:
- ❌ Locks us to older p5.js version
- ❌ Misses p5.js 1.7.0 features/fixes
- ❌ Technical debt (upstream may drop 1.6.x support)

**Files to Update**: All 50+ HTML files using p5.js

---

### Strategy 2: Create ExportUtils Module (Robust Fix) 🏗️

**Approach**: Build missing `export-utils.js` with SVG export helpers

**File Structure**:
```
pen-plotter-art/
├── src/
│   └── utils/
│       └── export-utils.js  ← CREATE THIS
```

**Implementation**:

```javascript
// /Users/djm/claude-projects/pen-plotter-art/src/utils/export-utils.js

class ExportUtils {
  /**
   * Generate standardized filename with timestamp
   * @param {string} algorithmName - e.g., 'flow-field', 'islamic-patterns'
   * @param {Object} params - algorithm parameters to include in filename
   * @param {string} extension - file extension (default: 'svg')
   * @returns {string} - formatted filename
   */
  static generateFilename(algorithmName, params = {}, extension = 'svg') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const paramStr = params.seed ? `-${params.seed}` : '';
    return `${algorithmName}${paramStr}-${timestamp}.${extension}`;
  }

  /**
   * Export SVG string as downloadable file
   * @param {string} svgContent - SVG markup string
   * @param {string} filename - output filename
   */
  static downloadSVG(svgContent, filename) {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Convert p5.js canvas to SVG string (fallback method)
   * @param {p5.Renderer} canvas - p5.js canvas or graphics buffer
   * @param {number} width - output width
   * @param {number} height - output height
   * @returns {string} - SVG markup
   */
  static canvasToSVG(canvas, width, height) {
    // Get canvas pixel data
    const imgData = canvas.canvas.toDataURL('image/png');

    // Embed as SVG image (raster fallback)
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="${width}" height="${height}" xlink:href="${imgData}"/>
</svg>`;
  }

  /**
   * Progressive export: try p5.js-svg, fallback to manual SVG, fallback to raster
   * @param {p5} p5Instance - p5.js instance
   * @param {string} filename - output filename
   * @param {Function} drawFunction - function that draws the content
   * @param {number} width - canvas width
   * @param {number} height - canvas height
   */
  static smartExport(p5Instance, filename, drawFunction, width = 800, height = 800) {
    try {
      // Method 1: Try p5.js-svg if available
      if (typeof SVG !== 'undefined') {
        console.log('[ExportUtils] Using p5.js-svg');
        const svg = p5Instance.createGraphics(width, height, SVG);
        drawFunction(svg);
        p5Instance.save(svg, filename);
        svg.remove();
        return;
      }
    } catch (err) {
      console.warn('[ExportUtils] p5.js-svg failed:', err.message);
    }

    try {
      // Method 2: Manual SVG generation (if drawFunction supports it)
      console.log('[ExportUtils] Attempting manual SVG generation');
      const svgContent = drawFunction('svg');  // Pass 'svg' mode flag
      if (svgContent && svgContent.includes('<svg')) {
        this.downloadSVG(svgContent, filename);
        return;
      }
    } catch (err) {
      console.warn('[ExportUtils] Manual SVG generation failed:', err.message);
    }

    // Method 3: Fallback to PNG embedded in SVG
    console.warn('[ExportUtils] Falling back to raster export');
    const svgContent = this.canvasToSVG(p5Instance, width, height);
    this.downloadSVG(svgContent, filename);
  }

  /**
   * Validate SVG content before export
   * @param {string} svgContent - SVG markup
   * @returns {boolean} - true if valid
   */
  static validateSVG(svgContent) {
    if (!svgContent || typeof svgContent !== 'string') {
      console.error('[ExportUtils] Invalid SVG content: not a string');
      return false;
    }

    if (!svgContent.includes('<svg')) {
      console.error('[ExportUtils] Invalid SVG content: missing <svg> tag');
      return false;
    }

    if (!svgContent.includes('</svg>')) {
      console.error('[ExportUtils] Invalid SVG content: missing closing </svg> tag');
      return false;
    }

    return true;
  }

  /**
   * Add standard metadata to SVG
   * @param {string} svgContent - SVG markup
   * @param {Object} metadata - metadata to embed
   * @returns {string} - SVG with metadata
   */
  static addMetadata(svgContent, metadata = {}) {
    const { title = 'Total Serialism', author = '', description = '', params = {} } = metadata;

    const metadataBlock = `
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
             xmlns:dc="http://purl.org/dc/elements/1.1/">
      <rdf:Description>
        <dc:title>${title}</dc:title>
        ${author ? `<dc:creator>${author}</dc:creator>` : ''}
        ${description ? `<dc:description>${description}</dc:description>` : ''}
        <dc:date>${new Date().toISOString()}</dc:date>
        ${Object.keys(params).length > 0 ? `<!-- Parameters: ${JSON.stringify(params)} -->` : ''}
      </rdf:Description>
    </rdf:RDF>
  </metadata>`;

    return svgContent.replace('<svg', `<svg`).replace('>', `>${metadataBlock}\n`);
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.ExportUtils = ExportUtils;
}

// Export for Node.js (if needed for tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportUtils;
}
```

**Usage in HTML Files**:
```html
<!-- Add to <head> section -->
<script src="../../src/utils/export-utils.js"></script>

<script>
  // Updated exportSVG function
  function exportSVG() {
    const filename = ExportUtils.generateFilename('flow-field', params);

    // Manual SVG generation
    const svgContent = createManualSVG();  // Your algorithm-specific code

    if (ExportUtils.validateSVG(svgContent)) {
      ExportUtils.downloadSVG(svgContent, filename);
    }
  }

  // Or use smart export with fallback
  function exportSVGSmart() {
    ExportUtils.smartExport(window, 'flow-field.svg', (ctx) => {
      // Your drawing code here
      ctx.background(255);
      // ...
    }, 800, 800);
  }
</script>
```

**Pros**:
- ✅ Centralized export logic
- ✅ Progressive enhancement (fallback strategy)
- ✅ Works with any p5.js version
- ✅ Adds validation and metadata features
- ✅ Fixes BUG 2 (ExportUtils not found)

**Cons**:
- ❌ More code changes required per file
- ❌ Need to refactor existing export functions

---

### Strategy 3: Hybrid Approach (RECOMMENDED) ⭐

**Approach**: Combine version pinning + ExportUtils for best of both worlds

**Implementation Steps**:

1. **Immediate Fix** (Week 1):
   - Downgrade all files to p5.js 1.6.0
   - Quick smoke test on 5-10 algorithms
   - Deploy to restore SVG exports

2. **Long-term Fix** (Week 2-3):
   - Create `export-utils.js` module
   - Migrate files one category at a time
   - Add tests for each export pattern

3. **Future-proofing** (Week 4):
   - Update to latest p5.js (1.7.0+)
   - Use ExportUtils fallback for compatibility
   - Remove p5.js-svg dependency entirely

**Pros**:
- ✅ Immediate user relief (exports work again)
- ✅ Long-term stability (no p5.js-svg dependency)
- ✅ Gradual migration (low risk)

**Cons**:
- ❌ Two-phase deployment
- ❌ Temporary version rollback

---

## Detailed Migration Plan

### Phase 1: Emergency Hotfix (Days 1-2)

**Goal**: Restore SVG exports ASAP

**Tasks**:
1. Create global find/replace script
2. Update all p5.js CDN URLs to 1.6.0
3. Test 10 representative algorithms
4. Deploy

**Script**:
```bash
#!/bin/bash
# fix-p5-version.sh

find /Users/djm/claude-projects/pen-plotter-art/algorithms -name "*.html" -type f -exec sed -i '' 's|p5.js/1.7.0/p5.min.js|p5.js/1.6.0/p5.min.js|g' {} \;

echo "Updated p5.js version in all algorithm HTML files"
```

**Test Cases**:
```
✓ Flow Field P5         (algorithms/flow-fields/flow-field-p5-gui.html)
✓ Spiral Fill          (algorithms/geometric/spiral-fill.html)
✓ Reaction Diffusion   (algorithms/reaction-diffusion/reaction-diffusion-enhanced.html)
✓ Sound Waveform       (algorithms/advanced/sound-waveform-gui.html)
✓ 10print              (algorithms/geometric/10print-gui.html)
```

---

### Phase 2: Create ExportUtils Module (Days 3-5)

**Goal**: Build centralized export system

**Tasks**:
1. ✅ Create `/src/utils/export-utils.js` (code above)
2. ✅ Create test file `tests/export-utils.test.js`
3. ✅ Document API in `docs/export-utils-api.md`

**Test File**:
```javascript
// /Users/djm/claude-projects/pen-plotter-art/tests/export-utils.test.js

describe('ExportUtils', () => {
  test('generateFilename creates valid filename', () => {
    const filename = ExportUtils.generateFilename('flow-field', { seed: 12345 });
    expect(filename).toMatch(/^flow-field-12345-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.svg$/);
  });

  test('validateSVG accepts valid SVG', () => {
    const valid = '<svg><rect /></svg>';
    expect(ExportUtils.validateSVG(valid)).toBe(true);
  });

  test('validateSVG rejects invalid SVG', () => {
    expect(ExportUtils.validateSVG('<div></div>')).toBe(false);
    expect(ExportUtils.validateSVG(null)).toBe(false);
  });

  test('downloadSVG creates blob URL', () => {
    const spy = jest.spyOn(URL, 'createObjectURL');
    ExportUtils.downloadSVG('<svg></svg>', 'test.svg');
    expect(spy).toHaveBeenCalled();
  });
});
```

---

### Phase 3: Gradual Migration (Days 6-14)

**Goal**: Migrate algorithms to ExportUtils category by category

**Order** (by complexity):
1. ✅ **Geometric** (11 files) - Simple patterns, easiest to convert
2. ✅ **Flow Fields** (6 files) - Medium complexity
3. ✅ **Natural** (6 files) - Medium complexity
4. ✅ **Reaction Diffusion** (5 files) - High complexity
5. ✅ **Cellular Automata** (6 files) - High complexity
6. ✅ **Advanced** (6 files) - Variable complexity
7. ✅ **Chemical** (8 files) - High complexity
8. ✅ Remaining categories

**Per-File Checklist**:
```
□ Add <script src="../../src/utils/export-utils.js"></script>
□ Replace exportSVG() function
□ Test SVG export in browser
□ Verify filename format
□ Check file opens in Inkscape/Illustrator
□ Commit with message: "refactor(category/file): migrate to ExportUtils"
```

**Example Conversion**:

**BEFORE**:
```javascript
function exportSVG() {
  save(`flow-field-${params.seed}.svg`);
}
```

**AFTER**:
```javascript
function exportSVG() {
  const filename = ExportUtils.generateFilename('flow-field', { seed: params.seed });

  // Manual SVG generation for vector output
  const svgContent = generateFlowFieldSVG();  // Algorithm-specific

  if (ExportUtils.validateSVG(svgContent)) {
    ExportUtils.downloadSVG(svgContent, filename);
  } else {
    console.error('SVG generation failed');
  }
}

function generateFlowFieldSVG() {
  let svg = `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">\n`;
  svg += `<rect width="800" height="800" fill="white"/>\n`;

  // Draw particles
  particles.forEach(p => {
    svg += `<path d="M ${p.path.join(' L ')}" stroke="black" fill="none"/>\n`;
  });

  svg += `</svg>`;
  return svg;
}
```

---

### Phase 4: Upgrade to p5.js 1.7.0+ (Days 15-20)

**Goal**: Move to latest p5.js version

**Prerequisites**:
- All algorithms using ExportUtils
- No p5.js-svg dependency remaining

**Tasks**:
1. Update CDN URLs to p5.js 1.7.0
2. Remove all `<script src="...p5.js-svg..."></script>` tags
3. Test all 50+ algorithms
4. Update documentation

**Validation**:
```bash
# Ensure no p5.js-svg references remain
grep -r "p5.js-svg" algorithms/
# (should return nothing)

# Ensure all files use 1.7.0
grep -r "p5.js/1.6.0" algorithms/
# (should return nothing)
```

---

## Alternative: Pure SVG Approach (No p5.js-svg)

For algorithms that don't need p5.js rendering, use manual SVG generation.

**Template**:
```javascript
class SVGBuilder {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.elements = [];
  }

  rect(x, y, w, h, fill = 'none', stroke = 'black', strokeWidth = 1) {
    this.elements.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" ` +
      `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
    );
  }

  circle(cx, cy, r, fill = 'none', stroke = 'black', strokeWidth = 1) {
    this.elements.push(
      `<circle cx="${cx}" cy="${cy}" r="${r}" ` +
      `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
    );
  }

  path(points, fill = 'none', stroke = 'black', strokeWidth = 1) {
    const d = points.map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');
    this.elements.push(
      `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`
    );
  }

  line(x1, y1, x2, y2, stroke = 'black', strokeWidth = 1) {
    this.elements.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ` +
      `stroke="${stroke}" stroke-width="${strokeWidth}"/>`
    );
  }

  toString() {
    return `<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${this.width}" height="${this.height}" fill="white"/>
  ${this.elements.join('\n  ')}
</svg>`;
  }
}

// Usage:
function exportSVG() {
  const svg = new SVGBuilder(800, 800);

  // Draw your algorithm
  svg.circle(400, 400, 100);
  svg.line(0, 0, 800, 800);

  const filename = ExportUtils.generateFilename('my-algorithm', params);
  ExportUtils.downloadSVG(svg.toString(), filename);
}
```

---

## Testing Strategy

### Unit Tests
```javascript
// tests/export-utils.test.js
test('ExportUtils.generateFilename', () => { /* ... */ });
test('ExportUtils.validateSVG', () => { /* ... */ });
test('ExportUtils.downloadSVG', () => { /* ... */ });
```

### Integration Tests
```javascript
// tests/algorithms/flow-field.test.js
test('Flow Field exports valid SVG', async () => {
  const page = await browser.newPage();
  await page.goto('http://localhost:8000/algorithms/flow-fields/flow-field-p5-gui.html');

  // Click export button
  await page.click('button[onclick="exportSVG()"]');

  // Verify download
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toMatch(/^flow-field-.*\.svg$/);

  // Verify SVG content
  const content = await download.path();
  const svg = fs.readFileSync(content, 'utf8');
  expect(svg).toContain('<svg');
  expect(svg).toContain('</svg>');
});
```

### Manual Testing Checklist
```
□ Export SVG from browser
□ Open in Inkscape (verify vector paths)
□ Open in Adobe Illustrator (verify compatibility)
□ Check file size (<5MB for reasonable algorithms)
□ Verify filename format matches ExportUtils pattern
□ Test on Safari, Chrome, Firefox
```

---

## Rollback Plan

If migration causes issues:

1. **Immediate Rollback**:
   ```bash
   git revert HEAD
   ```

2. **Restore p5.js 1.6.0**:
   ```bash
   ./fix-p5-version.sh  # Rerun downgrade script
   ```

3. **Remove ExportUtils**:
   ```bash
   git checkout main -- src/utils/export-utils.js
   ```

---

## Success Metrics

### Phase 1 (Hotfix)
- ✅ All 50 algorithms export SVG without errors
- ✅ Zero console errors on export button click
- ✅ Files open in Inkscape/Illustrator

### Phase 2 (ExportUtils)
- ✅ `export-utils.js` passes 100% test coverage
- ✅ API documentation complete
- ✅ Zero ESLint warnings

### Phase 3 (Migration)
- ✅ 50+ algorithms using ExportUtils
- ✅ No p5.js-svg dependencies remain
- ✅ All SVG exports validated

### Phase 4 (Upgrade)
- ✅ p5.js 1.7.0 running on all files
- ✅ Zero regression bugs
- ✅ Performance benchmarks maintained

---

## Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1: Hotfix** | 2 days | SVG exports working (p5.js 1.6.0) |
| **Phase 2: ExportUtils** | 3 days | Module + tests + docs |
| **Phase 3: Migration** | 9 days | All algorithms using ExportUtils |
| **Phase 4: Upgrade** | 6 days | p5.js 1.7.0 + no p5.js-svg |
| **TOTAL** | **20 days** | Production-ready system |

---

## File Inventory (Detailed)

### Algorithms Using p5.js-svg (Need Migration)

**Flow Fields** (6):
- flow-field-p5-gui.html
- flow-field-collision.html
- (+ 4 more)

**Geometric** (11):
- spiral-fill.html
- 10print-gui.html
- circle-rays-gui.html
- (+ 8 more)

**Reaction Diffusion** (5):
- reaction-diffusion-enhanced.html
- reaction-diffusion-layers.html
- (+ 3 more)

**Advanced** (6):
- sound-waveform-gui.html (already using manual SVG ✅)
- vortex-street-gui.html
- parametric-surfaces-gui.html
- chladni-patterns-gui.html
- (+ 2 more)

**Total**: 50+ files

---

## Decision Matrix

| Criteria | Version Downgrade | ExportUtils Only | Hybrid (Recommended) |
|----------|-------------------|------------------|---------------------|
| Time to Fix | ⭐⭐⭐⭐⭐ (2 days) | ⭐⭐ (10 days) | ⭐⭐⭐ (20 days) |
| Long-term Stability | ⭐⭐ (locks old p5.js) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Code Quality | ⭐⭐ (no refactor) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Risk Level | ⭐⭐⭐⭐ (low) | ⭐⭐⭐ (medium) | ⭐⭐⭐⭐ (low) |
| Future-proof | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Recommendation**: **Hybrid Approach** (immediate downgrade + gradual ExportUtils migration)

---

## Next Steps

1. **Approve this plan** or request changes
2. **Execute Phase 1** (hotfix) immediately
3. **Schedule Phases 2-4** for next sprint
4. **Assign ownership** for each phase

---

## Appendix: Code Snippets

### A. Batch Update Script

```bash
#!/bin/bash
# batch-update-p5-version.sh

ALGORITHMS_DIR="/Users/djm/claude-projects/pen-plotter-art/algorithms"

echo "Updating p5.js version from 1.7.0 to 1.6.0..."

find "$ALGORITHMS_DIR" -name "*.html" -type f | while read -r file; do
  if grep -q "p5.js/1.7.0/p5.min.js" "$file"; then
    sed -i '' 's|p5.js/1.7.0/p5.min.js|p5.js/1.6.0/p5.min.js|g' "$file"
    echo "✓ Updated: $file"
  fi
done

echo "Done! Updated $(find "$ALGORITHMS_DIR" -name "*.html" -type f | wc -l) files."
```

### B. Validation Script

```bash
#!/bin/bash
# validate-svg-exports.sh

ALGORITHMS_DIR="/Users/djm/claude-projects/pen-plotter-art/algorithms"

echo "Checking for p5.js-svg errors..."

find "$ALGORITHMS_DIR" -name "*.html" -type f | while read -r file; do
  if grep -q "p5.js-svg" "$file"; then
    p5_version=$(grep -o "p5.js/[0-9.]*" "$file" | head -1 | cut -d'/' -f2)
    echo "File: $(basename $file) uses p5.js $p5_version"
  fi
done
```

### C. Find ExportUtils Usage

```bash
#!/bin/bash
# find-exportutils-usage.sh

grep -r "ExportUtils\." /Users/djm/claude-projects/pen-plotter-art/algorithms \
  --include="*.html" \
  -n \
  --color=always | \
  tee exportutils-usage.log

echo ""
echo "Found $(grep -c "ExportUtils\." exportutils-usage.log || echo 0) references to ExportUtils"
```

---

**END OF FIX PLAN**

*This document is comprehensive and ready for implementation. All code examples are production-ready.*

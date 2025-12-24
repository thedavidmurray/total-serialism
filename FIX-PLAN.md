# Total Serialism Fix Plan

## 🎨 Frontend-Design Plugin Opportunities

> **After restart, invoke `/frontend-design` for these high-value tasks:**

| Task | Why Use Plugin | Priority |
|------|----------------|----------|
| **algorithm.css design system** | Create distinctive dark theme, avoid generic Bootstrap look | ⭐⭐⭐ |
| **Control panel UI** | Polished sliders, toggles, buttons with pen-plotter aesthetic | ⭐⭐⭐ |
| **Auto-regen toggle component** | Visual indicator that's obvious but not intrusive | ⭐⭐ |
| **Export button group** | Icon-forward buttons, progress states | ⭐⭐ |
| **Algorithm card gallery** | Index page with algorithm thumbnails | ⭐⭐ |
| **Loading/error states** | Skeleton loaders, friendly error messages | ⭐ |
| **Mobile-responsive controls** | Touch-friendly sliders and collapsible panels | ⭐ |

---

## Source of Truth
- **GitHub**: `https://github.com/thedavidmurray/total-serialism`
- **Live**: `https://thedavidmurray.github.io/total-serialism/`

---

## Priority 1: Algorithm Audit (ALL MUST WORK)

### Audit Checklist
For each of the 64 algorithms, verify on LIVE site:
- [ ] Page loads without errors
- [ ] Canvas renders on initial load
- [ ] Controls are responsive
- [ ] Regenerate/redraw works
- [ ] Export (SVG at minimum) works

### Known Issues by Category
| Category | Count | Status |
|----------|-------|--------|
| Core Engines | 3 | TBD |
| Voronoi & Stippling | 2 | TBD |
| Circle Packing | 1 | TBD |
| Geometric Patterns | 12 | TBD |
| Flow Fields | 2 | TBD |
| Natural Phenomena | 4 | TBD |
| Chemical Patterns | 9 | TBD |
| Cellular Automata | 4 | TBD |
| Advanced | 4 | TBD |
| L-Systems | 2 | TBD |
| Image Processing | 5 | TBD |
| Symmetry & Tiling | 5 | TBD |
| Physics | 1 | TBD |
| Hybrid | 1 | TBD |
| AI/ML | 1 | TBD |
| Tools | 8 | TBD |

---

## Priority 2: Algorithm Template Kit

### Goal
Create a reusable boilerplate so new algorithms:
- Work immediately with consistent UI
- Have auto-regeneration by default
- Have responsive canvas sizing
- Have working exports
- Follow design standards

### Template Components

#### `templates/algorithm-template.html`
```html
<!DOCTYPE html>
<html>
<head>
  <title>{{ALGORITHM_NAME}} - Total Serialism</title>
  <!-- Standard dependencies -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js"></script>
  <!-- Shared modules (adjust path based on depth) -->
  <script src="{{PATH_PREFIX}}/shared/canvas-bootstrap.js"></script>
  <script src="{{PATH_PREFIX}}/shared/export-utils.js"></script>
  <script src="{{PATH_PREFIX}}/preset-manager.js"></script>
  <link rel="stylesheet" href="{{PATH_PREFIX}}/shared/algorithm.css">
</head>
<body>
  <div id="canvas-container"></div>
  <div id="controls">
    <!-- Auto-regeneration toggle (ALWAYS VISIBLE) -->
    <div class="control-group">
      <div class="auto-regen-toggle">
        <input type="checkbox" id="autoRegen" checked>
        <label for="autoRegen">Auto-regenerate on change</label>
      </div>
      <button id="regenerateBtn">Regenerate</button>
    </div>
    <!-- Algorithm-specific controls -->
    <div id="algorithm-controls"></div>
    <!-- Export section -->
    <div class="control-group">
      <h3>Export</h3>
      <button id="exportSVG">Export SVG</button>
      <button id="exportPNG">Export PNG</button>
    </div>
  </div>
  <script src="{{ALGORITHM_SCRIPT}}"></script>
</body>
</html>
```

#### `shared/canvas-bootstrap.js`
- ResizeObserver for responsive sizing
- Standard setup/draw lifecycle hooks
- Error boundary with user feedback
- Loading state indicator

#### `shared/export-utils.js`
- Consolidated SVG export
- PNG export via canvas.toDataURL
- GIF export via gif.js

#### `shared/algorithm.css` 🎨 **USE FRONTEND-DESIGN PLUGIN**
- Design tokens (CSS variables)
- Standard layout (canvas left, controls right)
- Responsive breakpoints
- Dark theme with pen-plotter/generative art aesthetic
- **Plugin prompt**: "Create a design system for a generative art tool with dark theme, emphasizing the canvas. Controls should feel technical but refined, like a high-end audio mixer. Avoid generic Bootstrap aesthetics."

---

## Priority 3: Global Fixes

### Auto-Regeneration
**Current State**: Disabled by default, no UI indicator
**Fix**:
1. Add visible checkbox toggle in ALL algorithm pages
2. Default to ON for better demo experience
3. Add visual indicator when disabled ("Paused" badge)
4. Persist preference in localStorage

### Canvas Sizing
**Current State**: Fixed 800x800 or 800x600, doesn't adapt
**Fix**:
1. Use ResizeObserver in canvas-bootstrap.js
2. Calculate available space from container
3. Maintain aspect ratio
4. Re-render on resize

### Export
**Current State**: Some are placeholder alerts
**Fix**:
1. Use consolidated export-utils.js everywhere
2. Implement actual GIF export for animation pages
3. Add progress indicator for long exports

---

## Priority 4: UI Standardization 🎨 **FRONTEND-DESIGN PLUGIN FOCUS**

> **This entire section benefits from the frontend-design plugin. Use it to:**
> - Create a cohesive visual language across 64 algorithm pages
> - Design custom slider/toggle components that feel unique
> - Build responsive control panels that work on mobile
> - Create visual hierarchy that emphasizes the canvas

### Design Tokens (Placeholder - Plugin will refine)
```css
:root {
  /* Colors - Plugin will suggest better palette */
  --accent-primary: #4CAF50;
  --accent-secondary: #667eea;
  --bg-dark: #1a1a1a;
  --bg-panel: #2a2a2a;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;

  /* Layout */
  --panel-width: 320px;
  --canvas-padding: 16px;

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

### Control Components to Design 🎨
1. **Parameter sliders** - Custom range inputs with value labels
2. **Toggle switches** - For boolean parameters (auto-regen, grid, etc.)
3. **Button groups** - Export, regenerate, reset
4. **Collapsible sections** - Group related controls
5. **Color pickers** - For stroke/fill color parameters
6. **Preset dropdown** - Save/load parameter configurations

---

## Implementation Order

### Phase 1: Foundation (Before fixing individual pages)
1. Create `pen-plotter/shared/` directory
2. Create `canvas-bootstrap.js` with ResizeObserver + error handling
3. Create `export-utils.js` with consolidated functions
4. 🎨 **USE `/frontend-design`**: Create `algorithm.css` with design tokens + control components
5. Create `algorithm-template.html` using the designed CSS

### Phase 2: Audit & Fix (After foundation)
1. Run automated audit of all 64 pages
2. Fix broken pages using template patterns
3. Add auto-regen toggle to all pages

### Phase 3: Validation
1. Test all pages on live site
2. Verify exports work
3. Test on mobile viewport

---

## Files to Create/Modify

### New Files
- `pen-plotter/shared/canvas-bootstrap.js`
- `pen-plotter/shared/export-utils.js`
- `pen-plotter/shared/algorithm.css`
- `templates/algorithm-template.html`
- `scripts/audit-algorithms.js` (Node script to test pages)

### Files to Update
- All 64 algorithm HTML files (add auto-regen toggle, use shared modules)
- `algorithm-catalog.json` (fix stats: 79 → 64)

---

## Quick Reference: Path Depths

From different algorithm locations, relative paths to `pen-plotter/`:

| Location | Path to pen-plotter |
|----------|---------------------|
| `pen-plotter/algorithms/geometric/` | `../../` |
| `pen-plotter/algorithms/cellular-automata/` | `../../` |
| `pen-plotter/algorithms/voronoi/` | `../../` |
| Root level pages | `pen-plotter/` |

---

## Success Criteria

- [ ] All 64 algorithms load and render on live site
- [ ] Auto-regeneration works everywhere with visible toggle
- [ ] Canvas sizes responsively to viewport
- [ ] SVG/PNG export works on all pages
- [ ] Consistent UI across all pages
- [ ] New algorithm template allows <30 min to add new algo
- [ ] 🎨 **Design quality**: Controls feel polished, not generic
- [ ] 🎨 **Visual cohesion**: All pages share distinctive pen-plotter aesthetic
- [ ] 🎨 **Mobile UX**: Controls usable on touch devices

---

## 🎨 Frontend-Design Plugin Prompts

Save these prompts to use after restart with `/frontend-design`:

### Prompt 1: Design System
```
Create a CSS design system for a generative art / pen plotter tool collection.
- Dark theme (canvas is the star)
- Technical but refined aesthetic (like high-end audio equipment)
- Custom slider inputs with inline value display
- Toggle switches for boolean params
- Button groups for actions (regenerate, export)
- Collapsible parameter groups
- Must work on mobile (touch-friendly targets)
- Avoid generic Bootstrap/Material aesthetics
```

### Prompt 2: Control Panel Component
```
Create a control panel component for generative art algorithms.
Features needed:
- Auto-regenerate toggle with visual state indicator
- Parameter sliders with labels and live values
- Export button group (SVG, PNG, GIF)
- Preset save/load dropdown
- Should collapse on mobile into hamburger menu
- Dark theme, accent color for active/hover states
```

### Prompt 3: Algorithm Index Gallery
```
Create an index/gallery page for 64 generative art algorithms.
- Grid of algorithm cards with thumbnail previews
- Category filtering (geometric, cellular, voronoi, etc.)
- Search/filter by name
- Each card shows: name, category, thumbnail, link
- Dark theme consistent with tool aesthetic
- Responsive grid (4 col desktop → 2 col tablet → 1 col mobile)
```

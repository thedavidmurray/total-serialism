# TSCanvasControls Migration Guide

This guide documents how to migrate algorithms from inline canvas control handling to the standardized `TSCanvasControls` class.

## Benefits of Migration

- **Consistent defaults**: White background, black stroke across all algorithms
- **No memory leaks**: Proper event listener cleanup
- **WCAG AA colors**: Randomize All generates accessible color combinations
- **Less code**: Remove duplicate event listener setup
- **Standard controls**: Unified paper size, color, and stroke weight handling

## Quick Start

### 1. Add Script Tag

Add the canvas-controls.js script after canvas-bootstrap.js:

```html
<script src="../../shared/canvas-bootstrap.js"></script>
<script src="../../shared/canvas-controls.js"></script>
```

### 2. Initialize Controls

Replace inline canvas control params with TSCanvasControls:

**BEFORE:**
```javascript
const params = {
  bgColor: '#fff',  // inconsistent!
  strokeColor: '#000',
  paperSize: 'a4',
  // ... algorithm-specific params
};

// Manually attach listeners
document.getElementById('bgColor').addEventListener('change', ...);
document.getElementById('strokeColor').addEventListener('change', ...);
```

**AFTER:**
```javascript
// Canvas controls with consistent defaults
const canvasControls = new TSCanvasControls();

// Algorithm-specific params only
const params = {
  // algorithm-specific params here
};

// Bind canvas controls to params
canvasControls.bind(params, {
  autoRegen: true,
  regenCallback: regenerate
});
```

### 3. Set Up Listeners and Cleanup

```javascript
function setup() {
  // ... existing setup code ...

  // Set up canvas control listeners
  canvasControls.setupEventListeners(regenerate);

  // Optional: Set up Randomize All button
  canvasControls.setupRandomizeButton('randomizeAll');
}
```

### 4. Use getCanvasSize() for Dimensions

**BEFORE:**
```javascript
const paperSizes = {
  'a4': { width: 794, height: 1123 },
  // ... duplicated in every file
};
const size = paperSizes[params.paperSize];
```

**AFTER:**
```javascript
const size = canvasControls.getCanvasSize();
createCanvas(size.width, size.height);
```

### 5. Add Randomize All Button (Optional)

Add this button to your controls HTML:

```html
<button id="randomizeAll" class="ts-btn">Randomize Colors</button>
```

The button is automatically wired up if you call `setupRandomizeButton()`.

## HTML Element Requirements

TSCanvasControls looks for these element IDs:

| Element ID | Type | Description |
|------------|------|-------------|
| `paperSize` | select | Paper size dropdown |
| `bgColor` | select or input[type="color"] | Background color |
| `strokeColor` | select or input[type="color"] | Stroke color |
| `strokeWeight` | input[type="range"] | Stroke weight slider |
| `randomizeAll` | button | Randomize All button |

## Migration Checklist

For each algorithm file:

- [ ] Add `canvas-controls.js` script tag
- [ ] Create `TSCanvasControls` instance
- [ ] Remove inline `bgColor`, `strokeColor`, `paperSize` from params
- [ ] Call `canvasControls.bind(params, options)`
- [ ] Call `canvasControls.setupEventListeners(regenCallback)`
- [ ] Replace paper size lookup with `canvasControls.getCanvasSize()`
- [ ] Remove inline event listeners for canvas controls
- [ ] Add Randomize All button if desired
- [ ] Test: Verify colors apply correctly
- [ ] Test: Verify paper size changes work
- [ ] Test: Verify Randomize All produces good contrast

## API Reference

### TSCanvasControls

```javascript
// Constructor - optionally override defaults
const controls = new TSCanvasControls({
  bgColor: '#000000',  // optional override
  strokeColor: '#ffffff'
});

// Bind to algorithm params
controls.bind(params, {
  autoRegen: true,
  regenCallback: () => redraw()
});

// Set up DOM event listeners
controls.setupEventListeners(regenerateCallback);

// Set up Randomize All button
controls.setupRandomizeButton('randomizeAll');

// Get canvas dimensions for current paper size
const { width, height } = controls.getCanvasSize();

// Randomize colors with WCAG AA contrast
controls.randomizeColors();

// Randomize all (colors + trigger regen)
controls.randomizeAll();

// Lock/unlock parameters from randomization
controls.lockParameter('bgColor');
controls.unlockParameter('bgColor');
controls.isLocked('bgColor'); // returns boolean

// Clean up listeners (called automatically on beforeunload)
controls.cleanup();
```

### Static Methods

```javascript
// Validate hex color
TSCanvasControls.validateColor('#ffffff'); // true

// Generate random color
TSCanvasControls.generateRandomColor(); // '#a3b2c4'

// Generate contrasting color meeting WCAG AA
TSCanvasControls.generateContrastingColor('#000000', 4.5); // light color

// Get contrast ratio
TSCanvasControls.getContrastRatio('#000000', '#ffffff'); // 21

// Get luminance
TSCanvasControls.getLuminance('#808080'); // ~0.22
```

### Constants

```javascript
TSCanvasControls.DEFAULTS
// { paperSize: 'a4', bgColor: '#ffffff', strokeColor: '#000000', strokeWeight: 1 }

TSCanvasControls.PAPER_SIZES
// { 'a4': { width: 794, height: 1123 }, 'a3': {...}, ... }

TSCanvasControls.SAFE_COLOR_PAIRS
// Array of { bg, stroke } pairs with guaranteed good contrast
```

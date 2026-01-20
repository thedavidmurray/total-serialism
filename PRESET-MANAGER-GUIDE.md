# Preset Manager - Integration Guide

The Preset Manager is a drop-in system for saving, loading, and sharing algorithm parameters across Total Serialism.

## 🚀 Quick Start

### 1. Include the files

```html
<script src="/preset-manager.js"></script>
<link rel="stylesheet" href="/preset-manager.css">
```

### 2. Initialize in your code

```javascript
const presetManager = new PresetManager({
    algorithmId: 'my-algorithm', // Unique ID for your algorithm
    container: '#controls',      // Where to inject the UI

    onSave: () => {
        // Return current parameters as an object
        return {
            param1: currentValue1,
            param2: currentValue2,
            // ... all your parameters
        };
    },

    onLoad: (preset) => {
        // Apply the loaded preset
        const data = preset.data;
        applyParameter('param1', data.param1);
        applyParameter('param2', data.param2);
        // Update UI, regenerate, etc.
    },

    onRandomize: () => {
        // Optional: randomize parameters
        generateRandomParameters();
    }
});
```

That's it! The preset UI will appear in your container.

---

## 📖 Full API Reference

### Constructor Options

```javascript
new PresetManager({
    algorithmId: string,      // Required: Unique ID for localStorage
    container: string|Element, // Optional: DOM selector or element
    onSave: () => object,     // Required: Return current params
    onLoad: (preset) => void, // Required: Apply preset
    onRandomize: () => void   // Optional: Randomize function
})
```

### Methods

#### `save(name: string): Preset`
Save current parameters with a name.

```javascript
presetManager.save('My Cool Pattern');
```

#### `load(presetId: string): Preset`
Load a preset by ID.

```javascript
presetManager.load('1234567890');
```

#### `delete(presetId: string): void`
Delete a preset.

```javascript
presetManager.delete('1234567890');
```

#### `exportPreset(presetId: string): void`
Export a single preset as JSON file.

```javascript
presetManager.exportPreset('1234567890');
```

#### `exportAll(): void`
Export all presets as JSON file.

```javascript
presetManager.exportAll();
```

#### `import(file: File): Promise<Preset[]>`
Import presets from JSON file.

```javascript
await presetManager.import(fileFromInput);
```

#### `clear(): void`
Clear all presets (with confirmation).

```javascript
presetManager.clear();
```

---

## 🎨 UI Features

The preset manager provides a complete UI with:

### Save Section
- Text input for preset name
- **Save** button - saves current parameters
- **Random** button - randomizes parameters (if `onRandomize` provided)

### Search
- Real-time filtering of preset list
- Searches by preset name

### Preset List
- Shows all saved presets
- Each preset shows:
  - Name
  - Date saved
  - "Imported" badge (if imported)
- Actions per preset:
  - ▶ **Load** - apply preset
  - 📤 **Export** - download as JSON
  - 🗑️ **Delete** - remove preset

### Import/Export Section
- **Import** - load presets from JSON file
- **Export All** - download all presets
- **Clear All** - delete all presets

### Notifications
- Toast notifications for actions
- Success/error states
- Auto-dismiss after 2 seconds

---

## 💾 Data Format

Presets are stored as JSON with this structure:

```json
{
  "id": "1699123456789",
  "name": "My Preset",
  "algorithmId": "flow-field",
  "timestamp": "2024-11-10T12:34:56.789Z",
  "data": {
    "density": 50,
    "speed": 2.5,
    "color": "#4CAF50"
  },
  "imported": false
}
```

### Storage

- Stored in `localStorage` with key: `total-serialism-presets-{algorithmId}`
- Persists across browser sessions
- Scoped per algorithm ID
- Survives page refreshes

---

## 🔧 Integration Examples

### Example 1: Simple Integration

```javascript
// Minimal setup
const presetManager = new PresetManager({
    algorithmId: 'simple-pattern',
    container: '#preset-section',

    onSave: () => ({
        size: document.getElementById('size').value,
        color: document.getElementById('color').value
    }),

    onLoad: (preset) => {
        document.getElementById('size').value = preset.data.size;
        document.getElementById('color').value = preset.data.color;
        regenerate();
    }
});
```

### Example 2: With Randomization

```javascript
const presetManager = new PresetManager({
    algorithmId: 'complex-pattern',
    container: '#controls',

    onSave: () => getAllParameters(),

    onLoad: (preset) => {
        applyAllParameters(preset.data);
        updateAllUIElements();
        redraw();
    },

    onRandomize: () => {
        // Generate random values
        const randomParams = {
            density: Math.random() * 100,
            speed: Math.random() * 10,
            scale: Math.random() * 0.05
        };
        applyAllParameters(randomParams);
        updateAllUIElements();
        redraw();
    }
});
```

### Example 3: p5.js Integration

```javascript
// In your p5.js sketch
let params = {
    count: 100,
    size: 5,
    speed: 2
};

function setup() {
    createCanvas(800, 800);

    // Initialize preset manager
    const presetManager = new PresetManager({
        algorithmId: 'p5-sketch',
        container: '#controls',

        onSave: () => ({ ...params }), // Clone params

        onLoad: (preset) => {
            params = { ...preset.data };
            updateSliders();
            background(0);
            redraw();
        },

        onRandomize: () => {
            params.count = floor(random(50, 200));
            params.size = floor(random(1, 20));
            params.speed = random(0.5, 5);
            updateSliders();
            background(0);
        }
    });
}
```

---

## 🎨 Styling Customization

The preset manager uses CSS variables for easy customization:

```css
/* Add to your stylesheet */
.preset-manager {
    /* Override default styles */
    --preset-primary-color: #4CAF50;
    --preset-background: rgba(0, 0, 0, 0.05);
    --preset-border-radius: 8px;
}
```

### Dark Theme

The preset manager automatically adapts to dark themes using `prefers-color-scheme: dark`.

---

## 📤 Sharing Presets

### Export for Sharing

1. Click **Export** button on any preset
2. JSON file downloads: `algorithm-name-preset-name.json`
3. Share file with others

### Import Shared Presets

1. Click **Import** button
2. Select `.json` file
3. Preset appears in list with "Imported" badge
4. Name conflicts are resolved automatically

### Community Presets

Create a folder for community presets:

```
total-serialism/
└── presets/
    └── community/
        ├── flow-field-smooth.json
        ├── crystal-dense.json
        └── perlin-mountains.json
```

Users can drag-and-drop these into the import dialog.

---

## 🔒 Best Practices

### Algorithm IDs

Use descriptive, unique IDs:

```javascript
// Good
algorithmId: 'perlin-landscape-v2'
algorithmId: 'reaction-diffusion'

// Bad
algorithmId: 'algo'
algorithmId: 'test'
```

### Parameter Objects

Include all relevant state:

```javascript
onSave: () => ({
    // Visual parameters
    density: params.density,
    color: params.color,

    // Algorithm settings
    noiseScale: params.noiseScale,
    seed: params.seed,

    // Canvas state (optional)
    width: canvas.width,
    height: canvas.height
})
```

### UI Synchronization

Always update UI when loading:

```javascript
onLoad: (preset) => {
    // 1. Update internal state
    params = { ...preset.data };

    // 2. Update all UI elements
    document.getElementById('density').value = params.density;
    document.getElementById('densityDisplay').textContent = params.density;

    // 3. Regenerate/redraw
    regenerate();
}
```

### Error Handling

Validate preset data:

```javascript
onLoad: (preset) => {
    const data = preset.data;

    // Validate required fields
    if (!data.density || !data.color) {
        console.error('Invalid preset data');
        return;
    }

    // Apply with defaults
    applyParams({
        density: data.density || 50,
        color: data.color || '#000000'
    });
}
```

---

## 🐛 Troubleshooting

### Presets not persisting

**Issue:** Presets disappear on refresh

**Solution:** Check localStorage is enabled:
```javascript
if (typeof Storage === "undefined") {
    console.error("localStorage not available");
}
```

### UI not appearing

**Issue:** Preset UI doesn't show

**Solutions:**
- Verify container selector exists: `document.querySelector('#controls')`
- Check CSS file is loaded
- Look for console errors

### Import fails

**Issue:** "Invalid preset file" error

**Solutions:**
- Verify JSON is valid
- Check file has required fields: `id`, `name`, `data`
- Ensure `data` object has expected parameters

---

## 🚀 Advanced Usage

### Manual Storage

Don't want the built-in UI? Use the API directly:

```javascript
const presetManager = new PresetManager({
    algorithmId: 'my-algo',
    onSave: () => getParams(),
    onLoad: (p) => applyParams(p.data)
    // No container = no UI
});

// Use programmatically
presetManager.save('Manual Save');
const presets = presetManager.presets;
presetManager.load(presets[0].id);
```

### Custom UI

Build your own UI using the API:

```javascript
document.getElementById('myLoadBtn').addEventListener('click', () => {
    const presetId = document.getElementById('presetSelect').value;
    presetManager.load(presetId);
});
```

### Events

Hook into preset actions:

```javascript
const originalLoad = presetManager.onLoad;
presetManager.onLoad = (preset) => {
    console.log('Loading preset:', preset.name);
    originalLoad(preset);
    trackAnalytics('preset_loaded', preset.name);
};
```

---

## 📊 Examples in the Wild

Check these algorithms for real integrations:

- `preset-manager-demo.html` - Full featured demo
- `pen-plotter/algorithms/geometric/perlin-landscape-gui.html` - Live integration
- `pen-plotter/algorithms/flow-fields/flow-field-p5-gui.html` - Flow field example

---

## 🤝 Contributing

Have ideas for improving the preset system? See [IMPROVEMENT-ROADMAP.md](IMPROVEMENT-ROADMAP.md).

---

**Version:** 1.0.0
**Author:** Total Serialism
**License:** MIT

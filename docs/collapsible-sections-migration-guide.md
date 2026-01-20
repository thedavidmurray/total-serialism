# Collapsible Sections Migration Guide

## Overview

This guide helps you convert flat control panels to collapsible sections across all 67 Total Serialism pen plotter algorithms.

## Quick Start (5 Minutes)

### 1. Add Script Tags

Add these two lines to your HTML file's `<head>` section:

```html
<script src="../preset-manager.js"></script>
<script src="../collapsible-sections.js"></script>
```

### 2. Initialize in Your JavaScript

Add this code **after** your DOM is loaded:

```javascript
// Initialize collapsible sections
const sections = new CollapsibleSections({
    container: '#controls',
    storageKey: 'your-algorithm-name-sections',
    defaultState: 'expanded'
});

// Convert existing control groups
sections.convertFlatStructure({
    selector: '.control-group',
    getTitleFromElement: (element) => {
        const heading = element.querySelector('h3, h4');
        return heading ? heading.textContent : 'Section';
    }
});

// Add global controls
sections.addGlobalControls({
    position: 'top',
    showResetButton: true
});
```

That's it! Your flat control panel is now collapsible.

---

## Detailed Migration Strategies

### Strategy 1: Automatic Conversion (Recommended for Most Cases)

**Best for:** Algorithms with existing `.control-group` divs and semantic headings

**Steps:**

1. Ensure your HTML has this structure:

```html
<div id="controls">
    <div class="control-group">
        <h3>Canvas Settings</h3>
        <!-- controls here -->
    </div>

    <div class="control-group">
        <h3>Pattern Options</h3>
        <!-- controls here -->
    </div>
</div>
```

2. Add initialization code:

```javascript
const sections = new CollapsibleSections({
    container: '#controls',
    storageKey: 'algorithm-name-sections'
});

sections.convertFlatStructure();
sections.addGlobalControls({ position: 'top' });
```

**Done!** All `.control-group` divs become collapsible sections.

---

### Strategy 2: Manual Section Creation

**Best for:** Complex layouts, dynamic controls, or non-standard HTML structure

**Steps:**

1. Initialize the system:

```javascript
const sections = new CollapsibleSections({
    container: '#controls',
    storageKey: 'algorithm-name-sections'
});
```

2. Create sections programmatically:

```javascript
// Create canvas settings section
const canvasSection = sections.createSection({
    id: 'canvas-settings',
    title: 'Canvas Settings',
    content: `
        <div class="control">
            <label>Width: <span id="widthValue">800</span>px</label>
            <input type="range" id="width" min="400" max="2000" value="800">
        </div>
        <div class="control">
            <label>Height: <span id="heightValue">600</span>px</label>
            <input type="range" id="height" min="300" max="1500" value="600">
        </div>
    `,
    expanded: true
});

// Append to container
document.getElementById('controls').appendChild(canvasSection);

// Create pattern section
const patternSection = sections.createSection({
    id: 'pattern-settings',
    title: 'Pattern Options',
    content: document.getElementById('pattern-controls'), // Can pass HTMLElement
    expanded: false // Start collapsed
});

document.getElementById('controls').appendChild(patternSection);
```

3. Add global controls:

```javascript
sections.addGlobalControls({ position: 'top' });
```

---

### Strategy 3: Hybrid Approach

**Best for:** Partially refactoring existing code, gradual migration

**Steps:**

1. Convert some sections automatically:

```javascript
const sections = new CollapsibleSections({
    container: '#controls',
    storageKey: 'algorithm-name-sections'
});

// Convert only specific sections
sections.convertFlatStructure({
    selector: '.control-group:not(.legacy)' // Exclude legacy controls
});
```

2. Manually create additional sections:

```javascript
const advancedSection = sections.createSection({
    id: 'advanced-options',
    title: 'Advanced Options',
    content: document.getElementById('advanced-controls-container'),
    expanded: false
});

document.getElementById('controls').appendChild(advancedSection);
```

---

## Integration with PresetManager

If your algorithm uses `PresetManager`, integrate it to auto-expand sections on preset load:

```javascript
// Initialize preset manager
const presetManager = new PresetManager({
    algorithmId: 'algorithm-name',
    container: '#preset-container',
    onSave: () => params,
    onLoad: (preset) => {
        Object.assign(params, preset.data);
        updateUIFromParams();
        generate();
    }
});

// Integrate with collapsible sections
// This auto-expands all sections when a preset loads
sections.integrateWithPresetManager(presetManager);
```

---

## Common Patterns

### Pattern 1: Section Groups

Group related settings logically:

```javascript
// Recommended groupings for most algorithms:
const groupings = [
    'Canvas Settings',
    'Pattern Style',
    'Grid & Layout',
    'Appearance',
    'Advanced Options',
    'Generation',
    'Export',
    'Presets'
];
```

### Pattern 2: Default Collapsed Sections

Start with less-used sections collapsed:

```javascript
sections.convertFlatStructure({
    selector: '.control-group',
    getTitleFromElement: (element) => {
        const title = element.querySelector('h3').textContent;

        // These sections start collapsed
        const collapsedSections = [
            'Advanced Options',
            'Interlacing',
            'Debug Options'
        ];

        return title;
    }
});

// Then collapse specific sections after conversion
sections.collapseSection('advanced-options');
sections.collapseSection('interlacing');
sections.collapseSection('debug-options');
```

### Pattern 3: Programmatic Control

Control sections based on user actions:

```javascript
// Expand a section when a related option is enabled
document.getElementById('enableInterlace').addEventListener('change', (e) => {
    if (e.target.checked) {
        sections.expandSection('interlacing');
    } else {
        sections.collapseSection('interlacing');
    }
});

// Expand all sections when "Randomize" is clicked
document.getElementById('randomizeBtn').addEventListener('click', () => {
    sections.expandAll();
    randomizeParameters();
});
```

---

## Customization Options

### Custom Styling

Override default styles:

```css
/* Custom header colors */
.collapsible-section-header {
    background: linear-gradient(to bottom, #e3f2fd, #bbdefb) !important;
}

.collapsible-section-header:hover {
    background: linear-gradient(to bottom, #bbdefb, #90caf9) !important;
}

/* Custom title styling */
.collapsible-section-title {
    color: #1976d2 !important;
    font-size: 15px !important;
}

/* Custom animation speed */
.collapsible-section-content {
    transition-duration: 0.5s !important; /* Slower animation */
}

/* Remove animations entirely */
.collapsible-section-content {
    transition: none !important;
}
```

### Configuration Options

All available options:

```javascript
const sections = new CollapsibleSections({
    // Required
    container: '#controls',              // Selector or HTMLElement

    // Optional
    storageKey: 'algorithm-sections',    // localStorage key
    defaultState: 'expanded',            // 'expanded' | 'collapsed'
    animationDuration: 300,              // milliseconds
    persistState: true,                  // Save state to localStorage
    expandAllOnPresetLoad: true          // Auto-expand when preset loads
});
```

---

## Event Handling

Listen to section toggle events:

```javascript
document.getElementById('controls').addEventListener('sectionToggle', (e) => {
    console.log(`Section: ${e.detail.sectionId}`);
    console.log(`Expanded: ${e.detail.expanded}`);

    // Example: Track analytics
    if (window.analytics) {
        analytics.track('Section Toggled', {
            section: e.detail.sectionId,
            expanded: e.detail.expanded
        });
    }
});
```

---

## Accessibility Best Practices

### Keyboard Navigation

The collapsible sections system supports full keyboard navigation:

- **Enter / Space**: Toggle section
- **Arrow Down / Right**: Expand section
- **Arrow Up / Left**: Collapse section
- **Home**: Focus first section
- **End**: Focus last section
- **Tab**: Navigate through section headers

### Screen Reader Support

All sections include proper ARIA attributes:

- `role="button"` on headers
- `aria-expanded="true|false"` for state
- `aria-controls` linking header to content
- `aria-labelledby` linking content to header

### Visual Accessibility

- High contrast mode support
- Focus indicators for keyboard navigation
- Reduced motion support (honors `prefers-reduced-motion`)

---

## Testing Checklist

Before deploying your migrated algorithm:

- [ ] All sections toggle correctly
- [ ] State persists across page reloads
- [ ] PresetManager integration works (if applicable)
- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Works with screen readers
- [ ] Animations can be disabled
- [ ] Export buttons still function
- [ ] Generate/Randomize buttons work
- [ ] No console errors

---

## Troubleshooting

### Issue: Sections Don't Collapse

**Cause:** JavaScript not loaded or container not found

**Solution:**
```javascript
// Add error checking
try {
    const sections = new CollapsibleSections({
        container: '#controls',
        storageKey: 'algorithm-sections'
    });
    sections.convertFlatStructure();
} catch (error) {
    console.error('Failed to initialize collapsible sections:', error);
}
```

### Issue: State Not Persisting

**Cause:** localStorage disabled or quota exceeded

**Solution:**
```javascript
const sections = new CollapsibleSections({
    container: '#controls',
    storageKey: 'algorithm-sections',
    persistState: true // Explicitly enable
});

// Test localStorage
try {
    localStorage.setItem('test', '1');
    localStorage.removeItem('test');
    console.log('localStorage available');
} catch (e) {
    console.warn('localStorage not available:', e);
}
```

### Issue: Preset Manager Conflict

**Cause:** Preset container inserted in wrong position

**Solution:**
```javascript
// Create a dedicated preset container at the bottom
const presetContainer = document.createElement('div');
presetContainer.id = 'preset-container';
document.getElementById('controls').appendChild(presetContainer);

// Initialize preset manager with dedicated container
const presetManager = new PresetManager({
    algorithmId: 'algorithm-name',
    container: '#preset-container'
});
```

### Issue: Sections Overlap Content

**Cause:** CSS specificity conflict

**Solution:**
```css
/* Increase specificity */
#controls .collapsible-section {
    margin-bottom: 10px !important;
}

#controls .collapsible-section-content {
    overflow: visible !important; /* If controls are cut off */
}
```

---

## Performance Considerations

### Large Number of Sections

For algorithms with 15+ sections:

```javascript
// Start with most sections collapsed
const sections = new CollapsibleSections({
    container: '#controls',
    storageKey: 'algorithm-sections',
    defaultState: 'collapsed'
});

// Expand only essential sections
sections.expandSection('canvas-settings');
sections.expandSection('generation');
```

### Memory Management

Clean up when done:

```javascript
// Before page unload or when switching algorithms
sections.destroy();
```

---

## Migration Checklist

- [ ] Add script tags to HTML
- [ ] Initialize CollapsibleSections
- [ ] Convert or create sections
- [ ] Add global controls
- [ ] Integrate with PresetManager (if applicable)
- [ ] Test keyboard navigation
- [ ] Test state persistence
- [ ] Test on mobile devices
- [ ] Update documentation
- [ ] Test with screen reader

---

## Example: Complete Migration

**Before:**

```html
<div id="controls">
    <h2>Flow Field Algorithm</h2>

    <div class="control-group">
        <h3>Canvas Settings</h3>
        <div class="control">
            <label>Width</label>
            <input type="range" id="width">
        </div>
    </div>

    <div class="control-group">
        <h3>Flow Field</h3>
        <div class="control">
            <label>Noise Scale</label>
            <input type="range" id="noiseScale">
        </div>
    </div>
</div>

<script>
    // Flat controls, no organization
</script>
```

**After:**

```html
<div id="controls">
    <h2>Flow Field Algorithm</h2>
    <!-- Global controls injected here automatically -->

    <div class="control-group">
        <h3>Canvas Settings</h3>
        <div class="control">
            <label>Width</label>
            <input type="range" id="width">
        </div>
    </div>

    <div class="control-group">
        <h3>Flow Field</h3>
        <div class="control">
            <label>Noise Scale</label>
            <input type="range" id="noiseScale">
        </div>
    </div>
</div>

<script src="../preset-manager.js"></script>
<script src="../collapsible-sections.js"></script>
<script>
    // Initialize collapsible sections
    const sections = new CollapsibleSections({
        container: '#controls',
        storageKey: 'flow-field-sections',
        defaultState: 'expanded'
    });

    sections.convertFlatStructure();
    sections.addGlobalControls({ position: 'top' });

    // Initialize preset manager
    const presetManager = new PresetManager({
        algorithmId: 'flow-field',
        container: '#preset-container'
    });

    sections.integrateWithPresetManager(presetManager);
</script>
```

**Result:**
- Organized, collapsible sections
- State persistence across sessions
- Global expand/collapse controls
- Keyboard accessible
- Screen reader friendly
- Mobile responsive

---

## Next Steps

1. Start with your simplest algorithm
2. Migrate using Strategy 1 (automatic conversion)
3. Test thoroughly
4. Refine based on user feedback
5. Apply learnings to remaining algorithms

---

## Support

For questions or issues:
- Check the example: `examples/collapsible-sections-example.html`
- Review the source: `collapsible-sections.js`
- Test accessibility with screen readers
- Validate HTML structure

Happy migrating! 🎨

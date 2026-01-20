# Collapsible Sections Integration Guide

## Overview

The collapsible sections system provides a clean, accessible way to organize control panels in algorithm HTML files. It converts flat control groups into collapsible sections with localStorage persistence and smooth animations.

## Features

- **Vanilla JavaScript** - No dependencies (works alongside p5.js)
- **Accessibility** - ARIA compliant, keyboard navigation support
- **Persistence** - Remembers section states via localStorage
- **Smooth Animations** - CSS transitions with reduced-motion support
- **Print-Friendly** - Automatically expands all sections when printing
- **Easy Integration** - Converts existing `.control-group` elements

## Quick Start

### Manual Integration (3 steps)

1. **Add the script tag** in your HTML `<head>`:

```html
<script src="../../collapsible-sections.js"></script>
```

2. **Add initialization code** before `</body>`:

```html
<script>
document.addEventListener('DOMContentLoaded', function() {
  const sections = new CollapsibleSections({
    container: '#controls',
    storageKey: 'your-algorithm-name-sections',
    defaultState: 'expanded'
  });
  sections.convertFlatStructure();
  sections.addGlobalControls({ position: 'top' });
});
</script>
```

3. **Ensure your HTML uses `.control-group` with `<h3>` headings**:

```html
<div class="control-group">
  <h3>🔷 Section Title</h3>
  <!-- controls here -->
</div>
```

### Automated Integration

Use the integration script to automatically add collapsible sections to all algorithm files:

```bash
# Dry run (preview changes)
python scripts/add-collapsible-sections.py --dry-run --verbose

# Apply changes to all files
python scripts/add-collapsible-sections.py

# Apply to a specific file
python scripts/add-collapsible-sections.py --file algorithms/geometric/spiral-fill.html
```

## Configuration Options

### CollapsibleSections Constructor

```javascript
const sections = new CollapsibleSections({
  // Required: Container element selector or DOM element
  container: '#controls',

  // Optional: localStorage key for state persistence
  storageKey: 'algorithm-name-sections',  // default: 'collapsible-sections-state'

  // Optional: Default expanded state for sections
  defaultState: 'expanded',  // or 'collapsed'

  // Optional: Animation duration in milliseconds
  animationDuration: 300,  // default: 300

  // Optional: Enable/disable state persistence
  persistState: true,  // default: true

  // Optional: Expand all sections when preset is loaded
  expandAllOnPresetLoad: true  // default: true
});
```

### convertFlatStructure Options

```javascript
sections.convertFlatStructure({
  // Optional: CSS selector for control groups
  selector: '.control-group',  // default: '.control-group'

  // Optional: Function to extract title from element
  getTitleFromElement: (element) => {
    const heading = element.querySelector('h3, h4');
    return heading ? heading.textContent : 'Section';
  },

  // Optional: Wrap in section element
  wrapInSection: true  // default: true
});
```

### addGlobalControls Options

```javascript
sections.addGlobalControls({
  // Optional: Position of controls
  position: 'top',  // or 'bottom'

  // Optional: Show reset button
  showResetButton: true  // default: true
});
```

## API Reference

### Methods

#### `convertFlatStructure(config)`
Converts existing `.control-group` elements into collapsible sections.

#### `createSection(options)`
Programmatically creates a new collapsible section.

```javascript
const section = sections.createSection({
  id: 'my-section',
  title: 'Section Title',
  content: '<div>Section content</div>',
  expanded: true
});
```

#### `toggleSection(sectionId)`
Toggles a section between expanded and collapsed states.

#### `expandSection(sectionId)`
Expands a specific section.

#### `collapseSection(sectionId)`
Collapses a specific section.

#### `expandAll()`
Expands all sections.

#### `collapseAll()`
Collapses all sections.

#### `getSectionCount()`
Returns the number of sections.

#### `getSection(sectionId)`
Returns section object by ID.

#### `clearState()`
Clears all saved section states from localStorage.

#### `destroy()`
Removes event listeners and cleans up.

### Events

Listen for section toggle events:

```javascript
document.getElementById('controls').addEventListener('sectionToggle', (e) => {
  console.log(`Section ${e.detail.sectionId} is now ${e.detail.expanded ? 'expanded' : 'collapsed'}`);
});
```

### Keyboard Navigation

- **Enter / Space**: Toggle section
- **Arrow Down / Right**: Expand section
- **Arrow Up / Left**: Collapse section
- **Home**: Focus first section
- **End**: Focus last section

## Integration Checklist

Use this checklist when integrating collapsible sections:

- [ ] Script tag added (correct relative path)
- [ ] Initialization code added (inside DOMContentLoaded)
- [ ] Unique storageKey set (algorithm-name-sections)
- [ ] Control groups use `.control-group` class
- [ ] Control groups have `<h3>` or `<h4>` headings
- [ ] Tested section expand/collapse functionality
- [ ] Tested state persistence (reload page)
- [ ] Tested keyboard navigation
- [ ] Tested with existing PresetManager (if applicable)
- [ ] Verified no console errors

## Example Files

### Basic Integration
See: `algorithms/geometric/spiral-fill.html`

This file demonstrates the standard integration pattern with:
- Script tag in `<head>`
- Initialization in DOMContentLoaded
- Multiple control groups converted to sections
- Global expand/collapse controls

### With PresetManager
For algorithms using PresetManager:

```javascript
document.addEventListener('DOMContentLoaded', function() {
  const sections = new CollapsibleSections({
    container: '#controls',
    storageKey: 'algorithm-name-sections',
    defaultState: 'expanded',
    expandAllOnPresetLoad: true  // Expands when preset loads
  });
  sections.convertFlatStructure();
  sections.addGlobalControls({ position: 'top' });

  // Integrate with PresetManager if it exists
  if (typeof presetManager !== 'undefined') {
    sections.integrateWithPresetManager(presetManager);
  }
});
```

## Best Practices

### 1. Meaningful Section Titles
Use descriptive titles with emoji for visual scanning:

```html
<h3>🔷 Shape Selection</h3>
<h3>🌀 Spiral Parameters</h3>
<h3>🎨 Display Options</h3>
<h3>⚡ Path Optimization</h3>
<h3>💾 Export</h3>
```

### 2. Logical Grouping
Group related controls together. Common patterns:
- Input/Generation parameters
- Visual display options
- Optimization settings
- Export controls

### 3. Default State
Consider which sections are most frequently used:
- Use `defaultState: 'expanded'` for primary controls
- Consider collapsing advanced/expert sections by default

### 4. Storage Key Naming
Use consistent naming: `{algorithm-name}-sections`

Examples:
- `spiral-fill-sections`
- `flow-field-sections`
- `chladni-patterns-sections`

### 5. Load Order
Ensure collapsible-sections.js loads before initialization:

```html
<head>
  <script src="../../collapsible-sections.js"></script>
</head>
<body>
  <!-- page content -->
  <script>
    // Your algorithm code
  </script>
  <script>
    // Collapsible sections initialization (runs after DOM ready)
  </script>
</body>
```

## Troubleshooting

### Sections not appearing
- Check if `.control-group` elements exist
- Verify `#controls` container exists
- Check browser console for errors
- Ensure script loads before initialization

### State not persisting
- Verify unique `storageKey` is set
- Check localStorage is enabled in browser
- Try `sections.clearState()` to reset

### Animations not working
- Check browser supports CSS transitions
- Verify `prefers-reduced-motion` setting
- Inspect element styles in DevTools

### Script path incorrect
Calculate the correct relative path:
- From `algorithms/geometric/`: use `../../collapsible-sections.js`
- From `algorithms/cellular-automata/`: use `../../collapsible-sections.js`
- From `algorithms/advanced/`: use `../../collapsible-sections.js`

All subdirectories of `algorithms/` are at the same depth (2 levels).

## Browser Support

- **Modern browsers**: Full support
- **CSS Animations**: Graceful degradation with `prefers-reduced-motion`
- **localStorage**: Graceful degradation if unavailable
- **Accessibility**: WCAG 2.1 Level AA compliant

## Performance

- **Initialization**: < 10ms for typical algorithm pages
- **Toggle animation**: 300ms (configurable)
- **Memory**: < 1KB per section
- **No impact** on existing algorithm performance

## Migration from Existing Systems

If you have custom collapsible implementations:

1. Backup your HTML file
2. Remove custom collapsible code
3. Ensure structure uses `.control-group` with `<h3>` headings
4. Run integration script
5. Test functionality
6. Adjust styling if needed

## Related Files

- **Module**: `/collapsible-sections.js`
- **Integration Script**: `/scripts/add-collapsible-sections.py`
- **Example**: `/algorithms/geometric/spiral-fill.html`
- **Styles**: Injected automatically by CollapsibleSections class

## Support

For issues or questions:
1. Check this documentation
2. Review example implementation (`spiral-fill.html`)
3. Inspect browser console for errors
4. Review CollapsibleSections class source code

---

**Last Updated**: 2026-01-19
**Version**: 1.0.0
**Status**: Stable

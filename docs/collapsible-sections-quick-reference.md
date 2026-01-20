# Collapsible Sections - Quick Reference Card

## 30-Second Setup

```javascript
// 1. Add scripts to HTML
<script src="../preset-manager.js"></script>
<script src="../collapsible-sections.js"></script>

// 2. Initialize (put this after DOM loads)
const sections = new CollapsibleSections({
    container: '#controls',
    storageKey: 'algorithm-name-sections'
});

sections.convertFlatStructure();
sections.addGlobalControls({ position: 'top' });
```

Done! 🎉

---

## Essential Methods

```javascript
// Create section manually
const section = sections.createSection({
    id: 'canvas-settings',
    title: 'Canvas Settings',
    content: '<div>...</div>',
    expanded: true
});

// Toggle section
sections.toggleSection('canvas-settings');

// Expand/collapse specific section
sections.expandSection('canvas-settings');
sections.collapseSection('canvas-settings');

// Expand/collapse all
sections.expandAll();
sections.collapseAll();

// Get section info
const section = sections.getSection('canvas-settings');
const count = sections.getSectionCount();

// Cleanup
sections.destroy();
```

---

## Configuration Options

```javascript
const sections = new CollapsibleSections({
    container: '#controls',           // Required: selector or element
    storageKey: 'my-algorithm',       // localStorage key
    defaultState: 'expanded',         // 'expanded' or 'collapsed'
    animationDuration: 300,           // milliseconds
    persistState: true,               // save to localStorage
    expandAllOnPresetLoad: true       // auto-expand on preset load
});
```

---

## HTML Structure (Automatic)

```html
<!-- Before -->
<div class="control-group">
    <h3>Canvas Settings</h3>
    <div class="control">...</div>
</div>

<!-- After (automatic) -->
<div class="collapsible-section">
    <div class="collapsible-section-header" role="button" aria-expanded="true">
        <h3 class="collapsible-section-title">Canvas Settings</h3>
        <div class="collapsible-section-icon"></div>
    </div>
    <div class="collapsible-section-content" role="region">
        <div class="control">...</div>
    </div>
</div>
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Tab** | Next section |
| **Enter/Space** | Toggle |
| **↓/→** | Expand |
| **↑/←** | Collapse |
| **Home** | First section |
| **End** | Last section |

---

## PresetManager Integration

```javascript
const presetManager = new PresetManager({
    algorithmId: 'algorithm-name',
    container: '#preset-container',
    onSave: () => params,
    onLoad: (preset) => {
        Object.assign(params, preset.data);
        updateUIFromParams();
    }
});

// Auto-expand all sections when preset loads
sections.integrateWithPresetManager(presetManager);
```

---

## Events

```javascript
document.getElementById('controls').addEventListener('sectionToggle', (e) => {
    console.log(e.detail.sectionId);   // Section ID
    console.log(e.detail.expanded);    // true/false
});
```

---

## Custom Styling

```css
/* Custom header */
.collapsible-section-header {
    background: linear-gradient(to bottom, #e3f2fd, #bbdefb) !important;
}

/* Custom title */
.collapsible-section-title {
    color: #1976d2 !important;
    font-size: 15px !important;
}

/* Disable animations */
.collapsible-section-content {
    transition: none !important;
}
```

---

## Common Patterns

### Start With Sections Collapsed

```javascript
const sections = new CollapsibleSections({
    container: '#controls',
    storageKey: 'algorithm-sections',
    defaultState: 'collapsed'
});

sections.convertFlatStructure();

// Expand only essential sections
sections.expandSection('canvas-settings');
sections.expandSection('generation');
```

### Conditional Expansion

```javascript
document.getElementById('enableAdvanced').addEventListener('change', (e) => {
    if (e.target.checked) {
        sections.expandSection('advanced-options');
    } else {
        sections.collapseSection('advanced-options');
    }
});
```

### Add Global Controls

```javascript
sections.addGlobalControls({
    position: 'top',          // 'top' or 'bottom'
    showResetButton: true     // show reset button
});
```

---

## Recommended Section Groups

```javascript
const standardSections = [
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

---

## Accessibility Quick Check

✅ **Keyboard**: Tab through sections, toggle with Enter/Space
✅ **Screen Reader**: Announces "Section Name, button, expanded/collapsed"
✅ **Focus**: Visible outline on focused sections
✅ **High Contrast**: Automatic support
✅ **Reduced Motion**: Honors system preference
✅ **Touch**: 44x44px minimum touch targets

---

## Troubleshooting

### Sections don't collapse
→ Check console for errors
→ Verify container exists
→ Ensure JavaScript loads after DOM

### State not persisting
→ Check localStorage is enabled
→ Verify unique storageKey
→ Test with `persistState: true`

### Preset manager conflict
→ Create dedicated container
→ Integrate after both are initialized

### CSS conflicts
→ Use `!important` on custom styles
→ Increase specificity with `#controls .collapsible-section`

---

## Files

- **Core Module**: `collapsible-sections.js`
- **Example**: `examples/collapsible-sections-example.html`
- **Migration Guide**: `docs/collapsible-sections-migration-guide.md`
- **Accessibility**: `docs/collapsible-sections-accessibility.md`

---

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

---

## Performance

- ⚡ < 1KB gzipped (core module)
- ⚡ No framework dependencies
- ⚡ Lazy rendering (sections render on demand)
- ⚡ Efficient event delegation

---

## Tips

💡 **Use meaningful section IDs** - They're saved to localStorage
💡 **Group related controls** - Don't create too many tiny sections
💡 **Start collapsed for advanced options** - Reduce visual clutter
💡 **Test with keyboard** - Ensure navigation is smooth
💡 **Test with screen readers** - Verify announcements are clear

---

*Print this card for quick reference during migration!*

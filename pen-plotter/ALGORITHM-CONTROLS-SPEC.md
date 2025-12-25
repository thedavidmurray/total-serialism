# Algorithm Controls Specification

## Control Panel Layout (Top to Bottom)

### Section 0: Navigation (VERY TOP)
| Control | Type | Notes |
|---------|------|-------|
| **Back to Index** | Link | `<a href="../../index.html">← Back to Index</a>` |

Style:
```html
<a href="../../index.html" class="back-link">← Back to Index</a>
```

CSS (add to algorithm.css):
```css
.back-link {
  display: inline-block;
  margin-bottom: 12px;
  color: var(--text-secondary, #888);
  text-decoration: none;
  font-size: 12px;
}
.back-link:hover {
  color: var(--accent-primary, #4a9eff);
}
```

### Section 1: Algorithm-Specific Parameters (TOP)
- Unique to each algorithm
- Most frequently adjusted controls
- Examples: iterations, scale, pattern type, mathematical parameters

### Section 2: Standard Drawing Controls (MIDDLE)

| Control | Type | Behavior |
|---------|------|----------|
| **Randomize All** | Button | Randomizes all drawing params; preserves paper size |
| **Include Colors** | Checkbox | When checked, Randomize also randomizes bg/stroke colors |
| **Paper Size** | Dropdown | Custom, A5/A4/A3 (P/L), Letter (P/L), Square |
| **Background Color** | Dropdown | White, Black, Cream, Dark Blue, Charcoal |
| **Stroke Color** | Dropdown | Black, White, Red, Blue, Green, Orange, Purple |
| **Stroke Weight** | Slider | Algorithm-specific range |

### Section 3: Layer Controls (MIDDLE - Future Development)

**Purpose:** Enable multi-pen plotting by splitting a single algorithm into separate layers that can be drawn with different pen colors.

**Partitioning Methods:**
- By percentage (e.g., 0-50% = L1, 51-100% = L2)
- By degree/radian (for rotational algorithms)
- By iteration count
- By path index (for multi-path algorithms)
- Algorithm-specific splits (e.g., axes vs curves)

**Export Options:**
- Single SVG with `<g id="layer-1">`, `<g id="layer-2">` groups
- Separate SVG files per layer

**Status:** Parking lot until core stability achieved.

### Section 4: Export Controls (MIDDLE-BOTTOM)

| Control | Type | Notes |
|---------|------|-------|
| **Export SVG** | Button | Uses selected paper size, colors, layers |
| **Export PNG** | Button | Uses selected paper size, colors |

### Section 5: Advanced/Infrequent Controls (BOTTOM)

| Control | Type | Status |
|---------|------|--------|
| **Seed Input** | Text field | For reproducibility - Future |
| **Save Preset** | Button | Save current config - Future |
| **Load Preset** | Dropdown | Load saved configs - Future |

### Keyboard Shortcuts (Future)
- `R` - Regenerate/Randomize
- `S` - Export SVG
- `P` - Export PNG

---

## Visual Separator

Use `<hr>` between sections:
```html
<hr style="border-color: var(--border-color, #333); margin: 12px 0;">
```

---

## Implementation Checklist

For each algorithm, verify:

- [ ] Algorithm-specific params at top
- [ ] Randomize All button (preserves paper size)
- [ ] Include Colors checkbox for randomize
- [ ] Paper Size dropdown with full options
- [ ] Background Color dropdown
- [ ] Stroke Color dropdown
- [ ] Stroke Weight slider
- [ ] Export SVG button (uses params)
- [ ] Export PNG button (uses params)
- [ ] canvas-layout.js imported
- [ ] export-utils.js imported
- [ ] Colors applied in draw function
- [ ] Colors applied in generateSVG function
- [ ] Paper size changes resize canvas

---

## File Structure

```
/shared/
  algorithm.css      # Common styles
  canvas-layout.js   # Paper size presets (CanvasLayout.getSize())
  export-utils.js    # SVG/PNG export (TSExport)
```

---

*Created: 2024-12-24*
*Status: Draft - Layer controls in parking lot*

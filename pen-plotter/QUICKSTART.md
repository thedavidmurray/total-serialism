# Pen Plotter Art Quick Start

## 🚀 Test Your Setup

### 1. Test Flow Field (canvas-sketch)
```bash
cd pen-plotter-art
canvas-sketch algorithms/flow-fields/basic-flow.js --open
# Press Cmd+S to export SVG
```

### 2. Test Fluid Particles (vsketch)
```bash
vsk run algorithms/fluid-dynamics/particles.py
# Adjust parameters in GUI
# Click "Like" to save
```

### 3. Test Tree Algorithms
```bash
# Recursive tree with GUI (fixed version)
canvas-sketch algorithms/trees-lsystems/recursive-tree-fixed.js --open

# L-System trees (open in browser)
open algorithms/trees-lsystems/tree-working.html
```

### 4. Test Cellular Automata
```bash
# Game of Life with patterns
open algorithms/cellular-automata/game-of-life-gui.html

# Elementary CA with famous rules
open algorithms/cellular-automata/elementary-ca.html
```

### 5. Test Physics System
```bash
# Interactive particle system with forces
open algorithms/physics/particle-system-gui.html
```

### 6. Test Reaction-Diffusion
```bash
# Gray-Scott model with presets
open algorithms/reaction-diffusion/reaction-diffusion-gui.html

# Multi-layer chemical systems
open algorithms/reaction-diffusion/reaction-diffusion-layers.html
```

### 7. Optimize & Preview
```bash
# Optimize any SVG
./tools/optimize.sh output/raw/your-sketch.svg

# This creates:
# - output/optimized/your-sketch-opt-timestamp.svg
# - output/optimized/your-sketch-preview-timestamp.png
# - output/drive-sync/your-sketch-ready.svg
```

### 8. Sync to Google Drive
```bash
./tools/sync-to-drive.sh
```

## 📁 Where Things Live

- **Generate here**: `algorithms/`
- **Raw output**: `output/raw/`
- **Optimized files**: `output/optimized/`
- **Ready for drive**: `output/drive-sync/`
- **Saved parameters**: `parameters/successful/`

## 🎨 Algorithm Categories

### Ready Now:
- **Flow Fields**: 
  - `algorithms/flow-fields/basic-flow.js` - Basic flow field
  - `algorithms/flow-fields/flow-field-gui.js` - With dat.GUI controls
  - `algorithms/flow-fields/flow-field-p5-gui.html` - Standalone web GUI
- **Fluid Dynamics**: `algorithms/fluid-dynamics/particles.py`
- **Trees & L-Systems**:
  - `algorithms/trees-lsystems/recursive-tree-fixed.js` - Recursive tree with dat.GUI
  - `algorithms/trees-lsystems/tree-working.html` - L-System trees with presets

- **Cellular Automata**:
  - `algorithms/cellular-automata/game-of-life-gui.html` - Conway's Game of Life
  - `algorithms/cellular-automata/game-of-life-layers.html` - Multi-layer/color Game of Life
  - `algorithms/cellular-automata/elementary-ca.html` - Elementary CA (Rules 30, 90, 110, etc.)
  - `algorithms/cellular-automata/elementary-ca-layers.html` - Multi-color Elementary CA

- **Physics Simulations**:
  - `algorithms/physics/particle-system-gui.html` - Physics-based particle system with forces

- **Reaction-Diffusion Systems**:
  - `algorithms/reaction-diffusion/reaction-diffusion-gui.html` - Gray-Scott and other models
  - `algorithms/reaction-diffusion/reaction-diffusion-layers.html` - Multi-layer chemical systems

### Coming Soon:
- Algorithm Hybridization (Flow + CA, etc.)
- VVL Interactions
- Organic Patterns

## ⚡ Workflow Commands

```bash
# Full pipeline example
canvas-sketch algorithms/flow-fields/basic-flow.js --output=output/raw --stream=svg
./tools/optimize.sh output/raw/basic-flow.svg a3
./tools/sync-to-drive.sh

# vsketch with save
vsk save algorithms/fluid-dynamics/particles.py -o output/raw/particles.svg
./tools/optimize.sh output/raw/particles.svg a3
```

## 🔧 Tips

1. **A3 Optimization**: Default size, use `./tools/optimize.sh file.svg a3`
2. **A0 Optimization**: For big plotter, use `./tools/optimize.sh file.svg a0`
3. **Test First**: Always test on small/cheap paper
4. **Save Parameters**: When you get a good result, save the parameters!

## 📊 Parameter Management

In canvas-sketch scripts:
```javascript
console.log('Seed:', params.seed);  // Always logged
// Press 'p' to print parameters to console
```

In vsketch:
- Use GUI sliders
- Click "Like" to save parameters
- Parameters auto-saved in vsketch config

## 🎯 Next Algorithm to Try

Create a tree/L-system algorithm:
```bash
# We'll create this together!
touch algorithms/trees-lsystems/recursive-tree.js
```

Happy plotting! 🎨✨
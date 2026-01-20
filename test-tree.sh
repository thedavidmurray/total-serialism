#!/bin/bash

echo "🌳 Testing recursive tree algorithm..."
echo ""
echo "Opening in browser with canvas-sketch..."
echo ""

cd /Users/djm/claude-projects/pen-plotter-art
canvas-sketch algorithms/trees-lsystems/recursive-tree.js --open

echo ""
echo "✅ If the browser opened:"
echo "   - Adjust parameters in the dat.GUI panel"
echo "   - Try 'Randomize' to generate variations"
echo "   - Press Cmd+S to export SVG"
echo ""
echo "💡 Tips:"
echo "   - Increase treeCount for forests"
echo "   - Add windStrength for organic feel"
echo "   - Toggle taper for realistic branches"
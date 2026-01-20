const canvasSketch = require('canvas-sketch');

const settings = {
  dimensions: 'A4',
  units: 'mm',
  pixelsPerInch: 300,
  orientation: 'portrait'
};

const sketch = () => {
  return ({ context, width, height }) => {
    // Clear canvas
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);
    
    // Set up for pen plotting
    context.strokeStyle = 'black';
    context.lineWidth = 0.5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    // Create a simple generative pattern
    const margin = 20;
    const count = 20;
    
    context.beginPath();
    
    // Draw flowing lines
    for (let i = 0; i < count; i++) {
      const y = margin + (height - 2 * margin) * (i / (count - 1));
      
      context.moveTo(margin, y);
      
      // Create a wavy line across the page
      for (let x = margin; x < width - margin; x += 5) {
        const wave = Math.sin((x / width) * Math.PI * 4 + i * 0.5) * 10;
        context.lineTo(x, y + wave);
      }
    }
    
    context.stroke();
  };
};

canvasSketch(sketch, settings);
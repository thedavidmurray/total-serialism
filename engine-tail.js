                    slider.value = this.params[key];
                    value.textContent = this.params[key].toFixed(2);
                }
            }
        });
        
        this.generate();
    }
    
    surprise() {
        // Randomize everything
        Object.keys(this.params).forEach(key => {
            this.params[key] = Math.random();
            
            // Update UI
            const slider = document.getElementById(key);
            const value = document.getElementById(`${key}-value`);
            if (slider) {
                slider.value = this.params[key];
                value.textContent = this.params[key].toFixed(2);
            }
        });
        
        // Random algorithm and palette
        document.getElementById('algorithm-select').value = 'auto';
        document.getElementById('palette-select').value = 'auto';
        
        this.generate();
    }
    
    saveImage() {
        this.p5.save(`total-serialism-v3-${this.seed}.png`);
    }
    
    saveSVG() {
        let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">
<rect width="${this.width}" height="${this.height}" fill="#141414"/>
<g>`;

        this.svgPaths.forEach(path => {
            if (path.type === 'line') {
                svg += `\n<line x1="${path.x1}" y1="${path.y1}" x2="${path.x2}" y2="${path.y2}" stroke="${path.stroke}" stroke-width="${path.strokeWidth}" opacity="${path.opacity || 1}" stroke-linecap="round"/>`;
            } else if (path.type === 'circle') {
                const fill = path.fill || 'none';
                const stroke = path.stroke || 'none';
                const strokeWidth = path.strokeWidth || 1;
                const opacity = path.opacity || 1;
                svg += `\n<circle cx="${path.cx}" cy="${path.cy}" r="${path.r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`;
            } else if (path.type === 'polygon') {
                const fill = path.fill || 'none';
                const stroke = path.stroke || 'none';
                const strokeWidth = path.strokeWidth || 1;
                const opacity = path.opacity || 1;
                svg += `\n<polygon points="${path.points}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`;
            } else if (path.type === 'rect') {
                const fill = path.fill || 'none';
                const opacity = path.opacity || 1;
                svg += `\n<rect x="${path.x}" y="${path.y}" width="${path.width}" height="${path.height}" fill="${fill}" opacity="${opacity}"/>`;
            }
        });
        
        svg += '\n</g>\n</svg>';
        
        // Download
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `total-serialism-v3-${this.seed}.svg`;
        link.click();
        URL.revokeObjectURL(url);
    }
}

// Export the class for browser environment
if (typeof window !== 'undefined') {
    window.TotalSerialismArtwork = TotalSerialismArtwork;
}

// Initialize artwork system
let artwork;

// Initialize when everything is ready
function initializeArtwork() {
    artwork = new TotalSerialismArtwork();
    window.artwork = artwork;
    
    // Initialize after a short delay to ensure everything is loaded
    setTimeout(() => {
        artwork.init();
    }, 100);
}

// Wait for both DOM and window load
if (document.readyState === 'complete') {
    initializeArtwork();
} else {
    window.addEventListener('load', initializeArtwork);
}
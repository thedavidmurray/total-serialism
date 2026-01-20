/**
 * Plotter Format Exporter
 * Converts SVG/Canvas paths to DXF and HPGL formats for professional plotting
 *
 * Supported formats:
 * - DXF (Drawing Exchange Format) - AutoCAD, CAD software
 * - HPGL (Hewlett-Packard Graphics Language) - Vintage pen plotters, modern plotters
 *
 * Usage:
 * const exporter = new PlotterFormats();
 * exporter.exportDXF(paths, 'my-drawing.dxf');
 * exporter.exportHPGL(paths, 'my-drawing.hpgl');
 */

class PlotterFormats {
  constructor() {
    this.units = {
      mm: 1,
      inch: 25.4,
      px: 0.264583 // 96 DPI standard
    };
  }

  /**
   * Export paths to DXF format
   * @param {Array} paths - Array of path objects {points: [{x, y}], color, weight}
   * @param {String} filename - Output filename
   * @param {Object} options - Export options
   */
  exportDXF(paths, filename = 'drawing.dxf', options = {}) {
    const defaults = {
      unit: 'mm',
      paperWidth: 297,  // A4 width in mm
      paperHeight: 210, // A4 height in mm
      layerByColor: true,
      layerByWeight: false
    };
    const opts = { ...defaults, ...options };

    let dxf = this.createDXFHeader(opts);

    // Create layers
    const layers = this.organizeLayers(paths, opts);
    dxf += this.createDXFLayers(layers);

    // Add entities
    dxf += this.createDXFEntities(paths, layers, opts);

    // Footer
    dxf += this.createDXFFooter();

    // Download
    this.downloadFile(dxf, filename, 'application/dxf');
  }

  /**
   * Export paths to HPGL format
   * @param {Array} paths - Array of path objects
   * @param {String} filename - Output filename
   * @param {Object} options - Export options
   */
  exportHPGL(paths, filename = 'drawing.hpgl', options = {}) {
    const defaults = {
      unit: 'mm',
      paperWidth: 297,
      paperHeight: 210,
      penSpeed: 38,  // cm/s (default moderate speed)
      penForce: 3,   // 1-8 scale
      scaling: 1.0
    };
    const opts = { ...defaults, ...options };

    let hpgl = '';

    // Initialization
    hpgl += 'IN;';        // Initialize
    hpgl += 'SP1;';       // Select pen 1
    hpgl += `VS${opts.penSpeed};`;  // Velocity
    hpgl += `FS${opts.penForce};`;  // Force

    // Set scaling (40 units = 1mm in HPGL)
    const scale = 40 * opts.scaling;

    // Draw paths
    paths.forEach((path, index) => {
      if (!path.points || path.points.length < 2) return;

      // Select pen based on color or layer
      const penNumber = this.colorToPenNumber(path.color) || 1;
      hpgl += `SP${penNumber};`;

      // Move to start point (pen up)
      const startX = Math.round(path.points[0].x * scale);
      const startY = Math.round(path.points[0].y * scale);
      hpgl += `PU${startX},${startY};`;

      // Draw path (pen down)
      hpgl += 'PD';
      for (let i = 1; i < path.points.length; i++) {
        const x = Math.round(path.points[i].x * scale);
        const y = Math.round(path.points[i].y * scale);
        hpgl += `${x},${y}`;
        if (i < path.points.length - 1) {
          hpgl += ',';
        }
      }
      hpgl += ';';

      // Pen up after path
      hpgl += 'PU;';
    });

    // Return to origin and terminate
    hpgl += 'PU0,0;';
    hpgl += 'SP0;';  // Pen up, select pen 0 (park)

    // Download
    this.downloadFile(hpgl, filename, 'application/hpgl');
  }

  /**
   * Create DXF header section
   */
  createDXFHeader(opts) {
    return `0
SECTION
2
HEADER
9
$INSUNITS
70
4
9
$MEASUREMENT
70
1
0
ENDSEC
`;
  }

  /**
   * Create DXF layers section
   */
  createDXFLayers(layers) {
    let dxf = `0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
${layers.length}
`;

    layers.forEach(layer => {
      dxf += `0
LAYER
2
${layer.name}
70
0
62
${this.colorToACI(layer.color)}
6
CONTINUOUS
`;
    });

    dxf += `0
ENDTAB
0
ENDSEC
`;
    return dxf;
  }

  /**
   * Create DXF entities section
   */
  createDXFEntities(paths, layers, opts) {
    let dxf = `0
SECTION
2
ENTITIES
`;

    paths.forEach((path, index) => {
      if (!path.points || path.points.length < 2) return;

      // Determine layer
      const layerName = this.getLayerName(path, layers, opts);

      // Write as POLYLINE or LINE entities
      if (path.points.length === 2) {
        // Simple line
        dxf += this.createDXFLine(path.points[0], path.points[1], layerName);
      } else {
        // Polyline
        dxf += this.createDXFPolyline(path.points, layerName);
      }
    });

    dxf += `0
ENDSEC
`;
    return dxf;
  }

  /**
   * Create DXF footer
   */
  createDXFFooter() {
    return `0
EOF
`;
  }

  /**
   * Create DXF LINE entity
   */
  createDXFLine(p1, p2, layer) {
    return `0
LINE
8
${layer}
10
${p1.x}
20
${p1.y}
11
${p2.x}
21
${p2.y}
`;
  }

  /**
   * Create DXF POLYLINE entity
   */
  createDXFPolyline(points, layer) {
    let dxf = `0
LWPOLYLINE
8
${layer}
90
${points.length}
70
0
`;

    points.forEach(p => {
      dxf += `10
${p.x}
20
${p.y}
`;
    });

    return dxf;
  }

  /**
   * Organize paths into layers
   */
  organizeLayers(paths, opts) {
    const layerMap = new Map();

    paths.forEach(path => {
      let layerKey;

      if (opts.layerByColor && path.color) {
        layerKey = path.color;
      } else if (opts.layerByWeight && path.weight) {
        layerKey = `weight_${path.weight}`;
      } else {
        layerKey = 'default';
      }

      if (!layerMap.has(layerKey)) {
        layerMap.set(layerKey, {
          name: layerKey,
          color: path.color || '#000000',
          weight: path.weight || 1
        });
      }
    });

    return Array.from(layerMap.values());
  }

  /**
   * Get layer name for a path
   */
  getLayerName(path, layers, opts) {
    if (opts.layerByColor && path.color) {
      return path.color;
    } else if (opts.layerByWeight && path.weight) {
      return `weight_${path.weight}`;
    }
    return 'default';
  }

  /**
   * Convert hex color to AutoCAD Color Index (ACI)
   */
  colorToACI(color) {
    if (!color) return 7; // White default

    const colorMap = {
      '#ff0000': 1,  // Red
      '#ffff00': 2,  // Yellow
      '#00ff00': 3,  // Green
      '#00ffff': 4,  // Cyan
      '#0000ff': 5,  // Blue
      '#ff00ff': 6,  // Magenta
      '#ffffff': 7,  // White
      '#000000': 7   // Black (use white for visibility)
    };

    return colorMap[color.toLowerCase()] || 7;
  }

  /**
   * Convert color to HPGL pen number (1-8)
   */
  colorToPenNumber(color) {
    if (!color) return 1;

    const penMap = {
      '#000000': 1,  // Black
      '#ff0000': 2,  // Red
      '#0000ff': 3,  // Blue
      '#00ff00': 4,  // Green
      '#ffff00': 5,  // Yellow
      '#ff00ff': 6,  // Magenta
      '#00ffff': 7,  // Cyan
      '#ffffff': 8   // White
    };

    return penMap[color.toLowerCase()] || 1;
  }

  /**
   * Extract paths from SVG element
   * @param {SVGElement} svgElement - SVG DOM element or p5.Graphics
   */
  extractPathsFromSVG(svgElement) {
    const paths = [];

    // Handle p5.Graphics SVG canvas
    const svg = svgElement.elt || svgElement;

    // Query all drawable elements
    const elements = svg.querySelectorAll('line, polyline, polygon, path, circle, ellipse, rect');

    elements.forEach(element => {
      const tagName = element.tagName.toLowerCase();
      const points = [];
      const color = element.getAttribute('stroke') || element.style.stroke || '#000000';
      const weight = parseFloat(element.getAttribute('stroke-width') || element.style.strokeWidth || '1');

      switch (tagName) {
        case 'line':
          points.push(
            { x: parseFloat(element.getAttribute('x1')), y: parseFloat(element.getAttribute('y1')) },
            { x: parseFloat(element.getAttribute('x2')), y: parseFloat(element.getAttribute('y2')) }
          );
          break;

        case 'polyline':
        case 'polygon':
          const pointsStr = element.getAttribute('points');
          if (pointsStr) {
            const coords = pointsStr.trim().split(/[\s,]+/);
            for (let i = 0; i < coords.length; i += 2) {
              points.push({
                x: parseFloat(coords[i]),
                y: parseFloat(coords[i + 1])
              });
            }
          }
          break;

        case 'path':
          // Parse SVG path data
          const pathPoints = this.parsePathData(element.getAttribute('d'));
          points.push(...pathPoints);
          break;

        case 'circle':
          // Convert circle to polygon approximation
          const cx = parseFloat(element.getAttribute('cx'));
          const cy = parseFloat(element.getAttribute('cy'));
          const r = parseFloat(element.getAttribute('r'));
          const segments = 64;
          for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push({
              x: cx + Math.cos(angle) * r,
              y: cy + Math.sin(angle) * r
            });
          }
          break;

        case 'ellipse':
          // Convert ellipse to polygon approximation
          const ecx = parseFloat(element.getAttribute('cx'));
          const ecy = parseFloat(element.getAttribute('cy'));
          const rx = parseFloat(element.getAttribute('rx'));
          const ry = parseFloat(element.getAttribute('ry'));
          const eSegments = 64;
          for (let i = 0; i <= eSegments; i++) {
            const angle = (i / eSegments) * Math.PI * 2;
            points.push({
              x: ecx + Math.cos(angle) * rx,
              y: ecy + Math.sin(angle) * ry
            });
          }
          break;

        case 'rect':
          // Convert rect to polygon
          const x = parseFloat(element.getAttribute('x') || 0);
          const y = parseFloat(element.getAttribute('y') || 0);
          const w = parseFloat(element.getAttribute('width'));
          const h = parseFloat(element.getAttribute('height'));
          points.push(
            { x, y },
            { x: x + w, y },
            { x: x + w, y: y + h },
            { x, y: y + h },
            { x, y } // Close
          );
          break;
      }

      if (points.length > 0) {
        paths.push({ points, color, weight });
      }
    });

    return paths;
  }

  /**
   * Parse SVG path data to points
   * Simplified parser for M, L, C, Q commands
   */
  parsePathData(d) {
    const points = [];
    if (!d) return points;

    const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
    let currentX = 0, currentY = 0;

    commands.forEach(cmd => {
      const type = cmd[0];
      const coords = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat);

      switch (type.toUpperCase()) {
        case 'M': // MoveTo
          currentX = coords[0];
          currentY = coords[1];
          points.push({ x: currentX, y: currentY });
          break;

        case 'L': // LineTo
          for (let i = 0; i < coords.length; i += 2) {
            currentX = coords[i];
            currentY = coords[i + 1];
            points.push({ x: currentX, y: currentY });
          }
          break;

        case 'H': // Horizontal line
          currentX = coords[0];
          points.push({ x: currentX, y: currentY });
          break;

        case 'V': // Vertical line
          currentY = coords[0];
          points.push({ x: currentX, y: currentY });
          break;

        case 'C': // Cubic Bezier
          // Approximate with line to end point (simple approach)
          currentX = coords[4];
          currentY = coords[5];
          points.push({ x: currentX, y: currentY });
          break;

        case 'Q': // Quadratic Bezier
          // Approximate with line to end point
          currentX = coords[2];
          currentY = coords[3];
          points.push({ x: currentX, y: currentY });
          break;

        case 'Z': // Close path
          if (points.length > 0) {
            points.push({ ...points[0] });
          }
          break;
      }
    });

    return points;
  }

  /**
   * Download file to user's computer
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Convenience method: Export p5.Graphics SVG canvas to DXF
   */
  exportSVGCanvasToDXF(canvas, filename, options) {
    const paths = this.extractPathsFromSVG(canvas);
    this.exportDXF(paths, filename, options);
  }

  /**
   * Convenience method: Export p5.Graphics SVG canvas to HPGL
   */
  exportSVGCanvasToHPGL(canvas, filename, options) {
    const paths = this.extractPathsFromSVG(canvas);
    this.exportHPGL(paths, filename, options);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlotterFormats;
}

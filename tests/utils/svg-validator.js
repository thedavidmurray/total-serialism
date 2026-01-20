/**
 * SVG validation utilities for pen plotter art tests
 */

class SVGValidator {
  /**
   * Check if a string is valid SVG
   */
  static isValidSVG(svgString) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      
      // Check for parsing errors
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        return {
          valid: false,
          error: parserError.textContent
        };
      }
      
      // Check if root element is svg
      const rootElement = doc.documentElement;
      if (rootElement.nodeName !== 'svg') {
        return {
          valid: false,
          error: 'Root element is not <svg>'
        };
      }
      
      return {
        valid: true,
        document: doc
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Extract paths from SVG
   */
  static extractPaths(svgString) {
    const validation = this.isValidSVG(svgString);
    if (!validation.valid) {
      throw new Error(`Invalid SVG: ${validation.error}`);
    }
    
    const paths = validation.document.querySelectorAll('path');
    return Array.from(paths).map(path => ({
      d: path.getAttribute('d'),
      stroke: path.getAttribute('stroke'),
      strokeWidth: path.getAttribute('stroke-width'),
      fill: path.getAttribute('fill')
    }));
  }

  /**
   * Count total path commands in SVG
   */
  static countPathCommands(svgString) {
    const paths = this.extractPaths(svgString);
    let totalCommands = 0;
    
    paths.forEach(path => {
      if (path.d) {
        // Count M, L, C, Q, A, Z commands
        const commands = path.d.match(/[MLHVCSQTAZ]/gi);
        totalCommands += commands ? commands.length : 0;
      }
    });
    
    return totalCommands;
  }

  /**
   * Get SVG dimensions
   */
  static getDimensions(svgString) {
    const validation = this.isValidSVG(svgString);
    if (!validation.valid) {
      throw new Error(`Invalid SVG: ${validation.error}`);
    }
    
    const svg = validation.document.documentElement;
    return {
      width: parseFloat(svg.getAttribute('width')),
      height: parseFloat(svg.getAttribute('height')),
      viewBox: svg.getAttribute('viewBox')
    };
  }

  /**
   * Check if SVG is suitable for pen plotting
   */
  static validateForPenPlotter(svgString) {
    const issues = [];
    
    try {
      const validation = this.isValidSVG(svgString);
      if (!validation.valid) {
        issues.push(`Invalid SVG: ${validation.error}`);
        return { valid: false, issues };
      }
      
      const paths = this.extractPaths(svgString);
      
      // Check for filled paths (pen plotters only draw strokes)
      paths.forEach((path, index) => {
        if (path.fill && path.fill !== 'none') {
          issues.push(`Path ${index} has fill="${path.fill}" - pen plotters only draw strokes`);
        }
        
        if (!path.stroke || path.stroke === 'none') {
          issues.push(`Path ${index} has no stroke - will not be visible on pen plotter`);
        }
      });
      
      // Check dimensions
      const dimensions = this.getDimensions(svgString);
      if (!dimensions.width || !dimensions.height) {
        issues.push('SVG missing width or height attributes');
      }
      
      // Check for very small or very large dimensions
      if (dimensions.width < 10 || dimensions.height < 10) {
        issues.push('SVG dimensions too small (< 10 units)');
      }
      
      if (dimensions.width > 10000 || dimensions.height > 10000) {
        issues.push('SVG dimensions too large (> 10000 units)');
      }
      
    } catch (error) {
      issues.push(`Validation error: ${error.message}`);
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Compare two SVGs for similarity
   */
  static compareSVGs(svg1, svg2, tolerance = 0.001) {
    try {
      const paths1 = this.extractPaths(svg1);
      const paths2 = this.extractPaths(svg2);
      
      if (paths1.length !== paths2.length) {
        return {
          similar: false,
          reason: `Different number of paths: ${paths1.length} vs ${paths2.length}`
        };
      }
      
      // Compare path data with tolerance for floating point differences
      for (let i = 0; i < paths1.length; i++) {
        const d1 = paths1[i].d;
        const d2 = paths2[i].d;
        
        if (!this.comparePathData(d1, d2, tolerance)) {
          return {
            similar: false,
            reason: `Path ${i} data differs`
          };
        }
      }
      
      return { similar: true };
      
    } catch (error) {
      return {
        similar: false,
        reason: `Comparison error: ${error.message}`
      };
    }
  }

  /**
   * Compare path data with numeric tolerance
   */
  static comparePathData(d1, d2, tolerance) {
    if (!d1 || !d2) return d1 === d2;
    
    // Extract numbers from path data
    const numbers1 = d1.match(/-?\d+\.?\d*/g).map(parseFloat);
    const numbers2 = d2.match(/-?\d+\.?\d*/g).map(parseFloat);
    
    if (numbers1.length !== numbers2.length) return false;
    
    // Compare numbers with tolerance
    for (let i = 0; i < numbers1.length; i++) {
      if (Math.abs(numbers1[i] - numbers2[i]) > tolerance) {
        return false;
      }
    }
    
    // Compare commands (letters)
    const commands1 = d1.match(/[MLHVCSQTAZ]/gi).join('');
    const commands2 = d2.match(/[MLHVCSQTAZ]/gi).join('');
    
    return commands1 === commands2;
  }
}
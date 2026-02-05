/**
 * WORKFLOW UTILITIES
 * Batch processing, vpypeline integration, and A/B comparison tools
 */

class WorkflowUtils {
  constructor() {
    this.batchJobs = [];
    this.comparisonResults = [];
  }

  /**
   * Export to vpypeline.ayrep.fr for browser-based optimization
   * Opens vpypeline with the SVG embedded in the URL
   */
  exportToVpypeline(svg, options = {}) {
    // Clean and encode SVG
    const cleanedSVG = this.cleanSVGForExport(svg);
    const encodedSVG = encodeURIComponent(cleanedSVG);

    // Build vpypeline URL with parameters
    const baseURL = 'https://vpypeline.ayrep.fr/';
    const params = new URLSearchParams();

    // Add SVG data
    params.append('svg', encodedSVG);

    // Add vpype commands if specified
    if (options.commands) {
      params.append('cmd', options.commands);
    }

    const fullURL = `${baseURL}?${params.toString()}`;

    // Open in new window
    console.log('Opening vpypeline for optimization...');
    window.open(fullURL, '_blank');

    return {
      url: fullURL,
      success: true,
      message: 'Opened in vpypeline.ayrep.fr'
    };
  }

  /**
   * Create vpypeline button in UI
   */
  createVpypelineButton(container, getSVGFunction) {
    const button = document.createElement('button');
    button.textContent = '🔧 Optimize in vpypeline';
    button.className = 'vpypeline-btn';
    button.style.cssText = `
      padding: 10px 20px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin: 10px;
    `;

    button.onclick = () => {
      const svg = getSVGFunction();
      this.exportToVpypeline(svg);
    };

    container.appendChild(button);
    return button;
  }

  /**
   * Clean SVG for export
   */
  cleanSVGForExport(svg) {
    // Remove unnecessary attributes and optimize
    let cleaned = svg;

    // Remove fill attributes (plotter doesn't use them)
    cleaned = cleaned.replace(/fill="[^"]*"/g, 'fill="none"');

    // Ensure stroke is set
    cleaned = cleaned.replace(/<path(?![^>]*stroke)/g, '<path stroke="black"');

    return cleaned;
  }

  /**
   * Batch generate variations of an algorithm
   * @param {function} algorithmFunction - The algorithm to run
   * @param {object} paramRanges - Ranges for each parameter
   * @param {number} count - Number of variations to generate
   * @param {object} options - Additional options
   */
  async batchGenerate(algorithmFunction, paramRanges, count = 100, options = {}) {
    console.log(`Starting batch generation of ${count} variations...`);

    const results = [];
    const startTime = Date.now();

    for (let i = 0; i < count; i++) {
      // Generate random parameters within ranges
      const params = this.generateRandomParams(paramRanges);

      // Run algorithm
      const result = await this.runAlgorithmSafe(algorithmFunction, params, i);

      if (result.success) {
        // Optimize if requested
        if (options.autoOptimize && result.paths) {
          const optimized = pathOptimizer.optimizeAllPaths(result.paths, options.optimizeOptions);
          result.optimizedPaths = optimized;

          // Add time estimate
          result.timeEstimate = pathOptimizer.estimatePlotTime(optimized);
        }

        results.push({
          index: i,
          params: params,
          ...result
        });
      }

      // Progress callback
      if (options.onProgress) {
        options.onProgress(i + 1, count, results);
      }
    }

    const duration = Date.now() - startTime;

    const batch = {
      id: `batch-${Date.now()}`,
      count: results.length,
      duration: duration,
      results: results,
      paramRanges: paramRanges
    };

    this.batchJobs.push(batch);

    console.log(`Batch complete: ${results.length}/${count} successful in ${(duration/1000).toFixed(1)}s`);

    return batch;
  }

  /**
   * Generate random parameters within ranges
   */
  generateRandomParams(paramRanges) {
    const params = {};

    Object.keys(paramRanges).forEach(key => {
      const range = paramRanges[key];

      if (Array.isArray(range)) {
        // Choose from discrete options
        params[key] = range[Math.floor(Math.random() * range.length)];
      } else if (typeof range === 'object' && range.min !== undefined) {
        // Continuous range
        if (range.type === 'int') {
          params[key] = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        } else {
          params[key] = Math.random() * (range.max - range.min) + range.min;
        }
      }
    });

    return params;
  }

  /**
   * Run algorithm with error handling
   */
  async runAlgorithmSafe(algorithmFunction, params, index) {
    try {
      const result = await algorithmFunction(params);
      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error(`Batch item ${index} failed:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sort batch results by criteria
   */
  sortBatchResults(batchId, criteria = 'plotTime') {
    const batch = this.batchJobs.find(b => b.id === batchId);
    if (!batch) return null;

    const sorted = [...batch.results];

    switch (criteria) {
      case 'plotTime':
        sorted.sort((a, b) =>
          (a.timeEstimate?.totalMinutes || Infinity) - (b.timeEstimate?.totalMinutes || Infinity)
        );
        break;
      case 'complexity':
        sorted.sort((a, b) =>
          (b.paths?.length || 0) - (a.paths?.length || 0)
        );
        break;
      case 'pathCount':
        sorted.sort((a, b) =>
          (a.optimizedPaths?.length || Infinity) - (b.optimizedPaths?.length || Infinity)
        );
        break;
    }

    return sorted;
  }

  /**
   * A/B Comparison View
   * Compare optimization results side-by-side
   */
  createComparisonView(original, optimized, container, options = {}) {
    const comparisonId = `compare-${Date.now()}`;

    // Create comparison container
    const compDiv = document.createElement('div');
    compDiv.id = comparisonId;
    compDiv.className = 'optimization-comparison';
    compDiv.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
    `;

    // Original side
    const originalDiv = this.createSidePanel('Original', original, 'original');

    // Optimized side
    const optimizedDiv = this.createSidePanel('Optimized', optimized, 'optimized');

    // Stats comparison
    const statsDiv = this.createStatsComparison(original, optimized);

    compDiv.appendChild(originalDiv);
    compDiv.appendChild(optimizedDiv);
    compDiv.appendChild(statsDiv);

    container.appendChild(compDiv);

    const comparison = {
      id: comparisonId,
      original: original,
      optimized: optimized,
      created: new Date()
    };

    this.comparisonResults.push(comparison);

    return comparison;
  }

  /**
   * Create side panel for comparison
   */
  createSidePanel(title, paths, type) {
    const panel = document.createElement('div');
    panel.className = `comparison-panel ${type}`;
    panel.style.cssText = `
      background: white;
      padding: 15px;
      border-radius: 4px;
    `;

    const header = document.createElement('h3');
    header.textContent = title;
    header.style.marginTop = '0';

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    canvas.style.cssText = 'border: 1px solid #ddd; width: 100%;';

    // Draw paths on canvas
    this.drawPathsOnCanvas(canvas, paths);

    const stats = document.createElement('div');
    stats.className = 'path-stats';
    stats.innerHTML = `
      <p><strong>Paths:</strong> ${paths.length}</p>
      <p><strong>Total length:</strong> ${pathOptimizer.calculateTotalLength(paths).toFixed(1)}mm</p>
      <p><strong>Pen travel:</strong> ${pathOptimizer.calculatePenUpDistance(paths).toFixed(1)}mm</p>
    `;

    panel.appendChild(header);
    panel.appendChild(canvas);
    panel.appendChild(stats);

    return panel;
  }

  /**
   * Create stats comparison
   */
  createStatsComparison(original, optimized) {
    const stats = document.createElement('div');
    stats.style.cssText = `
      grid-column: 1 / -1;
      background: white;
      padding: 20px;
      border-radius: 4px;
      margin-top: 10px;
    `;

    const report = pathOptimizer.generateReport(original, optimized);

    stats.innerHTML = `
      <h3>Optimization Results</h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
        <div class="stat-card">
          <div class="stat-label">Path Reduction</div>
          <div class="stat-value">${report.pathReduction}%</div>
          <div class="stat-detail">${report.savings.pathsSaved} paths saved</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Length Reduction</div>
          <div class="stat-value">${report.lengthReduction}%</div>
          <div class="stat-detail">${report.savings.mmSaved}mm saved</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pen Travel Reduction</div>
          <div class="stat-value">${report.penUpReduction}%</div>
          <div class="stat-detail">${report.savings.penUpSaved}mm saved</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Estimated Plot Time</div>
          <div class="stat-value">${report.estimatedTime.totalMinutes} min</div>
          <div class="stat-detail">${report.estimatedTime.penLifts} pen lifts</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Drawing vs Travel</div>
          <div class="stat-value">${report.estimatedTime.drawingMinutes}m / ${report.estimatedTime.travelMinutes}m</div>
          <div class="stat-detail">Drawing / Travel time</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Distance</div>
          <div class="stat-value">${report.totalPlottingDistance}mm</div>
          <div class="stat-detail">Drawing + Travel</div>
        </div>
      </div>
    `;

    // Add CSS for stat cards
    const style = document.createElement('style');
    style.textContent = `
      .stat-card {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 4px;
        text-align: center;
      }
      .stat-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 8px;
      }
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #2196F3;
        margin-bottom: 5px;
      }
      .stat-detail {
        font-size: 11px;
        color: #999;
      }
    `;
    document.head.appendChild(style);

    return stats;
  }

  /**
   * Draw paths on canvas for preview
   */
  drawPathsOnCanvas(canvas, paths) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!paths || paths.length === 0) return;

    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    paths.forEach(path => {
      path.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    // Calculate scale to fit canvas
    const padding = 20;
    const scaleX = (canvas.width - padding * 2) / (maxX - minX);
    const scaleY = (canvas.height - padding * 2) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);

    // Draw paths
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    paths.forEach(path => {
      if (path.length < 2) return;

      ctx.beginPath();
      path.forEach((point, i) => {
        const x = (point.x - minX) * scale + padding;
        const y = (point.y - minY) * scale + padding;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    });

    // Draw pen-up travel in light gray
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);

    for (let i = 0; i < paths.length - 1; i++) {
      const end = paths[i][paths[i].length - 1];
      const start = paths[i + 1][0];

      const x1 = (end.x - minX) * scale + padding;
      const y1 = (end.y - minY) * scale + padding;
      const x2 = (start.x - minX) * scale + padding;
      const y2 = (start.y - minY) * scale + padding;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  /**
   * Export batch results
   */
  exportBatchResults(batchId, format = 'json') {
    const batch = this.batchJobs.find(b => b.id === batchId);
    if (!batch) return null;

    switch (format) {
      case 'json':
        return JSON.stringify(batch, null, 2);
      case 'csv':
        return this.batchToCSV(batch);
      default:
        return batch;
    }
  }

  /**
   * Convert batch to CSV
   */
  batchToCSV(batch) {
    const headers = ['index', 'params', 'paths', 'optimizedPaths', 'plotTime', 'success'];
    const rows = batch.results.map(r => [
      r.index,
      JSON.stringify(r.params),
      r.paths?.length || 0,
      r.optimizedPaths?.length || 0,
      r.timeEstimate?.totalMinutes || 0,
      r.success
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    return csv;
  }
}

// Global instance
const workflowUtils = new WorkflowUtils();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorkflowUtils;
}

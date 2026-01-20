/**
 * Optimizer Utils - Total Serialism
 * Utility functions for path optimization visualization and analysis
 */

class OptimizerUtils {
  /**
   * Generate test paths for debugging
   * @param {string} pattern - Pattern type: 'random', 'grid', 'circular', 'clustered'
   * @param {number} count - Number of paths to generate
   * @param {Object} options - Generation options
   */
  static generateTestPaths(pattern, count, options = {}) {
    const { width = 600, height = 600, colors = ['black'] } = options;

    switch (pattern) {
      case 'random':
        return this.generateRandomPaths(count, width, height, colors);
      case 'grid':
        return this.generateGridPaths(count, width, height, colors);
      case 'circular':
        return this.generateCircularPaths(count, width, height, colors);
      case 'clustered':
        return this.generateClusteredPaths(count, width, height, colors);
      default:
        return this.generateRandomPaths(count, width, height, colors);
    }
  }

  static generateRandomPaths(count, width, height, colors) {
    const paths = [];
    const margin = 50;

    for (let i = 0; i < count; i++) {
      const points = [];
      const numPoints = Math.floor(Math.random() * 10) + 3;
      const startX = margin + Math.random() * (width - 2 * margin);
      const startY = margin + Math.random() * (height - 2 * margin);

      for (let j = 0; j < numPoints; j++) {
        points.push({
          x: startX + (Math.random() - 0.5) * 100,
          y: startY + (Math.random() - 0.5) * 100
        });
      }

      paths.push({
        points,
        color: colors[Math.floor(Math.random() * colors.length)],
        closed: Math.random() > 0.7
      });
    }

    return paths;
  }

  static generateGridPaths(count, width, height, colors) {
    const paths = [];
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const cellWidth = (width - 100) / cols;
    const cellHeight = (height - 100) / rows;
    const margin = 50;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const centerX = margin + col * cellWidth + cellWidth / 2;
      const centerY = margin + row * cellHeight + cellHeight / 2;
      const size = Math.min(cellWidth, cellHeight) * 0.4;

      // Create a small shape at this grid position
      const points = [];
      const numSides = Math.floor(Math.random() * 4) + 3;

      for (let j = 0; j <= numSides; j++) {
        const angle = (j / numSides) * Math.PI * 2;
        points.push({
          x: centerX + Math.cos(angle) * size,
          y: centerY + Math.sin(angle) * size
        });
      }

      paths.push({
        points,
        color: colors[Math.floor(Math.random() * colors.length)],
        closed: true
      });
    }

    return paths;
  }

  static generateCircularPaths(count, width, height, colors) {
    const paths = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 50;

    for (let i = 0; i < count; i++) {
      const radius = 30 + (i / count) * (maxRadius - 30);
      const points = [];
      const numPoints = Math.floor(Math.random() * 20) + 10;

      for (let j = 0; j <= numPoints; j++) {
        const angle = (j / numPoints) * Math.PI * 2;
        const r = radius + (Math.random() - 0.5) * 20;
        points.push({
          x: centerX + Math.cos(angle) * r,
          y: centerY + Math.sin(angle) * r
        });
      }

      paths.push({
        points,
        color: colors[Math.floor(Math.random() * colors.length)],
        closed: true
      });
    }

    return paths;
  }

  static generateClusteredPaths(count, width, height, colors) {
    const paths = [];
    const numClusters = Math.max(3, Math.floor(count / 10));
    const clusterCenters = [];

    // Generate cluster centers
    for (let i = 0; i < numClusters; i++) {
      clusterCenters.push({
        x: 100 + Math.random() * (width - 200),
        y: 100 + Math.random() * (height - 200)
      });
    }

    // Generate paths around clusters
    for (let i = 0; i < count; i++) {
      const cluster = clusterCenters[Math.floor(Math.random() * numClusters)];
      const points = [];
      const numPoints = Math.floor(Math.random() * 8) + 3;

      const startX = cluster.x + (Math.random() - 0.5) * 150;
      const startY = cluster.y + (Math.random() - 0.5) * 150;

      for (let j = 0; j < numPoints; j++) {
        points.push({
          x: startX + (Math.random() - 0.5) * 60,
          y: startY + (Math.random() - 0.5) * 60
        });
      }

      paths.push({
        points,
        color: colors[Math.floor(Math.random() * colors.length)],
        closed: Math.random() > 0.5
      });
    }

    return paths;
  }

  /**
   * Analyze paths and return statistics
   * @param {Array} paths - Array of path objects
   */
  static analyzePaths(paths) {
    let pathCount = paths.length;
    let totalPoints = 0;
    let totalLength = 0;
    let travelDistance = 0;
    let penLifts = 0;
    let currentPos = { x: 0, y: 0 };
    const colors = new Set();

    paths.forEach(path => {
      if (!path.points || path.points.length === 0) return;

      // Track colors
      if (path.color) colors.add(path.color);

      // Calculate travel distance
      const dist = this.distance(currentPos, path.points[0]);
      if (dist > 1) {
        travelDistance += dist;
        penLifts++;
      }

      // Calculate drawing length
      for (let i = 1; i < path.points.length; i++) {
        totalLength += this.distance(path.points[i - 1], path.points[i]);
      }

      totalPoints += path.points.length;
      currentPos = path.points[path.points.length - 1];
    });

    const efficiency = (totalLength + travelDistance) > 0
      ? totalLength / (totalLength + travelDistance)
      : 0;

    return {
      pathCount,
      totalPoints,
      totalLength,
      travelDistance,
      penLifts,
      colors,
      efficiency
    };
  }

  /**
   * Create visualization data for rendering
   * @param {Array} paths - Array of path objects
   * @param {Object} options - Visualization options
   */
  static createVisualization(paths, options = {}) {
    const {
      width = 600,
      height = 600,
      showTravel = true,
      showStartEnd = true
    } = options;

    const vizPaths = [];
    const travels = [];
    const markers = [];
    let currentPos = { x: 0, y: 0 };

    paths.forEach((path, index) => {
      if (!path.points || path.points.length === 0) return;

      const startPoint = path.points[0];
      const endPoint = path.points[path.points.length - 1];

      // Add travel line
      if (showTravel) {
        travels.push({
          start: { ...currentPos },
          end: { ...startPoint }
        });
      }

      // Add path
      vizPaths.push({
        points: path.points,
        color: path.color || 'black',
        closed: path.closed
      });

      // Add markers
      if (showStartEnd) {
        markers.push({
          type: 'start',
          position: startPoint,
          pathIndex: index
        });
        markers.push({
          type: 'end',
          position: endPoint,
          pathIndex: index
        });
      }

      currentPos = endPoint;
    });

    return {
      paths: vizPaths,
      travels,
      markers
    };
  }

  static distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OptimizerUtils;
}

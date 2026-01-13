/**
 * Debug Preview - Total Serialism
 * Visualizes pen plotter paths with travel lines, markers, and statistics
 */

class DebugPreview {
  constructor(options = {}) {
    this.options = {
      showTravelPaths: true,
      showStartEnd: true,
      showDirection: true,
      showPenLifts: true,
      showStats: true,
      drawColor: 'rgba(0, 0, 0, 1)',
      travelColor: 'rgba(255, 0, 0, 0.3)',
      startColor: '#00ff00',
      endColor: '#ff0000',
      lineWidth: 2,
      ...options
    };
  }

  /**
   * Create a static preview of paths
   * @param {Array} paths - Array of path objects
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {Object} Preview data with imageData and stats
   */
  createPreview(paths, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Calculate statistics
    const stats = this.calculateStats(paths);

    // Draw travel paths first (underneath)
    if (this.options.showTravelPaths) {
      this.drawTravelPaths(ctx, paths);
    }

    // Draw actual paths
    this.drawPaths(ctx, paths);

    // Draw markers
    if (this.options.showStartEnd) {
      this.drawMarkers(ctx, paths);
    }

    // Draw direction arrows
    if (this.options.showDirection) {
      this.drawDirectionArrows(ctx, paths);
    }

    // Draw pen lift indicators
    if (this.options.showPenLifts) {
      this.drawPenLifts(ctx, paths);
    }

    // Draw statistics overlay
    if (this.options.showStats) {
      this.drawStatsOverlay(ctx, stats, width, height);
    }

    return {
      imageData: canvas.toDataURL('image/png'),
      stats: stats,
      canvas: canvas
    };
  }

  drawPaths(ctx, paths) {
    ctx.strokeStyle = this.options.drawColor;
    ctx.lineWidth = this.options.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    paths.forEach(path => {
      if (!path.points || path.points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);

      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }

      if (path.closed) {
        ctx.closePath();
      }

      ctx.stroke();
    });
  }

  drawTravelPaths(ctx, paths) {
    ctx.strokeStyle = this.options.travelColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    let currentPos = { x: 0, y: 0 };

    paths.forEach(path => {
      if (!path.points || path.points.length === 0) return;

      const startPoint = path.points[0];

      // Draw travel line from current position to start of path
      ctx.beginPath();
      ctx.moveTo(currentPos.x, currentPos.y);
      ctx.lineTo(startPoint.x, startPoint.y);
      ctx.stroke();

      // Update current position to end of path
      currentPos = path.points[path.points.length - 1];
    });

    ctx.setLineDash([]);
  }

  drawMarkers(ctx, paths) {
    paths.forEach(path => {
      if (!path.points || path.points.length < 2) return;

      const start = path.points[0];
      const end = path.points[path.points.length - 1];

      // Start marker (green circle)
      ctx.fillStyle = this.options.startColor;
      ctx.beginPath();
      ctx.arc(start.x, start.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // End marker (red square)
      ctx.fillStyle = this.options.endColor;
      ctx.fillRect(end.x - 4, end.y - 4, 8, 8);
    });
  }

  drawDirectionArrows(ctx, paths) {
    ctx.fillStyle = this.options.drawColor;

    paths.forEach(path => {
      if (!path.points || path.points.length < 3) return;

      // Draw arrow at midpoint of path
      const midIndex = Math.floor(path.points.length / 2);
      const p1 = path.points[midIndex - 1];
      const p2 = path.points[midIndex];

      if (!p1 || !p2) return;

      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(angle);

      // Draw arrow
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });
  }

  drawPenLifts(ctx, paths) {
    ctx.fillStyle = 'rgba(255, 165, 0, 0.7)';
    ctx.font = '10px monospace';

    let currentPos = { x: 0, y: 0 };
    let liftNumber = 1;

    paths.forEach(path => {
      if (!path.points || path.points.length === 0) return;

      const startPoint = path.points[0];
      const dist = this.distance(currentPos, startPoint);

      if (dist > 5) {
        // Draw pen lift indicator
        const midX = (currentPos.x + startPoint.x) / 2;
        const midY = (currentPos.y + startPoint.y) / 2;

        ctx.beginPath();
        ctx.arc(midX, midY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(liftNumber.toString(), midX, midY);
        ctx.fillStyle = 'rgba(255, 165, 0, 0.7)';

        liftNumber++;
      }

      currentPos = path.points[path.points.length - 1];
    });
  }

  drawStatsOverlay(ctx, stats, width, height) {
    const padding = 10;
    const lineHeight = 16;
    const boxWidth = 180;
    const boxHeight = 140;

    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(width - boxWidth - padding, padding, boxWidth, boxHeight);

    // Stats text
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';

    const lines = [
      `Paths: ${stats.paths}`,
      `Points: ${stats.points}`,
      `Pen Lifts: ${stats.penLifts}`,
      `Draw: ${stats.drawDistance}mm`,
      `Travel: ${stats.travelDistance}mm`,
      `Total: ${stats.totalDistance}mm`,
      `Efficiency: ${stats.efficiency}%`,
      `Est. Time: ${stats.estimatedTime}`
    ];

    lines.forEach((line, i) => {
      ctx.fillText(line, width - boxWidth - padding + 8, padding + 16 + i * lineHeight);
    });
  }

  calculateStats(paths) {
    let pathCount = paths.length;
    let pointCount = 0;
    let penLifts = 0;
    let drawDistance = 0;
    let travelDistance = 0;
    let currentPos = { x: 0, y: 0 };

    paths.forEach(path => {
      if (!path.points || path.points.length === 0) return;

      const startPoint = path.points[0];
      const dist = this.distance(currentPos, startPoint);

      if (dist > 1) {
        travelDistance += dist;
        penLifts++;
      }

      // Calculate drawing distance
      for (let i = 1; i < path.points.length; i++) {
        drawDistance += this.distance(path.points[i - 1], path.points[i]);
      }

      pointCount += path.points.length;
      currentPos = path.points[path.points.length - 1];
    });

    const totalDistance = drawDistance + travelDistance;
    const efficiency = totalDistance > 0 ? Math.round((drawDistance / totalDistance) * 100) : 0;

    // Estimate time (assuming 50mm/s draw, 100mm/s travel, 0.2s per pen lift)
    const drawTime = drawDistance / 50;
    const travelTime = travelDistance / 100;
    const liftTime = penLifts * 0.2;
    const totalTime = drawTime + travelTime + liftTime;

    return {
      paths: pathCount,
      points: pointCount,
      penLifts: penLifts,
      drawDistance: Math.round(drawDistance * 10) / 10,
      travelDistance: Math.round(travelDistance * 10) / 10,
      totalDistance: Math.round(totalDistance * 10) / 10,
      efficiency: efficiency,
      estimatedTime: this.formatTime(totalTime)
    };
  }

  formatTime(seconds) {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return `${mins}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
  }

  distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Create an animated preview that shows drawing progress
   * @param {Array} paths - Array of path objects
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {Function} callback - Called each frame with (canvas, state)
   */
  createAnimatedPreview(paths, width, height, callback) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    let currentPathIndex = 0;
    let currentPointIndex = 0;
    let animating = true;

    const animate = () => {
      if (!animating) return;

      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw completed paths
      ctx.strokeStyle = this.options.drawColor;
      ctx.lineWidth = this.options.lineWidth;

      for (let i = 0; i < currentPathIndex; i++) {
        const path = paths[i];
        if (!path.points || path.points.length < 2) continue;

        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let j = 1; j < path.points.length; j++) {
          ctx.lineTo(path.points[j].x, path.points[j].y);
        }
        ctx.stroke();
      }

      // Draw current path progress
      if (currentPathIndex < paths.length) {
        const currentPath = paths[currentPathIndex];
        if (currentPath.points && currentPath.points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(currentPath.points[0].x, currentPath.points[0].y);
          for (let j = 1; j <= currentPointIndex && j < currentPath.points.length; j++) {
            ctx.lineTo(currentPath.points[j].x, currentPath.points[j].y);
          }
          ctx.stroke();

          // Draw pen position
          if (currentPointIndex < currentPath.points.length) {
            const penPos = currentPath.points[currentPointIndex];
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(penPos.x, penPos.y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Calculate progress
      let totalPoints = 0;
      let completedPoints = 0;
      paths.forEach((path, i) => {
        if (!path.points) return;
        totalPoints += path.points.length;
        if (i < currentPathIndex) {
          completedPoints += path.points.length;
        } else if (i === currentPathIndex) {
          completedPoints += currentPointIndex;
        }
      });

      const progress = totalPoints > 0 ? completedPoints / totalPoints : 0;

      // Callback with current state
      callback(canvas, { progress, currentPath: currentPathIndex, currentPoint: currentPointIndex });

      // Advance animation
      currentPointIndex++;
      if (currentPathIndex < paths.length && currentPointIndex >= paths[currentPathIndex].points.length) {
        currentPathIndex++;
        currentPointIndex = 0;
      }

      if (currentPathIndex < paths.length) {
        requestAnimationFrame(animate);
      } else {
        callback(canvas, { progress: 1, complete: true });
      }
    };

    animate();

    return {
      stop: () => { animating = false; },
      canvas: canvas
    };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DebugPreview;
}

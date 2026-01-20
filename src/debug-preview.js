/**
 * Debug Preview Mode for Pen Plotter
 * 
 * Visualizes pen plotter movements including:
 * - Drawing paths (pen down)
 * - Travel paths (pen up)
 * - Start/end points
 * - Path direction arrows
 * - Pen lift indicators
 * - Estimated plotting time
 */

class DebugPreview {
  constructor(options = {}) {
    this.options = {
      showTravelPaths: true,
      showStartEnd: true,
      showDirection: true,
      showPenLifts: true,
      showStats: true,
      travelColor: 'rgba(255, 0, 0, 0.3)',
      drawColor: 'rgba(0, 0, 0, 1)',
      startColor: 'green',
      endColor: 'red',
      directionColor: 'blue',
      penLiftColor: 'orange',
      backgroundColor: 'white',
      strokeWidth: 1,
      travelStrokeWidth: 0.5,
      arrowSize: 8,
      markerSize: 6,
      animationSpeed: 100, // mm/s for time estimation
      ...options
    };
  }

  /**
   * Create debug preview from path segments
   * @param {Array} segments - Array of path segments with points
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {Object} Preview data with canvas and statistics
   */
  createPreview(segments, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = this.options.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Calculate statistics
    const stats = this.calculateStats(segments);
    
    // Draw travel paths first (behind drawing paths)
    if (this.options.showTravelPaths) {
      this.drawTravelPaths(ctx, segments);
    }
    
    // Draw pen lift indicators
    if (this.options.showPenLifts) {
      this.drawPenLifts(ctx, segments);
    }
    
    // Draw main paths
    this.drawPaths(ctx, segments);
    
    // Draw direction arrows
    if (this.options.showDirection) {
      this.drawDirectionArrows(ctx, segments);
    }
    
    // Draw start/end markers
    if (this.options.showStartEnd) {
      this.drawStartEndMarkers(ctx, segments);
    }
    
    // Draw statistics overlay
    if (this.options.showStats) {
      this.drawStats(ctx, stats);
    }
    
    return {
      canvas,
      stats,
      imageData: canvas.toDataURL('image/png')
    };
  }

  /**
   * Calculate path statistics
   */
  calculateStats(segments) {
    let totalDrawDistance = 0;
    let totalTravelDistance = 0;
    let penLifts = 0;
    let totalPoints = 0;
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      totalPoints += segment.points.length;
      
      // Calculate drawing distance
      for (let j = 1; j < segment.points.length; j++) {
        totalDrawDistance += this.distance(
          segment.points[j-1],
          segment.points[j]
        );
      }
      
      // Calculate travel distance to next segment
      if (i < segments.length - 1) {
        const lastPoint = segment.points[segment.points.length - 1];
        const nextFirstPoint = segments[i + 1].points[0];
        totalTravelDistance += this.distance(lastPoint, nextFirstPoint);
        penLifts++;
      }
    }
    
    // Convert pixels to mm (assuming 96 DPI)
    const pixelsToMm = 25.4 / 96;
    const drawDistanceMm = totalDrawDistance * pixelsToMm;
    const travelDistanceMm = totalTravelDistance * pixelsToMm;
    const totalDistanceMm = drawDistanceMm + travelDistanceMm;
    
    // Estimate plotting time
    const drawTime = drawDistanceMm / this.options.animationSpeed;
    const travelTime = travelDistanceMm / (this.options.animationSpeed * 2); // Travel faster
    const liftTime = penLifts * 0.5; // 0.5 seconds per lift
    const totalTime = drawTime + travelTime + liftTime;
    
    return {
      paths: segments.length,
      points: totalPoints,
      penLifts,
      drawDistance: drawDistanceMm.toFixed(1),
      travelDistance: travelDistanceMm.toFixed(1),
      totalDistance: totalDistanceMm.toFixed(1),
      efficiency: ((drawDistanceMm / totalDistanceMm) * 100).toFixed(1),
      estimatedTime: this.formatTime(totalTime),
      drawTime: this.formatTime(drawTime),
      travelTime: this.formatTime(travelTime)
    };
  }

  /**
   * Draw travel paths (pen up movements)
   */
  drawTravelPaths(ctx, segments) {
    ctx.strokeStyle = this.options.travelColor;
    ctx.lineWidth = this.options.travelStrokeWidth;
    ctx.setLineDash([5, 5]);
    
    for (let i = 0; i < segments.length - 1; i++) {
      const lastPoint = segments[i].points[segments[i].points.length - 1];
      const nextFirstPoint = segments[i + 1].points[0];
      
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(nextFirstPoint.x, nextFirstPoint.y);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  }

  /**
   * Draw pen lift indicators
   */
  drawPenLifts(ctx, segments) {
    ctx.fillStyle = this.options.penLiftColor;
    ctx.strokeStyle = this.options.penLiftColor;
    ctx.lineWidth = 2;
    
    for (let i = 0; i < segments.length - 1; i++) {
      const point = segments[i].points[segments[i].points.length - 1];
      
      // Draw lift indicator (upward arrow)
      ctx.beginPath();
      ctx.arc(point.x, point.y, this.options.markerSize, 0, Math.PI * 2);
      ctx.stroke();
      
      // Arrow pointing up
      ctx.beginPath();
      ctx.moveTo(point.x, point.y - this.options.markerSize);
      ctx.lineTo(point.x - 3, point.y - this.options.markerSize + 5);
      ctx.moveTo(point.x, point.y - this.options.markerSize);
      ctx.lineTo(point.x + 3, point.y - this.options.markerSize + 5);
      ctx.stroke();
    }
  }

  /**
   * Draw main paths
   */
  drawPaths(ctx, segments) {
    ctx.strokeStyle = this.options.drawColor;
    ctx.lineWidth = this.options.strokeWidth;
    
    segments.forEach(segment => {
      ctx.beginPath();
      segment.points.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    });
  }

  /**
   * Draw direction arrows along paths
   */
  drawDirectionArrows(ctx, segments) {
    ctx.fillStyle = this.options.directionColor;
    ctx.strokeStyle = this.options.directionColor;
    ctx.lineWidth = 1;
    
    segments.forEach(segment => {
      // Place arrows at regular intervals
      const interval = 50; // pixels
      let distance = 0;
      
      for (let i = 1; i < segment.points.length; i++) {
        const p1 = segment.points[i - 1];
        const p2 = segment.points[i];
        const segmentLength = this.distance(p1, p2);
        
        distance += segmentLength;
        
        if (distance >= interval) {
          // Calculate arrow position and angle
          const t = (distance - interval) / segmentLength;
          const x = p1.x + (p2.x - p1.x) * (1 - t);
          const y = p1.y + (p2.y - p1.y) * (1 - t);
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          
          this.drawArrow(ctx, x, y, angle);
          distance = distance - interval;
        }
      }
    });
  }

  /**
   * Draw an arrow at position with given angle
   */
  drawArrow(ctx, x, y, angle) {
    const size = this.options.arrowSize;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size/2);
    ctx.lineTo(-size, size/2);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }

  /**
   * Draw start and end markers
   */
  drawStartEndMarkers(ctx, segments) {
    if (segments.length === 0) return;
    
    // Start marker (green circle)
    const startPoint = segments[0].points[0];
    ctx.fillStyle = this.options.startColor;
    ctx.beginPath();
    ctx.arc(startPoint.x, startPoint.y, this.options.markerSize, 0, Math.PI * 2);
    ctx.fill();
    
    // End marker (red square)
    const lastSegment = segments[segments.length - 1];
    const endPoint = lastSegment.points[lastSegment.points.length - 1];
    ctx.fillStyle = this.options.endColor;
    ctx.fillRect(
      endPoint.x - this.options.markerSize,
      endPoint.y - this.options.markerSize,
      this.options.markerSize * 2,
      this.options.markerSize * 2
    );
  }

  /**
   * Draw statistics overlay
   */
  drawStats(ctx, stats) {
    const padding = 10;
    const lineHeight = 18;
    const bgPadding = 8;
    
    // Calculate text dimensions
    ctx.font = '14px monospace';
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
    
    let maxWidth = 0;
    lines.forEach(line => {
      const width = ctx.measureText(line).width;
      if (width > maxWidth) maxWidth = width;
    });
    
    // Draw background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(
      padding - bgPadding,
      padding - bgPadding,
      maxWidth + bgPadding * 2,
      lines.length * lineHeight + bgPadding * 2
    );
    
    // Draw border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      padding - bgPadding,
      padding - bgPadding,
      maxWidth + bgPadding * 2,
      lines.length * lineHeight + bgPadding * 2
    );
    
    // Draw text
    ctx.fillStyle = 'black';
    ctx.font = '14px monospace';
    lines.forEach((line, i) => {
      ctx.fillText(line, padding, padding + (i + 1) * lineHeight);
    });
  }

  /**
   * Calculate distance between two points
   */
  distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Format time in seconds to readable format
   */
  formatTime(seconds) {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = (seconds % 60).toFixed(0);
      return `${minutes}m ${remainingSeconds}s`;
    }
  }

  /**
   * Create animated preview showing plotting sequence
   */
  createAnimatedPreview(segments, width, height, onFrame) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    let currentSegment = 0;
    let currentPoint = 0;
    let isDrawing = true;
    let travelProgress = 0;
    
    const animate = () => {
      // Clear canvas
      ctx.fillStyle = this.options.backgroundColor;
      ctx.fillRect(0, 0, width, height);
      
      // Draw completed segments
      for (let i = 0; i < currentSegment; i++) {
        this.drawSegment(ctx, segments[i], this.options.drawColor);
      }
      
      // Draw current segment progress
      if (currentSegment < segments.length) {
        const segment = segments[currentSegment];
        
        if (isDrawing) {
          // Draw partial segment
          ctx.strokeStyle = this.options.drawColor;
          ctx.lineWidth = this.options.strokeWidth;
          ctx.beginPath();
          for (let i = 0; i <= currentPoint && i < segment.points.length; i++) {
            if (i === 0) {
              ctx.moveTo(segment.points[i].x, segment.points[i].y);
            } else {
              ctx.lineTo(segment.points[i].x, segment.points[i].y);
            }
          }
          ctx.stroke();
          
          // Draw pen position
          if (currentPoint < segment.points.length) {
            const point = segment.points[currentPoint];
            ctx.fillStyle = 'blue';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Advance to next point
          currentPoint++;
          if (currentPoint >= segment.points.length) {
            currentPoint = 0;
            isDrawing = false;
          }
        } else {
          // Show travel path
          if (currentSegment < segments.length - 1) {
            const fromPoint = segment.points[segment.points.length - 1];
            const toPoint = segments[currentSegment + 1].points[0];
            
            ctx.strokeStyle = this.options.travelColor;
            ctx.lineWidth = this.options.travelStrokeWidth;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(fromPoint.x, fromPoint.y);
            ctx.lineTo(
              fromPoint.x + (toPoint.x - fromPoint.x) * travelProgress,
              fromPoint.y + (toPoint.y - fromPoint.y) * travelProgress
            );
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw pen position during travel
            ctx.fillStyle = 'orange';
            ctx.beginPath();
            ctx.arc(
              fromPoint.x + (toPoint.x - fromPoint.x) * travelProgress,
              fromPoint.y + (toPoint.y - fromPoint.y) * travelProgress,
              3, 0, Math.PI * 2
            );
            ctx.fill();
            
            travelProgress += 0.1;
            if (travelProgress >= 1) {
              travelProgress = 0;
              currentSegment++;
              isDrawing = true;
            }
          } else {
            // Animation complete
            return canvas;
          }
        }
      }
      
      // Callback for each frame
      if (onFrame) {
        onFrame(canvas, {
          segment: currentSegment,
          point: currentPoint,
          isDrawing,
          progress: currentSegment / segments.length
        });
      }
      
      // Continue animation
      requestAnimationFrame(animate);
    };
    
    animate();
    return canvas;
  }

  /**
   * Draw a complete segment
   */
  drawSegment(ctx, segment, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = this.options.strokeWidth;
    ctx.beginPath();
    segment.points.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
  }
}

// Export for use in algorithms
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DebugPreview;
}
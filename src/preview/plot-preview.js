/**
 * Plot Preview - Animated visualization of pen plotter movement
 * Shows actual pen path, up/down states, and time estimation
 */

class PlotPreview {
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Configuration
    this.config = {
      // Animation speed multiplier
      speedMultiplier: config.speedMultiplier || 10,
      
      // Visual settings
      backgroundColor: config.backgroundColor || '#f8f8f8',
      penDownColor: config.penDownColor || '#000000',
      penUpColor: config.penUpColor || '#ff0000',
      penSize: config.penSize || 2,
      penUpOpacity: config.penUpOpacity || 0.3,
      
      // Show pen cursor
      showPen: config.showPen !== false,
      penCursorSize: config.penCursorSize || 10,
      
      // Show path highlights
      showPathHighlight: config.showPathHighlight !== false,
      highlightColor: config.highlightColor || '#0080ff',
      highlightWidth: config.highlightWidth || 4,
      
      // Show stats
      showStats: config.showStats !== false,
      statsFont: config.statsFont || '14px monospace',
      statsColor: config.statsColor || '#333333',
      
      // Plotter parameters (for accurate time estimation)
      drawSpeed: config.drawSpeed || 1500, // mm/min
      moveSpeed: config.moveSpeed || 3000, // mm/min
      penLiftTime: config.penLiftTime || 0.5, // seconds
      
      // Scale factor (pixels to mm)
      scale: config.scale || 0.2
    };
    
    // Animation state
    this.animationState = {
      isPlaying: false,
      isPaused: false,
      currentPathIndex: 0,
      currentPointIndex: 0,
      currentPosition: { x: 0, y: 0 },
      penDown: false,
      startTime: 0,
      pausedTime: 0,
      totalPausedTime: 0,
      drawnPaths: []
    };
    
    // Paths data
    this.paths = [];
    this.timeEstimate = null;
    
    // Animation frame ID
    this.animationFrameId = null;
    
    // Callbacks
    this.onProgress = config.onProgress || null;
    this.onComplete = config.onComplete || null;
  }

  /**
   * Load paths for preview
   */
  loadPaths(paths) {
    this.paths = paths;
    this.reset();
    this.calculateTimeEstimate();
    this.drawBackground();
  }

  /**
   * Start or resume animation
   */
  play() {
    if (!this.paths.length) return;
    
    if (this.animationState.isPaused) {
      // Resume from pause
      this.animationState.totalPausedTime += Date.now() - this.animationState.pausedTime;
      this.animationState.isPaused = false;
    } else if (!this.animationState.isPlaying) {
      // Start new animation
      this.animationState.startTime = Date.now();
      this.animationState.isPlaying = true;
    }
    
    this.animate();
  }

  /**
   * Pause animation
   */
  pause() {
    if (this.animationState.isPlaying && !this.animationState.isPaused) {
      this.animationState.isPaused = true;
      this.animationState.pausedTime = Date.now();
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /**
   * Stop and reset animation
   */
  stop() {
    this.animationState.isPlaying = false;
    this.animationState.isPaused = false;
    cancelAnimationFrame(this.animationFrameId);
    this.reset();
    this.drawBackground();
    this.drawAllPaths();
  }

  /**
   * Reset animation state
   */
  reset() {
    this.animationState = {
      isPlaying: false,
      isPaused: false,
      currentPathIndex: 0,
      currentPointIndex: 0,
      currentPosition: this.paths.length > 0 && this.paths[0].points.length > 0 ? 
        { ...this.paths[0].points[0] } : { x: 0, y: 0 },
      penDown: false,
      startTime: 0,
      pausedTime: 0,
      totalPausedTime: 0,
      drawnPaths: []
    };
  }

  /**
   * Main animation loop
   */
  animate() {
    if (!this.animationState.isPlaying || this.animationState.isPaused) return;
    
    const currentTime = Date.now();
    const elapsedTime = (currentTime - this.animationState.startTime - this.animationState.totalPausedTime) / 1000;
    
    // Update animation based on elapsed time
    this.updateAnimation(elapsedTime);
    
    // Draw frame
    this.drawFrame();
    
    // Check if complete
    if (this.animationState.currentPathIndex >= this.paths.length) {
      this.animationState.isPlaying = false;
      if (this.onComplete) this.onComplete();
      return;
    }
    
    // Continue animation
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Update animation state based on elapsed time
   */
  updateAnimation(elapsedTime) {
    const simulatedTime = elapsedTime * this.config.speedMultiplier;
    let accumulatedTime = 0;
    
    // Find current position based on time
    for (let pathIndex = 0; pathIndex < this.paths.length; pathIndex++) {
      const path = this.paths[pathIndex];
      
      if (!path.points || path.points.length === 0) continue;
      
      // Time for pen move to start of path
      if (pathIndex > 0) {
        const prevPath = this.paths[pathIndex - 1];
        const prevEnd = prevPath.points[prevPath.points.length - 1];
        const currentStart = path.points[0];
        const moveDistance = this.distance(prevEnd, currentStart) * this.config.scale;
        const moveTime = (moveDistance / this.config.moveSpeed) * 60 + this.config.penLiftTime;
        
        if (accumulatedTime + moveTime > simulatedTime) {
          // Currently in pen up move
          const progress = (simulatedTime - accumulatedTime) / moveTime;
          this.animationState.currentPathIndex = pathIndex;
          this.animationState.currentPointIndex = 0;
          this.animationState.penDown = false;
          this.animationState.currentPosition = this.interpolatePosition(prevEnd, currentStart, progress);
          return;
        }
        
        accumulatedTime += moveTime;
      }
      
      // Time for drawing path
      for (let pointIndex = 1; pointIndex < path.points.length; pointIndex++) {
        const p1 = path.points[pointIndex - 1];
        const p2 = path.points[pointIndex];
        const drawDistance = this.distance(p1, p2) * this.config.scale;
        const drawTime = (drawDistance / this.config.drawSpeed) * 60;
        
        if (accumulatedTime + drawTime > simulatedTime) {
          // Currently drawing this segment
          const progress = (simulatedTime - accumulatedTime) / drawTime;
          this.animationState.currentPathIndex = pathIndex;
          this.animationState.currentPointIndex = pointIndex;
          this.animationState.penDown = true;
          this.animationState.currentPosition = this.interpolatePosition(p1, p2, progress);
          
          // Update progress callback
          if (this.onProgress) {
            const totalProgress = simulatedTime / this.timeEstimate.totalTime;
            this.onProgress(totalProgress, this.timeEstimate);
          }
          
          return;
        }
        
        accumulatedTime += drawTime;
      }
    }
    
    // Animation complete
    this.animationState.currentPathIndex = this.paths.length;
  }

  /**
   * Draw current frame
   */
  drawFrame() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background
    this.drawBackground();
    
    // Draw completed paths
    this.drawCompletedPaths();
    
    // Draw current path progress
    this.drawCurrentPath();
    
    // Draw pen cursor
    if (this.config.showPen) {
      this.drawPenCursor();
    }
    
    // Draw stats
    if (this.config.showStats) {
      this.drawStats();
    }
  }

  /**
   * Draw background
   */
  drawBackground() {
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw all paths (for static view)
   */
  drawAllPaths() {
    this.ctx.strokeStyle = this.config.penDownColor;
    this.ctx.lineWidth = this.config.penSize;
    
    for (const path of this.paths) {
      if (!path.points || path.points.length < 2) continue;
      
      this.ctx.beginPath();
      this.ctx.moveTo(path.points[0].x, path.points[0].y);
      
      for (let i = 1; i < path.points.length; i++) {
        this.ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      
      this.ctx.stroke();
    }
  }

  /**
   * Draw completed paths
   */
  drawCompletedPaths() {
    this.ctx.strokeStyle = this.config.penDownColor;
    this.ctx.lineWidth = this.config.penSize;
    
    for (let i = 0; i < this.animationState.currentPathIndex; i++) {
      const path = this.paths[i];
      if (!path.points || path.points.length < 2) continue;
      
      this.ctx.beginPath();
      this.ctx.moveTo(path.points[0].x, path.points[0].y);
      
      for (let j = 1; j < path.points.length; j++) {
        this.ctx.lineTo(path.points[j].x, path.points[j].y);
      }
      
      this.ctx.stroke();
    }
  }

  /**
   * Draw current path being drawn
   */
  drawCurrentPath() {
    if (this.animationState.currentPathIndex >= this.paths.length) return;
    
    const currentPath = this.paths[this.animationState.currentPathIndex];
    if (!currentPath.points || currentPath.points.length < 2) return;
    
    // Draw completed portion of current path
    if (this.animationState.penDown && this.animationState.currentPointIndex > 0) {
      this.ctx.strokeStyle = this.config.penDownColor;
      this.ctx.lineWidth = this.config.penSize;
      
      this.ctx.beginPath();
      this.ctx.moveTo(currentPath.points[0].x, currentPath.points[0].y);
      
      for (let i = 1; i < this.animationState.currentPointIndex; i++) {
        this.ctx.lineTo(currentPath.points[i].x, currentPath.points[i].y);
      }
      
      // Draw to current position
      this.ctx.lineTo(this.animationState.currentPosition.x, this.animationState.currentPosition.y);
      this.ctx.stroke();
      
      // Highlight current segment
      if (this.config.showPathHighlight) {
        this.ctx.strokeStyle = this.config.highlightColor;
        this.ctx.lineWidth = this.config.highlightWidth;
        this.ctx.globalAlpha = 0.5;
        
        this.ctx.beginPath();
        const p1 = currentPath.points[this.animationState.currentPointIndex - 1];
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(this.animationState.currentPosition.x, this.animationState.currentPosition.y);
        this.ctx.stroke();
        
        this.ctx.globalAlpha = 1;
      }
    }
  }

  /**
   * Draw pen cursor
   */
  drawPenCursor() {
    const pos = this.animationState.currentPosition;
    
    // Pen circle
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, this.config.penCursorSize, 0, Math.PI * 2);
    
    if (this.animationState.penDown) {
      this.ctx.fillStyle = this.config.penDownColor;
      this.ctx.fill();
    } else {
      this.ctx.strokeStyle = this.config.penUpColor;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      // Draw movement line for pen up
      if (this.animationState.currentPathIndex > 0 && 
          this.animationState.currentPointIndex === 0) {
        const prevPath = this.paths[this.animationState.currentPathIndex - 1];
        const prevEnd = prevPath.points[prevPath.points.length - 1];
        
        this.ctx.beginPath();
        this.ctx.moveTo(prevEnd.x, prevEnd.y);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.strokeStyle = this.config.penUpColor;
        this.ctx.globalAlpha = this.config.penUpOpacity;
        this.ctx.setLineDash([5, 5]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1;
      }
    }
  }

  /**
   * Draw statistics
   */
  drawStats() {
    if (!this.timeEstimate) return;
    
    const stats = [];
    
    if (this.animationState.isPlaying) {
      const elapsed = (Date.now() - this.animationState.startTime - this.animationState.totalPausedTime) / 1000;
      const simulatedTime = elapsed * this.config.speedMultiplier;
      const progress = Math.min(simulatedTime / this.timeEstimate.totalTime, 1);
      
      stats.push(`Progress: ${(progress * 100).toFixed(1)}%`);
      stats.push(`Simulated: ${this.formatTime(simulatedTime)} / ${this.formatTime(this.timeEstimate.totalTime)}`);
    }
    
    stats.push(`Paths: ${this.animationState.currentPathIndex + 1} / ${this.paths.length}`);
    stats.push(`Draw time: ${this.formatTime(this.timeEstimate.drawTime)}`);
    stats.push(`Move time: ${this.formatTime(this.timeEstimate.moveTime)}`);
    stats.push(`Total time: ${this.formatTime(this.timeEstimate.totalTime)}`);
    
    this.ctx.font = this.config.statsFont;
    this.ctx.fillStyle = this.config.statsColor;
    
    const lineHeight = 20;
    stats.forEach((stat, index) => {
      this.ctx.fillText(stat, 10, 20 + index * lineHeight);
    });
  }

  /**
   * Calculate time estimate for all paths
   */
  calculateTimeEstimate() {
    let totalDistance = 0;
    let penMoves = 0;
    let pathCount = 0;
    
    for (let i = 0; i < this.paths.length; i++) {
      const path = this.paths[i];
      if (!path.points || path.points.length === 0) continue;
      
      pathCount++;
      
      // Pen move to start
      if (i > 0) {
        const prevPath = this.paths[i - 1];
        if (prevPath.points && prevPath.points.length > 0) {
          const prevEnd = prevPath.points[prevPath.points.length - 1];
          const currentStart = path.points[0];
          penMoves += this.distance(prevEnd, currentStart);
        }
      }
      
      // Drawing distance
      for (let j = 1; j < path.points.length; j++) {
        totalDistance += this.distance(path.points[j - 1], path.points[j]);
      }
    }
    
    // Convert to mm
    totalDistance *= this.config.scale;
    penMoves *= this.config.scale;
    
    // Time calculation (in seconds)
    const drawTime = (totalDistance / this.config.drawSpeed) * 60;
    const moveTime = (penMoves / this.config.moveSpeed) * 60;
    const penLiftTime = pathCount * this.config.penLiftTime;
    
    this.timeEstimate = {
      drawTime,
      moveTime,
      penLiftTime,
      totalTime: drawTime + moveTime + penLiftTime,
      totalDistance,
      penMoves,
      pathCount
    };
  }

  /**
   * Helper functions
   */
  distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  interpolatePosition(p1, p2, t) {
    return {
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t
    };
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Set animation speed multiplier
   */
  setSpeed(multiplier) {
    this.config.speedMultiplier = multiplier;
  }

  /**
   * Get current animation progress (0-1)
   */
  getProgress() {
    if (!this.timeEstimate || !this.animationState.isPlaying) return 0;
    
    const elapsed = (Date.now() - this.animationState.startTime - this.animationState.totalPausedTime) / 1000;
    const simulatedTime = elapsed * this.config.speedMultiplier;
    return Math.min(simulatedTime / this.timeEstimate.totalTime, 1);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlotPreview;
}
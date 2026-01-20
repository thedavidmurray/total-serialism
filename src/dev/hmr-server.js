import express from 'express';
import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

class HMRServer {
  constructor(port = 3000, wsPort = 3001) {
    this.port = port;
    this.wsPort = wsPort;
    this.app = express();
    this.wss = null;
    this.clients = new Set();
    this.fileHashes = new Map();
    this.algorithmCache = new Map();
  }

  async start() {
    // Setup express server
    this.app.use(express.static(projectRoot));
    this.app.use('/node_modules', express.static(path.join(projectRoot, 'node_modules')));
    
    // HMR endpoint
    this.app.get('/hmr/client.js', (req, res) => {
      res.type('application/javascript');
      res.send(this.getHMRClientCode());
    });

    // Algorithm metadata endpoint
    this.app.get('/api/algorithms', async (req, res) => {
      const algorithms = await this.scanAlgorithms();
      res.json(algorithms);
    });

    // Start HTTP server
    this.app.listen(this.port, () => {
      console.log(`HMR Dev Server running at http://localhost:${this.port}`);
    });

    // Start WebSocket server with error handling
    try {
      this.wss = new WebSocketServer({ port: this.wsPort });
      this.wss.on('connection', (ws) => {
        this.clients.add(ws);
        console.log('HMR client connected');

        ws.on('close', () => {
          this.clients.delete(ws);
          console.log('HMR client disconnected');
        });

        // Send initial state
        ws.send(JSON.stringify({
          type: 'connected',
          algorithms: Array.from(this.algorithmCache.keys())
        }));
      });

      this.wss.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`WebSocket port ${this.wsPort} is already in use. Trying port ${this.wsPort + 1}...`);
          this.wsPort = this.wsPort + 1;
          // Retry with new port
          this.wss = new WebSocketServer({ port: this.wsPort });
          console.log(`WebSocket server started on port ${this.wsPort}`);
        } else {
          console.error('WebSocket server error:', error);
        }
      });
    } catch (error) {
      console.error('Failed to start WebSocket server:', error);
      // Continue without WebSocket for static serving
    }

    // Watch for file changes
    this.setupFileWatcher();
  }

  setupFileWatcher() {
    const watcher = chokidar.watch([
      path.join(projectRoot, 'algorithms/**/*.html'),
      path.join(projectRoot, 'algorithms/**/*.js'),
      path.join(projectRoot, 'src/**/*.js')
    ], {
      ignored: /node_modules/,
      persistent: true
    });

    watcher
      .on('change', async (filePath) => {
        console.log(`File changed: ${filePath}`);
        await this.handleFileChange(filePath);
      })
      .on('add', async (filePath) => {
        console.log(`File added: ${filePath}`);
        await this.handleFileAdd(filePath);
      })
      .on('unlink', async (filePath) => {
        console.log(`File removed: ${filePath}`);
        await this.handleFileRemove(filePath);
      });
  }

  async handleFileChange(filePath) {
    const relativePath = path.relative(projectRoot, filePath);
    const newHash = await this.getFileHash(filePath);
    const oldHash = this.fileHashes.get(relativePath);

    if (newHash !== oldHash) {
      this.fileHashes.set(relativePath, newHash);
      
      // Determine update type
      let updateType = 'file-change';
      let moduleType = 'unknown';

      if (relativePath.includes('algorithms/') && relativePath.endsWith('.html')) {
        updateType = 'algorithm-update';
        moduleType = 'algorithm';
      } else if (relativePath.includes('src/') && relativePath.endsWith('.js')) {
        updateType = 'module-update';
        moduleType = 'module';
      }

      // Parse algorithm if needed
      let algorithmData = null;
      if (moduleType === 'algorithm') {
        algorithmData = await this.parseAlgorithm(filePath);
        this.algorithmCache.set(relativePath, algorithmData);
      }

      // Broadcast update to clients
      this.broadcast({
        type: updateType,
        path: relativePath,
        moduleType,
        timestamp: Date.now(),
        algorithm: algorithmData
      });
    }
  }

  async handleFileAdd(filePath) {
    const relativePath = path.relative(projectRoot, filePath);
    const hash = await this.getFileHash(filePath);
    this.fileHashes.set(relativePath, hash);

    if (relativePath.includes('algorithms/') && relativePath.endsWith('.html')) {
      const algorithmData = await this.parseAlgorithm(filePath);
      this.algorithmCache.set(relativePath, algorithmData);

      this.broadcast({
        type: 'algorithm-added',
        path: relativePath,
        algorithm: algorithmData,
        timestamp: Date.now()
      });
    }
  }

  async handleFileRemove(filePath) {
    const relativePath = path.relative(projectRoot, filePath);
    this.fileHashes.delete(relativePath);
    this.algorithmCache.delete(relativePath);

    this.broadcast({
      type: 'file-removed',
      path: relativePath,
      timestamp: Date.now()
    });
  }

  async getFileHash(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }

  async parseAlgorithm(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const relativePath = path.relative(projectRoot, filePath);
      
      // Extract algorithm metadata
      const titleMatch = content.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.html');
      
      // Extract parameters from controls
      const params = {};
      const paramMatches = content.matchAll(/id="([^"]+)"[^>]*(?:type="range"|type="checkbox"|tagName === 'SELECT')/g);
      for (const match of paramMatches) {
        params[match[1]] = true;
      }

      // Detect features
      const features = {
        hasGIF: content.includes('exportGIF'),
        hasSVG: content.includes('exportSVG') || content.includes('SVG'),
        hasAnimation: content.includes('animate') || content.includes('draw()'),
        hasInteraction: content.includes('mousePressed') || content.includes('mouseMoved'),
        has3D: content.includes('WEBGL') || content.includes('createVector'),
        hasSound: content.includes('p5.sound')
      };

      return {
        path: relativePath,
        title,
        params: Object.keys(params),
        features,
        lastModified: Date.now()
      };
    } catch (error) {
      console.error(`Error parsing algorithm ${filePath}:`, error);
      return null;
    }
  }

  async scanAlgorithms() {
    const algorithmsDir = path.join(projectRoot, 'algorithms');
    const algorithms = [];

    async function scanDir(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.name.endsWith('.html')) {
          const algorithmData = await this.parseAlgorithm(fullPath);
          if (algorithmData) {
            algorithms.push(algorithmData);
          }
        }
      }
    }

    await scanDir(algorithmsDir);
    return algorithms;
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(data);
      }
    });
  }

  getHMRClientCode() {
    return `
(function() {
  let HMR_WS_URL = 'ws://localhost:${this.wsPort}';
  let ws = null;
  let reconnectTimer = null;
  let updateQueue = [];
  let isUpdating = false;
  let wsPort = ${this.wsPort};

  class HMRClient {
    constructor() {
      this.handlers = new Map();
      this.algorithmCache = new Map();
      this.connect();
      this.injectStyles();
      this.setupMessageHandlers();
    }

    connect() {
      ws = new WebSocket(HMR_WS_URL);
      
      ws.onopen = () => {
        console.log('[HMR] Connected to dev server');
        if (reconnectTimer) {
          clearInterval(reconnectTimer);
          reconnectTimer = null;
        }
        this.showNotification('HMR Connected', 'success');
      };

      ws.onclose = () => {
        console.log('[HMR] Disconnected from dev server');
        this.showNotification('HMR Disconnected', 'error');
        this.attemptReconnect();
      };

      ws.onerror = (error) => {
        console.error('[HMR] WebSocket error:', error);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };
    }

    attemptReconnect() {
      if (!reconnectTimer) {
        reconnectTimer = setInterval(() => {
          console.log('[HMR] Attempting to reconnect...');
          this.connect();
        }, 2000);
      }
    }

    handleMessage(message) {
      console.log('[HMR] Received:', message.type);
      
      switch (message.type) {
        case 'connected':
          // Initial connection established
          break;
          
        case 'algorithm-update':
          this.handleAlgorithmUpdate(message);
          break;
          
        case 'module-update':
          this.handleModuleUpdate(message);
          break;
          
        case 'algorithm-added':
          this.handleAlgorithmAdded(message);
          break;
          
        case 'file-removed':
          this.handleFileRemoved(message);
          break;
          
        default:
          console.warn('[HMR] Unknown message type:', message.type);
      }
    }

    async handleAlgorithmUpdate(message) {
      const { path, algorithm } = message;
      
      // Check if this is the current algorithm
      if (window.location.pathname.includes(path)) {
        this.showNotification('Algorithm updated! Preserving state...', 'info');
        
        // Save current state
        const state = this.captureState();
        
        // Reload algorithm code
        await this.reloadAlgorithm(path, state);
      }
      
      // Update cache
      this.algorithmCache.set(path, algorithm);
      
      // Notify listeners
      this.emit('algorithm-updated', { path, algorithm });
    }

    async handleModuleUpdate(message) {
      const { path } = message;
      
      // If it's a core module, we might need to reload
      if (path.includes('src/core/') || path.includes('src/export/')) {
        this.showNotification('Core module updated. Reload recommended.', 'warning');
        
        // Optionally auto-reload after a delay
        setTimeout(() => {
          if (confirm('Core module updated. Reload page to apply changes?')) {
            window.location.reload();
          }
        }, 1000);
      }
    }

    captureState() {
      const state = {
        params: {},
        canvas: null,
        customData: {}
      };

      // Capture parameter values
      if (window.params) {
        state.params = { ...window.params };
      }

      // Capture canvas state
      if (window.canvas) {
        state.canvas = {
          width: window.width,
          height: window.height,
          pixels: window.get ? window.get() : null
        };
      }

      // Allow algorithms to provide custom state
      if (window.captureHMRState && typeof window.captureHMRState === 'function') {
        state.customData = window.captureHMRState();
      }

      return state;
    }

    async reloadAlgorithm(path, state) {
      try {
        // Fetch updated algorithm
        const response = await fetch(path + '?t=' + Date.now());
        const html = await response.text();
        
        // Extract and update script content
        const scriptMatch = html.match(/<script>([\\s\\S]*)<\\/script>/);
        if (scriptMatch) {
          const newScript = scriptMatch[1];
          
          // Create new script element
          const scriptEl = document.createElement('script');
          scriptEl.textContent = \`
            (function() {
              // Restore state
              const __hmrState = \${JSON.stringify(state)};
              
              // Override setup to restore state
              const originalSetup = window.setup;
              window.setup = function() {
                if (originalSetup) originalSetup();
                
                // Restore parameters
                if (__hmrState.params && window.params) {
                  Object.assign(window.params, __hmrState.params);
                  
                  // Update UI controls
                  Object.keys(__hmrState.params).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) {
                      element.value = __hmrState.params[key];
                      // Trigger change event
                      element.dispatchEvent(new Event('input'));
                    }
                  });
                }
                
                // Restore custom state
                if (window.restoreHMRState && typeof window.restoreHMRState === 'function') {
                  window.restoreHMRState(__hmrState.customData);
                }
              };
              
              \${newScript}
            })();
          \`;
          
          // Clear old p5 instance
          if (window.remove) window.remove();
          
          // Inject new script
          document.body.appendChild(scriptEl);
          
          this.showNotification('Algorithm reloaded successfully!', 'success');
        }
      } catch (error) {
        console.error('[HMR] Failed to reload algorithm:', error);
        this.showNotification('Failed to reload algorithm', 'error');
      }
    }

    showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = \`hmr-notification hmr-\${type}\`;
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('hmr-fade-out');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }

    injectStyles() {
      const style = document.createElement('style');
      style.textContent = \`
        .hmr-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 4px;
          font-family: Arial, sans-serif;
          font-size: 14px;
          z-index: 10000;
          transition: opacity 0.3s ease;
        }
        
        .hmr-notification.hmr-success {
          background: #4CAF50;
          color: white;
        }
        
        .hmr-notification.hmr-info {
          background: #2196F3;
          color: white;
        }
        
        .hmr-notification.hmr-warning {
          background: #FF9800;
          color: white;
        }
        
        .hmr-notification.hmr-error {
          background: #F44336;
          color: white;
        }
        
        .hmr-notification.hmr-fade-out {
          opacity: 0;
        }
        
        .hmr-indicator {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #4CAF50;
          z-index: 10000;
        }
        
        .hmr-indicator.disconnected {
          background: #F44336;
        }
      \`;
      document.head.appendChild(style);
      
      // Add connection indicator
      const indicator = document.createElement('div');
      indicator.className = 'hmr-indicator';
      indicator.title = 'HMR Status';
      document.body.appendChild(indicator);
      
      // Update indicator on connection change
      this.on('connection-change', (connected) => {
        indicator.classList.toggle('disconnected', !connected);
      });
    }

    setupMessageHandlers() {
      // Allow algorithms to register HMR handlers
      window.hmr = {
        accept: (handler) => {
          this.handlers.set('accept', handler);
        },
        dispose: (handler) => {
          this.handlers.set('dispose', handler);
        }
      };
    }

    emit(event, data) {
      if (this.handlers.has(event)) {
        this.handlers.get(event)(data);
      }
    }

    on(event, handler) {
      this.handlers.set(event, handler);
    }
  }

  // Initialize HMR client
  if (!window.__hmrClient) {
    window.__hmrClient = new HMRClient();
  }
})();
    `;
  }
}

// Start the server
const server = new HMRServer();
server.start().catch(console.error);

export default HMRServer;
// Parameter management utilities for pen plotter art

const fs = require('fs');
const path = require('path');

class ParamManager {
  constructor(algorithmName, defaultParams) {
    this.algorithmName = algorithmName;
    this.params = { ...defaultParams };
    this.paramDir = path.join(__dirname, '../../parameters');
  }
  
  // Save current parameters
  save(name = null) {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = name || `${this.algorithmName}-${timestamp}`;
    const filepath = path.join(this.paramDir, 'experiments', `${filename}.json`);
    
    const data = {
      algorithm: this.algorithmName,
      timestamp,
      params: this.params,
      notes: ''
    };
    
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    console.log(`Parameters saved to: ${filepath}`);
    return filepath;
  }
  
  // Load parameters from file
  load(filename) {
    const filepath = path.join(this.paramDir, filename);
    
    if (!fs.existsSync(filepath)) {
      // Try in experiments and successful directories
      const experiments = path.join(this.paramDir, 'experiments', filename);
      const successful = path.join(this.paramDir, 'successful', filename);
      
      if (fs.existsSync(experiments)) {
        filepath = experiments;
      } else if (fs.existsSync(successful)) {
        filepath = successful;
      } else {
        console.error(`Parameter file not found: ${filename}`);
        return false;
      }
    }
    
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    this.params = data.params;
    
    console.log(`Parameters loaded from: ${filepath}`);
    return true;
  }
  
  // Mark current parameters as successful
  markSuccessful(notes = '') {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `${this.algorithmName}-${timestamp}`;
    const filepath = path.join(this.paramDir, 'successful', `${filename}.json`);
    
    const data = {
      algorithm: this.algorithmName,
      timestamp,
      params: this.params,
      notes
    };
    
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    console.log(`Successful parameters saved to: ${filepath}`);
    return filepath;
  }
  
  // Generate URL params for sharing
  toURL() {
    return encodeURIComponent(JSON.stringify(this.params));
  }
  
  // Load from URL params
  fromURL(urlParams) {
    try {
      this.params = JSON.parse(decodeURIComponent(urlParams));
      return true;
    } catch (e) {
      console.error('Failed to parse URL parameters:', e);
      return false;
    }
  }
  
  // Random variation of current parameters
  randomize(keys = null, variation = 0.2) {
    const keysToRandomize = keys || Object.keys(this.params);
    
    keysToRandomize.forEach(key => {
      const value = this.params[key];
      
      if (typeof value === 'number') {
        // Vary by ±variation
        const delta = value * variation;
        this.params[key] = value + (Math.random() * 2 - 1) * delta;
      } else if (typeof value === 'boolean') {
        // Flip with variation probability
        if (Math.random() < variation) {
          this.params[key] = !value;
        }
      }
    });
  }
}

module.exports = ParamManager;
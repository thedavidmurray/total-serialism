// Preset Manager for Pen Plotter GUI Tools
// Handles saving, loading, and managing parameter presets

class PresetManager {
  constructor(options = {}) {
    // Support both old string API and new options API
    if (typeof options === 'string') {
      this.toolName = options;
      this.onSave = () => {};
      this.onLoad = () => {};
      this.onRandomize = () => {};
    } else {
      this.toolName = options.algorithmId || 'default';
      this.onSave = options.onSave || (() => {});
      this.onLoad = options.onLoad || (() => {});
      this.onRandomize = options.onRandomize || (() => {});
    }

    this.storageKey = `penplotter_${this.toolName}_presets`;
    this.currentPreset = null;
    this.presets = this.loadPresets();
    this.builtInPresets = {};
    this.urlPersistenceEnabled = false;
    this.urlPersistenceOptions = null;

    // Initialize UI if container provided
    if (options.container) {
      const container = document.querySelector(options.container);
      if (container) {
        setTimeout(() => {
          this.createUI(container, this.onSave, (preset) => {
            this.onLoad(preset);
          });
        }, 100);
      }
    }
  }

  // Load presets from localStorage
  loadPresets() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Failed to load presets:', e);
      return {};
    }
  }

  // Save presets to localStorage
  savePresets() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.presets));
    } catch (e) {
      console.error('Failed to save presets:', e);
    }
  }

  // Save current parameters as a preset
  savePreset(name, parameters) {
    this.presets[name] = {
      name: name,
      timestamp: Date.now(),
      parameters: { ...parameters }
    };
    this.savePresets();
    this.updatePresetList();
  }

  // Load a preset (checks built-in first, then user presets)
  loadPreset(name) {
    let preset = this.builtInPresets[name] || this.presets[name];
    if (preset) {
      this.currentPreset = name;
      // Return preset with data property for compatibility
      return { data: preset.parameters, ...preset };
    }
    return null;
  }

  // Delete a preset
  deletePreset(name) {
    delete this.presets[name];
    this.savePresets();
    this.updatePresetList();
  }

  // Get list of preset names
  getPresetNames() {
    return Object.keys(this.presets).sort();
  }

  // Get list of built-in preset names
  getBuiltInPresetNames() {
    return Object.keys(this.builtInPresets).sort();
  }

  // Get all preset names (built-in + user)
  getAllPresetNames() {
    const builtIn = this.getBuiltInPresetNames();
    const user = this.getPresetNames();
    return [...new Set([...builtIn, ...user])].sort();
  }

  // Export presets as JSON
  exportPresets() {
    const dataStr = JSON.stringify(this.presets, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${this.toolName}_presets.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // Import presets from JSON
  importPresets(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        // Merge with existing presets
        this.presets = { ...this.presets, ...imported };
        this.savePresets();
        this.updatePresetList();
        alert('Presets imported successfully!');
      } catch (error) {
        alert('Failed to import presets. Invalid file format.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  }

  // Create preset manager UI
  createUI(container, getParameters, applyParameters) {
    const presetSection = document.createElement('div');
    presetSection.className = 'preset-manager';
    presetSection.innerHTML = `
      <div class="control-group">
        <h3>Presets</h3>
        <div class="control">
          <select id="preset-select">
            <option value="">-- Select Preset --</option>
          </select>
        </div>
        <div class="control">
          <button id="load-preset-btn">Load Preset</button>
        </div>
        <div class="control">
          <input type="text" id="preset-name" placeholder="Enter preset name">
        </div>
        <div class="control">
          <button id="save-preset-btn">Save Current as Preset</button>
        </div>
        <div class="control">
          <button id="delete-preset-btn">Delete Selected Preset</button>
        </div>
        <hr style="border-color: #333; margin: 15px 0;">
        <div class="control">
          <button id="export-presets-btn">Export All Presets</button>
        </div>
        <div class="control">
          <input type="file" id="import-presets" accept=".json" style="display: none;">
          <button id="import-presets-btn">Import Presets</button>
        </div>
      </div>
    `;

    container.appendChild(presetSection);

    // Add event listeners
    document.getElementById('load-preset-btn').addEventListener('click', () => {
      const select = document.getElementById('preset-select');
      if (select.value) {
        const preset = this.loadPreset(select.value);
        if (preset && applyParameters) {
          applyParameters(preset);
        }
      }
    });

    document.getElementById('save-preset-btn').addEventListener('click', () => {
      const name = document.getElementById('preset-name').value.trim();
      if (name) {
        this.savePreset(name, getParameters());
        document.getElementById('preset-name').value = '';
        alert(`Preset "${name}" saved!`);
      } else {
        alert('Please enter a preset name');
      }
    });

    document.getElementById('delete-preset-btn').addEventListener('click', () => {
      const select = document.getElementById('preset-select');
      if (select.value) {
        if (confirm(`Delete preset "${select.value}"?`)) {
          this.deletePreset(select.value);
        }
      }
    });

    document.getElementById('export-presets-btn').addEventListener('click', () => {
      this.exportPresets();
    });

    document.getElementById('import-presets-btn').addEventListener('click', () => {
      document.getElementById('import-presets').click();
    });

    document.getElementById('import-presets').addEventListener('change', (e) => {
      this.importPresets(e.target);
    });

    // Initial update of preset list
    this.updatePresetList();
  }

  // Update the preset select dropdown
  updatePresetList() {
    const select = document.getElementById('preset-select');
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">-- Select Preset --</option>';

    // Add built-in presets first
    const builtInNames = this.getBuiltInPresetNames();
    if (builtInNames.length > 0) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = '📦 Built-in Presets';
      builtInNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        optgroup.appendChild(option);
      });
      select.appendChild(optgroup);
    }

    // Add user presets
    const userNames = this.getPresetNames();
    if (userNames.length > 0) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = '👤 User Presets';
      userNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        optgroup.appendChild(option);
      });
      select.appendChild(optgroup);
    }

    // Restore selection if it still exists
    if (currentValue && (this.presets[currentValue] || this.builtInPresets[currentValue])) {
      select.value = currentValue;
    }

    // Update quickbar if it exists
    this.updateQuickbar();
  }

  // Load built-in presets from JSON file
  async loadBuiltInPresets(jsonPath) {
    try {
      const response = await fetch(jsonPath);
      if (!response.ok) {
        throw new Error(`Failed to load presets: ${response.statusText}`);
      }
      const presets = await response.json();
      this.builtInPresets = presets;
      this.updatePresetList();
      return true;
    } catch (error) {
      console.error('Failed to load built-in presets:', error);
      return false;
    }
  }

  // Utility: Escape HTML to prevent XSS
  escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Inject quickbar at the top of a container
  injectQuickbar(container) {
    const targetContainer = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!targetContainer) {
      console.error('Quickbar container not found');
      return;
    }

    // Create quickbar element
    const quickbar = document.createElement('div');
    quickbar.className = 'preset-quickbar';
    quickbar.id = 'preset-quickbar';
    quickbar.innerHTML = `
      <div class="quickbar-inner">
        <span class="quickbar-label">Quick Presets:</span>
        <div class="quickbar-buttons" id="quickbar-buttons"></div>
      </div>
    `;

    // Insert at the top of the container
    targetContainer.insertBefore(quickbar, targetContainer.firstChild);

    // Populate quickbar buttons
    this.updateQuickbar();

    // Store reference
    this.quickbarContainer = quickbar;
  }

  // Update quickbar buttons
  updateQuickbar() {
    const buttonsContainer = document.getElementById('quickbar-buttons');
    if (!buttonsContainer) return;

    buttonsContainer.innerHTML = '';

    // Get first 8 presets (built-in first, then user)
    const allNames = this.getAllPresetNames();
    const quickPresets = allNames.slice(0, 8);

    quickPresets.forEach((name, index) => {
      const button = document.createElement('button');
      button.className = 'quickbar-btn';
      button.dataset.presetName = name;
      button.textContent = `${String.fromCharCode(65 + index)}${index + 1}`;

      // Add active state if this is current preset
      if (this.currentPreset === name) {
        button.classList.add('active');
      }

      // Check if it's a built-in preset
      const isBuiltIn = this.builtInPresets[name] !== undefined;
      if (isBuiltIn) {
        button.classList.add('builtin');
      }

      // Hover preview
      button.title = this.escapeHtml(name);

      // Click handler
      button.addEventListener('click', () => {
        const preset = this.loadPreset(name);
        if (preset && this.onLoad) {
          this.onLoad(preset);
        }
        // Update active states
        document.querySelectorAll('.quickbar-btn').forEach(btn =>
          btn.classList.remove('active')
        );
        button.classList.add('active');
      });

      buttonsContainer.appendChild(button);
    });
  }

  // Enable URL parameter persistence
  enableURLPersistence(options = {}) {
    this.urlPersistenceEnabled = true;
    this.urlPersistenceOptions = {
      paramPrefix: options.paramPrefix || 'preset_',
      replaceState: options.replaceState !== false, // default true
      autoRestore: options.autoRestore !== false, // default true
      ...options
    };

    // Auto-restore from URL on load
    if (this.urlPersistenceOptions.autoRestore) {
      this.restoreFromURL();
    }

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
      if (this.urlPersistenceEnabled) {
        this.restoreFromURL();
      }
    });
  }

  // Update URL with current preset parameters
  updateURL(replaceState = null) {
    if (!this.urlPersistenceEnabled) return;

    const useReplaceState = replaceState !== null
      ? replaceState
      : this.urlPersistenceOptions.replaceState;

    const params = new URLSearchParams(window.location.search);
    const prefix = this.urlPersistenceOptions.paramPrefix;

    // Add current preset name if available
    if (this.currentPreset) {
      params.set(`${prefix}name`, this.currentPreset);
    }

    // Get current parameters from callback
    if (this.onSave) {
      const currentParams = this.onSave();
      if (currentParams && typeof currentParams === 'object') {
        Object.entries(currentParams).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            params.set(`${prefix}${key}`, String(value));
          }
        });
      }
    }

    const newURL = `${window.location.pathname}?${params.toString()}`;

    if (useReplaceState) {
      window.history.replaceState(null, '', newURL);
    } else {
      window.history.pushState(null, '', newURL);
    }
  }

  // Restore state from URL parameters
  restoreFromURL() {
    if (!this.urlPersistenceEnabled) return null;

    const params = new URLSearchParams(window.location.search);
    const prefix = this.urlPersistenceOptions.paramPrefix;

    // Check if there's a preset name in URL
    const presetName = params.get(`${prefix}name`);
    if (presetName) {
      const preset = this.loadPreset(presetName);
      if (preset && this.onLoad) {
        this.onLoad(preset);
        return preset;
      }
    }

    // Otherwise, try to restore individual parameters
    const restoredParams = {};
    let hasParams = false;

    for (const [key, value] of params.entries()) {
      if (key.startsWith(prefix) && key !== `${prefix}name`) {
        const paramKey = key.slice(prefix.length);
        // Try to parse as number if possible
        const parsedValue = !isNaN(value) && value !== '' ? Number(value) : value;
        restoredParams[paramKey] = parsedValue;
        hasParams = true;
      }
    }

    if (hasParams && this.onLoad) {
      this.onLoad({ data: restoredParams, parameters: restoredParams });
      return restoredParams;
    }

    return null;
  }

  // Get shareable URL with current state
  getShareableURL() {
    if (!this.urlPersistenceEnabled) {
      console.warn('URL persistence not enabled. Call enableURLPersistence() first.');
      return window.location.href;
    }

    const params = new URLSearchParams();
    const prefix = this.urlPersistenceOptions.paramPrefix;

    // Add current preset name if available
    if (this.currentPreset) {
      params.set(`${prefix}name`, this.currentPreset);
    }

    // Get current parameters
    if (this.onSave) {
      const currentParams = this.onSave();
      if (currentParams && typeof currentParams === 'object') {
        Object.entries(currentParams).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            params.set(`${prefix}${key}`, String(value));
          }
        });
      }
    }

    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }

  // Copy shareable URL to clipboard
  async copyShareableURL() {
    const url = this.getShareableURL();

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        return { success: true, url };
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return { success, url };
      }
    } catch (error) {
      console.error('Failed to copy URL:', error);
      return { success: false, url, error };
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PresetManager;
}
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

  // Load a preset
  loadPreset(name) {
    const preset = this.presets[name];
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
    
    const names = this.getPresetNames();
    names.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });

    // Restore selection if it still exists
    if (currentValue && this.presets[currentValue]) {
      select.value = currentValue;
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PresetManager;
}
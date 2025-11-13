/**
 * Preset Manager - Universal preset system for Total Serialism algorithms
 *
 * Features:
 * - Save/load presets with descriptive names
 * - Export/import as JSON
 * - LocalStorage persistence
 * - Search and filter
 * - Built-in UI component
 *
 * Usage:
 * const presetManager = new PresetManager({
 *   algorithmId: 'my-algorithm',
 *   onSave: () => ({ param1: value1, param2: value2 }),
 *   onLoad: (preset) => { applyParameters(preset.data) }
 * });
 */

class PresetManager {
  constructor(config) {
    this.algorithmId = config.algorithmId || 'default';
    this.onSave = config.onSave || (() => ({}));
    this.onLoad = config.onLoad || (() => {});
    this.onRandomize = config.onRandomize || null;

    this.storageKey = `total-serialism-presets-${this.algorithmId}`;
    this.presets = this.loadFromStorage();

    // Auto-inject UI if container provided
    if (config.container) {
      this.injectUI(config.container);
    }
  }

  // Storage operations
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load presets:', e);
      return [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.presets));
    } catch (e) {
      console.error('Failed to save presets:', e);
    }
  }

  // Preset operations
  save(name) {
    if (!name || name.trim() === '') {
      throw new Error('Preset name is required');
    }

    const data = this.onSave();
    const preset = {
      id: Date.now().toString(),
      name: name.trim(),
      data: data,
      timestamp: new Date().toISOString(),
      algorithmId: this.algorithmId
    };

    // Check for duplicate names
    const existingIndex = this.presets.findIndex(p => p.name === preset.name);
    if (existingIndex > -1) {
      // Overwrite existing
      this.presets[existingIndex] = preset;
    } else {
      // Add new
      this.presets.unshift(preset);
    }

    this.saveToStorage();
    this.updateUI();
    return preset;
  }

  load(presetId) {
    const preset = this.presets.find(p => p.id === presetId);
    if (!preset) {
      throw new Error('Preset not found');
    }

    this.onLoad(preset);
    return preset;
  }

  delete(presetId) {
    const index = this.presets.findIndex(p => p.id === presetId);
    if (index > -1) {
      this.presets.splice(index, 1);
      this.saveToStorage();
      this.updateUI();
    }
  }

  rename(presetId, newName) {
    const preset = this.presets.find(p => p.id === presetId);
    if (preset) {
      preset.name = newName.trim();
      this.saveToStorage();
      this.updateUI();
    }
  }

  clear() {
    if (confirm('Delete all presets? This cannot be undone.')) {
      this.presets = [];
      this.saveToStorage();
      this.updateUI();
    }
  }

  // Export/Import
  exportPreset(presetId) {
    const preset = this.presets.find(p => p.id === presetId);
    if (!preset) return;

    const dataStr = JSON.stringify(preset, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.algorithmId}-${preset.name.replace(/[^a-z0-9]/gi, '-')}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  exportAll() {
    const dataStr = JSON.stringify(this.presets, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.algorithmId}-all-presets.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  import(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);

          // Handle single preset or array
          const presetsToImport = Array.isArray(imported) ? imported : [imported];

          // Add imported presets
          presetsToImport.forEach(preset => {
            // Generate new ID to avoid conflicts
            preset.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            preset.imported = true;

            // Check for name conflicts
            let name = preset.name;
            let counter = 1;
            while (this.presets.some(p => p.name === name)) {
              name = `${preset.name} (${counter})`;
              counter++;
            }
            preset.name = name;

            this.presets.unshift(preset);
          });

          this.saveToStorage();
          this.updateUI();
          resolve(presetsToImport);
        } catch (e) {
          reject(new Error('Invalid preset file'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // UI Generation
  injectUI(container) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!this.container) {
      console.error('Preset Manager: Container not found');
      return;
    }

    const ui = document.createElement('div');
    ui.className = 'preset-manager';
    ui.innerHTML = `
      <div class="preset-manager-header">
        <h3>⚙️ Presets</h3>
        <button class="preset-collapse-btn" title="Collapse">−</button>
      </div>

      <div class="preset-manager-content">
        <div class="preset-save-section">
          <input
            type="text"
            class="preset-name-input"
            placeholder="Preset name..."
            maxlength="50"
          >
          <div class="preset-action-row">
            <button class="preset-save-btn">💾 Save</button>
            ${this.onRandomize ? '<button class="preset-random-btn">🎲 Random</button>' : ''}
          </div>
        </div>

        <div class="preset-search-section">
          <input
            type="text"
            class="preset-search-input"
            placeholder="Search presets..."
          >
        </div>

        <div class="preset-list"></div>

        <div class="preset-import-section">
          <input
            type="file"
            class="preset-import-input"
            accept=".json"
            style="display: none"
          >
          <button class="preset-import-btn">📥 Import</button>
          <button class="preset-export-all-btn">📤 Export All</button>
          <button class="preset-clear-btn">🗑️ Clear All</button>
        </div>
      </div>
    `;

    this.container.appendChild(ui);
    this.attachEventListeners();
    this.updateUI();
  }

  attachEventListeners() {
    const container = this.container.querySelector('.preset-manager');

    // Collapse toggle
    const collapseBtn = container.querySelector('.preset-collapse-btn');
    const content = container.querySelector('.preset-manager-content');
    collapseBtn.addEventListener('click', () => {
      content.classList.toggle('collapsed');
      collapseBtn.textContent = content.classList.contains('collapsed') ? '+' : '−';
    });

    // Save preset
    const saveBtn = container.querySelector('.preset-save-btn');
    const nameInput = container.querySelector('.preset-name-input');

    saveBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (name) {
        try {
          this.save(name);
          nameInput.value = '';
          this.showNotification('Preset saved!');
        } catch (e) {
          this.showNotification(e.message, 'error');
        }
      }
    });

    // Enter key to save
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveBtn.click();
      }
    });

    // Randomize
    const randomBtn = container.querySelector('.preset-random-btn');
    if (randomBtn && this.onRandomize) {
      randomBtn.addEventListener('click', () => {
        this.onRandomize();
        this.showNotification('Parameters randomized!');
      });
    }

    // Search
    const searchInput = container.querySelector('.preset-search-input');
    searchInput.addEventListener('input', (e) => {
      this.filterPresets(e.target.value);
    });

    // Import
    const importBtn = container.querySelector('.preset-import-btn');
    const importInput = container.querySelector('.preset-import-input');

    importBtn.addEventListener('click', () => {
      importInput.click();
    });

    importInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const imported = await this.import(file);
          this.showNotification(`Imported ${imported.length} preset(s)!`);
        } catch (e) {
          this.showNotification(e.message, 'error');
        }
        importInput.value = ''; // Reset
      }
    });

    // Export all
    const exportAllBtn = container.querySelector('.preset-export-all-btn');
    exportAllBtn.addEventListener('click', () => {
      if (this.presets.length === 0) {
        this.showNotification('No presets to export', 'error');
        return;
      }
      this.exportAll();
      this.showNotification('Presets exported!');
    });

    // Clear all
    const clearBtn = container.querySelector('.preset-clear-btn');
    clearBtn.addEventListener('click', () => {
      this.clear();
    });
  }

  updateUI() {
    if (!this.container) return;

    const list = this.container.querySelector('.preset-list');
    if (!list) return;

    if (this.presets.length === 0) {
      list.innerHTML = '<div class="preset-empty">No presets saved yet</div>';
      return;
    }

    list.innerHTML = this.presets.map(preset => `
      <div class="preset-item" data-id="${preset.id}">
        <div class="preset-info">
          <div class="preset-name">${this.escapeHtml(preset.name)}</div>
          <div class="preset-meta">
            ${new Date(preset.timestamp).toLocaleDateString()}
            ${preset.imported ? ' • <span class="preset-badge">Imported</span>' : ''}
          </div>
        </div>
        <div class="preset-actions">
          <button class="preset-load-btn" title="Load preset">▶</button>
          <button class="preset-export-btn" title="Export preset">📤</button>
          <button class="preset-delete-btn" title="Delete preset">🗑️</button>
        </div>
      </div>
    `).join('');

    // Attach item event listeners
    list.querySelectorAll('.preset-item').forEach(item => {
      const id = item.dataset.id;

      item.querySelector('.preset-load-btn').addEventListener('click', () => {
        this.load(id);
        this.showNotification('Preset loaded!');
      });

      item.querySelector('.preset-export-btn').addEventListener('click', () => {
        this.exportPreset(id);
        this.showNotification('Preset exported!');
      });

      item.querySelector('.preset-delete-btn').addEventListener('click', () => {
        if (confirm('Delete this preset?')) {
          this.delete(id);
          this.showNotification('Preset deleted');
        }
      });
    });
  }

  filterPresets(searchTerm) {
    const list = this.container.querySelector('.preset-list');
    const items = list.querySelectorAll('.preset-item');

    const term = searchTerm.toLowerCase();

    items.forEach(item => {
      const name = item.querySelector('.preset-name').textContent.toLowerCase();
      item.style.display = name.includes(term) ? '' : 'none';
    });
  }

  showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `preset-notification preset-notification-${type}`;
    notification.textContent = message;

    // Add to body
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use in modules or global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PresetManager;
}

/**
 * UI UTILITIES
 * Common UI helpers and status management for algorithms
 */

class UIUtils {
  constructor() {
    this.statusElement = null;
    this.progressElement = null;
    this.initializeStatusDisplay();
  }

  /**
   * Initialize status display if not exists
   */
  initializeStatusDisplay() {
    // Create status container if it doesn't exist
    if (!document.getElementById('global-status')) {
      const statusContainer = document.createElement('div');
      statusContainer.id = 'global-status';
      statusContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        max-width: 300px;
        z-index: 9999;
        display: none;
      `;
      document.body.appendChild(statusContainer);
      this.statusElement = statusContainer;
    } else {
      this.statusElement = document.getElementById('global-status');
    }
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info', duration = 3000) {
    if (!this.statusElement) this.initializeStatusDisplay();
    
    const colors = {
      'info': '#2196F3',
      'success': '#4CAF50', 
      'warning': '#FF9800',
      'error': '#F44336'
    };
    
    this.statusElement.style.backgroundColor = colors[type] || colors['info'];
    this.statusElement.textContent = message;
    this.statusElement.style.display = 'block';
    
    if (duration > 0) {
      setTimeout(() => {
        this.statusElement.style.display = 'none';
      }, duration);
    }
  }

  /**
   * Show progress bar
   */
  showProgress(current, total, message = 'Processing...') {
    if (!this.statusElement) this.initializeStatusDisplay();
    
    const percentage = Math.round((current / total) * 100);
    
    this.statusElement.innerHTML = `
      <div>${message}</div>
      <div style="background: rgba(255,255,255,0.3); height: 20px; margin: 5px 0; border-radius: 3px;">
        <div style="background: #4CAF50; height: 100%; width: ${percentage}%; border-radius: 3px; transition: width 0.3s;"></div>
      </div>
      <div>${current} / ${total} (${percentage}%)</div>
    `;
    
    this.statusElement.style.display = 'block';
    
    if (current >= total) {
      setTimeout(() => {
        this.statusElement.style.display = 'none';
      }, 2000);
    }
  }

  /**
   * Hide status
   */
  hideStatus() {
    if (this.statusElement) {
      this.statusElement.style.display = 'none';
    }
  }

  /**
   * Create parameter slider with label and value display
   */
  createSlider(container, label, id, min, max, value, step = 1) {
    const sliderGroup = document.createElement('div');
    sliderGroup.className = 'slider-group';
    sliderGroup.innerHTML = `
      <label for="${id}">${label}: <span id="${id}-val">${value}</span></label>
      <input type="range" id="${id}" min="${min}" max="${max}" value="${value}" step="${step}">
    `;
    
    container.appendChild(sliderGroup);
    
    const slider = sliderGroup.querySelector(`#${id}`);
    const valueDisplay = sliderGroup.querySelector(`#${id}-val`);
    
    slider.addEventListener('input', (e) => {
      valueDisplay.textContent = e.target.value;
    });
    
    return slider;
  }

  /**
   * Create checkbox with label
   */
  createCheckbox(container, label, id, checked = false) {
    const checkboxGroup = document.createElement('div');
    checkboxGroup.className = 'checkbox-group';
    checkboxGroup.innerHTML = `
      <label>
        <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
        ${label}
      </label>
    `;
    
    container.appendChild(checkboxGroup);
    
    return checkboxGroup.querySelector(`#${id}`);
  }

  /**
   * Create dropdown select
   */
  createSelect(container, label, id, options, selected) {
    const selectGroup = document.createElement('div');
    selectGroup.className = 'select-group';
    
    const optionsHTML = options.map(option => 
      `<option value="${option.value}" ${option.value === selected ? 'selected' : ''}>${option.label}</option>`
    ).join('');
    
    selectGroup.innerHTML = `
      <label for="${id}">${label}:</label>
      <select id="${id}">${optionsHTML}</select>
    `;
    
    container.appendChild(selectGroup);
    
    return selectGroup.querySelector(`#${id}`);
  }

  /**
   * Create button group
   */
  createButtonGroup(container, label, buttons) {
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    
    if (label) {
      const labelElement = document.createElement('h4');
      labelElement.textContent = label;
      buttonGroup.appendChild(labelElement);
    }
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-row';
    
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.textContent = btn.label;
      button.onclick = btn.callback;
      if (btn.style) {
        Object.assign(button.style, btn.style);
      }
      buttonContainer.appendChild(button);
    });
    
    buttonGroup.appendChild(buttonContainer);
    container.appendChild(buttonGroup);
    
    return buttonGroup;
  }

  /**
   * Add standard CSS styles for UI elements
   */
  addStandardStyles() {
    if (document.getElementById('ui-utils-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'ui-utils-styles';
    styles.textContent = `
      .slider-group {
        margin-bottom: 15px;
      }
      
      .slider-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }
      
      .slider-group input[type="range"] {
        width: 100%;
        margin: 5px 0;
      }
      
      .checkbox-group {
        margin-bottom: 10px;
      }
      
      .checkbox-group label {
        display: flex;
        align-items: center;
        cursor: pointer;
      }
      
      .checkbox-group input[type="checkbox"] {
        margin-right: 10px;
      }
      
      .select-group {
        margin-bottom: 15px;
      }
      
      .select-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
      }
      
      .select-group select {
        width: 100%;
        padding: 5px;
        border-radius: 3px;
        border: 1px solid #ccc;
      }
      
      .button-group {
        margin-bottom: 15px;
      }
      
      .button-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      
      .button-row button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        background: #2196F3;
        color: white;
        cursor: pointer;
        font-size: 14px;
      }
      
      .button-row button:hover {
        background: #1976D2;
      }
      
      .button-row button:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    `;
    
    document.head.appendChild(styles);
  }

  /**
   * Update parameter displays from object
   */
  updateParameterDisplays(params) {
    Object.keys(params).forEach(key => {
      const element = document.getElementById(key);
      const display = document.getElementById(`${key}-val`);
      
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = params[key];
        } else {
          element.value = params[key];
        }
      }
      
      if (display) {
        display.textContent = params[key];
      }
    });
  }

  /**
   * Get parameter values from UI elements
   */
  getParameterValues(paramKeys) {
    const values = {};
    
    paramKeys.forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          values[key] = element.checked;
        } else if (element.type === 'range' || element.type === 'number') {
          values[key] = parseFloat(element.value);
        } else {
          values[key] = element.value;
        }
      }
    });
    
    return values;
  }

  /**
   * Debounce function for performance
   */
  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }
}

// Global instance
const uiUtils = new UIUtils();

// Initialize styles
document.addEventListener('DOMContentLoaded', () => {
  uiUtils.addStandardStyles();
});

// Legacy compatibility functions
function showStatus(message, type, duration) {
  uiUtils.showStatus(message, type, duration);
}

function showProgress(current, total, message) {
  uiUtils.showProgress(current, total, message);
}

function createSlider(container, label, id, min, max, value, step) {
  return uiUtils.createSlider(container, label, id, min, max, value, step);
}

function createCheckbox(container, label, id, checked) {
  return uiUtils.createCheckbox(container, label, id, checked);
}
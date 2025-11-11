/**
 * UI Utilities for Total Serialism
 * Shared functions for parameter synchronization and UI updates
 */

class UIUtils {
  /**
   * Update all UI elements from a params object
   * Handles range inputs, selects, checkboxes, and value displays
   * @param {Object} params - Parameters object
   * @param {Object} options - Configuration options
   */
  static updateUIFromParams(params, options = {}) {
    const {
      valueSuffix = '-val',
      valueTransform = {},
      skipKeys = []
    } = options;

    Object.keys(params).forEach(key => {
      if (skipKeys.includes(key)) return;

      const element = document.getElementById(key);
      if (!element) return;

      // Update input element
      if (element.type === 'range' || element.type === 'number') {
        element.value = params[key];
      } else if (element.type === 'checkbox') {
        element.checked = params[key];
      } else if (element.tagName === 'SELECT') {
        element.value = params[key];
      }

      // Update value display
      const valueDisplay = document.getElementById(key + valueSuffix) ||
                          document.getElementById(key + 'Value') ||
                          document.getElementById(key + '-value');

      if (valueDisplay) {
        let displayValue = params[key];

        // Apply transformation if specified
        if (valueTransform[key]) {
          displayValue = valueTransform[key](displayValue);
        } else if (typeof displayValue === 'number') {
          // Default formatting for numbers
          displayValue = Number.isInteger(displayValue)
            ? displayValue.toString()
            : displayValue.toFixed(2);
        }

        valueDisplay.textContent = displayValue;
      }
    });
  }

  /**
   * Sync params from UI elements
   * Reads current values from UI and updates params object
   * @param {Object} params - Parameters object to update
   * @returns {Object} Updated params
   */
  static syncParamsFromUI(params) {
    Object.keys(params).forEach(key => {
      const element = document.getElementById(key);
      if (!element) return;

      if (element.type === 'range' || element.type === 'number') {
        params[key] = parseFloat(element.value);
      } else if (element.type === 'checkbox') {
        params[key] = element.checked;
      } else if (element.tagName === 'SELECT') {
        params[key] = element.value;
      }
    });

    return params;
  }

  /**
   * Setup automatic param synchronization
   * Automatically updates params when UI elements change
   * @param {Object} params - Parameters object
   * @param {Function} onChange - Callback when params change
   * @param {Object} options - Configuration options
   */
  static setupParamSync(params, onChange = null, options = {}) {
    const {
      valueSuffix = '-val',
      skipKeys = []
    } = options;

    Object.keys(params).forEach(key => {
      if (skipKeys.includes(key)) return;

      const element = document.getElementById(key);
      if (!element) return;

      const eventType = element.type === 'range' ? 'input' : 'change';

      element.addEventListener(eventType, (e) => {
        // Update param
        if (element.type === 'range' || element.type === 'number') {
          params[key] = parseFloat(e.target.value);
        } else if (element.type === 'checkbox') {
          params[key] = e.target.checked;
        } else if (element.tagName === 'SELECT') {
          params[key] = e.target.value;
        }

        // Update value display
        const valueDisplay = document.getElementById(key + valueSuffix) ||
                            document.getElementById(key + 'Value') ||
                            document.getElementById(key + '-value');

        if (valueDisplay && (element.type === 'range' || element.type === 'number')) {
          valueDisplay.textContent = element.value;
        }

        // Trigger callback
        if (onChange) {
          onChange(key, params[key], params);
        }
      });
    });
  }

  /**
   * Create a range control with label and value display
   * @param {Object} config - Control configuration
   * @returns {HTMLElement} Control element
   */
  static createRangeControl(config) {
    const {
      id,
      label,
      min,
      max,
      value,
      step = 1,
      unit = '',
      onChange = null
    } = config;

    const controlDiv = document.createElement('div');
    controlDiv.className = 'control';

    const labelEl = document.createElement('label');
    labelEl.innerHTML = `${label}: <span class="value" id="${id}-val">${value}${unit}</span>`;

    const inputEl = document.createElement('input');
    inputEl.type = 'range';
    inputEl.id = id;
    inputEl.min = min;
    inputEl.max = max;
    inputEl.value = value;
    inputEl.step = step;

    inputEl.addEventListener('input', (e) => {
      const valueDisplay = document.getElementById(`${id}-val`);
      if (valueDisplay) {
        valueDisplay.textContent = e.target.value + unit;
      }
      if (onChange) {
        onChange(parseFloat(e.target.value));
      }
    });

    controlDiv.appendChild(labelEl);
    controlDiv.appendChild(inputEl);

    return controlDiv;
  }

  /**
   * Create a select control with label
   * @param {Object} config - Control configuration
   * @returns {HTMLElement} Control element
   */
  static createSelectControl(config) {
    const {
      id,
      label,
      options,
      value,
      onChange = null
    } = config;

    const controlDiv = document.createElement('div');
    controlDiv.className = 'control';

    const labelEl = document.createElement('label');
    labelEl.textContent = label;

    const selectEl = document.createElement('select');
    selectEl.id = id;

    options.forEach(opt => {
      const optionEl = document.createElement('option');
      optionEl.value = typeof opt === 'object' ? opt.value : opt;
      optionEl.textContent = typeof opt === 'object' ? opt.label : opt;
      if (optionEl.value === value) {
        optionEl.selected = true;
      }
      selectEl.appendChild(optionEl);
    });

    if (onChange) {
      selectEl.addEventListener('change', (e) => {
        onChange(e.target.value);
      });
    }

    controlDiv.appendChild(labelEl);
    controlDiv.appendChild(selectEl);

    return controlDiv;
  }

  /**
   * Create a checkbox control with label
   * @param {Object} config - Control configuration
   * @returns {HTMLElement} Control element
   */
  static createCheckboxControl(config) {
    const {
      id,
      label,
      checked = false,
      onChange = null
    } = config;

    const controlDiv = document.createElement('div');
    controlDiv.className = 'checkbox-container';

    const inputEl = document.createElement('input');
    inputEl.type = 'checkbox';
    inputEl.id = id;
    inputEl.checked = checked;

    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label;

    if (onChange) {
      inputEl.addEventListener('change', (e) => {
        onChange(e.target.checked);
      });
    }

    controlDiv.appendChild(inputEl);
    controlDiv.appendChild(labelEl);

    return controlDiv;
  }

  /**
   * Show a notification/toast message
   * @param {String} message - Message to display
   * @param {String} type - Message type ('info', 'success', 'error', 'warning')
   * @param {Number} duration - Duration in ms (0 = no auto-hide)
   */
  static showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : type === 'warning' ? '#ff9800' : '#2196F3'};
      color: white;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    if (duration > 0) {
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
      }, duration);
    }

    return notification;
  }

  /**
   * Randomize parameters with ranges
   * @param {Object} params - Parameters to randomize
   * @param {Object} ranges - Ranges for each parameter
   * @returns {Object} Randomized params
   */
  static randomizeParams(params, ranges) {
    Object.keys(ranges).forEach(key => {
      const range = ranges[key];

      if (Array.isArray(range)) {
        // Array of possible values
        params[key] = range[Math.floor(Math.random() * range.length)];
      } else if (typeof range === 'object') {
        // {min, max, step, type}
        const { min, max, step = 1, type = 'float' } = range;
        const value = Math.random() * (max - min) + min;

        if (type === 'int' || Number.isInteger(step)) {
          params[key] = Math.floor(value / step) * step;
        } else {
          params[key] = value;
        }
      }
    });

    return params;
  }

  /**
   * Generate a random seed
   * @param {Number} max - Maximum value (default 999999)
   * @returns {Number} Random seed
   */
  static randomSeed(max = 999999) {
    return Math.floor(Math.random() * max) + 1;
  }

  /**
   * Format number for display
   * @param {Number} value - Number to format
   * @param {Number} decimals - Number of decimal places
   * @returns {String} Formatted number
   */
  static formatNumber(value, decimals = 2) {
    if (Number.isInteger(value)) {
      return value.toString();
    }
    return value.toFixed(decimals);
  }

  /**
   * Debounce function for performance
   * @param {Function} func - Function to debounce
   * @param {Number} wait - Wait time in ms
   * @returns {Function} Debounced function
   */
  static debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Make available globally
if (typeof window !== 'undefined') {
  window.UIUtils = UIUtils;
}

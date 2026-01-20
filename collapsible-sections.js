/**
 * Collapsible Sections System for Total Serialism Pen Plotter Algorithms
 *
 * Features:
 * - Vanilla JavaScript (no dependencies)
 * - localStorage persistence for collapse state
 * - Smooth CSS animations
 * - Keyboard accessibility (ARIA compliant)
 * - Works with existing PresetManager
 * - Incremental adoption across 67 algorithms
 *
 * Usage:
 *   const sections = new CollapsibleSections({
 *     container: '#controls',
 *     storageKey: 'algorithm-name-sections',
 *     defaultState: 'expanded' // or 'collapsed'
 *   });
 */

class CollapsibleSections {
  constructor(options = {}) {
    this.container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;

    if (!this.container) {
      throw new Error('Container element not found');
    }

    // Configuration
    this.storageKey = options.storageKey || 'collapsible-sections-state';
    this.defaultState = options.defaultState || 'expanded'; // 'expanded' or 'collapsed'
    this.animationDuration = options.animationDuration || 300; // ms
    this.persistState = options.persistState !== false; // default true
    this.expandAllOnPresetLoad = options.expandAllOnPresetLoad !== false; // default true

    // Internal state
    this.sections = new Map(); // sectionId -> { element, header, content, expanded }
    this.state = this.loadState();

    // Bind methods
    this.toggleSection = this.toggleSection.bind(this);
    this.expandAll = this.expandAll.bind(this);
    this.collapseAll = this.collapseAll.bind(this);
    this.handleKeyboard = this.handleKeyboard.bind(this);

    // Initialize
    this.injectStyles();
  }

  /**
   * Inject CSS styles for collapsible sections
   */
  injectStyles() {
    if (document.getElementById('collapsible-sections-styles')) {
      return; // Already injected
    }

    const style = document.createElement('style');
    style.id = 'collapsible-sections-styles';
    style.textContent = `
      /* Collapsible Section Styles */
      .collapsible-section {
        margin-bottom: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #fafafa;
        overflow: hidden;
      }

      .collapsible-section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 15px;
        background: linear-gradient(to bottom, #f5f5f5, #e8e8e8);
        border-bottom: 1px solid #ddd;
        cursor: pointer;
        user-select: none;
        transition: background-color 0.15s ease;
      }

      .collapsible-section-header:hover {
        background: linear-gradient(to bottom, #f0f0f0, #e3e3e3);
      }

      .collapsible-section-header:active {
        background: linear-gradient(to bottom, #e8e8e8, #dadada);
      }

      .collapsible-section-header:focus {
        outline: 2px solid #4CAF50;
        outline-offset: -2px;
      }

      .collapsible-section-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
        flex-grow: 1;
      }

      .collapsible-section-icon {
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid #666;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        margin-left: 10px;
      }

      .collapsible-section-header[aria-expanded="false"] .collapsible-section-icon {
        transform: rotate(-90deg);
      }

      .collapsible-section-content {
        overflow: hidden;
        transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        max-height: 2000px; /* Large enough for most sections */
        opacity: 1;
        padding: 15px;
        background: white;
      }

      .collapsible-section-content.collapsed {
        max-height: 0;
        opacity: 0;
        padding-top: 0;
        padding-bottom: 0;
      }

      /* Optional: Add subtle animation for individual controls */
      .collapsible-section-content > * {
        animation: fadeInDown 0.3s ease-out;
      }

      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translateY(-5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Global expand/collapse controls */
      .section-controls {
        display: flex;
        gap: 8px;
        margin-bottom: 15px;
        padding: 8px;
        background: #f5f5f5;
        border-radius: 4px;
      }

      .section-controls button {
        flex: 1;
        padding: 6px 12px;
        font-size: 12px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 3px;
        cursor: pointer;
        transition: background-color 0.15s ease;
      }

      .section-controls button:hover {
        background: #f0f0f0;
      }

      .section-controls button:active {
        background: #e8e8e8;
      }

      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .collapsible-section {
          border: 2px solid #000;
        }

        .collapsible-section-header {
          border-bottom: 2px solid #000;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .collapsible-section-icon,
        .collapsible-section-content {
          transition: none;
        }

        .collapsible-section-content > * {
          animation: none;
        }
      }

      /* Print styles - expand all sections */
      @media print {
        .collapsible-section-content {
          max-height: none !important;
          opacity: 1 !important;
          padding: 15px !important;
        }

        .collapsible-section-icon {
          display: none;
        }

        .section-controls {
          display: none;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Convert flat control groups to collapsible sections
   *
   * @param {Object} config - Configuration object
   * @param {string} config.selector - Selector for control groups to convert
   * @param {Function} config.getTitleFromElement - Function to extract title from element
   * @param {boolean} config.wrapInSection - Whether to wrap in section element
   */
  convertFlatStructure(config = {}) {
    const {
      selector = '.control-group',
      getTitleFromElement = (element) => {
        const heading = element.querySelector('h3, h4');
        return heading ? heading.textContent : 'Section';
      },
      wrapInSection = true
    } = config;

    const controlGroups = this.container.querySelectorAll(selector);

    controlGroups.forEach((group, index) => {
      const title = getTitleFromElement(group);
      const sectionId = this.generateSectionId(title, index);

      // Extract existing content
      const content = group.innerHTML;

      // Remove the original heading if it exists
      const heading = group.querySelector('h3, h4');
      if (heading) {
        heading.remove();
      }

      // Create collapsible section
      const section = this.createSection({
        id: sectionId,
        title: title,
        content: group.innerHTML,
        expanded: this.getSavedState(sectionId)
      });

      // Replace original group with collapsible section
      group.replaceWith(section);
    });
  }

  /**
   * Create a collapsible section programmatically
   *
   * @param {Object} options - Section options
   * @param {string} options.id - Unique section identifier
   * @param {string} options.title - Section title
   * @param {string|HTMLElement} options.content - Section content
   * @param {boolean} options.expanded - Initial expanded state
   * @returns {HTMLElement} The created section element
   */
  createSection(options = {}) {
    const {
      id = this.generateSectionId(options.title),
      title = 'Section',
      content = '',
      expanded = this.defaultState === 'expanded'
    } = options;

    // Create section structure
    const section = document.createElement('div');
    section.className = 'collapsible-section';
    section.setAttribute('data-section-id', id);

    // Create header
    const header = document.createElement('div');
    header.className = 'collapsible-section-header';
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', expanded.toString());
    header.setAttribute('aria-controls', `${id}-content`);

    const titleElement = document.createElement('h3');
    titleElement.className = 'collapsible-section-title';
    titleElement.textContent = title;

    const icon = document.createElement('div');
    icon.className = 'collapsible-section-icon';
    icon.setAttribute('aria-hidden', 'true');

    header.appendChild(titleElement);
    header.appendChild(icon);

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'collapsible-section-content';
    contentContainer.id = `${id}-content`;
    contentContainer.setAttribute('role', 'region');
    contentContainer.setAttribute('aria-labelledby', `${id}-header`);

    if (!expanded) {
      contentContainer.classList.add('collapsed');
    }

    // Add content
    if (typeof content === 'string') {
      contentContainer.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      contentContainer.appendChild(content);
    }

    // Assemble section
    section.appendChild(header);
    section.appendChild(contentContainer);

    // Add event listeners
    header.addEventListener('click', () => this.toggleSection(id));
    header.addEventListener('keydown', (e) => this.handleKeyboard(e, id));

    // Store section reference
    this.sections.set(id, {
      element: section,
      header: header,
      content: contentContainer,
      expanded: expanded
    });

    return section;
  }

  /**
   * Toggle a section's expanded/collapsed state
   *
   * @param {string} sectionId - Section identifier
   */
  toggleSection(sectionId) {
    const section = this.sections.get(sectionId);
    if (!section) return;

    const isExpanded = section.expanded;

    // Update state
    section.expanded = !isExpanded;
    section.header.setAttribute('aria-expanded', (!isExpanded).toString());

    // Animate
    if (isExpanded) {
      // Collapse
      section.content.classList.add('collapsed');
    } else {
      // Expand
      section.content.classList.remove('collapsed');
    }

    // Save state
    this.saveState(sectionId, !isExpanded);

    // Fire custom event
    const event = new CustomEvent('sectionToggle', {
      detail: { sectionId, expanded: !isExpanded }
    });
    this.container.dispatchEvent(event);
  }

  /**
   * Expand a specific section
   *
   * @param {string} sectionId - Section identifier
   */
  expandSection(sectionId) {
    const section = this.sections.get(sectionId);
    if (!section || section.expanded) return;

    this.toggleSection(sectionId);
  }

  /**
   * Collapse a specific section
   *
   * @param {string} sectionId - Section identifier
   */
  collapseSection(sectionId) {
    const section = this.sections.get(sectionId);
    if (!section || !section.expanded) return;

    this.toggleSection(sectionId);
  }

  /**
   * Expand all sections
   */
  expandAll() {
    this.sections.forEach((section, sectionId) => {
      if (!section.expanded) {
        this.toggleSection(sectionId);
      }
    });
  }

  /**
   * Collapse all sections
   */
  collapseAll() {
    this.sections.forEach((section, sectionId) => {
      if (section.expanded) {
        this.toggleSection(sectionId);
      }
    });
  }

  /**
   * Handle keyboard navigation
   *
   * @param {KeyboardEvent} event - Keyboard event
   * @param {string} sectionId - Section identifier
   */
  handleKeyboard(event, sectionId) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggleSection(sectionId);
        break;

      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        this.expandSection(sectionId);
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        this.collapseSection(sectionId);
        break;

      case 'Home':
        event.preventDefault();
        this.focusFirstSection();
        break;

      case 'End':
        event.preventDefault();
        this.focusLastSection();
        break;
    }
  }

  /**
   * Focus the first section header
   */
  focusFirstSection() {
    const firstSection = this.sections.values().next().value;
    if (firstSection) {
      firstSection.header.focus();
    }
  }

  /**
   * Focus the last section header
   */
  focusLastSection() {
    const sectionsArray = Array.from(this.sections.values());
    const lastSection = sectionsArray[sectionsArray.length - 1];
    if (lastSection) {
      lastSection.header.focus();
    }
  }

  /**
   * Generate a unique section ID from title
   *
   * @param {string} title - Section title
   * @param {number} index - Optional index for uniqueness
   * @returns {string} Section ID
   */
  generateSectionId(title, index = 0) {
    const baseId = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return index > 0 ? `${baseId}-${index}` : baseId;
  }

  /**
   * Load saved section states from localStorage
   *
   * @returns {Object} Saved states
   */
  loadState() {
    if (!this.persistState) return {};

    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.warn('Failed to load section states:', e);
      return {};
    }
  }

  /**
   * Get saved state for a specific section
   *
   * @param {string} sectionId - Section identifier
   * @returns {boolean} Expanded state
   */
  getSavedState(sectionId) {
    if (!this.persistState) {
      return this.defaultState === 'expanded';
    }

    return this.state[sectionId] !== undefined
      ? this.state[sectionId]
      : this.defaultState === 'expanded';
  }

  /**
   * Save state for a specific section
   *
   * @param {string} sectionId - Section identifier
   * @param {boolean} expanded - Expanded state
   */
  saveState(sectionId, expanded) {
    if (!this.persistState) return;

    this.state[sectionId] = expanded;

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save section state:', e);
    }
  }

  /**
   * Clear all saved states
   */
  clearState() {
    this.state = {};

    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.warn('Failed to clear section states:', e);
    }
  }

  /**
   * Add global expand/collapse controls to container
   *
   * @param {Object} options - Control options
   * @param {string} options.position - 'top' or 'bottom'
   * @param {boolean} options.showResetButton - Show reset button
   */
  addGlobalControls(options = {}) {
    const {
      position = 'top',
      showResetButton = true
    } = options;

    const controls = document.createElement('div');
    controls.className = 'section-controls';

    const expandAllBtn = document.createElement('button');
    expandAllBtn.textContent = '⊞ Expand All';
    expandAllBtn.title = 'Expand all sections';
    expandAllBtn.addEventListener('click', this.expandAll);

    const collapseAllBtn = document.createElement('button');
    collapseAllBtn.textContent = '⊟ Collapse All';
    collapseAllBtn.title = 'Collapse all sections';
    collapseAllBtn.addEventListener('click', this.collapseAll);

    controls.appendChild(expandAllBtn);
    controls.appendChild(collapseAllBtn);

    if (showResetButton) {
      const resetBtn = document.createElement('button');
      resetBtn.textContent = '↺ Reset';
      resetBtn.title = 'Reset to default state';
      resetBtn.addEventListener('click', () => {
        this.clearState();
        location.reload(); // Simplest way to reset UI
      });
      controls.appendChild(resetBtn);
    }

    if (position === 'top') {
      this.container.insertBefore(controls, this.container.firstChild);
    } else {
      this.container.appendChild(controls);
    }
  }

  /**
   * Integration with PresetManager
   * Optionally expand all sections when a preset is loaded
   */
  integrateWithPresetManager(presetManager) {
    if (!this.expandAllOnPresetLoad) return;

    // Store original load method
    const originalLoad = presetManager.loadPreset.bind(presetManager);

    // Override with wrapped version
    presetManager.loadPreset = (name) => {
      const result = originalLoad(name);

      // Expand all sections when preset loads
      if (result) {
        this.expandAll();
      }

      return result;
    };
  }

  /**
   * Get section count
   *
   * @returns {number} Number of sections
   */
  getSectionCount() {
    return this.sections.size;
  }

  /**
   * Get section by ID
   *
   * @param {string} sectionId - Section identifier
   * @returns {Object|null} Section object or null
   */
  getSection(sectionId) {
    return this.sections.get(sectionId) || null;
  }

  /**
   * Destroy the collapsible sections system
   * Removes event listeners and cleans up
   */
  destroy() {
    this.sections.forEach((section) => {
      section.header.removeEventListener('click', this.toggleSection);
      section.header.removeEventListener('keydown', this.handleKeyboard);
    });

    this.sections.clear();
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CollapsibleSections;
}

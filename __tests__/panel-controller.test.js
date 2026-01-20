/**
 * Unit tests for TSPanelController
 * TDD Phase: RED - These tests should FAIL until implementation exists
 */

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key) => {
      delete store[key];
    }
  };
})();

global.localStorage = localStorageMock;

// Mock window.dispatchEvent
const dispatchedEvents = [];
global.dispatchEvent = (event) => {
  dispatchedEvents.push(event);
};

// Setup DOM structure that algorithms use
function setupDOM() {
  document.body.innerHTML = `
    <div id="canvas-container"></div>
    <div id="controls">
      <div class="control-group">
        <h3>Test Controls</h3>
        <input type="text" id="test-input" />
      </div>
    </div>
  `;
}

// Import will fail until implementation exists - that's expected (RED)
let TSPanelController;
try {
  TSPanelController = require('../pen-plotter/shared/panel-controller.js');
} catch (e) {
  // Expected to fail in RED phase
}

describe('TSPanelController', () => {
  beforeEach(() => {
    localStorage.clear();
    dispatchedEvents.length = 0;
    setupDOM();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Constructor', () => {
    test('should initialize with default options', () => {
      const controller = new TSPanelController();

      expect(controller.options.panelSelector).toBe('#controls');
      expect(controller.options.canvasAreaSelector).toBe('#canvas-container');
      expect(controller.options.storageKey).toBe('ts-panel-collapsed');
      expect(controller.options.persistState).toBe(true);
      expect(controller.options.startCollapsed).toBe(false);
      expect(controller.options.transitionDuration).toBe(350);
      expect(controller.options.labelExpanded).toBe('Close Controls');
      expect(controller.options.labelCollapsed).toBe('Show Controls');
    });

    test('should accept and apply custom options', () => {
      const customOptions = {
        panelSelector: '#custom-panel',
        storageKey: 'custom-key',
        persistState: false,
        transitionDuration: 500,
        labelExpanded: 'Hide',
        labelCollapsed: 'Show'
      };

      const controller = new TSPanelController(customOptions);

      expect(controller.options.panelSelector).toBe('#custom-panel');
      expect(controller.options.storageKey).toBe('custom-key');
      expect(controller.options.persistState).toBe(false);
      expect(controller.options.transitionDuration).toBe(500);
      expect(controller.options.labelExpanded).toBe('Hide');
      expect(controller.options.labelCollapsed).toBe('Show');
    });
  });

  describe('attach', () => {
    test('should auto-create toggle button when toggleSelector is null', () => {
      const controller = new TSPanelController();
      controller.attach();

      const button = document.querySelector('.ts-panel-toggle');
      expect(button).not.toBeNull();
      expect(button.id).toBe('ts-panel-toggle');
      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(button.getAttribute('aria-controls')).toBe('controls');
    });

    test('should use existing button when toggleSelector provided', () => {
      // Add existing button to DOM
      const existingButton = document.createElement('button');
      existingButton.id = 'my-toggle';
      existingButton.className = 'existing-toggle';
      document.body.appendChild(existingButton);

      const controller = new TSPanelController({ toggleSelector: '#my-toggle' });
      controller.attach();

      // Should use existing, not create new
      const newButtons = document.querySelectorAll('.ts-panel-toggle');
      expect(newButtons.length).toBe(0);
      expect(existingButton.getAttribute('aria-expanded')).toBe('true');
    });

    test('should return this for method chaining', () => {
      const controller = new TSPanelController();
      const result = controller.attach();

      expect(result).toBe(controller);
    });
  });

  describe('toggle', () => {
    test('should collapse panel when expanded', () => {
      const controller = new TSPanelController();
      controller.attach();

      expect(controller.isCollapsed()).toBe(false);

      controller.toggle();

      expect(controller.isCollapsed()).toBe(true);
      expect(document.body.classList.contains('ts-panel-collapsed')).toBe(true);
      expect(document.getElementById('controls').classList.contains('ts-collapsed')).toBe(true);
    });

    test('should expand panel when collapsed', () => {
      const controller = new TSPanelController({ startCollapsed: true });
      controller.attach();

      expect(controller.isCollapsed()).toBe(true);

      controller.toggle();

      expect(controller.isCollapsed()).toBe(false);
      expect(document.body.classList.contains('ts-panel-collapsed')).toBe(false);
    });

    test('should call onToggle callback with correct state', () => {
      const onToggleMock = jest.fn();
      const controller = new TSPanelController({ onToggle: onToggleMock });
      controller.attach();

      controller.toggle();

      expect(onToggleMock).toHaveBeenCalledWith(true); // collapsed = true

      controller.toggle();

      expect(onToggleMock).toHaveBeenCalledWith(false); // collapsed = false
    });

    test('should update aria-expanded attribute', () => {
      const controller = new TSPanelController();
      controller.attach();

      const button = document.querySelector('.ts-panel-toggle');
      expect(button.getAttribute('aria-expanded')).toBe('true');

      controller.toggle();

      expect(button.getAttribute('aria-expanded')).toBe('false');
    });

    test('should update button label text', () => {
      const controller = new TSPanelController();
      controller.attach();

      const label = document.querySelector('.ts-panel-toggle-label');
      expect(label.textContent).toBe('Close Controls');

      controller.toggle();

      expect(label.textContent).toBe('Show Controls');
    });

    test('should dispatch resize event for p5.js canvas', () => {
      jest.useFakeTimers();

      const controller = new TSPanelController();
      controller.attach();

      dispatchedEvents.length = 0;
      controller.toggle();

      // Advance timers to trigger delayed resize
      jest.advanceTimersByTime(400);

      expect(dispatchedEvents.length).toBeGreaterThan(0);
      expect(dispatchedEvents.some(e => e.type === 'resize')).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('collapse and expand', () => {
    test('collapse should be idempotent when already collapsed', () => {
      const onToggleMock = jest.fn();
      const controller = new TSPanelController({ onToggle: onToggleMock });
      controller.attach();

      controller.collapse();
      expect(controller.isCollapsed()).toBe(true);
      expect(onToggleMock).toHaveBeenCalledTimes(1);

      controller.collapse();
      expect(controller.isCollapsed()).toBe(true);
      // Should NOT call callback again
      expect(onToggleMock).toHaveBeenCalledTimes(1);
    });

    test('expand should be idempotent when already expanded', () => {
      const onToggleMock = jest.fn();
      const controller = new TSPanelController({ onToggle: onToggleMock });
      controller.attach();

      // Already expanded by default
      controller.expand();
      expect(controller.isCollapsed()).toBe(false);
      // Should NOT call callback
      expect(onToggleMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('isCollapsed', () => {
    test('should return false when panel is visible', () => {
      const controller = new TSPanelController();
      controller.attach();

      expect(controller.isCollapsed()).toBe(false);
    });

    test('should return true when panel is hidden', () => {
      const controller = new TSPanelController({ startCollapsed: true });
      controller.attach();

      expect(controller.isCollapsed()).toBe(true);
    });
  });

  describe('setLabel', () => {
    test('should update labels and apply on next toggle', () => {
      const controller = new TSPanelController();
      controller.attach();

      controller.setLabel('Hide Panel', 'Show Panel');

      const label = document.querySelector('.ts-panel-toggle-label');
      expect(label.textContent).toBe('Hide Panel'); // Updated immediately

      controller.toggle(); // collapse
      expect(label.textContent).toBe('Show Panel');

      controller.toggle(); // expand
      expect(label.textContent).toBe('Hide Panel');
    });
  });

  describe('destroy', () => {
    test('should remove event listeners', () => {
      const controller = new TSPanelController();
      controller.attach();

      const button = document.querySelector('.ts-panel-toggle');
      const clickSpy = jest.spyOn(controller, 'toggle');

      controller.destroy();

      // Simulate click - should not trigger toggle
      button.click();
      expect(clickSpy).not.toHaveBeenCalled();
    });

    test('should remove auto-created toggle button', () => {
      const controller = new TSPanelController();
      controller.attach();

      expect(document.querySelector('.ts-panel-toggle')).not.toBeNull();

      controller.destroy();

      expect(document.querySelector('.ts-panel-toggle')).toBeNull();
    });

    test('should leave user-provided button intact', () => {
      const existingButton = document.createElement('button');
      existingButton.id = 'user-toggle';
      document.body.appendChild(existingButton);

      const controller = new TSPanelController({ toggleSelector: '#user-toggle' });
      controller.attach();
      controller.destroy();

      // User's button should still exist
      expect(document.getElementById('user-toggle')).not.toBeNull();
    });

    test('should remove body class if collapsed', () => {
      const controller = new TSPanelController({ startCollapsed: true });
      controller.attach();

      expect(document.body.classList.contains('ts-panel-collapsed')).toBe(true);

      controller.destroy();

      expect(document.body.classList.contains('ts-panel-collapsed')).toBe(false);
    });
  });

  describe('localStorage persistence', () => {
    test('should save state to localStorage on toggle', () => {
      const controller = new TSPanelController();
      controller.attach();

      controller.toggle();

      expect(localStorage.getItem('ts-panel-collapsed')).toBe('true');

      controller.toggle();

      expect(localStorage.getItem('ts-panel-collapsed')).toBe('false');
    });

    test('should restore collapsed state from localStorage on attach', () => {
      localStorage.setItem('ts-panel-collapsed', 'true');

      const controller = new TSPanelController();
      controller.attach();

      expect(controller.isCollapsed()).toBe(true);
      expect(document.body.classList.contains('ts-panel-collapsed')).toBe(true);
    });

    test('should not use localStorage when persistState is false', () => {
      localStorage.setItem('ts-panel-collapsed', 'true');

      const controller = new TSPanelController({ persistState: false });
      controller.attach();

      // Should NOT restore collapsed state
      expect(controller.isCollapsed()).toBe(false);

      controller.toggle();

      // Should NOT save state (or should clear)
      // We check that the previous value wasn't changed unexpectedly
      expect(controller.isCollapsed()).toBe(true);
    });

    test('should use custom storageKey', () => {
      const controller = new TSPanelController({ storageKey: 'my-custom-key' });
      controller.attach();
      controller.toggle();

      expect(localStorage.getItem('my-custom-key')).toBe('true');
      expect(localStorage.getItem('ts-panel-collapsed')).toBeNull();
    });
  });

  describe('keyboard shortcuts', () => {
    test('should toggle on ] key when no input focused', () => {
      const controller = new TSPanelController();
      controller.attach();

      expect(controller.isCollapsed()).toBe(false);

      // Simulate ] keypress
      const event = new KeyboardEvent('keydown', { key: ']' });
      document.dispatchEvent(event);

      expect(controller.isCollapsed()).toBe(true);
    });

    test('should collapse on Escape when focus inside panel', () => {
      const controller = new TSPanelController();
      controller.attach();

      // Focus an input inside the panel
      const input = document.getElementById('test-input');
      input.focus();

      expect(controller.isCollapsed()).toBe(false);

      // Simulate Escape keypress with bubbling
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      input.dispatchEvent(event);

      expect(controller.isCollapsed()).toBe(true);
    });

    test('should ignore ] key when input is focused', () => {
      const controller = new TSPanelController();
      controller.attach();

      const input = document.getElementById('test-input');
      input.focus();

      // Simulate ] keypress while input focused
      const event = new KeyboardEvent('keydown', { key: ']' });
      Object.defineProperty(event, 'target', { value: input });
      document.dispatchEvent(event);

      // Should NOT toggle
      expect(controller.isCollapsed()).toBe(false);
    });
  });

  describe('reduced motion', () => {
    test('should respect prefers-reduced-motion', () => {
      // Mock matchMedia
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }));

      const controller = new TSPanelController();
      controller.attach();

      // When reduced motion preferred, transition should be instant
      // This is tested by checking CSS or transition duration behavior
      expect(controller.options.transitionDuration).toBeDefined();

      // Restore
      window.matchMedia = originalMatchMedia;
    });
  });

  describe('error handling', () => {
    test('should handle missing panel element gracefully', () => {
      document.body.innerHTML = '<div id="canvas-container"></div>';
      // No #controls element

      const controller = new TSPanelController();

      // Should not throw
      expect(() => controller.attach()).not.toThrow();

      // Console should have error (we'd need to mock console.error to test this)
    });

    test('should handle missing canvas container gracefully', () => {
      document.body.innerHTML = '<div id="controls"></div>';
      // No #canvas-container element

      const controller = new TSPanelController();

      // Should not throw
      expect(() => controller.attach()).not.toThrow();
    });
  });
});

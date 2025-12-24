/**
 * Total Serialism UI Utilities
 * Toast notifications and confirm modals to replace browser alert()/confirm()
 */

const TSNotify = {
  container: null,

  init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.className = 'ts-toast-container';
    document.body.appendChild(this.container);
  },

  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {string} type - 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration - How long to show (ms), default 3000
   */
  toast(message, type = 'info', duration = 3000) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `ts-toast ts-toast-${type}`;
    toast.textContent = message;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('ts-toast-out');
      setTimeout(() => toast.remove(), 200);
    }, duration);
  },

  success(message, duration) {
    this.toast(message, 'success', duration);
  },

  error(message, duration) {
    this.toast(message, 'error', duration);
  },

  warning(message, duration) {
    this.toast(message, 'warning', duration);
  },

  info(message, duration) {
    this.toast(message, 'info', duration);
  },

  /**
   * Show a confirm modal (replacement for browser confirm())
   * @param {string} message - The confirmation message
   * @param {Object} options - { confirmText, cancelText, danger }
   * @returns {Promise<boolean>} - Resolves true if confirmed, false if cancelled
   */
  confirm(message, options = {}) {
    const {
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      danger = false
    } = options;

    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'ts-modal-overlay';

      const modal = document.createElement('div');
      modal.className = 'ts-modal';

      const messageEl = document.createElement('div');
      messageEl.className = 'ts-modal-message';
      messageEl.textContent = message;

      const actions = document.createElement('div');
      actions.className = 'ts-modal-actions';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'ts-modal-btn ts-modal-btn-cancel';
      cancelBtn.textContent = cancelText;
      cancelBtn.onclick = () => {
        overlay.remove();
        resolve(false);
      };

      const confirmBtn = document.createElement('button');
      confirmBtn.className = `ts-modal-btn ${danger ? 'ts-modal-btn-danger' : 'ts-modal-btn-confirm'}`;
      confirmBtn.textContent = confirmText;
      confirmBtn.onclick = () => {
        overlay.remove();
        resolve(true);
      };

      actions.appendChild(cancelBtn);
      actions.appendChild(confirmBtn);
      modal.appendChild(messageEl);
      modal.appendChild(actions);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Focus confirm button
      confirmBtn.focus();

      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove();
          resolve(false);
        }
      });

      // Close on Escape key
      const handleKeydown = (e) => {
        if (e.key === 'Escape') {
          overlay.remove();
          resolve(false);
          document.removeEventListener('keydown', handleKeydown);
        }
      };
      document.addEventListener('keydown', handleKeydown);
    });
  }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TSNotify;
}

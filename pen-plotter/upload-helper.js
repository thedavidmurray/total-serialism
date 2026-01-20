/**
 * UploadHelper
 * Simple drag/click file upload helper with callbacks.
 * Usage:
 *   new UploadHelper({ dropArea: '#drop', input: '#fileInput', onFile: (file) => {} });
 */
(function () {
  class UploadHelper {
    constructor(opts) {
      this.dropArea = document.querySelector(opts.dropArea);
      this.input = document.querySelector(opts.input);
      this.onFile = opts.onFile;
      this.init();
    }

    init() {
      if (!this.dropArea || !this.input) return;
      this.dropArea.addEventListener('click', () => this.input.click());
      this.dropArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.input.click();
        }
      });
      this.dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.dropArea.classList.add('dragover');
      });
      this.dropArea.addEventListener('dragleave', () => {
        this.dropArea.classList.remove('dragover');
      });
      this.dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        this.dropArea.classList.remove('dragover');
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file && this.onFile) this.onFile(file);
      });
      this.input.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file && this.onFile) this.onFile(file);
      });
      this.dropArea.tabIndex = 0;
    }
  }

  window.UploadHelper = UploadHelper;
})();

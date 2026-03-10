/**
 * TSUrlState - Compact URL state serialization for Total Serialism
 *
 * Encodes algorithm parameters into short, URL-safe strings for sharing.
 * Uses binary packing + Base64url encoding to minimize URL length.
 *
 * Example:
 *   VERBOSE: ?seed=441969&outerRadius=200&innerRadius=65&...
 *   COMPACT: ?s=AQbx0QDIQQUA...  (~50% shorter)
 *
 * Usage:
 *   const urlState = new TSUrlState({
 *     schema: [
 *       { key: 'seed', type: 'int', bytes: 4 },
 *       { key: 'radius', type: 'int', bytes: 2 },
 *       { key: 'color', type: 'color' },
 *       { key: 'mode', type: 'enum', options: ['a', 'b', 'c'] }
 *     ]
 *   });
 *
 *   // Encode params to compact string
 *   const encoded = urlState.encode({ seed: 12345, radius: 100, ... });
 *
 *   // Decode string back to params
 *   const params = urlState.decode(encoded);
 *
 *   // URL integration
 *   urlState.pushState(params);     // Update URL without reload
 *   const params = urlState.fromUrl(); // Parse from current URL
 */

(function(global) {
  'use strict';

  /**
   * Default options
   */
  const DEFAULTS = {
    paramKey: 's',      // URL parameter name
    version: 1,         // Schema version (for future compatibility)
    algorithmId: null   // Optional namespace
  };

  /**
   * Base64url encoding (URL-safe, no padding)
   */
  function base64urlEncode(bytes) {
    const binary = String.fromCharCode.apply(null, bytes);
    const base64 = btoa(binary);
    // Convert to URL-safe and remove padding
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Base64url decoding
   */
  function base64urlDecode(str) {
    // Convert from URL-safe
    let base64 = str
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }

    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      return null;
    }
  }

  /**
   * Parse color string to RGB values
   */
  function parseColor(color) {
    let hex = String(color).replace(/^#/, '');

    // Expand shorthand (e.g., 'f00' -> 'ff0000')
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;

    return [r, g, b];
  }

  /**
   * Convert RGB values to hex color string
   */
  function rgbToHex(r, g, b) {
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  /**
   * Clamp value to range
   */
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * TSUrlState class
   */
  class TSUrlState {
    constructor(options = {}) {
      this._schema = options.schema || [];
      this._paramKey = options.paramKey || DEFAULTS.paramKey;
      this._version = options.version || DEFAULTS.version;
      this._algorithmId = options.algorithmId || DEFAULTS.algorithmId;
      this._decodedVersion = null;

      // Pre-calculate byte sizes for schema
      this._calculateSizes();
    }

    /**
     * Calculate total byte size and offsets for schema
     */
    _calculateSizes() {
      let offset = 1; // Start at 1 (version byte)
      let boolCount = 0;

      this._schema.forEach((field, index) => {
        field._offset = offset;

        switch (field.type) {
          case 'int':
            field._bytes = field.bytes || 4;
            offset += field._bytes;
            break;

          case 'float':
            field._bytes = field.bytes || 2;
            offset += field._bytes;
            break;

          case 'color':
            field._bytes = 3;
            offset += 3;
            break;

          case 'bool':
            // Bools are packed together - 8 per byte
            // First bool in a group allocates the byte
            if (boolCount % 8 === 0) {
              this._currentBoolByteOffset = offset;
              offset += 1;
            }
            field._boolByteOffset = this._currentBoolByteOffset;
            field._boolBitIndex = boolCount % 8;
            field._bytes = 0;
            boolCount++;
            break;

          case 'enum':
            field._bytes = 1;
            offset += 1;
            break;

          default:
            field._bytes = 1;
            offset += 1;
        }
      });

      this._totalBytes = offset;
      this._boolCount = boolCount;
    }

    /**
     * Get default values from schema
     */
    _getDefaults() {
      const defaults = {};
      this._schema.forEach(field => {
        if (field.default !== undefined) {
          defaults[field.key] = field.default;
        } else {
          // Type-based defaults
          switch (field.type) {
            case 'int':
              defaults[field.key] = 0;
              break;
            case 'float':
              defaults[field.key] = field.min || 0;
              break;
            case 'color':
              defaults[field.key] = '#000000';
              break;
            case 'bool':
              defaults[field.key] = false;
              break;
            case 'enum':
              defaults[field.key] = field.options?.[0] || '';
              break;
          }
        }
      });
      return defaults;
    }

    /**
     * Encode params object to compact string
     * @param {Object} params - Parameters to encode
     * @returns {string} Base64url encoded string
     */
    encode(params) {
      const defaults = this._getDefaults();
      const merged = { ...defaults, ...params };
      const bytes = new Uint8Array(this._totalBytes);

      // Version byte
      bytes[0] = this._version;

      this._schema.forEach(field => {
        const value = merged[field.key];

        switch (field.type) {
          case 'int':
            this._writeInt(bytes, field._offset, value, field._bytes);
            break;

          case 'float':
            this._writeFloat(bytes, field._offset, value, field);
            break;

          case 'color':
            this._writeColor(bytes, field._offset, value);
            break;

          case 'bool':
            // Each bool writes directly to its byte/bit position
            if (value) {
              bytes[field._boolByteOffset] |= (1 << field._boolBitIndex);
            }
            break;

          case 'enum':
            this._writeEnum(bytes, field._offset, value, field.options);
            break;
        }
      });

      return base64urlEncode(bytes);
    }

    /**
     * Decode compact string to params object
     * @param {string} encoded - Base64url encoded string
     * @returns {Object} Decoded parameters
     */
    decode(encoded) {
      const defaults = this._getDefaults();

      if (!encoded || encoded.length === 0) {
        return defaults;
      }

      const bytes = base64urlDecode(encoded);
      if (!bytes || bytes.length === 0) {
        return defaults;
      }

      // Check version
      this._decodedVersion = bytes[0];
      if (this._decodedVersion !== this._version) {
        // Version mismatch - return defaults
        return defaults;
      }

      const result = {};

      this._schema.forEach(field => {
        try {
          switch (field.type) {
            case 'int':
              result[field.key] = this._readInt(bytes, field._offset, field._bytes);
              break;

            case 'float':
              result[field.key] = this._readFloat(bytes, field._offset, field);
              break;

            case 'color':
              result[field.key] = this._readColor(bytes, field._offset);
              break;

            case 'bool':
              result[field.key] = this._readBool(bytes, field._boolByteOffset, field._boolBitIndex);
              break;

            case 'enum':
              result[field.key] = this._readEnum(bytes, field._offset, field.options);
              break;
          }
        } catch (e) {
          result[field.key] = defaults[field.key];
        }
      });

      return result;
    }

    // ========== Binary Writers ==========

    _writeInt(bytes, offset, value, numBytes) {
      const maxVal = Math.pow(256, numBytes) - 1;
      const clamped = clamp(Math.round(value) || 0, 0, maxVal);

      for (let i = 0; i < numBytes; i++) {
        bytes[offset + i] = (clamped >> (i * 8)) & 0xFF;
      }
    }

    _writeFloat(bytes, offset, value, field) {
      const min = field.min !== undefined ? field.min : 0;
      const max = field.max !== undefined ? field.max : 1;
      const numBytes = field._bytes;
      const maxVal = Math.pow(256, numBytes) - 1;

      const normalized = clamp((value - min) / (max - min), 0, 1);
      const intVal = Math.round(normalized * maxVal);

      for (let i = 0; i < numBytes; i++) {
        bytes[offset + i] = (intVal >> (i * 8)) & 0xFF;
      }
    }

    _writeColor(bytes, offset, value) {
      const [r, g, b] = parseColor(value);
      bytes[offset] = r;
      bytes[offset + 1] = g;
      bytes[offset + 2] = b;
    }

    _writeEnum(bytes, offset, value, options) {
      const index = options ? options.indexOf(value) : -1;
      bytes[offset] = index >= 0 ? index : 0;
    }

    // ========== Binary Readers ==========

    _readInt(bytes, offset, numBytes) {
      let value = 0;
      for (let i = 0; i < numBytes; i++) {
        value |= (bytes[offset + i] || 0) << (i * 8);
      }
      return value >>> 0; // Ensure unsigned
    }

    _readFloat(bytes, offset, field) {
      const min = field.min !== undefined ? field.min : 0;
      const max = field.max !== undefined ? field.max : 1;
      const numBytes = field._bytes;
      const maxVal = Math.pow(256, numBytes) - 1;

      const intVal = this._readInt(bytes, offset, numBytes);
      const normalized = intVal / maxVal;

      return min + normalized * (max - min);
    }

    _readColor(bytes, offset) {
      const r = bytes[offset] || 0;
      const g = bytes[offset + 1] || 0;
      const b = bytes[offset + 2] || 0;
      return rgbToHex(r, g, b);
    }

    _readBool(bytes, byteOffset, bitIndex) {
      const byte = bytes[byteOffset] || 0;
      return Boolean(byte & (1 << bitIndex));
    }

    _readEnum(bytes, offset, options) {
      const index = bytes[offset] || 0;
      return options && options[index] ? options[index] : (options?.[0] || '');
    }

    // ========== URL Integration ==========

    /**
     * Get full URL with encoded state
     * @param {Object} params - Parameters to encode
     * @returns {string} Full URL with state param
     */
    getUrl(params) {
      const encoded = this.encode(params);
      const url = new URL(window.location.href);
      url.searchParams.set(this._paramKey, encoded);
      return url.toString();
    }

    /**
     * Parse state from current URL
     * @returns {Object} Decoded parameters (or defaults if none)
     */
    fromUrl() {
      const url = new URL(window.location.href);
      const encoded = url.searchParams.get(this._paramKey);
      return this.decode(encoded || '');
    }

    /**
     * Update URL with state (adds history entry)
     * @param {Object} params - Parameters to encode
     */
    pushState(params) {
      const url = this.getUrl(params);
      window.history.pushState({ params }, '', url);
    }

    /**
     * Update URL with state (replaces current history entry)
     * @param {Object} params - Parameters to encode
     */
    replaceState(params) {
      const url = this.getUrl(params);
      window.history.replaceState({ params }, '', url);
    }

    /**
     * Generate a shareable URL
     * @param {Object} params - Parameters to encode
     * @param {string} baseUrl - Optional base URL (defaults to current)
     * @returns {string} Shareable URL
     */
    getShareUrl(params, baseUrl = null) {
      const encoded = this.encode(params);
      const url = new URL(baseUrl || window.location.href);
      // Clean up - remove other params for a clean share URL
      const cleanUrl = new URL(url.origin + url.pathname);
      cleanUrl.searchParams.set(this._paramKey, encoded);
      return cleanUrl.toString();
    }
  }

  // ========== Static Helpers ==========

  /**
   * Create a shareable URL (static convenience method)
   */
  TSUrlState.createShareUrl = function(schema, params, baseUrl) {
    const urlState = new TSUrlState({ schema });
    return urlState.getShareUrl(params, baseUrl);
  };

  /**
   * Parse a shareable URL (static convenience method)
   */
  TSUrlState.parseShareUrl = function(schema, url) {
    const urlState = new TSUrlState({ schema });
    const parsed = new URL(url);
    const encoded = parsed.searchParams.get('s');
    return urlState.decode(encoded || '');
  };

  // Static defaults
  TSUrlState.DEFAULTS = DEFAULTS;

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TSUrlState;
  }
  global.TSUrlState = TSUrlState;

})(typeof window !== 'undefined' ? window : global);

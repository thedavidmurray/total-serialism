/**
 * Parameter validation utilities for pen plotter algorithms
 */

class ParameterValidator {
  /**
   * Define a parameter schema
   */
  static schema(definition) {
    return new ParameterSchema(definition);
  }

  /**
   * Validate parameters against a schema
   */
  static validate(params, schema) {
    const errors = [];
    const warnings = [];
    const validated = {};

    // Check for unknown parameters
    for (const key of Object.keys(params)) {
      if (!schema.parameters[key]) {
        warnings.push(`Unknown parameter: ${key}`);
      }
    }

    // Validate each defined parameter
    for (const [name, definition] of Object.entries(schema.parameters)) {
      const value = params[name];
      const result = this.validateParameter(name, value, definition);
      
      if (result.error) {
        errors.push(result.error);
      }
      
      if (result.warnings) {
        warnings.push(...result.warnings);
      }
      
      validated[name] = result.value;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      validated
    };
  }

  /**
   * Validate a single parameter
   */
  static validateParameter(name, value, definition) {
    const result = {
      value: value,
      warnings: []
    };

    // Check if required
    if (definition.required && value === undefined) {
      result.error = `Missing required parameter: ${name}`;
      return result;
    }

    // Use default if not provided
    if (value === undefined && definition.default !== undefined) {
      result.value = typeof definition.default === 'function' 
        ? definition.default() 
        : definition.default;
      return result;
    }

    // Skip validation if optional and not provided
    if (value === undefined) {
      return result;
    }

    // Type validation
    if (definition.type) {
      const typeError = this.validateType(value, definition.type, name);
      if (typeError) {
        result.error = typeError;
        return result;
      }
    }

    // Range validation for numbers
    if (definition.type === 'number' || definition.type === 'integer') {
      if (definition.min !== undefined && value < definition.min) {
        result.error = `${name} must be >= ${definition.min} (got ${value})`;
        return result;
      }
      
      if (definition.max !== undefined && value > definition.max) {
        result.error = `${name} must be <= ${definition.max} (got ${value})`;
        return result;
      }

      // Warn about unusual values
      if (definition.typical) {
        const [typicalMin, typicalMax] = definition.typical;
        if (value < typicalMin || value > typicalMax) {
          result.warnings.push(
            `${name} is outside typical range [${typicalMin}, ${typicalMax}] (got ${value})`
          );
        }
      }
    }

    // Enum validation
    if (definition.enum && !definition.enum.includes(value)) {
      result.error = `${name} must be one of: ${definition.enum.join(', ')} (got ${value})`;
      return result;
    }

    // Custom validation
    if (definition.validate) {
      const customResult = definition.validate(value);
      if (customResult !== true) {
        result.error = typeof customResult === 'string' 
          ? customResult 
          : `${name} failed custom validation`;
        return result;
      }
    }

    // Coercion
    if (definition.coerce) {
      result.value = definition.coerce(value);
    }

    return result;
  }

  /**
   * Validate type
   */
  static validateType(value, expectedType, name) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    
    switch (expectedType) {
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${name} must be a number (got ${actualType})`;
        }
        break;
        
      case 'integer':
        if (!Number.isInteger(value)) {
          return `${name} must be an integer (got ${value})`;
        }
        break;
        
      case 'string':
        if (typeof value !== 'string') {
          return `${name} must be a string (got ${actualType})`;
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${name} must be a boolean (got ${actualType})`;
        }
        break;
        
      case 'array':
        if (!Array.isArray(value)) {
          return `${name} must be an array (got ${actualType})`;
        }
        break;
        
      case 'object':
        if (typeof value !== 'object' || value === null) {
          return `${name} must be an object (got ${actualType})`;
        }
        break;
        
      case 'function':
        if (typeof value !== 'function') {
          return `${name} must be a function (got ${actualType})`;
        }
        break;
    }
    
    return null;
  }

  /**
   * Create a parameter set for testing edge cases
   */
  static generateTestCases(schema) {
    const testCases = [];
    
    // Valid base case
    const baseCase = {};
    for (const [name, def] of Object.entries(schema.parameters)) {
      if (def.default !== undefined) {
        baseCase[name] = typeof def.default === 'function' ? def.default() : def.default;
      } else if (def.example !== undefined) {
        baseCase[name] = def.example;
      }
    }
    testCases.push({ name: 'Base case', params: baseCase, expectValid: true });
    
    // Test each parameter's edge cases
    for (const [name, def] of Object.entries(schema.parameters)) {
      // Missing required parameter
      if (def.required) {
        const missingCase = { ...baseCase };
        delete missingCase[name];
        testCases.push({
          name: `Missing required: ${name}`,
          params: missingCase,
          expectValid: false
        });
      }
      
      // Wrong type
      if (def.type) {
        const wrongTypeCase = { ...baseCase };
        wrongTypeCase[name] = this.getWrongTypeValue(def.type);
        testCases.push({
          name: `Wrong type for ${name}`,
          params: wrongTypeCase,
          expectValid: false
        });
      }
      
      // Out of range
      if (def.min !== undefined) {
        const belowMinCase = { ...baseCase };
        belowMinCase[name] = def.min - 1;
        testCases.push({
          name: `${name} below minimum`,
          params: belowMinCase,
          expectValid: false
        });
      }
      
      if (def.max !== undefined) {
        const aboveMaxCase = { ...baseCase };
        aboveMaxCase[name] = def.max + 1;
        testCases.push({
          name: `${name} above maximum`,
          params: aboveMaxCase,
          expectValid: false
        });
      }
    }
    
    return testCases;
  }

  /**
   * Get a value of the wrong type for testing
   */
  static getWrongTypeValue(correctType) {
    const wrongTypes = {
      'number': 'not a number',
      'integer': 3.14,
      'string': 42,
      'boolean': 'true',
      'array': 'not an array',
      'object': 'not an object',
      'function': 'not a function'
    };
    return wrongTypes[correctType] || null;
  }
}

/**
 * Parameter schema class
 */
class ParameterSchema {
  constructor(definition) {
    this.parameters = definition;
  }

  /**
   * Create documentation from schema
   */
  toDocumentation() {
    const lines = ['Parameters:'];
    
    for (const [name, def] of Object.entries(this.parameters)) {
      const parts = [`  ${name}:`];
      
      if (def.type) parts.push(`{${def.type}}`);
      if (def.required) parts.push('[required]');
      if (def.description) parts.push(`- ${def.description}`);
      
      lines.push(parts.join(' '));
      
      if (def.min !== undefined || def.max !== undefined) {
        const range = [];
        if (def.min !== undefined) range.push(`min: ${def.min}`);
        if (def.max !== undefined) range.push(`max: ${def.max}`);
        lines.push(`    Range: ${range.join(', ')}`);
      }
      
      if (def.default !== undefined) {
        const defaultValue = typeof def.default === 'function' ? 'dynamic' : def.default;
        lines.push(`    Default: ${defaultValue}`);
      }
      
      if (def.enum) {
        lines.push(`    Options: ${def.enum.join(', ')}`);
      }
      
      if (def.example !== undefined) {
        lines.push(`    Example: ${def.example}`);
      }
    }
    
    return lines.join('\n');
  }
}

// Common parameter definitions for reuse
ParameterValidator.common = {
  seed: {
    type: 'integer',
    description: 'Random seed for reproducible output',
    default: () => Date.now(),
    example: 12345
  },
  
  width: {
    type: 'number',
    description: 'Canvas width in pixels',
    required: true,
    min: 1,
    max: 10000,
    typical: [100, 1000]
  },
  
  height: {
    type: 'number',
    description: 'Canvas height in pixels',
    required: true,
    min: 1,
    max: 10000,
    typical: [100, 1000]
  },
  
  margin: {
    type: 'number',
    description: 'Margin from canvas edge',
    default: 20,
    min: 0,
    typical: [10, 50]
  },
  
  color: {
    type: 'string',
    description: 'Color in hex format',
    default: '#000000',
    validate: (value) => /^#[0-9A-F]{6}$/i.test(value) || 'Invalid hex color'
  },
  
  count: {
    type: 'integer',
    description: 'Number of elements to generate',
    default: 10,
    min: 1,
    typical: [5, 100]
  }
};
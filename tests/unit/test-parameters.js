/**
 * Unit tests for parameter validation
 */

describe('Parameter Validation', () => {
  it('should validate simple parameters', () => {
    const schema = ParameterValidator.schema({
      width: {
        type: 'number',
        required: true,
        min: 1,
        max: 1000
      },
      height: {
        type: 'number',
        required: true,
        min: 1,
        max: 1000
      },
      seed: {
        type: 'integer',
        default: 12345
      }
    });

    const params = {
      width: 500,
      height: 300
    };

    const result = ParameterValidator.validate(params, schema);
    expect(result.valid).toBeTruthy();
    expect(result.validated.width).toBe(500);
    expect(result.validated.height).toBe(300);
    expect(result.validated.seed).toBe(12345); // Default applied
  });

  it('should detect missing required parameters', () => {
    const schema = ParameterValidator.schema({
      name: {
        type: 'string',
        required: true
      }
    });

    const result = ParameterValidator.validate({}, schema);
    expect(result.valid).toBeFalsy();
    expect(result.errors).toContain('Missing required parameter: name');
  });

  it('should validate type constraints', () => {
    const schema = ParameterValidator.schema({
      count: {
        type: 'integer'
      },
      ratio: {
        type: 'number'
      },
      label: {
        type: 'string'
      },
      enabled: {
        type: 'boolean'
      }
    });

    const invalidParams = {
      count: 3.14,        // Should be integer
      ratio: 'not a number',
      label: 123,         // Should be string
      enabled: 'yes'      // Should be boolean
    };

    const result = ParameterValidator.validate(invalidParams, schema);
    expect(result.valid).toBeFalsy();
    expect(result.errors.length).toBe(4);
  });

  it('should validate range constraints', () => {
    const schema = ParameterValidator.schema({
      age: {
        type: 'number',
        min: 0,
        max: 150
      }
    });

    const tooLow = ParameterValidator.validate({ age: -5 }, schema);
    expect(tooLow.valid).toBeFalsy();
    expect(tooLow.errors[0]).toContain('must be >= 0');

    const tooHigh = ParameterValidator.validate({ age: 200 }, schema);
    expect(tooHigh.valid).toBeFalsy();
    expect(tooHigh.errors[0]).toContain('must be <= 150');

    const justRight = ParameterValidator.validate({ age: 25 }, schema);
    expect(justRight.valid).toBeTruthy();
  });

  it('should validate enum values', () => {
    const schema = ParameterValidator.schema({
      mode: {
        type: 'string',
        enum: ['easy', 'medium', 'hard']
      }
    });

    const valid = ParameterValidator.validate({ mode: 'medium' }, schema);
    expect(valid.valid).toBeTruthy();

    const invalid = ParameterValidator.validate({ mode: 'extreme' }, schema);
    expect(invalid.valid).toBeFalsy();
    expect(invalid.errors[0]).toContain('must be one of: easy, medium, hard');
  });

  it('should apply custom validation', () => {
    const schema = ParameterValidator.schema({
      email: {
        type: 'string',
        validate: (value) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value) || 'Invalid email format';
        }
      }
    });

    const valid = ParameterValidator.validate({ email: 'test@example.com' }, schema);
    expect(valid.valid).toBeTruthy();

    const invalid = ParameterValidator.validate({ email: 'not-an-email' }, schema);
    expect(invalid.valid).toBeFalsy();
    expect(invalid.errors[0]).toContain('Invalid email format');
  });

  it('should warn about unusual values', () => {
    const schema = ParameterValidator.schema({
      iterations: {
        type: 'integer',
        min: 1,
        max: 10000,
        typical: [10, 100]
      }
    });

    const result = ParameterValidator.validate({ iterations: 5000 }, schema);
    expect(result.valid).toBeTruthy();
    expect(result.warnings.length).toBe(1);
    expect(result.warnings[0]).toContain('outside typical range');
  });

  it('should apply coercion', () => {
    const schema = ParameterValidator.schema({
      count: {
        type: 'integer',
        coerce: (value) => Math.round(value)
      },
      name: {
        type: 'string',
        coerce: (value) => value.trim().toLowerCase()
      }
    });

    const result = ParameterValidator.validate({
      count: 3.7,
      name: '  HELLO WORLD  '
    }, schema);

    expect(result.valid).toBeTruthy();
    expect(result.validated.count).toBe(4);
    expect(result.validated.name).toBe('hello world');
  });

  it('should generate test cases from schema', () => {
    const schema = ParameterValidator.schema({
      x: {
        type: 'number',
        required: true,
        min: 0,
        max: 100
      },
      y: {
        type: 'number',
        required: true,
        min: 0,
        max: 100
      },
      color: {
        type: 'string',
        default: 'black'
      }
    });

    const testCases = ParameterValidator.generateTestCases(schema);
    
    // Should include base case
    const baseCase = testCases.find(tc => tc.name === 'Base case');
    expect(baseCase).toBeDefined();
    expect(baseCase.expectValid).toBeTruthy();

    // Should include missing required tests
    const missingX = testCases.find(tc => tc.name.includes('Missing required: x'));
    expect(missingX).toBeDefined();
    expect(missingX.expectValid).toBeFalsy();

    // Should include out of range tests
    const belowMin = testCases.find(tc => tc.name.includes('below minimum'));
    expect(belowMin).toBeDefined();
    expect(belowMin.expectValid).toBeFalsy();
  });

  it('should use common parameter definitions', () => {
    const schema = ParameterValidator.schema({
      seed: ParameterValidator.common.seed,
      width: ParameterValidator.common.width,
      height: ParameterValidator.common.height,
      margin: ParameterValidator.common.margin
    });

    const result = ParameterValidator.validate({
      width: 800,
      height: 600
    }, schema);

    expect(result.valid).toBeTruthy();
    expect(result.validated.margin).toBe(20); // Default from common
    expect(typeof result.validated.seed).toBe('number'); // Dynamic default
  });

  it('should generate documentation from schema', () => {
    const schema = ParameterValidator.schema({
      radius: {
        type: 'number',
        description: 'Circle radius',
        required: true,
        min: 1,
        max: 100,
        default: 10,
        example: 25
      }
    });

    const docs = schema.toDocumentation();
    expect(docs).toContain('Parameters:');
    expect(docs).toContain('radius:');
    expect(docs).toContain('Circle radius');
    expect(docs).toContain('[required]');
    expect(docs).toContain('Range: min: 1, max: 100');
    expect(docs).toContain('Default: 10');
    expect(docs).toContain('Example: 25');
  });
});
/**
 * Unit tests for SVG validation utilities
 */

describe('SVG Validation', () => {
  it('should validate a simple SVG', () => {
    const svg = '<svg width="100" height="100"><path d="M 10 10 L 90 90" stroke="black" fill="none"/></svg>';
    const result = SVGValidator.isValidSVG(svg);
    expect(result.valid).toBeTruthy();
  });

  it('should reject invalid SVG', () => {
    const svg = '<svg><invalid></svg>';
    const result = SVGValidator.isValidSVG(svg);
    expect(result.valid).toBeFalsy();
  });

  it('should extract paths from SVG', () => {
    const svg = `
      <svg width="100" height="100">
        <path d="M 10 10 L 90 90" stroke="black" fill="none"/>
        <path d="M 90 10 L 10 90" stroke="red" fill="none"/>
      </svg>
    `;
    const paths = SVGValidator.extractPaths(svg);
    expect(paths).toHaveLength(2);
    expect(paths[0].stroke).toBe('black');
    expect(paths[1].stroke).toBe('red');
  });

  it('should count path commands', () => {
    const svg = `
      <svg width="100" height="100">
        <path d="M 10 10 L 50 50 L 90 90 Z" stroke="black"/>
        <path d="M 0 0 C 20 20 80 20 100 0" stroke="blue"/>
      </svg>
    `;
    const count = SVGValidator.countPathCommands(svg);
    expect(count).toBe(6); // M + L + L + Z + M + C
  });

  it('should get SVG dimensions', () => {
    const svg = '<svg width="200" height="150" viewBox="0 0 200 150"></svg>';
    const dimensions = SVGValidator.getDimensions(svg);
    expect(dimensions.width).toBe(200);
    expect(dimensions.height).toBe(150);
    expect(dimensions.viewBox).toBe('0 0 200 150');
  });

  it('should validate SVG for pen plotter', () => {
    const goodSvg = `
      <svg width="100" height="100">
        <path d="M 10 10 L 90 90" stroke="black" fill="none"/>
      </svg>
    `;
    const result = SVGValidator.validateForPenPlotter(goodSvg);
    expect(result.valid).toBeTruthy();
    expect(result.issues).toHaveLength(0);
  });

  it('should detect pen plotter issues', () => {
    const badSvg = `
      <svg width="100" height="100">
        <path d="M 10 10 L 90 90" fill="red"/>
        <path d="M 0 0 L 100 100" stroke="none"/>
      </svg>
    `;
    const result = SVGValidator.validateForPenPlotter(badSvg);
    expect(result.valid).toBeFalsy();
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('should compare similar SVGs', () => {
    const svg1 = '<svg width="100" height="100"><path d="M 10.0 10.0 L 90.0 90.0" stroke="black"/></svg>';
    const svg2 = '<svg width="100" height="100"><path d="M 10.00 10.00 L 90.00 90.00" stroke="black"/></svg>';
    const result = SVGValidator.compareSVGs(svg1, svg2);
    expect(result.similar).toBeTruthy();
  });

  it('should detect different SVGs', () => {
    const svg1 = '<svg width="100" height="100"><path d="M 10 10 L 90 90" stroke="black"/></svg>';
    const svg2 = '<svg width="100" height="100"><path d="M 20 20 L 80 80" stroke="black"/></svg>';
    const result = SVGValidator.compareSVGs(svg1, svg2);
    expect(result.similar).toBeFalsy();
  });
});
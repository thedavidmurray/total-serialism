/**
 * Algorithm Wrappers
 * Provides wrapper functions for existing HTML-based algorithms
 */

import { AlgorithmWrapper, AlgorithmMetadata } from '../registry';

// Base path to algorithms directory (adjust based on your project structure)
const ALGORITHMS_BASE_PATH = '../../../algorithms';

/**
 * Flow Fields Wrapper
 */
export const flowFieldWrapper: AlgorithmWrapper = {
  metadata: {
    id: 'flow-field-p5',
    name: 'Flow Field',
    description: 'Creates organic, flowing patterns using Perlin noise-based vector fields',
    category: 'vector-fields',
    tags: ['flow', 'perlin-noise', 'organic', 'p5js', 'interactive'],
    htmlPath: `${ALGORITHMS_BASE_PATH}/flow-fields/flow-field-p5-gui.html`,
    parameters: {
      noiseScale: { type: 'number', default: 0.01, min: 0.001, max: 0.1 },
      particleCount: { type: 'number', default: 1000, min: 100, max: 5000 },
      speed: { type: 'number', default: 2, min: 0.1, max: 10 }
    }
  }
};

/**
 * Cellular Automata Wrappers
 */
export const gameOfLifeWrapper: AlgorithmWrapper = {
  metadata: {
    id: 'game-of-life',
    name: 'Game of Life',
    description: "Conway's Game of Life - a cellular automaton with simple rules that create complex patterns",
    category: 'cellular-automata',
    tags: ['cellular-automata', 'conway', 'emergent', 'grid-based', 'layers'],
    htmlPath: `${ALGORITHMS_BASE_PATH}/cellular-automata/game-of-life-layers.html`,
    parameters: {
      gridSize: { type: 'number', default: 50, min: 10, max: 200 },
      cellSize: { type: 'number', default: 10, min: 2, max: 50 },
      updateSpeed: { type: 'number', default: 100, min: 10, max: 1000 }
    }
  }
};

export const elementaryCAWrapper: AlgorithmWrapper = {
  metadata: {
    id: 'elementary-ca',
    name: 'Elementary Cellular Automata',
    description: 'One-dimensional cellular automata with various rule sets creating intricate patterns',
    category: 'cellular-automata',
    tags: ['cellular-automata', 'wolfram', '1D', 'rules', 'patterns'],
    htmlPath: `${ALGORITHMS_BASE_PATH}/cellular-automata/elementary-ca-layers.html`,
    parameters: {
      rule: { type: 'number', default: 30, min: 0, max: 255 },
      cellSize: { type: 'number', default: 4, min: 1, max: 20 }
    }
  }
};

/**
 * Physics Particle System Wrapper
 */
export const particleSystemWrapper: AlgorithmWrapper = {
  metadata: {
    id: 'particle-system',
    name: 'Physics Particle System',
    description: 'Simulates particles with physics properties like gravity, attraction, and repulsion',
    category: 'physics-simulation',
    tags: ['physics', 'particles', 'forces', 'simulation', 'interactive'],
    htmlPath: `${ALGORITHMS_BASE_PATH}/physics/particle-system-gui.html`,
    parameters: {
      particleCount: { type: 'number', default: 500, min: 10, max: 2000 },
      gravity: { type: 'number', default: 0.1, min: -1, max: 1 },
      friction: { type: 'number', default: 0.99, min: 0.9, max: 1 },
      attractionStrength: { type: 'number', default: 0.001, min: 0, max: 0.01 }
    }
  }
};

/**
 * Reaction Diffusion Wrappers
 */
export const reactionDiffusionWrapper: AlgorithmWrapper = {
  metadata: {
    id: 'reaction-diffusion',
    name: 'Reaction Diffusion',
    description: 'Simulates chemical reactions creating organic, coral-like patterns',
    category: 'chemical-simulation',
    tags: ['reaction-diffusion', 'gray-scott', 'organic', 'patterns', 'simulation'],
    htmlPath: `${ALGORITHMS_BASE_PATH}/reaction-diffusion/reaction-diffusion-enhanced.html`,
    parameters: {
      feedRate: { type: 'number', default: 0.055, min: 0.01, max: 0.1 },
      killRate: { type: 'number', default: 0.062, min: 0.045, max: 0.07 },
      diffusionRateA: { type: 'number', default: 1.0, min: 0.8, max: 1.2 },
      diffusionRateB: { type: 'number', default: 0.5, min: 0.3, max: 0.7 }
    }
  }
};

export const reactionDiffusionLayersWrapper: AlgorithmWrapper = {
  metadata: {
    id: 'reaction-diffusion-layers',
    name: 'Reaction Diffusion (Layered)',
    description: 'Multi-layer reaction diffusion with color mapping and blending',
    category: 'chemical-simulation',
    tags: ['reaction-diffusion', 'layers', 'color', 'blending', 'advanced'],
    htmlPath: `${ALGORITHMS_BASE_PATH}/reaction-diffusion/reaction-diffusion-layers.html`
  }
};

/**
 * Tree and L-System Wrappers
 */
export const treeGeneratorWrapper: AlgorithmWrapper = {
  metadata: {
    id: 'tree-generator',
    name: 'Tree Generator',
    description: 'Generates organic tree structures using recursive branching algorithms',
    category: 'l-systems',
    tags: ['trees', 'branching', 'recursive', 'organic', 'nature'],
    htmlPath: `${ALGORITHMS_BASE_PATH}/trees-lsystems/tree-gui.html`,
    parameters: {
      branchAngle: { type: 'number', default: 25, min: 10, max: 45 },
      branchLength: { type: 'number', default: 0.67, min: 0.5, max: 0.9 },
      maxDepth: { type: 'number', default: 10, min: 3, max: 15 }
    }
  }
};

export const lSystemWrapper: AlgorithmWrapper = {
  metadata: {
    id: 'l-system',
    name: 'L-System Generator',
    description: 'Creates complex patterns using Lindenmayer systems (L-systems)',
    category: 'l-systems',
    tags: ['l-system', 'fractal', 'grammar', 'recursive', 'patterns'],
    htmlPath: `${ALGORITHMS_BASE_PATH}/trees-lsystems/lsystem-simple.html`,
    parameters: {
      axiom: { type: 'string', default: 'F' },
      rules: { type: 'object', default: { 'F': 'F+F-F-F+F' } },
      angle: { type: 'number', default: 90, min: 0, max: 360 },
      iterations: { type: 'number', default: 4, min: 1, max: 8 }
    }
  }
};

/**
 * Helper function to create a wrapper with custom initialization
 */
export function createAlgorithmWrapper(
  metadata: AlgorithmMetadata,
  customHandlers?: {
    initialize?: () => Promise<void>;
    render?: (canvas: HTMLCanvasElement, params?: Record<string, any>) => void;
    cleanup?: () => void;
  }
): AlgorithmWrapper {
  return {
    metadata,
    ...customHandlers
  };
}

/**
 * Get all default algorithm wrappers
 */
export function getAllDefaultWrappers(): AlgorithmWrapper[] {
  return [
    flowFieldWrapper,
    gameOfLifeWrapper,
    elementaryCAWrapper,
    particleSystemWrapper,
    reactionDiffusionWrapper,
    reactionDiffusionLayersWrapper,
    treeGeneratorWrapper,
    lSystemWrapper
  ];
}

/**
 * Create wrapper for custom HTML algorithm
 */
export function createHTMLAlgorithmWrapper(
  metadata: Omit<AlgorithmMetadata, 'htmlPath'>,
  htmlPath: string
): AlgorithmWrapper {
  return {
    metadata: {
      ...metadata,
      htmlPath
    }
  };
}
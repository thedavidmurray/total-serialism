/**
 * Algorithm Registry Usage Example
 * Demonstrates how to use the algorithm registry system
 */

import { algorithmRegistry } from '../src/registry';
import { 
  getAllDefaultWrappers,
  createHTMLAlgorithmWrapper,
  flowFieldWrapper,
  gameOfLifeWrapper
} from '../src/wrappers';

// Example 1: Register all default algorithms
function registerDefaultAlgorithms() {
  console.log('Registering default algorithms...');
  const wrappers = getAllDefaultWrappers();
  algorithmRegistry.registerMany(wrappers);
  
  console.log(`Registered ${wrappers.length} algorithms`);
  console.log('Categories:', algorithmRegistry.getCategories());
}

// Example 2: List all algorithms
function listAllAlgorithms() {
  console.log('\nAll registered algorithms:');
  const algorithms = algorithmRegistry.list();
  
  algorithms.forEach(alg => {
    console.log(`- ${alg.name} (${alg.id})`);
    console.log(`  Category: ${alg.category}`);
    console.log(`  Tags: ${alg.tags.join(', ')}`);
  });
}

// Example 3: Search algorithms
function searchAlgorithms() {
  console.log('\nSearching for "particle" algorithms:');
  const results = algorithmRegistry.search('particle');
  
  results.forEach(alg => {
    console.log(`- ${alg.name}: ${alg.description}`);
  });
}

// Example 4: Get algorithms by category
function getByCategory() {
  console.log('\nCellular Automata algorithms:');
  const cellularAutomata = algorithmRegistry.listByCategory('cellular-automata');
  
  cellularAutomata.forEach(alg => {
    console.log(`- ${alg.name} (${alg.id})`);
  });
}

// Example 5: Get a specific algorithm
function getSpecificAlgorithm() {
  console.log('\nGetting Flow Field algorithm:');
  const flowField = algorithmRegistry.get('flow-field-p5');
  
  if (flowField) {
    console.log('Found:', flowField.metadata.name);
    console.log('Parameters:', flowField.metadata.parameters);
  }
}

// Example 6: Register a custom algorithm
function registerCustomAlgorithm() {
  console.log('\nRegistering custom algorithm:');
  
  const customWrapper = createHTMLAlgorithmWrapper(
    {
      id: 'custom-spiral',
      name: 'Custom Spiral Generator',
      description: 'Generates mathematical spirals with customizable parameters',
      category: 'mathematical',
      tags: ['spiral', 'mathematical', 'parametric', 'custom'],
      parameters: {
        spiralType: { 
          type: 'select', 
          options: ['archimedean', 'logarithmic', 'fibonacci'],
          default: 'archimedean'
        },
        turns: { type: 'number', default: 10, min: 1, max: 50 },
        spacing: { type: 'number', default: 5, min: 1, max: 20 }
      }
    },
    '/path/to/custom-spiral.html'
  );
  
  algorithmRegistry.register(customWrapper);
  console.log('Custom algorithm registered successfully');
}

// Example 7: Dynamic HTML loading
async function dynamicLoadExample() {
  console.log('\nDynamic loading example:');
  
  await algorithmRegistry.loadFromHTML(
    '/algorithms/custom/my-algorithm.html',
    {
      id: 'dynamic-algorithm',
      name: 'Dynamically Loaded Algorithm',
      description: 'An algorithm loaded at runtime',
      category: 'experimental',
      tags: ['dynamic', 'experimental']
    }
  );
  
  console.log('Algorithm loaded dynamically');
}

// Example 8: Get registry statistics
function getStats() {
  console.log('\nRegistry Statistics:');
  const stats = algorithmRegistry.getStats();
  
  console.log(`Total algorithms: ${stats.totalAlgorithms}`);
  console.log('Algorithms per category:');
  
  Object.entries(stats.categoryCounts).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });
}

// Example 9: Using algorithm in a web page
function webPageUsageExample() {
  // This would be in your HTML/JavaScript
  const exampleHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Algorithm Registry Demo</title>
</head>
<body>
  <h1>Algorithm Gallery</h1>
  <div id="algorithm-list"></div>
  <div id="algorithm-display"></div>
  
  <script type="module">
    import { algorithmRegistry } from './packages/algorithms/src/registry.js';
    import { getAllDefaultWrappers } from './packages/algorithms/src/wrappers/index.js';
    
    // Register algorithms
    algorithmRegistry.registerMany(getAllDefaultWrappers());
    
    // Display algorithm list
    const listDiv = document.getElementById('algorithm-list');
    const algorithms = algorithmRegistry.list();
    
    algorithms.forEach(alg => {
      const button = document.createElement('button');
      button.textContent = alg.name;
      button.onclick = () => loadAlgorithm(alg.id);
      listDiv.appendChild(button);
    });
    
    // Load algorithm function
    function loadAlgorithm(id) {
      const algorithm = algorithmRegistry.get(id);
      if (algorithm) {
        const displayDiv = document.getElementById('algorithm-display');
        displayDiv.innerHTML = \`
          <h2>\${algorithm.metadata.name}</h2>
          <p>\${algorithm.metadata.description}</p>
          <iframe src="\${algorithm.metadata.htmlPath}" width="800" height="600"></iframe>
        \`;
      }
    }
  </script>
</body>
</html>
  `;
  
  console.log('\nExample HTML usage:');
  console.log(exampleHTML);
}

// Example 10: TypeScript usage with type safety
function typeScriptExample() {
  // Get algorithm with type safety
  const algorithm = algorithmRegistry.get('flow-field-p5');
  
  if (algorithm) {
    // Access metadata with full type information
    const { id, name, category, parameters } = algorithm.metadata;
    
    // Parameters are typed
    if (parameters?.noiseScale) {
      const noiseScale = parameters.noiseScale as {
        type: string;
        default: number;
        min: number;
        max: number;
      };
      
      console.log(`Noise scale range: ${noiseScale.min} - ${noiseScale.max}`);
    }
  }
}

// Run all examples
async function runExamples() {
  registerDefaultAlgorithms();
  listAllAlgorithms();
  searchAlgorithms();
  getByCategory();
  getSpecificAlgorithm();
  registerCustomAlgorithm();
  await dynamicLoadExample();
  getStats();
  webPageUsageExample();
  typeScriptExample();
}

// Execute if running directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export { runExamples };
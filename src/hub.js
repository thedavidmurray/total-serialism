// Algorithm Registry
const algorithms = [
    // Hybrid Algorithms
    {
        name: "Hybrid Composer",
        category: "hybrid",
        description: "Combine multiple algorithms into unique hybrid patterns",
        path: "algorithms/hybrid/hybrid-composer-gui.html",
        tags: ["experimental", "composite", "layers"],
        difficulty: "advanced",
        preview: "🔀"
    },

    // Cellular Automata
    {
        name: "Game of Life",
        category: "cellular-automata",
        description: "Conway's Game of Life with customizable patterns and rendering styles",
        path: "algorithms/cellular-automata/game-of-life-gui.html",
        tags: ["interactive", "patterns", "evolution"],
        difficulty: "beginner",
        preview: "🦠"
    },
    {
        name: "Elementary CA",
        category: "cellular-automata",
        description: "Elementary cellular automata with rule exploration",
        path: "algorithms/cellular-automata/elementary-ca.html",
        tags: ["rules", "patterns", "1D"],
        difficulty: "beginner",
        preview: "▓▒░"
    },
    {
        name: "Elementary CA Layers",
        category: "cellular-automata",
        description: "Layered elementary cellular automata for complex patterns",
        path: "algorithms/cellular-automata/elementary-ca-layers.html",
        tags: ["layers", "complex", "patterns"],
        difficulty: "intermediate",
        preview: "≡"
    },
    {
        name: "Game of Life Layers",
        category: "cellular-automata",
        description: "Multi-layer Game of Life with interaction between layers",
        path: "algorithms/cellular-automata/game-of-life-layers.html",
        tags: ["layers", "interactive", "complex"],
        difficulty: "advanced",
        preview: "🧬"
    },

    // Flow Fields
    {
        name: "Flow Field GUI",
        category: "flow-fields",
        description: "Interactive flow field generator with Perlin noise",
        path: "algorithms/flow-fields/flow-field-p5-gui.html",
        tags: ["perlin", "particles", "interactive"],
        difficulty: "intermediate",
        preview: "〰️"
    },
    {
        name: "Flow Field with Collision",
        category: "flow-fields",
        description: "Enhanced flow field with collision detection and path avoidance",
        path: "algorithms/flow-fields/flow-field-collision.html",
        tags: ["collision", "avoidance", "particles", "advanced"],
        difficulty: "advanced",
        preview: "🛡️"
    },

    // Physics
    {
        name: "Particle System",
        category: "physics",
        description: "Physics-based particle system with forces and constraints",
        path: "algorithms/physics/particle-system-gui.html",
        tags: ["forces", "particles", "simulation"],
        difficulty: "intermediate",
        preview: "⚛️"
    },

    // Reaction-Diffusion
    {
        name: "Reaction-Diffusion",
        category: "reaction-diffusion",
        description: "Gray-Scott reaction-diffusion system",
        path: "algorithms/reaction-diffusion/reaction-diffusion-gui.html",
        tags: ["organic", "patterns", "chemical"],
        difficulty: "advanced",
        preview: "🌊"
    },
    {
        name: "RD Enhanced",
        category: "reaction-diffusion",
        description: "Enhanced reaction-diffusion with advanced controls",
        path: "algorithms/reaction-diffusion/reaction-diffusion-enhanced.html",
        tags: ["advanced", "organic", "controls"],
        difficulty: "advanced",
        preview: "🎨"
    },
    {
        name: "RD Layers",
        category: "reaction-diffusion",
        description: "Multi-layer reaction-diffusion system",
        path: "algorithms/reaction-diffusion/reaction-diffusion-layers.html",
        tags: ["layers", "complex", "organic"],
        difficulty: "expert",
        preview: "🔬"
    },

    // Trees & L-Systems
    {
        name: "Tree Generator",
        category: "trees",
        description: "Recursive tree generator with branching controls",
        path: "algorithms/trees-lsystems/tree-gui.html",
        tags: ["recursive", "nature", "branching"],
        difficulty: "beginner",
        preview: "🌳"
    },
    {
        name: "L-System Simple",
        category: "trees",
        description: "Simple L-System implementation",
        path: "algorithms/trees-lsystems/lsystem-simple.html",
        tags: ["l-systems", "grammar", "fractal"],
        difficulty: "intermediate",
        preview: "🌿"
    },

    // Geometric Patterns
    {
        name: "10PRINT Pattern",
        category: "geometric",
        description: "Classic 10PRINT maze pattern with variations",
        path: "algorithms/geometric/10print-gui.html",
        tags: ["classic", "maze", "pattern"],
        difficulty: "beginner",
        preview: "╱╲"
    },
    {
        name: "Perlin Circles",
        category: "geometric",
        description: "Circles distorted by Perlin noise for organic patterns",
        path: "algorithms/geometric/perlin-circles-gui.html",
        tags: ["noise", "organic", "circles"],
        difficulty: "intermediate",
        preview: "◯"
    },
    {
        name: "Circle Rays",
        category: "geometric",
        description: "Radial patterns with customizable ray styles",
        path: "algorithms/geometric/circle-rays-gui.html",
        tags: ["radial", "mandala", "rays"],
        difficulty: "beginner",
        preview: "✦"
    },
    {
        name: "Snowflakes",
        category: "geometric",
        description: "Procedural snowflake generator with 6-fold symmetry",
        path: "algorithms/geometric/snowflakes-gui.html",
        tags: ["fractal", "nature", "symmetry"],
        difficulty: "intermediate",
        preview: "❄️"
    },
    {
        name: "Perlin Landscape",
        category: "geometric",
        description: "Topographical contour lines from Perlin noise",
        path: "algorithms/geometric/perlin-landscape-gui.html",
        tags: ["terrain", "contours", "noise"],
        difficulty: "advanced",
        preview: "🏔️"
    },
    {
        name: "Grid Landscape",
        category: "geometric",
        description: "3D terrain visualization on a grid",
        path: "algorithms/geometric/grid-landscape-gui.html",
        tags: ["3D", "terrain", "grid"],
        difficulty: "advanced",
        preview: "⛰️"
    },
    {
        name: "Spirotron",
        category: "geometric",
        description: "Spirograph pattern generator with compound wheels",
        path: "algorithms/geometric/spirotron-gui.html",
        tags: ["spirograph", "mathematical", "curves"],
        difficulty: "intermediate",
        preview: "🌸"
    },
    {
        name: "Hash Tiles",
        category: "geometric",
        description: "Algorithmic tile patterns based on hash functions",
        path: "algorithms/geometric/hash-tiles-gui.html",
        tags: ["tiles", "hash", "grid", "patterns"],
        difficulty: "intermediate",
        preview: "⬚"
    },
    {
        name: "Perlin Spiral",
        category: "geometric",
        description: "Spiral patterns with Perlin noise variations",
        path: "algorithms/geometric/perlin-spiral-gui.html",
        tags: ["spiral", "noise", "curves"],
        difficulty: "intermediate",
        preview: "🌀"
    },
    {
        name: "Circle Twist Layers",
        category: "geometric",
        description: "Layered circular patterns with twisting effects",
        path: "algorithms/geometric/circle-twist-gui.html",
        tags: ["circles", "layers", "twist"],
        difficulty: "intermediate",
        preview: "🔄"
    },

    // Textures & Hatching
    {
        name: "Hatching Library",
        category: "textures",
        description: "Comprehensive hatching and texture patterns for pen plotting",
        path: "algorithms/textures/hatching-demo.html",
        tags: ["hatching", "textures", "fills"],
        difficulty: "intermediate",
        preview: "▤"
    },

    // Image Processing
    {
        name: "SquiggleCam",
        category: "image-processing",
        description: "Convert images to squiggly line art based on brightness",
        path: "algorithms/image-processing/squigglecam.html",
        tags: ["image", "brightness", "squiggles", "photo"],
        difficulty: "intermediate",
        preview: "〰️"
    },
    {
        name: "Hatching",
        category: "image-processing",
        description: "Convert images to various hatching patterns",
        path: "algorithms/image-processing/hatching.html",
        tags: ["image", "hatching", "crosshatch", "stipple", "contour"],
        difficulty: "intermediate",
        preview: "▤"
    },
    {
        name: "Halftone",
        category: "image-processing",
        description: "Convert images to halftone circle and shape patterns",
        path: "algorithms/image-processing/halftone.html",
        tags: ["image", "halftone", "circles", "dots", "shapes"],
        difficulty: "beginner",
        preview: "⚫"
    },

    // Natural Phenomena
    {
        name: "Lightning",
        category: "natural",
        description: "Dielectric breakdown simulation for lightning patterns",
        path: "algorithms/natural/lightning-gui.html",
        tags: ["lightning", "electricity", "branches"],
        difficulty: "intermediate",
        preview: "⚡"
    },
    {
        name: "Crystal Growth",
        category: "natural",
        description: "Diffusion-limited aggregation crystal formation",
        path: "algorithms/natural/crystal-growth-gui.html",
        tags: ["crystals", "DLA", "growth"],
        difficulty: "advanced",
        preview: "❄️"
    },
    {
        name: "Coral Growth",
        category: "natural",
        description: "Organic coral and lichen growth patterns",
        path: "algorithms/natural/coral-growth-gui.html",
        tags: ["coral", "organic", "growth"],
        difficulty: "intermediate",
        preview: "🪸"
    },
    {
        name: "Astronomy",
        category: "natural",
        description: "Star maps, constellations, and celestial mechanics",
        path: "algorithms/natural/astronomy-gui.html",
        tags: ["stars", "planets", "space"],
        difficulty: "intermediate",
        preview: "✨"
    },

    // Symmetry Patterns
    {
        name: "Zellige Pattern",
        category: "symmetry",
        description: "Traditional Moroccan geometric tilework with 8-fold symmetry",
        path: "algorithms/symmetry/zellige-pattern.html",
        tags: ["moroccan", "tiles", "8-fold", "geometric"],
        difficulty: "intermediate",
        preview: "🕌"
    },
    {
        name: "Kumiko Pattern",
        category: "symmetry",
        description: "Japanese woodwork patterns without nails or glue",
        path: "algorithms/symmetry/kumiko-pattern.html",
        tags: ["japanese", "woodwork", "lattice", "traditional"],
        difficulty: "intermediate",
        preview: "⛩️"
    },

    // Tools
    {
        name: "Path Optimizer",
        category: "tools",
        description: "Optimize paths for efficient pen plotting",
        path: "algorithms/tools/path-optimizer-gui.html",
        tags: ["optimization", "TSP", "efficiency"],
        difficulty: "beginner",
        preview: "🔧"
    },
    {
        name: "Debug Preview",
        category: "tools",
        description: "Visualize pen plotter movements with travel paths and statistics",
        path: "algorithms/tools/debug-preview-gui.html",
        tags: ["debug", "preview", "visualization", "travel"],
        difficulty: "intermediate",
        preview: "🔍"
    },
    {
        name: "Plotter Export",
        category: "tools",
        description: "Export to G-code and HPGL with preview",
        path: "algorithms/tools/plotter-export-gui.html",
        tags: ["export", "gcode", "hpgl"],
        difficulty: "beginner",
        preview: "📤"
    }
];

// DOM Elements
const grid = document.getElementById('algorithms-grid');
const searchInput = document.getElementById('search');
const filterButtons = document.querySelectorAll('.filter-btn');
const themeToggle = document.getElementById('theme-toggle');
const gridToggle = document.getElementById('grid-toggle');

// State
let currentFilter = 'all';
let currentSearch = '';
let isDarkTheme = localStorage.getItem('theme') === 'dark' || 
                  (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    renderAlgorithms();
    setupEventListeners();
});

// Render functions
function renderAlgorithms() {
    const filtered = filterAlgorithms();
    grid.innerHTML = '';
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="no-results">No algorithms found matching your criteria</div>';
        return;
    }
    
    filtered.forEach(algo => {
        const card = createAlgorithmCard(algo);
        grid.appendChild(card);
    });
}

function createAlgorithmCard(algo) {
    const card = document.createElement('div');
    card.className = `algorithm-card ${algo.difficulty}`;
    card.dataset.category = algo.category;
    
    card.innerHTML = `
        <div class="card-header">
            <span class="preview">${algo.preview}</span>
            <span class="difficulty-badge">${algo.difficulty}</span>
        </div>
        <h3>${algo.name}</h3>
        <p>${algo.description}</p>
        <div class="tags">
            ${algo.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <a href="${algo.path}" class="card-link">Open Algorithm</a>
    `;
    
    // Add click handler for the entire card
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('card-link')) {
            window.location.href = algo.path;
        }
    });
    
    return card;
}

// Filter functions
function filterAlgorithms() {
    return algorithms.filter(algo => {
        const matchesCategory = currentFilter === 'all' || algo.category === currentFilter;
        const matchesSearch = currentSearch === '' || 
            algo.name.toLowerCase().includes(currentSearch.toLowerCase()) ||
            algo.description.toLowerCase().includes(currentSearch.toLowerCase()) ||
            algo.tags.some(tag => tag.toLowerCase().includes(currentSearch.toLowerCase()));
        
        return matchesCategory && matchesSearch;
    });
}

// Event handlers
function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderAlgorithms();
    });
    
    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderAlgorithms();
        });
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', () => {
        isDarkTheme = !isDarkTheme;
        localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
        applyTheme();
    });
    
    // Grid toggle
    gridToggle.addEventListener('click', () => {
        grid.classList.toggle('grid-view');
        grid.classList.toggle('list-view');
    });
}

// Theme management
function applyTheme() {
    document.body.classList.toggle('dark-theme', isDarkTheme);
    document.body.classList.toggle('light-theme', !isDarkTheme);
}
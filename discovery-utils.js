(function initTSDiscovery(global) {
  const complexityOrder = ['beginner', 'intermediate', 'advanced'];
  const mediumLabels = {
    plotter: 'Plotter',
    screen: 'Screen',
    systems: 'Systems',
    tools: 'Tools',
  };
  const readinessLabels = {
    native: 'Plotter Native',
    adaptable: 'Plotter Adaptable',
    'screen-first': 'Screen First',
    tool: 'Tooling',
  };
  const toolDescriptions = {
    'plotter-export': 'Normalize imported SVG or screen-first output into cleaner plotter geometry.',
    'plotter-prep': 'Scale, center, and clean exported SVG before you commit to paper.',
    'path-optimizer': 'Reduce pen-up travel and reorder paths once the composition is locked.',
    'plotter-preview': 'Simulate pen motion, timing, and layer order before plotting.',
    'plot-simulator': 'Quickly preview travel and line order without leaving the browser.',
  };
  const motifPromptMap = {
    aggregation: 'Capture three growth stages and compare which one still reads when reduced to linework.',
    attractor: 'Hold one chaotic parameter steady and sweep only one other control so the structure stays legible.',
    audio: 'Compare a clean signal-driven run against a noisier one before you add any secondary styling.',
    branching: 'Separate the backbone from the fringe growth so the main structure survives simplification.',
    cells: 'Reduce the number of cell states before you increase density so the macro-structure stays readable.',
    collision: 'Compare the same run with collision handling relaxed and strict to see where the form tightens up.',
    contour: 'Cut the contour count down first, then add density back only where the major shapes survive.',
    curves: 'Lock one parameter and sweep one variable family at a time instead of moving every curve control together.',
    directional: 'Force one dominant direction, then add only slight drift so the composition keeps a clear flow.',
    field: 'Switch from fixed angles to a vector field and compare how much coherence you gain or lose.',
    fluid: 'Freeze the motion at three different times and choose the moment with the clearest large-scale flow.',
    grammar: 'Keep the grammar stable and vary recursion depth or turn angle, not both at once.',
    grid: 'Break one axis, spacing, or cell size while keeping the rest of the grid honest.',
    growth: 'Save an early, middle, and late growth pass; the strongest plot is often not the fully grown one.',
    hatching: 'Pair one coarse hatch pass with one fine pass rather than tuning every stroke into the same density.',
    'image-derived': 'Use a higher-contrast source image than you think you need, then reintroduce detail deliberately.',
    interference: 'Offset only one interfering layer at a time so you can see when the pattern starts to hum.',
    lattice: 'Mask the lattice into a frame or border so the edge condition becomes part of the design.',
    lines: 'Compare long sparse lines against short dense lines before you mix both in one composition.',
    'motif-placement': 'Design the motif in isolation first, then tune the spacing and collisions around it.',
    ornament: 'Keep the symmetry rules fixed and vary only spacing or stroke weight until the rhythm clicks.',
    packing: 'Start sparse, then push density until the negative space becomes the real subject.',
    parametric: 'Pick one hero parameter, sweep it hard, and keep the rest of the system nearly fixed.',
    particles: 'Freeze the particle system into a few stills before you decide which stage deserves a full plot.',
    projection: 'Test one orthographic-feeling pass against one more distorted pass before you commit to depth cues.',
    radial: 'Move the anchor off-center and compare how much tension you gain without losing the structure.',
    reaction: 'Reduce thresholds or reaction bands first so the large shapes survive export.',
    routes: 'Turn route optimization off once, then back on, so you can see what motion it is actually erasing.',
    simulation: 'Save a clean baseline run before adding turbulence, randomness, or extra layers.',
    spiral: 'Try one tight spiral family and one looser one so the eye has a clear rhythm to follow.',
    streamlines: 'Compare fewer long streamlines against many short ones before you split layers.',
    surfaces: 'Slice the surface with fewer contour bands first; only add detail once the projection reads.',
    swarm: 'Choose whether you want flock cohesion or collisions to dominate, then tune toward that bias.',
    texture: 'Leave one pass deliberately open so the texture breathes instead of filling every gap.',
    tiling: 'Constrain the tiling with a mask or border instead of letting it fill the page edge to edge.',
    utility: 'Use this as a checkpoint in the workflow rather than the first stop for ideation.',
    wave: 'Double the wavelength or halve the frequency and compare where the pattern becomes readable.',
  };
  const traitPromptMap = {
    angular: 'Contrast a sharper angular pass against a softened one so the edge language stays intentional.',
    braided: 'Try one version where crossings bridge and one where they fully intersect; the difference is structural.',
    botanical: 'Split trunk, stem, or scaffold lines from leaf or bloom detail so the hierarchy stays clear.',
    cellular: 'Dial the cell count down before you dial the noise up; otherwise the macro-pattern disappears.',
    chaotic: 'Clamp one variable hard and let only one other control get wild so the result keeps a spine.',
    configurable: 'Start from one constraint family only, then open up a second family after you save a clean baseline.',
    continuous: 'Prefer fewer longer strokes before you add texture or secondary detail.',
    dense: 'Plot the same system at 60%, 85%, and 100% density to find the readable edge.',
    delicate: 'Increase spacing before lowering stroke weight; otherwise the form disappears too early.',
    directional: 'Choose one dominant flow direction and keep deviations small until the rhythm is established.',
    dynamic: 'Export a calmer version first so you know which motion cues are essential and which are noise.',
    emergent: 'Capture several seeds with the same rules before you start widening the parameter ranges.',
    flowing: 'Compare a more constrained mask against a looser one so the motion has something to push against.',
    functional: 'Treat the tool as a handoff step; validate the output before moving further down the chain.',
    geometric: 'Use a frame or margin system to sharpen the rhythm instead of filling the whole page.',
    'high-contrast': 'Reduce the mark vocabulary until the contrast reads from across the room.',
    hybrid: 'Keep one subsystem dominant and let the secondary system support it instead of competing with it.',
    layered: 'Split the result into two layers and let one carry only the backbone structure.',
    mathematical: 'Print one clean reference version before you start stylizing the system.',
    modular: 'Repeat one clean module first, then add scale or rotation drift after the module earns it.',
    organic: 'Compare a tightly bounded mask against a looser one to control how far the form can wander.',
    precise: 'Test one stricter spacing pass before you add jitter or noise so the base structure stays readable.',
    radial: 'Offset the center slightly to see whether the composition wants symmetry or tension.',
    recursive: 'Lower recursion depth first and only add it back where the silhouette still holds.',
    repetitive: 'Introduce one controlled interruption so the repetition feels deliberate, not accidental.',
    rhythmic: 'Lock the main rhythm, then introduce accent variation in only one parameter family.',
    scientific: 'Make one unstyled analytical version first so you know which data cues are worth preserving.',
    'screen-based': 'Decide early whether this is staying on screen or being translated to pens; the tuning path changes.',
    structured: 'Keep one structural rule constant while you stress-test the others.',
    symmetrical: 'Break symmetry in one controlled region rather than softening it everywhere at once.',
    textural: 'Keep one pass coarse and one pass fine instead of letting all texture land in the middle.',
    turbulent: 'Capture a calmer moment and a wilder moment side by side before choosing which one scales to paper.',
    'web-like': 'Reserve one layer for the main connective tissue and keep the secondary web lighter.',
  };
  const complexityRanks = complexityOrder.reduce((acc, value, index) => {
    acc[value] = index;
    return acc;
  }, {});

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function unique(values) {
    return [...new Set((values || []).filter(Boolean))];
  }

  function asArray(value) {
    if (Array.isArray(value)) {
      return value;
    }
    if (value === undefined || value === null || value === '') {
      return [];
    }
    return [value];
  }

  function overlapCount(left, right) {
    const rightSet = new Set(asArray(right));
    return asArray(left).filter((value) => rightSet.has(value)).length;
  }

  function formatCategory(category) {
    return String(category || '')
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  function getMediumLabel(medium) {
    return mediumLabels[medium] || formatCategory(medium);
  }

  function getPlotterReadinessLabel(readiness) {
    return readinessLabels[readiness] || formatCategory(readiness);
  }

  function toTitleCase(value) {
    return String(value || '')
      .split(/[\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  function buildSearchHaystack(algo, catalog) {
    const category = catalog && catalog.categories ? catalog.categories[algo.category] : null;
    const searchParts = [
      algo.name,
      algo.id,
      algo.description,
      algo.category,
      category && category.name,
      category && category.description,
      algo.complexity,
      algo.medium,
      getMediumLabel(algo.medium),
      algo.plotterReadiness,
      getPlotterReadinessLabel(algo.plotterReadiness),
      algo.colorDependency,
      algo.penCount,
      algo.status,
      ...(algo.tags || []),
      ...(algo.engine || []),
      ...(algo.outputs || []),
      ...(algo.inputs || []),
      ...(algo.motifFamilies || []),
      ...(algo.visualTraits || []),
    ];

    return normalizeText(searchParts.filter(Boolean).join(' '));
  }

  function resolveAlgorithm(catalog, algoOrId) {
    if (!catalog || !Array.isArray(catalog.algorithms)) {
      return null;
    }

    if (typeof algoOrId === 'string') {
      return catalog.algorithms.find((algo) => algo.id === algoOrId) || null;
    }

    if (algoOrId && algoOrId.id) {
      return algoOrId;
    }

    return null;
  }

  function getComplexityDistance(left, right) {
    const leftIndex = complexityOrder.indexOf(left);
    const rightIndex = complexityOrder.indexOf(right);

    if (leftIndex === -1 || rightIndex === -1) {
      return 10;
    }

    return Math.abs(leftIndex - rightIndex);
  }

  function hashString(value) {
    return String(value || '').split('').reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) >>> 0, 7);
  }

  function getComplexityRank(value) {
    return complexityRanks[value] ?? 99;
  }

  function scoreRelationship(reference, candidate) {
    if (!reference || !candidate || reference.id === candidate.id) {
      return -Infinity;
    }

    let score = 0;

    if ((reference.relatedSeeds || []).includes(candidate.id)) {
      score += 40;
    }
    if ((candidate.relatedSeeds || []).includes(reference.id)) {
      score += 20;
    }
    if (reference.medium === candidate.medium) {
      score += 12;
    }
    if (reference.plotterReadiness === candidate.plotterReadiness) {
      score += 10;
    }
    if (reference.category === candidate.category) {
      score += 8;
    }
    if (reference.plotterSafe === candidate.plotterSafe) {
      score += 2;
    }

    score += overlapCount(reference.motifFamilies, candidate.motifFamilies) * 6;
    score += overlapCount(reference.visualTraits, candidate.visualTraits) * 4;
    score += overlapCount(reference.tags, candidate.tags) * 2;
    score += overlapCount(reference.engine, candidate.engine) * 3;
    score += overlapCount(reference.outputs, candidate.outputs) * 3;
    score += overlapCount(reference.inputs, candidate.inputs) * 2;

    const complexityDistance = getComplexityDistance(reference.complexity, candidate.complexity);
    if (complexityDistance === 0) {
      score += 4;
    } else if (complexityDistance === 1) {
      score += 2;
    }

    return score;
  }

  function getRelatedAlgorithms(catalog, referenceId, limit) {
    if (!catalog || !Array.isArray(catalog.algorithms)) {
      return [];
    }

    const reference = catalog.algorithms.find((algo) => algo.id === referenceId);
    if (!reference) {
      return [];
    }

    return catalog.algorithms
      .map((candidate) => ({ candidate, score: scoreRelationship(reference, candidate) }))
      .filter((entry) => Number.isFinite(entry.score) && entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        return left.candidate.name.localeCompare(right.candidate.name);
      })
      .slice(0, limit || 6)
      .map((entry) => entry.candidate);
  }

  function rankAlgorithms(catalog, referenceId) {
    if (!catalog || !Array.isArray(catalog.algorithms)) {
      return [];
    }

    const reference = catalog.algorithms.find((algo) => algo.id === referenceId);
    if (!reference) {
      return [];
    }

    return catalog.algorithms
      .map((candidate) => ({ candidate, score: scoreRelationship(reference, candidate) }))
      .filter((entry) => Number.isFinite(entry.score) && entry.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        return left.candidate.name.localeCompare(right.candidate.name);
      });
  }

  function pickFirst(entries, predicate) {
    const match = entries.find((entry) => predicate(entry.candidate, entry.score));
    return match ? match.candidate : null;
  }

  function getTrailSuggestions(catalog, referenceId) {
    const reference = catalog && Array.isArray(catalog.algorithms)
      ? catalog.algorithms.find((algo) => algo.id === referenceId)
      : null;

    if (!reference) {
      return [];
    }

    const ranked = rankAlgorithms(catalog, referenceId);
    const related = ranked.slice(0, 18);
    const suggestions = [];
    const used = new Set([reference.id]);
    const referenceComplexity = getComplexityRank(reference.complexity);

    function addSuggestion(label, description, predicate) {
      const picked = pickFirst(related, (candidate) => !used.has(candidate.id) && predicate(candidate));
      if (!picked) {
        return;
      }

      used.add(picked.id);
      suggestions.push({ label, description, algo: picked });
    }

    addSuggestion(
      referenceComplexity > 0 ? 'Simpler Route' : 'Start Here',
      referenceComplexity > 0 ? 'Same family, lower setup cost.' : 'Fastest way into this vibe.',
      (candidate) => getComplexityRank(candidate.complexity) <= referenceComplexity - 1
    );

    addSuggestion(
      'Denser Route',
      'Push the structure harder.',
      (candidate) => (candidate.visualTraits || []).includes('dense') || getComplexityRank(candidate.complexity) >= referenceComplexity
    );

    addSuggestion(
      'Preset Route',
      'Good when you want fast iteration.',
      (candidate) => candidate.hasPresets === true
    );

    addSuggestion(
      'Plotter Route',
      'Closest native plotting fit.',
      (candidate) => candidate.plotterReadiness === 'native'
    );

    return suggestions;
  }

  function getSpotlightSections(catalog) {
    if (!catalog || !Array.isArray(catalog.algorithms)) {
      return [];
    }

    const all = catalog.algorithms.filter((algo) => algo.category !== 'tools');
    const byScore = (predicate) => all
      .filter(predicate)
      .sort((left, right) => {
        const leftScore = (left.featured ? 10 : 0) + (left.hasPresets ? 6 : 0) + (left.plotterReadiness === 'native' ? 4 : 0);
        const rightScore = (right.featured ? 10 : 0) + (right.hasPresets ? 6 : 0) + (right.plotterReadiness === 'native' ? 4 : 0);
        if (rightScore !== leftScore) {
          return rightScore - leftScore;
        }
        return left.name.localeCompare(right.name);
      })
      .slice(0, 4);

    return [
      {
        id: 'start',
        title: 'Start Fast',
        description: 'Preset-friendly entries with low friction.',
        algorithms: byScore((algo) => algo.hasPresets && getComplexityRank(algo.complexity) <= 1),
      },
      {
        id: 'plotter',
        title: 'Plotter Native',
        description: 'Safe bets when you want clean line output.',
        algorithms: byScore((algo) => algo.plotterReadiness === 'native' && algo.medium === 'plotter'),
      },
      {
        id: 'systems',
        title: 'Systems Lab',
        description: 'Heavier simulations and emergent structures.',
        algorithms: byScore((algo) => algo.medium === 'systems' || algo.medium === 'screen'),
      },
      {
        id: 'image',
        title: 'Image Driven',
        description: 'Useful when you want to start from source material.',
        algorithms: byScore((algo) => (algo.inputs || []).includes('image')),
      },
    ].filter((section) => section.algorithms.length > 0);
  }

  function getPreviewAccent(algo) {
    const primary = (algo.motifFamilies && algo.motifFamilies[0]) || algo.medium || algo.category || 'plotter';
    const secondary = (algo.visualTraits && algo.visualTraits[0]) || algo.category || 'form';
    return {
      primary,
      secondary,
    };
  }

  function joinSentences(parts, maxParts) {
    return unique(parts)
      .filter(Boolean)
      .slice(0, maxParts || parts.length)
      .join(' ');
  }

  function getPlotterSummary(algo) {
    if (!algo) {
      return '';
    }

    const notes = [];

    if (algo.category === 'tools') {
      notes.push('Workflow utility for preparing, validating, or simulating plotter-ready output.');
    } else if (algo.plotterReadiness === 'native') {
      notes.push('Native fit for pen plotting with minimal translation work.');
    } else if (algo.plotterReadiness === 'adaptable') {
      notes.push('Good plotting candidate, but expect one cleanup pass before final export.');
    } else if (algo.plotterReadiness === 'screen-first') {
      notes.push('Screen-first system; plotting will be an adaptation rather than the default outcome.');
    }

    if ((algo.outputs || []).includes('svg')) {
      notes.push('Direct SVG output is available.');
    } else if ((algo.outputs || []).includes('png')) {
      notes.push('No direct SVG path export was detected, so plan on conversion or SVG prep.');
    }

    if (algo.colorDependency === 'core') {
      notes.push('Color carries structure here, so pen changes or layer mapping need to be explicit.');
    } else if (algo.colorDependency === 'optional') {
      notes.push('Color can be treated as optional layer separation instead of a required part of the form.');
    }

    if (algo.penCount === 'variable') {
      notes.push('Expect multi-pen or multi-layer iteration as part of the workflow.');
    }

    if ((algo.inputs || []).includes('image')) {
      notes.push('Cleaner, higher-contrast source material will survive the export pipeline better.');
    }

    if ((algo.inputs || []).includes('audio')) {
      notes.push('Capture a stable audio-driven frame before tuning line density for plotting.');
    }

    return joinSentences(notes, 3);
  }

  function getWorkflowStepIds(algo) {
    if (!algo) {
      return [];
    }

    if (algo.category === 'tools') {
      const toolMap = {
        'plot-simulator': ['plotter-preview', 'path-optimizer', 'plotter-prep'],
        'path-optimizer': ['plotter-preview', 'plotter-prep', 'plotter-export'],
        'plotter-export': ['plotter-prep', 'path-optimizer', 'plotter-preview'],
        'plotter-prep': ['path-optimizer', 'plotter-preview', 'plotter-export'],
        'plotter-preview': ['path-optimizer', 'plotter-prep', 'plotter-export'],
      };

      return unique(toolMap[algo.id] || ['plotter-preview', 'path-optimizer', 'plotter-prep']);
    }

    const ids = [];
    const outputs = algo.outputs || [];

    if (outputs.includes('svg')) {
      ids.push('plotter-prep');
    } else {
      ids.push('plotter-export');
    }

    if (algo.plotterReadiness === 'screen-first') {
      ids.push('plotter-prep');
    } else {
      ids.push('path-optimizer');
    }

    ids.push('plotter-preview');

    if ((algo.inputs || []).includes('image')) {
      ids.unshift('plotter-export');
    }

    return unique(ids).slice(0, 3);
  }

  function getWorkflowSteps(catalog, algoOrId) {
    const algo = resolveAlgorithm(catalog, algoOrId);
    if (!algo) {
      return [];
    }

    const ids = getWorkflowStepIds(algo);
    return ids
      .map((id) => catalog.algorithms.find((candidate) => candidate.id === id))
      .filter(Boolean)
      .map((tool) => ({
        ...tool,
        guidance: toolDescriptions[tool.id] || `Use ${tool.name} when you are ready for the next workflow step.`,
      }));
  }

  function getIdeationPrompts(algo) {
    if (!algo) {
      return [];
    }

    const prompts = [];
    (algo.motifFamilies || []).forEach((family) => {
      if (motifPromptMap[family]) {
        prompts.push(motifPromptMap[family]);
      }
    });
    (algo.visualTraits || []).forEach((trait) => {
      if (traitPromptMap[trait]) {
        prompts.push(traitPromptMap[trait]);
      }
    });

    if ((algo.inputs || []).includes('image')) {
      prompts.push('Prepare one high-contrast source image and one softer source image, then compare which one still survives simplification.');
    }

    if ((algo.outputs || []).includes('svg')) {
      prompts.push('Check whether the seed still reads after SVG export before you spend time polishing the preview.');
    } else {
      prompts.push('Decide early whether you want to translate this into paths or keep it as a screen-first study; that choice changes the parameter moves worth making.');
    }

    if (algo.hasPresets) {
      prompts.push('Start from a preset, change one control family only, and save the first seed that survives export.');
    } else {
      prompts.push('Change one parameter family at a time and keep only the seeds that still read after simplification.');
    }

    if (algo.plotterReadiness === 'native') {
      prompts.push('Test a cleaner, lower-density pass before assuming more detail will improve the plot.');
    } else if (algo.plotterReadiness === 'screen-first') {
      prompts.push('Plan one screen-first version and one plot-adapted version instead of forcing one setup to do both jobs.');
    }

    return unique(prompts).slice(0, 3);
  }

  function getUseCaseLabels(algo) {
    if (!algo) {
      return [];
    }

    const labels = [];
    if (algo.category === 'tools' || algo.plotterReadiness === 'tool') {
      labels.push('Workflow tool');
    } else if (algo.plotterReadiness === 'native') {
      labels.push('Plotter-safe');
    } else if (algo.plotterReadiness === 'screen-first') {
      labels.push('Screen-first');
    } else {
      labels.push('Needs cleanup');
    }

    if (algo.hasPresets) {
      labels.push('Fast iteration');
    }
    if ((algo.outputs || []).includes('svg')) {
      labels.push('Direct SVG');
    }
    if ((algo.inputs || []).includes('image')) {
      labels.push('Image-driven');
    }
    if ((algo.visualTraits || []).includes('dense')) {
      labels.push('Dense results');
    }
    if ((algo.visualTraits || []).includes('layered')) {
      labels.push('Layer-friendly');
    }

    if (labels.length < 3 && (algo.motifFamilies || []).length > 0) {
      algo.motifFamilies.slice(0, 3).forEach((family) => labels.push(toTitleCase(family)));
    }

    return unique(labels).slice(0, 3);
  }

  function buildPreviewStyle(algo) {
    const hash = hashString(algo.id);
    const hueA = hash % 360;
    const hueB = (hueA + 32 + (hash % 77)) % 360;
    const hueC = (hueB + 56) % 360;
    const angle = hash % 180;
    const family = ((algo.motifFamilies || [])[0] || '').toLowerCase();
    let overlay = `repeating-linear-gradient(${(angle + 90) % 180}deg, rgba(15,23,42,0.08) 0 2px, transparent 2px 14px)`;

    if (family.includes('field') || family.includes('wave')) {
      overlay = `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.62) 0 10%, transparent 11%), radial-gradient(circle at 75% 40%, rgba(15,23,42,0.08) 0 12%, transparent 13%), repeating-linear-gradient(${angle}deg, rgba(15,23,42,0.06) 0 1px, transparent 1px 10px)`;
    } else if (family.includes('tiling') || family.includes('grid') || family.includes('lattice')) {
      overlay = `repeating-linear-gradient(${angle}deg, rgba(15,23,42,0.08) 0 1px, transparent 1px 16px), repeating-linear-gradient(${(angle + 90) % 180}deg, rgba(255,255,255,0.55) 0 1px, transparent 1px 16px)`;
    } else if (family.includes('packing') || family.includes('circles') || family.includes('radial')) {
      overlay = `radial-gradient(circle at 18% 24%, rgba(255,255,255,0.65) 0 12%, transparent 13%), radial-gradient(circle at 68% 52%, rgba(15,23,42,0.08) 0 10%, transparent 11%), radial-gradient(circle at 85% 22%, rgba(255,255,255,0.45) 0 8%, transparent 9%)`;
    }

    return [
      `background-image: linear-gradient(${angle}deg, hsla(${hueA}, 78%, 88%, 0.95), hsla(${hueB}, 82%, 92%, 0.92), hsla(${hueC}, 78%, 94%, 0.92)), ${overlay}`,
      'background-size: cover',
      'background-position: center',
    ].join('; ');
  }

  function getUrlParams(search) {
    return new URLSearchParams(search || global.location.search);
  }

  global.TSDiscovery = {
    buildPreviewStyle,
    normalizeText,
    formatCategory,
    getMediumLabel,
    getPlotterReadinessLabel,
    buildSearchHaystack,
    getIdeationPrompts,
    getPlotterSummary,
    getUseCaseLabels,
    getWorkflowSteps,
    getRelatedAlgorithms,
    getSpotlightSections,
    getTrailSuggestions,
    getPreviewAccent,
    getUrlParams,
    scoreRelationship,
  };
})(window);

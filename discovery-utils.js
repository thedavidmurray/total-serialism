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
    getRelatedAlgorithms,
    getSpotlightSections,
    getTrailSuggestions,
    getPreviewAccent,
    getUrlParams,
    scoreRelationship,
  };
})(window);

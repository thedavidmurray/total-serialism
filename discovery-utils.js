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

  function getUrlParams(search) {
    return new URLSearchParams(search || global.location.search);
  }

  global.TSDiscovery = {
    normalizeText,
    formatCategory,
    getMediumLabel,
    getPlotterReadinessLabel,
    buildSearchHaystack,
    getRelatedAlgorithms,
    getUrlParams,
    scoreRelationship,
  };
})(window);

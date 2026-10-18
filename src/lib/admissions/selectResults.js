const MAX_RESULTS = 5;
const MAX_TOP_RESULTS = 3;
const COMPARABLE_SCALES = new Set(['4', '5', '100']);
const SUPPRESSED_FALLBACK_IDS = new Set([
  'oxford',
  'university-of-oxford',
  'cambridge',
  'university-of-cambridge',
]);
const SUPPRESSED_FALLBACK_NAMES = new Set(['university of oxford', 'university of cambridge']);

/** @param {any} answers */
function comparableGrade(answers) {
  if (!answers || !COMPARABLE_SCALES.has(answers.scale)) return false;
  if (answers.grade === '' || answers.grade == null) return false;
  const grade = typeof answers.grade === 'number' ? answers.grade : Number(answers.grade);
  return Number.isFinite(grade) && grade >= 0 && grade <= Number(answers.scale);
}

/** @param {any} option */
function fieldsFor(option) {
  if (Array.isArray(option?.fields)) return option.fields;
  if (Array.isArray(option?.field)) return option.field;
  return typeof option?.field === 'string' ? [option.field] : [];
}

/** @param {any} row */
function institutionKey(row) {
  const institutionId = row.option.institutionId;
  if (typeof institutionId === 'string' && institutionId.trim()) return `id:${institutionId.trim().toLowerCase()}`;
  const university = row.option.university;
  if (typeof university === 'string' && university.trim()) {
    return `name:${university.trim().toLowerCase().replace(/\s+/g, ' ')}`;
  }
  return `option:${String(row.option.id ?? '')}`;
}

/** @param {any} row */
function stableId(row) {
  return typeof row.option.id === 'string' ? row.option.id : String(row.option.id ?? '');
}

/** @param {any} row */
function preferenceValue(row) {
  const value = row.preferenceMatches;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Sort known preference scores ahead of unknown scores, then descending, with
 * option id as a stable tie-breaker. No missing-data or institution bonus is used.
 * @param {any} left
 * @param {any} right
 */
function comparePreference(left, right) {
  const a = preferenceValue(left);
  const b = preferenceValue(right);
  if (a !== null && b === null) return -1;
  if (a === null && b !== null) return 1;
  if (a !== null && b !== null && a !== b) return b - a;
  const aId = stableId(left);
  const bId = stableId(right);
  return aId < bId ? -1 : aId > bId ? 1 : 0;
}

/**
 * Interleave regions only within equal preference-score groups. Higher known
 * scores remain ahead of lower scores, and unknown scores remain last.
 * @param {any[]} rows
 * @param {string[]} selectedRegions
 */
function compareWithRegionalFairness(rows, selectedRegions) {
  const groups = new Map();
  for (const row of rows) {
    const score = preferenceValue(row);
    const key = score === null ? 'unknown' : `score:${score}`;
    if (!groups.has(key)) groups.set(key, { score, rows: [] });
    groups.get(key).rows.push(row);
  }

  const orderedGroups = [...groups.values()].sort((left, right) => {
    if (left.score === null) return right.score === null ? 0 : 1;
    if (right.score === null) return -1;
    return right.score - left.score;
  });
  const ordered = [];
  for (const group of orderedGroups) {
    const byRegion = new Map();
    for (const row of group.rows) {
      const region = typeof row.option.region === 'string' ? row.option.region : '';
      if (!byRegion.has(region)) byRegion.set(region, []);
      byRegion.get(region).push(row);
    }
    for (const regionRows of byRegion.values()) regionRows.sort(comparePreference);

    const regionOrder = [...new Set([
      ...selectedRegions.filter((region) => byRegion.has(region)),
      ...byRegion.keys(),
    ])].sort();
    let hasRows = true;
    while (hasRows) {
      hasRows = false;
      for (const region of regionOrder) {
        const regionRows = byRegion.get(region);
        if (regionRows?.length) {
          ordered.push(regionRows.shift());
          hasRows = true;
        }
      }
    }
  }
  return ordered;
}

/** @param {any} row */
function hasUnmetCondition(row) {
  return row.requirementStatus === 'unmet'
    || row.languageStatus === 'unmet'
    || row.academicStatus === 'unmet'
    || row.budgetStatus === 'unmet'
    || row.requiresClarification === true;
}

/** @param {any} row */
function isFallbackInstitution(row) {
  const option = row.option;
  const id = typeof option.institutionId === 'string'
    ? option.institutionId.trim().toLowerCase().replace(/_/g, '-')
    : '';
  const name = typeof option.university === 'string' ? option.university.trim().toLowerCase().replace(/\s+/g, ' ') : '';
  return SUPPRESSED_FALLBACK_IDS.has(id)
    || SUPPRESSED_FALLBACK_NAMES.has(name)
    || option.fallbackPolicy === 'requires_academic_evidence';
}

/**
 * Pick a small, deterministic guest-facing result set from already evaluated rows.
 * This function only orders and separates rows; it does not infer admissions
 * eligibility or relax a selected field or region.
 *
 * @param {any[]} rows
 * @param {Record<string, any>} answers
 * @param {number} [limit]
 * @returns {{results: any[], alternatives: any[], topCount: number, mode: 'ranked'|'explore', totalInstitutions: number}}
 */
export function selectPreliminaryResults(rows, answers, limit = MAX_RESULTS) {
  const requestedLimit = Number.isFinite(limit) ? Math.floor(limit) : MAX_RESULTS;
  const cap = Math.min(MAX_RESULTS, Math.max(0, requestedLimit));
  const selectedRegions = Array.isArray(answers?.regions) ? answers.regions : [];
  const selectedField = typeof answers?.field === 'string' ? answers.field : '';
  const hasComparableGrade = comparableGrade(answers);
  const hasKnownIeltsScore = answers?.exam === 'IELTS'
    && answers.score !== ''
    && answers.score != null
    && Number.isFinite(typeof answers.score === 'number' ? answers.score : Number(answers.score));
  const supportedFieldSelected = selectedField !== '';
  const hasKnownBudget = answers?.budget !== '' && answers?.budget != null
    && Number.isFinite(Number(answers.budget)) && Number(answers.budget) >= 0
    && typeof answers?.currency === 'string' && answers.currency !== '';

  const matching = (Array.isArray(rows) ? rows : []).filter((row) => {
    if (!row || typeof row !== 'object' || !row.option || typeof row.option !== 'object') return false;
    const option = row.option;
    if (typeof option.id !== 'string' || !option.id.trim()) return false;
    if (typeof option.entryPath === 'string' && option.entryPath.toLowerCase().includes('foundation')) return false;
    if (option.discoveryPolicy === 'ambitious_only') return false;
    if (option.discoveryPolicy === 'unreviewed') return false;
    if (option.competitiveness?.category === 'extremely_selective') return false;
    if (row.requiresAlternativePath === true) return false;
    if (selectedRegions.length && !selectedRegions.includes(option.region)) return false;
    if (selectedField && !fieldsFor(option).includes(selectedField)) return false;
    if (isFallbackInstitution(row) && (!hasComparableGrade || row.academicStatus !== 'met')) return false;
    return true;
  });

  // Collapse campus/program duplicates to one representative institution.
  const byInstitution = new Map();
  for (const row of matching) {
    const key = institutionKey(row);
    const previous = byInstitution.get(key);
    if (!previous) {
      byInstitution.set(key, row);
      continue;
    }
    const rowIsSafe = !hasUnmetCondition(row);
    const previousIsSafe = !hasUnmetCondition(previous);
    if (rowIsSafe !== previousIsSafe) {
      if (rowIsSafe) byInstitution.set(key, row);
      continue;
    }
    const rowHasProvenEvidence = row.topEvidence === true && row.requirementStatus !== 'unmet';
    const previousHasProvenEvidence = previous.topEvidence === true && previous.requirementStatus !== 'unmet';
    if (rowHasProvenEvidence !== previousHasProvenEvidence) {
      if (rowHasProvenEvidence) byInstitution.set(key, row);
    } else if (comparePreference(row, previous) < 0) {
      byInstitution.set(key, row);
    }
  }

  const unique = [...byInstitution.values()];
  const main = unique.filter((row) => !hasUnmetCondition(row));
  const alternativeRows = unique.filter(hasUnmetCondition).sort(comparePreference);
  const eligibleTop = main.filter((row) => row.topEvidence === true
    && row.requirementStatus !== 'unmet'
    && row.academicStatus === 'met'
    && row.languageStatus === 'met'
    && row.budgetStatus === 'met'
    && supportedFieldSelected
    && fieldsFor(row.option).includes(selectedField)
    && hasComparableGrade
    && hasKnownIeltsScore
    && hasKnownBudget
    && selectedRegions.length > 0,
  ).sort(comparePreference);
  const topSet = new Set(eligibleTop.slice(0, MAX_TOP_RESULTS));
  const orderedMain = [
    ...eligibleTop,
    ...compareWithRegionalFairness(main.filter((row) => !eligibleTop.includes(row)), selectedRegions),
  ];
  const resultRows = orderedMain.slice(0, cap).map((row) => cloneRow(row, topSet.has(row)));
  const alternativeSlots = Math.max(0, cap - resultRows.length);
  const alternatives = alternativeRows.slice(0, alternativeSlots).map((row) => cloneRow(row, false));
  const topCount = resultRows.filter((row) => row.isTop).length;

  return {
    results: resultRows,
    alternatives,
    topCount,
    mode: topCount > 0 ? 'ranked' : 'explore',
    totalInstitutions: main.length,
  };
}

/** @param {any} row @param {boolean} isTop */
function cloneRow(row, isTop) {
  return {
    ...row,
    option: {
      ...row.option,
      ...(Array.isArray(row.option.fields) ? { fields: [...row.option.fields] } : {}),
      ...(Array.isArray(row.option.field) ? { field: [...row.option.field] } : {}),
    },
    ...(Array.isArray(row.reasons) ? { reasons: row.reasons.map((reason) => reason && typeof reason === 'object' ? { ...reason } : reason) } : {}),
    isTop,
  };
}

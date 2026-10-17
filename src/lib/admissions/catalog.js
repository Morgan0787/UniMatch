import researchPackage from '../../../docs/business-turks-2026/catalog-expansion-03.json' with { type: 'json' };
import { adaptResearchPackage } from './catalogAdapter.js';

// Static public research only. The research-owned package is never rewritten here.
const adapted = adaptResearchPackage(researchPackage);
export const OPTIONS = adapted.options;
export const CATALOG_VERSION = adapted.version;
export const CATALOG_ISSUES = adapted.issues;
export const CATALOG_RESEARCH_COVERAGE = researchPackage.coverage;

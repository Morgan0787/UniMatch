import assert from 'node:assert/strict';
import { readRecommendationState, writeRecommendationState } from '../src/lib/recommendationState.js';
import { isRecommendationsReturn, universityPageUrl, universityReturnPath } from '../src/lib/universityNavigation.js';

const defaults = { filter: 'all', sort: 'match' };
const selected = { filter: 'budget', sort: 'name' };
assert.deepEqual(readRecommendationState(new URLSearchParams()), defaults);
assert.deepEqual(readRecommendationState(new URLSearchParams('filter=bud%67et&sort=na%6De')), selected);
assert.deepEqual(readRecommendationState(new URLSearchParams('filter=%252Fsearch&sort=tuition')), defaults);

const filters = writeRecommendationState(new URLSearchParams('utm_source=mail&sort=name'), { filter: 'budget' });
assert.equal(filters.get('utm_source'), 'mail');
assert.deepEqual(readRecommendationState(filters), selected);
assert.deepEqual(readRecommendationState(writeRecommendationState(filters, { filter: 'all' })), { filter: 'all', sort: 'name' });
assert.equal(writeRecommendationState(filters, defaults).toString(), 'utm_source=mail');

const origin = 'https://unimatch.local';
const recommendations = '/Recommendations?filter=budget&sort=name#results';
const search = '/ru/Search?q=Data+%26+Society&filters=%7B%22budget%22%3A4000%7D';
const detailReturn = from => new URL(universityPageUrl('sample-id', from), origin).searchParams.get('from');
assert.equal(detailReturn(recommendations), recommendations);
assert.equal(detailReturn(search), search);
assert.equal(isRecommendationsReturn(detailReturn(recommendations)), true);
assert.equal(isRecommendationsReturn('/recommendations/?sort=name'), true);
assert.equal(isRecommendationsReturn(detailReturn(search)), false);
for (const path of ['//elsewhere.test/Recommendations', 'https://elsewhere.test/Recommendations', '/%2Felsewhere.test', '/%5Celsewhere.test', '/Login', '/Recommendations-other']) {
  assert.equal(universityReturnPath(path), '/Search', path);
  assert.equal(isRecommendationsReturn(path), false, path);
}
assert.equal(universityReturnPath('/'), '/');
console.log('Recommendation URL state and university return paths passed.');

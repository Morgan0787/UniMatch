// Legacy university-wide scores are references, not programme requirements.
// Only compare a supplied score when the teaching language is unambiguous.
export function assessLanguage(university, ielts, topik) {
    const language = university.language?.toLowerCase();
    if (language !== 'english' && language !== 'korean') return { state: 'unknown', reason: 'programme' };
    const required = language === 'english' ? Number(university.required_ielts) : Number.parseInt(String(university.topikLevel).match(/\d+/)?.[0], 10);
    if (!Number.isFinite(required) || required <= 0) return { state: 'unknown', reason: 'requirement' };
    const supplied = language === 'english' ? ielts : Number.parseInt(String(topik).match(/\d+/)?.[0], 10);
    if (supplied == null || supplied === '' || !Number.isFinite(Number(supplied)) || Number(supplied) <= 0) return { state: 'unknown', reason: 'score' };
    return { state: Number(supplied) >= required ? 'met' : 'notMet', required, supplied: Number(supplied) };
}

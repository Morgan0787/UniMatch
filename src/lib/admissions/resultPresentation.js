/** Presentation only: retain the evaluator's exact budget determination. */
export function resultBudgetState(reasons) {
  if (reasons.some(reason => reason.code === 'BUDGET_BELOW_PUBLISHED_TUITION' && reason.status === 'unmet')) return 'exceeds';
  if (reasons.some(reason => reason.code === 'BUDGET_COVERS_TUITION_ONLY' && reason.status === 'met')) return 'covered';
  return 'unknown';
}

export const RESULT_COPY = {
  en: { covered: 'Within budget', exceeds: 'Above budget', unknown: 'Budget check needed', comparison: 'Comparison: {count} of 3', count: 'Universities: {count}', details: 'Requirements & sources', limit: '3 of 3 selected · remove one first', tuition: 'Tuition', summary: 'Your selection' },
  ru: { covered: 'В пределах бюджета', exceeds: 'Выше бюджета', unknown: 'Бюджет не указан', comparison: 'Сравнение: {count} из 3', count: 'Вузов: {count}', details: 'Условия и источники', limit: 'Выбрано 3 из 3 · сначала уберите один', tuition: 'Стоимость обучения', summary: 'Ваши параметры' },
  uz: { covered: 'Budjet doirasida', exceeds: 'Budjetdan yuqori', unknown: 'Budjet aniqlanmagan', comparison: 'Taqqoslash: 3 tadan {count}', count: '{count} ta universitet', details: 'Shartlar va manbalar', limit: '3 tadan 3 tasi · avval bittasini olib tashlang', tuition: 'O‘qish haqi', summary: 'Tanlovingiz' },
};

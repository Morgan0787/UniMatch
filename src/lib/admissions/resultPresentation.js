/** Presentation only: retain the evaluator's exact budget determination. */
export function resultBudgetState(reasons) {
  if (reasons.some(reason => reason.code === 'BUDGET_BELOW_PUBLISHED_TUITION' && reason.status === 'unmet')) return 'exceeds';
  if (reasons.some(reason => reason.code === 'BUDGET_COVERS_TUITION_ONLY' && reason.status === 'met')) return 'covered';
  return 'unknown';
}

export const RESULT_COPY = {
  en: { covered: 'Tuition within budget', exceeds: 'Tuition exceeds budget', unknown: 'Budget fit unknown', comparison: 'Comparison: {count} of 3', count: '{count} universities', details: 'Conditions and sources', limit: '3 of 3 selected · remove one first', tuition: 'Tuition', summary: 'Your selection' },
  ru: { covered: 'Обучение в пределах бюджета', exceeds: 'Обучение дороже бюджета', unknown: 'Соответствие бюджету неизвестно', comparison: 'Сравнение: {count} из 3', count: '{count} вузов', details: 'Условия и источники', limit: 'Выбрано 3 из 3 · сначала уберите один', tuition: 'Стоимость обучения', summary: 'Ваши параметры' },
  uz: { covered: 'O‘qish haqi budjet doirasida', exceeds: 'O‘qish haqi budjetdan yuqori', unknown: 'Budjetga moslik noma’lum', comparison: 'Taqqoslash: 3 tadan {count}', count: '{count} ta universitet', details: 'Shartlar va manbalar', limit: '3 tadan 3 tasi · avval bittasini olib tashlang', tuition: 'O‘qish haqi', summary: 'Tanlovingiz' },
};

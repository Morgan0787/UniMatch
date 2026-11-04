/** Short qualification stays next to the amount, including in collapsed cards. */
export function tuitionStatus(fact, language = 'en') {
  const copy = {
    en: { historical: 'Historical reference · applicability unconfirmed', unconfirmed: 'Applicability unconfirmed', estimate: 'Estimate · confirm with the university' },
    ru: { historical: 'Историческая справка · применимость не подтверждена', unconfirmed: 'Применимость не подтверждена', estimate: 'Оценка · уточните в университете' },
    uz: { historical: 'Tarixiy ma’lumot · qo‘llanishi tasdiqlanmagan', unconfirmed: 'Qo‘llanishi tasdiqlanmagan', estimate: 'Taxmin · universitetdan aniqlashtiring' },
  }[language] || { historical: 'Historical reference · applicability unconfirmed', unconfirmed: 'Applicability unconfirmed', estimate: 'Estimate · confirm with the university' };
  if (fact?.status === 'historical_reference' && fact.historical?.value != null) return copy.historical;
  if (!fact || fact.status === 'unknown' || fact.value == null) return '';
  if (fact.status === 'estimate') return copy.estimate;
  return fact.status === 'published_unconfirmed' || fact.applicability === 'unconfirmed' ? copy.unconfirmed : '';
}

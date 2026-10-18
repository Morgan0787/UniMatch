const COPY = {
  en: {
    unknown: 'Unknown', unknownNotice: 'This condition still needs confirmation for your application.',
    published: 'Published; applicability to this intake is unconfirmed.', historical: 'Historical reference for {season}; current applicability is unconfirmed.',
    estimate: 'Estimate; not a confirmed programme requirement.', year: 'year', semester: 'semester', creditHour: 'credit hour', nineMonthYear: '9-month academic year', twelveMonths: '12 months', unknownPeriod: 'period unknown', amountUnknown: 'Amount unknown', all: 'and', any: 'or',
    grade: 'minimum {minimum} on the original {scale}-point scale', ielts: 'IELTS minimum {minimum}',
    sectionMinimum: '{section} minimum {minimum}', validity: '; valid for {years} years as of {date}', needsDate: '; test date validity also applies', scope: 'Scope', route: 'route', studentCategory: 'student category', schoolCountry: 'school country', credential: 'credential', intakeYear: 'intake year', programme: 'programme', degreeUnknown: 'Degree unknown', timezoneUnknown: 'timezone unknown',
  },
  ru: {
    unknown: 'Неизвестно', unknownNotice: 'Это условие ещё нужно подтвердить для вашего поступления.',
    published: 'Опубликовано; применимость к этому набору не подтверждена.', historical: 'Историческая справка за сезон {season}; текущая применимость не подтверждена.',
    estimate: 'Оценка; это не подтверждённое требование программы.', year: 'год', semester: 'семестр', creditHour: 'кредитный час', nineMonthYear: 'учебный год из 9 месяцев', twelveMonths: '12 месяцев', unknownPeriod: 'период неизвестен', amountUnknown: 'Сумма неизвестна', all: 'и', any: 'или',
    grade: 'минимум {minimum} по исходной шкале из {scale} баллов', ielts: 'минимальный IELTS {minimum}',
    sectionMinimum: 'минимум {minimum} по разделу «{section}»', validity: '; действует {years} лет на дату {date}', needsDate: '; также важна дата сдачи', scope: 'Область', route: 'маршрут', studentCategory: 'категория студента', schoolCountry: 'страна обучения', credential: 'документ об образовании', intakeYear: 'год набора', programme: 'программа', degreeUnknown: 'Степень неизвестна', timezoneUnknown: 'часовой пояс неизвестен',
  },
  uz: {
    unknown: 'Noma’lum', unknownNotice: 'Bu shart arizangiz uchun hali tasdiqlanishi kerak.',
    published: 'E’lon qilingan; ushbu qabul davriga tegishliligi tasdiqlanmagan.', historical: '{season} mavsumi uchun tarixiy ma’lumot; joriy qo‘llanishi tasdiqlanmagan.',
    estimate: 'Taxmin; bu dastur uchun tasdiqlangan talab emas.', year: 'yil', semester: 'semestr', creditHour: 'kredit soati', nineMonthYear: '9 oylik o‘quv yili', twelveMonths: '12 oy', unknownPeriod: 'davr noma’lum', amountUnknown: 'Summa noma’lum', all: 'va', any: 'yoki',
    grade: 'asl {scale} ballik shkalada kamida {minimum}', ielts: 'IELTS kamida {minimum}',
    sectionMinimum: '{section} bo‘limidan kamida {minimum}', validity: '; {date} sanasiga ko‘ra amal muddati {years} yil', needsDate: '; imtihon sanasi ham ahamiyatli', scope: 'Qo‘llanish sohasi', route: 'yo‘nalish', studentCategory: 'talaba toifasi', schoolCountry: 'maktab ta’limi davlati', credential: 'ta’lim hujjati', intakeYear: 'qabul yili', programme: 'dastur', degreeUnknown: 'Daraja noma’lum', timezoneUnknown: 'vaqt mintaqasi noma’lum',
  },
};

function copy(language) { return COPY[language] || COPY.en; }
function template(text, values) { return text.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? '')); }
function number(value) { return Number.isFinite(value) ? String(value) : ''; }

function scopeValue(value, language) {
  const labels = {
    direct: ['Direct entry', 'Прямое поступление', 'To‘g‘ridan-to‘g‘ri qabul'],
    foundation: ['Foundation course', 'Подготовительная программа', 'Tayyorlov dasturi'],
    international: ['International applicants', 'Иностранные абитуриенты', 'Xalqaro abituriyentlar'],
    international_freshman: ['International first-year applicants', 'Иностранные абитуриенты первого курса', 'Xalqaro birinchi kurs abituriyentlari'],
    English_stream: ['English-taught programme', 'Программа на английском языке', 'Ingliz tilidagi dastur'],
    academic_lyceum_diploma: ['Academic lyceum diploma', 'Диплом академического лицея', 'Akademik litsey diplomi'],
    professional_college_diploma: ['Professional college diploma', 'Диплом профессионального колледжа', 'Kasb-hunar kolleji diplomi'],
    secondary_school_certificate: ['Secondary school certificate', 'Аттестат о среднем образовании', 'O‘rta ta’lim attestati'],
    Uzbekistan: ['Uzbekistan', 'Узбекистан', 'O‘zbekiston'],
  };
  const index = language === 'ru' ? 1 : language === 'uz' ? 2 : 0;
  return labels[value]?.[index] || (/[_]/.test(String(value)) ? copy(language).unknown : String(value));
}

function scopeText(scope, language) {
  if (!scope || typeof scope !== 'object' || Array.isArray(scope)) return '';
  const c = copy(language);
  const entries = ['route', 'studentCategory', 'schoolCountry', 'credential', 'intakeYear']
    .filter(key => scope[key] !== null && scope[key] !== undefined && scope[key] !== '')
    .map(key => `${c[key]}: ${scopeValue(scope[key], language)}`);
  return entries.length ? `${c.scope}: ${entries.join('; ')}` : '';
}

function renderRule(rule, language, nested = false) {
  const c = copy(language);
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) return c.unknown;
  if (rule.type === 'all' || rule.type === 'any') {
    const children = Array.isArray(rule.children) ? rule.children.map(child => renderRule(child, language, true)).filter(Boolean) : [];
    const rendered = children.length ? children.join(` ${c[rule.type]} `) : c.unknown;
    const scoped = scopeText(rule.scope, language);
    const result = `${rendered}${scoped ? ` (${scoped})` : ''}`;
    return nested ? `(${result})` : result;
  }
  if (rule.type === 'grade' && Number.isFinite(rule.minimum) && ['4', '5', '100'].includes(String(rule.scale))) {
    return `${template(c.grade, { minimum: number(rule.minimum), scale: rule.scale })}${scopeText(rule.scope, language) ? ` (${scopeText(rule.scope, language)})` : ''}`;
  }
  if (rule.type === 'ielts' && Number.isFinite(rule.minimum)) {
    const sections = rule.sections && typeof rule.sections === 'object' && !Array.isArray(rule.sections)
      ? Object.entries(rule.sections).filter(([, minimum]) => Number.isFinite(minimum))
        .map(([section, minimum]) => template(c.sectionMinimum, { section: ({ru:{listening:'Аудирование',reading:'Чтение',writing:'Письмо',speaking:'Говорение'},uz:{listening:'Tinglash',reading:'O‘qish',writing:'Yozish',speaking:'Gapirish'}}[language] || {})[section.toLowerCase()] || section, minimum: number(minimum) }))
      : [];
    const validity = Number.isFinite(rule.validityYears) && typeof rule.referenceDate === 'string'
      ? template(c.validity, { years: number(rule.validityYears), date: rule.referenceDate }).replace(/^;\s*/, '')
      : '';
    const details = [...sections, ...(rule.requiresDate === true ? [c.needsDate.replace(/^;\s*/, '')] : []), validity].filter(Boolean);
    return `${template(c.ielts, { minimum: number(rule.minimum) })}${details.length ? `; ${details.join('; ')}` : ''}${scopeText(rule.scope, language) ? ` (${scopeText(rule.scope, language)})` : ''}`;
  }
  const scoped = scopeText(rule.scope, language);
  return `${c.unknown}${scoped ? ` (${scoped})` : ''}`;
}

function renderValue(value, kind, language) {
  const c = copy(language);
  if (value === null || value === undefined) return c.unknown;
  if (kind === 'location') return typeof value.country === 'string' ? [value.campus, value.country].filter(Boolean).join(' · ') : c.unknown;
  if (kind === 'intake') return typeof value.text === 'string' ? value.text : c.unknown;
  if (kind === 'rule') return renderRule(value, language);
  if (kind === 'degree') {
    if (typeof value === 'string') return value;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return c.degreeUnknown;
    if (typeof value.award === 'string' && value.award.trim()) return value.award;
    return typeof value.level === 'string' && value.level.trim() ? value.level : c.degreeUnknown;
  }
  if (kind === 'tuition') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return c.unknown;
    const amount = Number.isFinite(value.amount) ? number(value.amount) : c.amountUnknown;
    const currency = typeof value.currency === 'string' && value.currency ? value.currency : '';
    const periodNames = { year: c.year, semester: c.semester, credit_hour: c.creditHour, academic_year_9_months: c.nineMonthYear, '12_months': c.twelveMonths };
    const period = periodNames[value.period] || c.unknownPeriod;
    const feeYear = typeof value.feeYear === 'string' && value.feeYear ? ` (${value.feeYear})` : '';
    const label = typeof value.label === 'string' && value.label.trim() ? ` · ${value.label}` : '';
    return `${amount}${currency ? ` ${currency}` : ''} / ${period}${feeYear}${label}`;
  }
  if (kind === 'deadline') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return c.unknown;
    const renderEntry = entry => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return '';
      const date = typeof entry.date === 'string' ? entry.date
        : typeof entry.monthDay === 'string' ? entry.monthDay : c.unknown;
      const time = typeof entry.time === 'string' ? ` ${entry.time}` : '';
      const timezone = ` (${typeof entry.timezone === 'string' ? entry.timezone : c.timezoneUnknown})`;
      return `${typeof entry.label === 'string' && entry.label ? `${entry.label}: ` : ''}${date}${time}${timezone}`;
    };
    const entries = Array.isArray(value.entries) ? value.entries.map(renderEntry).filter(Boolean) : [];
    if (entries.length) return entries.join('; ');
    if (typeof value.date !== 'string') return c.unknown;
    return `${value.date} (${typeof value.timezone === 'string' ? value.timezone : c.timezoneUnknown})`;
  }
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return c.unknown;
}

/**
 * Prepare a public catalogue fact for display without implying eligibility.
 * Historical values are read only from historical.value.
 * @param {any} fact
 * @param {string} language
 * @param {string} kind
 * @param {{includeScope?: boolean}} options
 * @returns {{value: string, notice: string, sourceIds: string[]}}
 */
export function describePublicFact(fact, language = 'en', kind = 'text', { includeScope = false } = {}) {
  const c = copy(language);
  if (!fact || typeof fact !== 'object' || Array.isArray(fact)) {
    return { value: c.unknown, notice: c.unknownNotice, sourceIds: [] };
  }
  const sourceIds = [...new Set([
    ...(Array.isArray(fact.sourceIds) ? fact.sourceIds : []),
    ...(Array.isArray(fact.historical?.sourceIds) ? fact.historical.sourceIds : []),
  ].filter(id => typeof id === 'string'))];

  if (fact.status === 'historical_reference') {
    const historical = fact.historical;
    const value = historical?.value == null ? c.unknown : renderValue(historical.value, kind, language);
    const season = typeof historical?.referenceSeason === 'string' ? historical.referenceSeason : '';
    const scope = includeScope ? scopeText(fact.scope, language) : '';
    return { value, notice: [template(c.historical, { season }), scope].filter(Boolean).join(' '), sourceIds };
  }
  if (fact.status === 'unknown' || fact.value == null) {
    const scope = includeScope ? scopeText(fact.scope, language) : '';
    return { value: c.unknown, notice: [c.unknownNotice, scope].filter(Boolean).join(' '), sourceIds };
  }
  const notice = fact.status === 'published_unconfirmed' || fact.applicability === 'unconfirmed'
    ? c.published
    : fact.status === 'estimate' ? c.estimate : '';
  const scope = includeScope ? scopeText(fact.scope, language) : '';
  return { value: renderValue(fact.value, kind, language), notice: [notice, scope].filter(Boolean).join(' '), sourceIds };
}

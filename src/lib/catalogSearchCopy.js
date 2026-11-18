const COPY = {
  en: {
    budgetLimit: 'Annual tuition limit',
    budgetHint: 'Enter tuition only, in euros per year. Living costs are separate.',
    clearBudget: 'Clear tuition limit',
    budgetResults: 'Results by annual tuition',
    budgetSummary: (amount) => `Tuition limit of ${amount} per year. Living costs are separate.`,
    groups: { within: 'Within budget', above: 'Above budget', unknown: 'Needs confirmation' },
    groupHelp: {
      within: 'Confirmed programme tuition in euros is at or below your annual limit.',
      above: 'Confirmed programme tuition in euros exceeds your annual limit.',
      unknown: 'Check the current tuition, billing period or currency before comparing these programmes.',
    },
    groupEmpty: {
      within: 'No programmes have confirmed tuition within your limit.',
      above: 'No programmes have confirmed tuition above your limit.',
      unknown: 'No results need tuition confirmation.',
    },
    budgetReasons: {
      noProgramme: 'Programme tuition is unknown.',
      unconfirmedTuition: 'Current tuition for this programme needs confirmation.',
      nonAnnualTuition: 'A comparable annual tuition amount is unavailable.',
      nonEuroTuition: 'Tuition is listed in a different currency.',
    },
    mainUniversity: 'Main university', programmeCampus: 'Programme campus', unknownCampus: 'Campus location unconfirmed',
  },
  ru: {
    budgetLimit: 'Лимит платы за обучение в год',
    budgetHint: 'Укажите только плату за обучение в евро за год. Расходы на проживание учитываются отдельно.',
    clearBudget: 'Сбросить лимит платы за обучение',
    budgetResults: 'Результаты по годовой плате за обучение',
    budgetSummary: (amount) => `Лимит платы за обучение ${amount} в год. Расходы на проживание учитываются отдельно.`,
    groups: { within: 'В пределах бюджета', above: 'Выше бюджета', unknown: 'Нужно уточнить' },
    groupHelp: {
      within: 'Подтверждённая годовая плата за обучение в евро укладывается в ваш лимит.',
      above: 'Подтверждённая годовая плата за обучение в евро превышает ваш лимит.',
      unknown: 'Уточните актуальную плату за обучение, расчётный период или валюту, чтобы сравнить эти программы.',
    },
    groupEmpty: {
      within: 'Нет программ с подтверждённой платой за обучение в пределах лимита.',
      above: 'Нет программ с подтверждённой платой за обучение выше лимита.',
      unknown: 'В этой выдаче нет результатов, для которых нужно уточнить плату за обучение.',
    },
    budgetReasons: {
      noProgramme: 'Плата за обучение по программе неизвестна.',
      unconfirmedTuition: 'Актуальную плату за обучение по этой программе нужно уточнить.',
      nonAnnualTuition: 'Нет сопоставимой суммы платы за обучение за год.',
      nonEuroTuition: 'Плата за обучение указана в другой валюте.',
    },
    mainUniversity: 'Головной вуз', programmeCampus: 'Кампус программы', unknownCampus: 'Местонахождение кампуса не подтверждено',
  },
  uz: {
    budgetLimit: 'Yillik o‘qish haqi chegarasi',
    budgetHint: 'Yillik o‘qish haqini yevroda kiriting. Yashash xarajatlari alohida hisoblanadi.',
    clearBudget: 'O‘qish haqi chegarasini olib tashlash',
    budgetResults: 'Yillik o‘qish haqi bo‘yicha natijalar',
    budgetSummary: (amount) => `Yillik o‘qish haqi chegarasi ${amount}. Yashash xarajatlari alohida hisoblanadi.`,
    groups: { within: 'Budjetga mos', above: 'Budjetdan yuqori', unknown: 'Aniqlashtirish kerak' },
    groupHelp: {
      within: 'Tasdiqlangan yillik o‘qish haqi yevroda va siz belgilagan chegaradan oshmaydi.',
      above: 'Tasdiqlangan yillik o‘qish haqi yevroda va siz belgilagan chegaradan yuqori.',
      unknown: 'Bu dasturlarni solishtirish uchun amaldagi o‘qish haqi, to‘lov davri yoki valyutasini aniqlashtiring.',
    },
    groupEmpty: {
      within: 'O‘qish haqi tasdiqlangan va budjetga mos dasturlar topilmadi.',
      above: 'O‘qish haqi tasdiqlangan va budjetdan yuqori dasturlar topilmadi.',
      unknown: 'O‘qish haqini aniqlashtirish kerak bo‘lgan natijalar yo‘q.',
    },
    budgetReasons: {
      noProgramme: 'Dastur uchun o‘qish haqi noma’lum.',
      unconfirmedTuition: 'Bu dastur uchun amaldagi o‘qish haqini aniqlashtirish kerak.',
      nonAnnualTuition: 'Solishtirish uchun yillik o‘qish haqi ko‘rsatilmagan.',
      nonEuroTuition: 'O‘qish haqi boshqa valyutada ko‘rsatilgan.',
    },
    mainUniversity: 'Bosh universitet', programmeCampus: 'Dastur kampusi', unknownCampus: 'Kampus joylashuvi tasdiqlanmagan',
  },
};

export function catalogSearchCopy(language) {
  return COPY[language] || COPY.en;
}

export function formatCatalogueBudget(amount, language) {
  return new Intl.NumberFormat(language, { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

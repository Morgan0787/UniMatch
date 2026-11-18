const COPY = {
  en: {
    budgetLimit: 'Annual tuition limit',
    budgetHint: 'Enter tuition only, in euros per year. Living costs are separate. Programmes with unconfirmed tuition stay in the results.',
    clearBudget: 'Clear tuition limit',
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
    budgetHint: 'Укажите только плату за обучение в евро за год. Расходы на проживание учитываются отдельно. Программы без подтверждённой цены остаются в выдаче.',
    clearBudget: 'Сбросить лимит платы за обучение',
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
    budgetHint: 'Yillik o‘qish haqini yevroda kiriting. Yashash xarajatlari alohida hisoblanadi. O‘qish haqi tasdiqlanmagan dasturlar natijalarda qoladi.',
    clearBudget: 'O‘qish haqi chegarasini olib tashlash',
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

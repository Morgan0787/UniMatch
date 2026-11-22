const COPY = {
  en: {
    budgetLimit: 'Annual tuition limit',
    budgetHint: 'Tuition only, in USD per year. Converted amounts are estimates. Programmes with unconfirmed tuition stay in the results.',
    clearBudget: 'Clear tuition limit',
    budgetReasons: {
      noProgramme: 'Programme tuition is unknown.',
      unconfirmedTuition: 'Current tuition for this programme needs confirmation.',
      nonAnnualTuition: 'A comparable annual tuition amount is unavailable.',
      unavailableExchangeRate: 'An exchange rate for this currency is unavailable.',
    },
    mainUniversity: 'Main university', programmeCampus: 'Programme campus', unknownCampus: 'Campus location unconfirmed',
  },
  ru: {
    budgetLimit: 'Лимит платы за обучение в год',
    budgetHint: 'Только плата за обучение в USD за год. Суммы после пересчёта приблизительные. Программы без подтверждённой цены остаются в выдаче.',
    clearBudget: 'Сбросить лимит платы за обучение',
    budgetReasons: {
      noProgramme: 'Плата за обучение по программе неизвестна.',
      unconfirmedTuition: 'Актуальную плату за обучение по этой программе нужно уточнить.',
      nonAnnualTuition: 'Нет сопоставимой суммы платы за обучение за год.',
      unavailableExchangeRate: 'Для этой валюты нет справочного курса.',
    },
    mainUniversity: 'Головной вуз', programmeCampus: 'Кампус программы', unknownCampus: 'Местонахождение кампуса не подтверждено',
  },
  uz: {
    budgetLimit: 'Yillik o‘qish haqi chegarasi',
    budgetHint: 'Faqat yillik o‘qish haqini USDda kiriting. O‘girilgan summalar taxminiy. O‘qish haqi tasdiqlanmagan dasturlar natijalarda qoladi.',
    clearBudget: 'O‘qish haqi chegarasini olib tashlash',
    budgetReasons: {
      noProgramme: 'Dastur uchun o‘qish haqi noma’lum.',
      unconfirmedTuition: 'Bu dastur uchun amaldagi o‘qish haqini aniqlashtirish kerak.',
      nonAnnualTuition: 'Solishtirish uchun yillik o‘qish haqi ko‘rsatilmagan.',
      unavailableExchangeRate: 'Bu valyuta uchun ma’lumotnoma kursi mavjud emas.',
    },
    mainUniversity: 'Bosh universitet', programmeCampus: 'Dastur kampusi', unknownCampus: 'Kampus joylashuvi tasdiqlanmagan',
  },
};

export function catalogSearchCopy(language) {
  return COPY[language] || COPY.en;
}

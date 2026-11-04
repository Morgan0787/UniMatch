const copy = {
  en: {
    notPublished: 'Not published by university',
    holistic: 'Holistic',
    noFixedGpa: 'No fixed GPA',
    holisticNote: 'Admissions are assessed across several factors; there is no single fixed GPA cutoff.',
    estimate: 'Estimate',
    estimateNote: 'General regional range for context only; this is not an official university requirement.',
    sourceLanguageNote: 'This description is provided in English.',
    languageUnknown: 'Language requirement not published',
    languageNotMet: 'Language requirement not met yet. Check the required score before applying.',
    languageMet: 'Language requirement met',
    languageMixedNote: 'The program may use more than one language of instruction.',
  },
  ru: {
    notPublished: 'Университет не публиковал данные',
    holistic: 'Комплексная оценка',
    noFixedGpa: 'Нет фиксированного порога GPA',
    holisticNote: 'Приёмная комиссия оценивает несколько факторов; единого фиксированного порога GPA нет.',
    estimate: 'Оценка',
    estimateNote: 'Общий региональный диапазон для ориентира; это не официальное требование университета.',
    sourceLanguageNote: 'Это описание приведено на английском языке.',
    languageUnknown: 'Языковое требование не опубликовано',
    languageNotMet: 'Языковое требование пока не выполнено. Проверьте нужный результат перед подачей.',
    languageMet: 'Языковое требование выполнено',
    languageMixedNote: 'В программе могут использоваться несколько языков обучения.',
  },
  uz: {
    notPublished: 'Universitet bu ma’lumotni e’lon qilmagan',
    holistic: 'Kompleks baholash',
    noFixedGpa: 'Belgilangan GPA chegarasi yo‘q',
    holisticNote: 'Qabul bir nechta omil asosida baholanadi; yagona belgilangan GPA chegarasi yo‘q.',
    estimate: 'Taxminiy',
    estimateNote: 'Umumiy mintaqaviy oraliq faqat ma’lumot uchun; bu universitetning rasmiy talabi emas.',
    sourceLanguageNote: 'Bu tavsif ingliz tilida berilgan.',
    languageUnknown: 'Til talabi e’lon qilinmagan',
    languageNotMet: 'Til talabi hali bajarilmagan. Ariza topshirishdan oldin kerakli natijani tekshiring.',
    languageMet: 'Til talabi bajarilgan',
    languageMixedNote: 'Dasturda bir nechta ta’lim tilidan foydalanilishi mumkin.',
  },
};

const values = {
  ru: {
    Mixed: 'Несколько языков', English: 'Английский', Korean: 'Корейский', German: 'Немецкий', French: 'Французский', Italian: 'Итальянский', Spanish: 'Испанский', Dutch: 'Нидерландский', Russian: 'Русский',
    Bachelor: 'Бакалавриат', Master: 'Магистратура', PhD: 'Докторантура', Lithuania: 'Литва', Latvia: 'Латвия',
    Uzbekistan: 'Узбекистан', Kazakhstan: 'Казахстан', Kyrgyzstan: 'Кыргызстан', Tajikistan: 'Таджикистан', Turkmenistan: 'Туркменистан', Russia: 'Россия', Ukraine: 'Украина', Azerbaijan: 'Азербайджан', Georgia: 'Грузия', Armenia: 'Армения', India: 'Индия', Pakistan: 'Пакистан', Bangladesh: 'Бангладеш', Vietnam: 'Вьетнам', Indonesia: 'Индонезия', Nigeria: 'Нигерия', Kenya: 'Кения', Ghana: 'Гана', Egypt: 'Египет', Morocco: 'Марокко', Other: 'Другое',
    Engineering: 'Инженерное дело', 'Computer Science': 'Информатика', Business: 'Бизнес', Medicine: 'Медицина', Law: 'Право', 'Arts & Design': 'Искусство и дизайн', 'Natural Sciences': 'Естественные науки', 'Social Sciences': 'Общественные науки', Economics: 'Экономика', Architecture: 'Архитектура',
    Germany: 'Германия', Netherlands: 'Нидерланды', 'Czech Republic': 'Чехия', Poland: 'Польша', Hungary: 'Венгрия', Austria: 'Австрия', France: 'Франция', Italy: 'Италия', Spain: 'Испания', Portugal: 'Португалия', Belgium: 'Бельгия', Sweden: 'Швеция', Finland: 'Финляндия', Norway: 'Норвегия', Denmark: 'Дания', Switzerland: 'Швейцария', 'United Kingdom': 'Великобритания', Ireland: 'Ирландия', USA: 'США', 'United States': 'Соединённые Штаты Америки', Canada: 'Канада', Australia: 'Австралия', China: 'Китай', 'South Korea': 'Южная Корея', Japan: 'Япония', Singapore: 'Сингапур', Malaysia: 'Малайзия', UAE: 'ОАЭ',
    Europe: 'Европа', 'North America': 'Северная Америка', Asia: 'Азия', 'Middle East': 'Ближний Восток', Oceania: 'Океания', 'South America': 'Южная Америка',
  },
  uz: {
    Mixed: 'Bir nechta til', English: 'Ingliz tili', Korean: 'Koreys tili', German: 'Nemis tili', French: 'Fransuz tili', Italian: 'Italyan tili', Spanish: 'Ispan tili', Dutch: 'Niderland tili', Russian: 'Rus tili',
    Bachelor: 'Bakalavriat', Master: 'Magistratura', PhD: 'Doktorantura', Lithuania: 'Litva', Latvia: 'Latviya',
    Uzbekistan: 'O‘zbekiston', Kazakhstan: 'Qozog‘iston', Kyrgyzstan: 'Qirg‘iziston', Tajikistan: 'Tojikiston', Turkmenistan: 'Turkmaniston', Russia: 'Rossiya', Ukraine: 'Ukraina', Azerbaijan: 'Ozarbayjon', Georgia: 'Gruziya', Armenia: 'Armaniston', India: 'Hindiston', Pakistan: 'Pokiston', Bangladesh: 'Bangladesh', Vietnam: 'Vetnam', Indonesia: 'Indoneziya', Nigeria: 'Nigeriya', Kenya: 'Keniya', Ghana: 'Gana', Egypt: 'Misr', Morocco: 'Marokash', Other: 'Boshqa',
    Engineering: 'Muhandislik', 'Computer Science': 'Kompyuter fanlari', Business: 'Biznes', Medicine: 'Tibbiyot', Law: 'Huquq', 'Arts & Design': 'San’at va dizayn', 'Natural Sciences': 'Tabiiy fanlar', 'Social Sciences': 'Ijtimoiy fanlar', Economics: 'Iqtisodiyot', Architecture: 'Arxitektura',
    Germany: 'Germaniya', Netherlands: 'Niderlandiya', 'Czech Republic': 'Chexiya', Poland: 'Polsha', Hungary: 'Vengriya', Austria: 'Avstriya', France: 'Fransiya', Italy: 'Italiya', Spain: 'Ispaniya', Portugal: 'Portugaliya', Belgium: 'Belgiya', Sweden: 'Shvetsiya', Finland: 'Finlyandiya', Norway: 'Norvegiya', Denmark: 'Daniya', Switzerland: 'Shveytsariya', 'United Kingdom': 'Buyuk Britaniya', Ireland: 'Irlandiya', USA: 'AQSh', 'United States': 'Amerika Qo‘shma Shtatlari', Canada: 'Kanada', Australia: 'Avstraliya', China: 'Xitoy', 'South Korea': 'Janubiy Koreya', Japan: 'Yaponiya', Singapore: 'Singapur', Malaysia: 'Malayziya', UAE: 'BAA',
    Europe: 'Yevropa', 'North America': 'Shimoliy Amerika', Asia: 'Osiyo', 'Middle East': 'Yaqin Sharq', Oceania: 'Okeaniya', 'South America': 'Janubiy Amerika',
  },
};

const estimateNotes = {
  ru: {
    'South Korea.gpa': 'В большинстве корейских университетов минимальный допустимый GPA составляет около 2,5–3,0 по шкале 4,0–4,5; у конкурентоспособных абитуриентов обычно 3,5 и выше.',
    'South Korea.ielts': 'Типичный уровень для программ бакалавриата на английском языке; ведущие вузы (SNU, KAIST, Korea Univ.) часто требуют 6,5–7,0.',
    'South Korea.topik': 'Для программ на корейском языке обычно требуется TOPIK уровня 3, а конкурентные программы предпочитают уровень 4 и выше.',
    'Europe.ielts': 'Типичный уровень для программ бакалавриата на английском языке в Великобритании, Германии и Нидерландах; на конкурсных программах, а также на праве и медицине часто требуется 7,0 и выше.',
    'North America.gpa': 'Общий ориентир для четырёхлетних вузов без высокой избирательности; в селективных вузах обычно ожидают GPA 3,7 и выше.',
    'North America.ielts': 'Типичный минимальный уровень для поступления на программы бакалавриата в США и Канаде.',
  },
  uz: {
    'South Korea.gpa': 'Koreya universitetlarining aksariyatida eng kam mos GPA 4,0–4,5 shkalasida taxminan 2,5–3,0; raqobatbardosh abituriyentlarda odatda 3,5 yoki undan yuqori bo‘ladi.',
    'South Korea.ielts': 'Ingliz tilida o‘qitiladigan bakalavriat dasturlari uchun odatiy daraja; yetakchi universitetlar (SNU, KAIST, Korea Univ.) ko‘pincha 6,5–7,0 talab qiladi.',
    'South Korea.topik': 'Koreys tilidagi dasturlar odatda TOPIK 3-darajani talab qiladi, raqobat yuqori dasturlar esa 4-daraja yoki undan yuqorisini afzal ko‘radi.',
    'Europe.ielts': 'Buyuk Britaniya, Germaniya va Niderlandiyadagi ingliz tilida o‘qitiladigan bakalavriat dasturlari uchun odatiy daraja; raqobat yuqori dasturlar, huquq va tibbiyot yo‘nalishlari ko‘pincha 7,0 yoki undan yuqorisini talab qiladi.',
    'North America.gpa': 'Tanlovi uncha yuqori bo‘lmagan to‘rt yillik oliygohlar uchun umumiy taxminiy ko‘rsatkich; tanlovchan universitetlar odatda 3,7 yoki undan yuqori GPA kutadi.',
    'North America.ielts': 'AQSh va Kanadada bakalavriatga qabul uchun odatiy eng kam daraja.',
  },
};

export function catalogText(language, key) {
  return copy[language]?.[key] ?? copy.en[key] ?? key;
}

export function catalogValue(value, language) {
  if (typeof value !== 'string') return value;
  const aliases = { uk: 'United Kingdom', bachelor: 'Bachelor', master: 'Master', phd: 'PhD', english: 'English', german: 'German', french: 'French', italian: 'Italian', korean: 'Korean', russian: 'Russian' };
  const normalized = aliases[value.toLowerCase()] || value;
  return values[language]?.[normalized] ?? normalized;
}

// Translate editorial catalogue copy only when the source sentence matches.
// New or changed source descriptions remain visible in their original language.
export function catalogDescription(description, language) {
  const translations = {
    'Innovative university with Seoul and Yongin campuses known for architecture and information science': {
      ru: 'Инновационный университет с кампусами в Сеуле и Йонъине, известный архитектурой и информационными науками.',
      uz: 'Seul va Yongindagi kampuslarga ega, arxitektura va axborot fanlari bilan tanilgan innovatsion universitet.',
    },
  };
  return translations[description]?.[language] || description;
}

export function catalogEstimateNote(region, field, language, fallback) {
  if (language === 'en') return fallback;
  return estimateNotes[language]?.[`${region}.${field}`] ?? fallback;
}

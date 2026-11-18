const COPY = {
  en: {
    headline: 'A world of possibilities.',
    description: 'Find your place. Write your next chapter.',
    caption: 'Your journey starts with a little curiosity.',
    subtitle: 'Keep your shortlist and your next steps in one place.',
    recommendationsNotice: 'You can get preliminary results from the survey without signing in. Sign in to get recommendations based on your saved profile.',
    surveyProfileNotice: 'Use this tab to sign in and save your survey answers. Your recommendations will open after saving.',
  },
  ru: {
    headline: 'Твой мир возможностей.',
    description: 'Найди своё место. Начни новую главу.',
    caption: 'Большое путешествие начинается с любопытства.',
    subtitle: 'Сохраняй университеты и планируй поступление.',
    recommendationsNotice: 'Предварительные результаты анкеты доступны без входа. Войдите, чтобы получить рекомендации по сохранённому профилю.',
    surveyProfileNotice: 'Войдите в этой вкладке, чтобы сохранить ответы анкеты в профиле и открыть рекомендации.',
  },
  uz: {
    headline: 'Imkoniyatlar olami.',
    description: 'O‘z joyingni top. Yangi sahifani och.',
    caption: 'Katta sayohat qiziqishdan boshlanadi.',
    subtitle: 'Universitetlarni saqlang va o‘qishga kirishni rejalashtiring.',
    recommendationsNotice: 'So‘rovnomaning dastlabki natijalarini tizimga kirmasdan ko‘rishingiz mumkin. Saqlangan profilingiz asosida tavsiyalar olish uchun tizimga kiring.',
    surveyProfileNotice: 'Javoblarni profilga saqlash va tavsiyalarni ochish uchun shu varaqda tizimga kiring.',
  },
}

export function authSceneCopy(language) { return COPY[language] || COPY.en }

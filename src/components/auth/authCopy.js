const COPY = {
  en: {
    headline: 'A world of possibilities.',
    description: 'Find your place. Write your next chapter.',
    caption: 'Your journey starts with a little curiosity.',
    subtitle: 'Keep your shortlist and your next steps in one place.',
    motionNotice: 'Your device prefers reduced motion.',
    enableMotion: 'Explore the interactive scene',
    pauseMotion: 'Pause animation',
  },
  ru: {
    headline: 'Твой мир возможностей.',
    description: 'Найди своё место. Начни новую главу.',
    caption: 'Большое путешествие начинается с любопытства.',
    subtitle: 'Сохраняй университеты и планируй поступление.',
    motionNotice: 'На устройстве включено уменьшение движения.',
    enableMotion: 'Включить интерактивную сцену',
    pauseMotion: 'Остановить анимацию',
  },
  uz: {
    headline: 'Imkoniyatlar olami.',
    description: 'O‘z joyingni top. Yangi sahifani och.',
    caption: 'Katta sayohat qiziqishdan boshlanadi.',
    subtitle: 'Universitetlarni saqlang va o‘qishga kirishni rejalashtiring.',
    motionNotice: 'Qurilmada harakatni kamaytirish yoqilgan.',
    enableMotion: 'Interaktiv sahnani yoqish',
    pauseMotion: 'Animatsiyani to‘xtatish',
  },
}

export function authSceneCopy(language) { return COPY[language] || COPY.en }

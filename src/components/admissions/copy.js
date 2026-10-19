import { polishCopy } from './polishCopy.js';

const en = {
  eyebrow: 'YOUR NEXT CHAPTER', title: 'Find a place to begin.', subtitle: 'Bachelor’s studies after school', you: 'You',
  steps: ['Direction', 'Preparation', 'Budget'], stepTitles: ['What would you like to study?', 'What do you already know?', 'Your annual tuition budget'],
  stepIntros: ['Choose an interest and any regions. Our researched coverage is still limited.', 'Enter only what you know. Grades and their original scale are optional.', 'Tuition for one academic year, excluding living costs and other fees.'],
  field: 'Field of study', regions: 'Where would you consider studying?', any: 'Not sure yet',
  fields: { business: 'Business', it: 'Information Technology (IT)', computer_engineering: 'Computer Engineering', software_engineering: 'Software Engineering', computer_science: 'Computer Science', other: 'Another field' },
  regionNames: { Europe: 'Europe', USA: 'United States', 'South Korea': 'South Korea', UK: 'United Kingdom', Canada: 'Canada' },
  regionHint: 'You can choose several. A visible region does not mean we have researched programmes there.',
  exam: 'Language exam', exams: { IELTS: 'IELTS Academic', TOEFL: 'TOEFL iBT', TOPIK: 'TOPIK', not_taken: 'Not taken yet' }, score: 'Your score',
  examHint: 'Different TOEFL scales and language waivers need a separate check. A score alone does not confirm eligibility.',
  gradesToggle: 'Add grades — optional', grade: 'Average grade', scale: 'Original grading scale', scales: { '4': 'Out of 4', '5': 'Out of 5', '100': 'Out of 100' }, gradeHint: 'We keep your original scale. We do not invent GPA equivalents.',
  budget: 'Tuition budget per academic year', currency: 'Currency', scholarship: 'Do you need a scholarship?', scholarships: { required: 'Essential', preferred: 'Would help', not_required: 'Not required' },
  budgetHint: 'Scholarships are not deducted from the published price. We do not convert currencies without a verified rate.',
  back: 'Back', next: 'Continue', show: 'Show options', skip: 'Not sure — skip this step', edit: 'Edit answers', editFields: 'Change direction', reset: 'Clear answers', resetConfirm: 'Clear the temporary answers in this tab?',
  temporary: 'Answers stay in this tab for up to two hours. Account saving and syncing are not available yet.', restored: 'Your temporary answers were restored in this tab.',
  expired: 'The previous draft expired or could not be read. You can start again.', storageError: 'This tab cannot keep a draft right now. You can continue, but your answers may be lost on reload. Clear answers to start a new draft.',
  errors: 'Check the highlighted fields. Incomplete information can be left unknown.', invalid: 'Enter a valid value in the displayed scale. Leave it blank if you do not know.',
  resultsTitle: 'A starting point, not an admission promise.', resultsIntro: 'Two researched candidates: Software Engineering in Finland and Computer Science in the USA. This is a limited selection, not a complete catalogue.',
  unknown: 'Eligibility needs clarification', unmet: 'A published condition needs attention', met: 'Published threshold reached', unknownShort: 'Unknown',
  noResults: 'Our researched selection does not cover these preferences yet.', noResultsBody: 'This does not mean there are no suitable programmes. Change your direction or regions, or leave preferences open. We will not replace IT, Business or Computer Engineering with Computer Science.',
  sources: 'Requirements, limits and official sources', checked: 'Sources checked', scope: 'Scope', tuition: 'Published tuition', baseOnly: 'Base tuition only, not a programme bill or total budget.', living: 'Living costs, other fees and personal eligibility still need checking.',
  nextStep: 'Your next step', official: 'Check the official admissions route', noDeadline: 'Intake availability and current places must be verified. Dates are not a guarantee of an available place.',
  refine: 'Refine the result — optional', refineIntro: 'These details help identify what must be checked. They do not automatically confirm your school document or a place.',
  schoolCountry: 'Country of school education', credential: 'Name of school qualification', startYear: 'Desired start year', language: 'Preferred teaching language', examDate: 'Exam date', languages: { English: 'English', Korean: 'Korean', other: 'Another language' }, apply: 'Apply details', applied: 'Details updated. Eligibility and missing information have been recalculated.',
  country: 'Country', programme: 'Programme', intake: 'Intake / route', incomplete: 'Individual qualification, selection and availability remain unconfirmed.',
  reasons: {
    FIELD_MATCH: 'The researched field matches your chosen direction.', FIELD_UNSPECIFIED: 'Your direction is open; these are examples of the researched coverage.', REGION_MATCH: 'This candidate is in a selected region.', REGION_UNSPECIFIED: 'You have not restricted the region.',
    PERSONAL_CREDENTIAL_UNKNOWN: 'The university must check your exact school qualification and academic preparation.', TURKU_PLACES_UNKNOWN: 'Available places and the selection interview still need confirmation.', ASU_SPRING_CS_INTAKE_UNCONFIRMED: 'The intended intake for this programme still needs confirmation.',
    LANGUAGE_TEST_UNSPECIFIED: 'Language evidence is not provided. Accepted alternatives and exemptions need checking.', LANGUAGE_SCALE_UNKNOWN: 'We cannot compare this exam or scale using the confirmed fields.', LANGUAGE_SCORE_MISSING: 'Your exam score is unknown.', LANGUAGE_BELOW_PUBLISHED_THRESHOLD: 'Your IELTS score is below the published threshold. Alternatives or exemptions need checking.', LANGUAGE_TEST_DATE_MISSING: 'The exam date and certificate validity need checking.', LANGUAGE_WAIVER_UNKNOWN: 'A published IELTS threshold alone does not settle validity, alternatives or exemption rules.',
    BUDGET_MISSING: 'Your tuition budget is unknown.', BUDGET_CURRENCY_UNKNOWN: 'The budget currency is unknown.', BUDGET_CURRENCY_MISMATCH: 'The currencies differ; no conversion has been assumed.', BUDGET_BELOW_PUBLISHED_TUITION: 'Your budget is below the published tuition amount in the same currency.', BUDGET_COVERS_TUITION_ONLY: 'Your amount covers the published tuition figure only; other fees and applicability remain unconfirmed.', ADMISSION_ELIGIBILITY_INCOMPLETE: 'These facts do not establish that all admission requirements are met.',
  },
  notes: {},
};

const ru = {
  ...en, eyebrow: 'ВАША СЛЕДУЮЩАЯ ГЛАВА', title: 'Найти своё место в мире.', subtitle: 'Бакалавриат после школы', you: 'Вы',
  steps: ['Направление', 'Подготовка', 'Бюджет'], stepTitles: ['Что хотите изучать?', 'Что уже известно о подготовке?', 'Ваш годовой бюджет на обучение'],
  stepIntros: ['Выберите направление и регионы. Проверенное покрытие пока ограничено.', 'Укажите только известное. Оценки с исходной шкалой — по желанию.', 'Обучение за один учебный год, без проживания и прочих сборов.'],
  field: 'Направление', regions: 'Где рассматриваете учёбу?', any: 'Пока не знаю',
  fields: { business: 'Бизнес', it: 'Информационные технологии (IT)', computer_engineering: 'Компьютерная инженерия', software_engineering: 'Программная инженерия', computer_science: 'Компьютерные науки (Computer Science)', other: 'Другое направление' },
  regionNames: { Europe: 'Европа', USA: 'США', 'South Korea': 'Южная Корея', UK: 'Великобритания', Canada: 'Канада' },
  regionHint: 'Можно несколько. Наличие региона в списке не означает, что программы там уже проверены.',
  exam: 'Языковой экзамен', exams: { IELTS: 'IELTS Academic', TOEFL: 'TOEFL iBT', TOPIK: 'TOPIK', not_taken: 'Ещё не сдавал(а)' }, score: 'Ваш балл', examHint: 'Разные шкалы TOEFL и освобождение от экзамена требуют отдельной проверки. Одного балла недостаточно для допуска.',
  gradesToggle: 'Добавить оценки — необязательно', grade: 'Средняя оценка', scale: 'Исходная шкала', scales: { '4': 'Из 4', '5': 'Из 5', '100': 'Из 100' }, gradeHint: 'Сохраняем исходную шкалу. Не придумываем эквивалент GPA.',
  budget: 'Бюджет на обучение за учебный год', currency: 'Валюта', scholarship: 'Нужна стипендия?', scholarships: { required: 'Без неё не смогу', preferred: 'Будет полезна', not_required: 'Не обязательна' }, budgetHint: 'Стипендию не вычитаем из цены. Без проверенного курса валюты не пересчитываем.',
  back: 'Назад', next: 'Продолжить', show: 'Показать варианты', skip: 'Пока не знаю — пропустить', edit: 'Изменить ответы', editFields: 'Изменить направление', reset: 'Сбросить ответы', resetConfirm: 'Удалить временные ответы в этой вкладке?',
  temporary: 'Ответы временно хранятся в этой вкладке до двух часов. Сохранение в аккаунт и синхронизация пока недоступны.', restored: 'Временные ответы восстановлены в этой вкладке.', expired: 'Предыдущий черновик истёк или не прочитан. Можно начать заново.', storageError: 'Сейчас черновик не сохраняется в этой вкладке. Можно продолжить, но при обновлении ответы могут потеряться. Для нового черновика сбросьте ответы.',
  errors: 'Проверьте отмеченные поля. Неполные сведения можно оставить неизвестными.', invalid: 'Введите корректное значение в указанной шкале. Если не знаете — оставьте поле пустым.',
  resultsTitle: 'Начало выбора, а не обещание поступления.', resultsIntro: 'Два исследованных кандидата: Software Engineering в Финляндии и Computer Science в США. Это ограниченная подборка, а не полный каталог.',
  unknown: 'Допустимость поступления нужно уточнить', unmet: 'Есть условие, требующее внимания', met: 'Опубликованный порог достигнут', unknownShort: 'Неизвестно',
  noResults: 'В проверенной подборке пока нет вариантов под эти предпочтения.', noResultsBody: 'Это не означает, что подходящих программ не существует. Измените направление или регионы либо оставьте предпочтения открытыми. Мы не подменяем IT, бизнес или компьютерную инженерию программой Computer Science.',
  sources: 'Условия, ограничения и официальные источники', checked: 'Дата проверки источников', scope: 'Область применимости', tuition: 'Опубликованная стоимость обучения', baseOnly: 'Только базовое обучение: это не счёт программы и не полный бюджет.', living: 'Проживание, прочие сборы и индивидуальную допустимость ещё нужно проверить.',
  nextStep: 'Следующий шаг', official: 'Проверить официальный порядок поступления', noDeadline: 'Набор и наличие мест нужно уточнить. Даты не гарантируют свободное место.',
  refine: 'Уточнить подбор — необязательно', refineIntro: 'Эти сведения помогут понять, что проверить. Они не подтверждают автоматически признание документа или наличие места.',
  schoolCountry: 'Страна школьного образования', credential: 'Название школьного документа', startYear: 'Желаемый год начала', language: 'Предпочитаемый язык обучения', examDate: 'Дата экзамена', languages: { English: 'Английский', Korean: 'Корейский', other: 'Другой язык' }, apply: 'Применить уточнения', applied: 'Уточнения применены. Условия и пробелы пересчитаны.',
  country: 'Страна', programme: 'Программа', intake: 'Набор / маршрут', incomplete: 'Индивидуальный документ, отбор и наличие мест ещё не подтверждены.',
  reasons: {
    FIELD_MATCH: 'Исследованная программа соответствует выбранному направлению.', FIELD_UNSPECIFIED: 'Направление не выбрано: показываем примеры проверенного охвата.', REGION_MATCH: 'Кандидат находится в выбранном регионе.', REGION_UNSPECIFIED: 'Регион не ограничен.',
    PERSONAL_CREDENTIAL_UNKNOWN: 'Вуз должен проверить ваш конкретный школьный документ и академическую подготовку.', TURKU_PLACES_UNKNOWN: 'Наличие мест и прохождение отборочного интервью ещё нужно подтвердить.', ASU_SPRING_CS_INTAKE_UNCONFIRMED: 'Желаемый набор на эту программу ещё нужно подтвердить.',
    LANGUAGE_TEST_UNSPECIFIED: 'Языковых данных нет. Альтернативы и освобождения нужно проверить.', LANGUAGE_SCALE_UNKNOWN: 'Этот экзамен или шкалу нельзя сопоставить по подтверждённым полям.', LANGUAGE_SCORE_MISSING: 'Балл экзамена неизвестен.', LANGUAGE_BELOW_PUBLISHED_THRESHOLD: 'Ваш IELTS ниже опубликованного порога. Альтернативы и освобождения нужно проверить.', LANGUAGE_TEST_DATE_MISSING: 'Дату экзамена и срок действия сертификата нужно проверить.', LANGUAGE_WAIVER_UNKNOWN: 'Один порог IELTS не подтверждает срок действия, альтернативы и правила освобождения.',
    BUDGET_MISSING: 'Бюджет на обучение неизвестен.', BUDGET_CURRENCY_UNKNOWN: 'Валюта бюджета неизвестна.', BUDGET_CURRENCY_MISMATCH: 'Валюты различаются: пересчёт не выполнялся.', BUDGET_BELOW_PUBLISHED_TUITION: 'Ваш бюджет ниже опубликованной стоимости обучения в той же валюте.', BUDGET_COVERS_TUITION_ONLY: 'Сумма покрывает только опубликованную стоимость обучения; прочие сборы и применимость ещё не подтверждены.', ADMISSION_ELIGIBILITY_INCOMPLETE: 'Эти сведения не подтверждают выполнение всех требований поступления.',
  },
  notes: {},
};

const uz = {
  ...en, eyebrow: 'KEYINGI QADAMINGIZ', title: 'O‘z yo‘lingizni toping.', subtitle: 'Maktabdan keyin bakalavriat', you: 'Siz',
  steps: ['Yo‘nalish', 'Tayyorgarlik', 'Budjet'], stepTitles: ['Nimani o‘rganmoqchisiz?', 'Tayyorgarligingiz haqida nimalar ma’lum?', 'Bir yillik o‘qish budjetingiz'],
  stepIntros: ['Yo‘nalish va hududlarni tanlang. Tekshirilgan dasturlar qamrovi hozircha cheklangan.', 'Faqat bilganingizni kiriting. Baho va uning asl shkalasi ixtiyoriy.', 'Bir o‘quv yilining o‘qish haqi, yashash va boshqa to‘lovlarsiz.'],
  field: 'Ta’lim yo‘nalishi', regions: 'Qayerda o‘qishni istaysiz?', any: 'Hali bilmayman', fields: { business: 'Biznes', it: 'Axborot texnologiyalari (IT)', computer_engineering: 'Kompyuter muhandisligi', software_engineering: 'Dasturiy injiniring', computer_science: 'Kompyuter fanlari (Computer Science)', other: 'Boshqa yo‘nalish' },
  regionNames: { Europe: 'Yevropa', USA: 'AQSh', 'South Korea': 'Janubiy Koreya', UK: 'Buyuk Britaniya', Canada: 'Kanada' }, regionHint: 'Bir nechtasini tanlash mumkin. Hudud ro‘yxatda bo‘lishi u yerdagi dasturlar tekshirilganini anglatmaydi.',
  exam: 'Til imtihoni', exams: { IELTS: 'IELTS Academic', TOEFL: 'TOEFL iBT', TOPIK: 'TOPIK', not_taken: 'Hali topshirmaganman' }, score: 'Natijangiz', examHint: 'TOEFL shkalalari va imtihondan ozod qilish qoidalari alohida tekshiriladi. Faqat ball qabul shartlari bajarilganini bildirmaydi.',
  gradesToggle: 'Baholarni qo‘shish — ixtiyoriy', grade: 'O‘rtacha baho', scale: 'Asl baholash shkalasi', scales: { '4': '4 ballik', '5': '5 ballik', '100': '100 ballik' }, gradeHint: 'Asl shkalani saqlaymiz. GPA ekvivalentini taxmin qilmaymiz.',
  budget: 'Bir o‘quv yilining o‘qish budjeti', currency: 'Valuta', scholarship: 'Stipendiya kerakmi?', scholarships: { required: 'Stipendiyasiz o‘qiy olmayman', preferred: 'Foydali bo‘lardi', not_required: 'Shart emas' }, budgetHint: 'Stipendiya narxdan ayrilmaydi. Tekshirilgan kurssiz valuta o‘girilmaydi.',
  back: 'Orqaga', next: 'Davom etish', show: 'Variantlarni ko‘rish', skip: 'Hali bilmayman — o‘tkazish', edit: 'Javoblarni o‘zgartirish', editFields: 'Yo‘nalishni o‘zgartirish', reset: 'Javoblarni tozalash', resetConfirm: 'Shu oynadagi vaqtinchalik javoblar o‘chirilsinmi?',
  temporary: 'Javoblar shu oynada ikki soatgacha saqlanadi. Hisobga saqlash va sinxronlash hozircha mavjud emas.', restored: 'Vaqtinchalik javoblar shu oynada tiklandi.', expired: 'Oldingi qoralama eskirgan yoki o‘qilmadi. Qayta boshlashingiz mumkin.', storageError: 'Qoralama bu oynada saqlanmayapti. Davom etish mumkin, ammo yangilanganda javoblar yo‘qolishi mumkin. Yangi qoralama uchun javoblarni tozalang.',
  errors: 'Belgilangan maydonlarni tekshiring. To‘liq bo‘lmagan ma’lumot noma’lum qolishi mumkin.', invalid: 'Ko‘rsatilgan shkalada to‘g‘ri qiymat kiriting. Bilmasangiz, bo‘sh qoldiring.',
  resultsTitle: 'Tanlovning boshlanishi, qabul va’dasi emas.', resultsIntro: 'Ikki o‘rganilgan nomzod: Finlandiyada Software Engineering va AQShda Computer Science. Bu cheklangan tanlov, to‘liq katalog emas.', unknown: 'Qabulga moslik aniqlashtirilishi kerak', unmet: 'E’lon qilingan shartga e’tibor kerak', met: 'E’lon qilingan chegara bajarilgan', unknownShort: 'Noma’lum',
  noResults: 'Tekshirilgan tanlovda bu istaklarga mos variantlar hozircha yo‘q.', noResultsBody: 'Bu mos dasturlar umuman yo‘q degani emas. Yo‘nalish yoki hududlarni o‘zgartiring yoki istaklarni ochiq qoldiring. IT, biznes va kompyuter muhandisligini Computer Science bilan almashtirmaymiz.',
  sources: 'Shartlar, cheklovlar va rasmiy manbalar', checked: 'Manbalar tekshirilgan sana', scope: 'Qo‘llanish sohasi', tuition: 'E’lon qilingan o‘qish haqi', baseOnly: 'Faqat bazaviy o‘qish haqi, dastur hisobi yoki to‘liq budjet emas.', living: 'Yashash, boshqa to‘lovlar va shaxsiy moslik hali tekshirilishi kerak.', nextStep: 'Keyingi qadam', official: 'Rasmiy qabul tartibini tekshirish', noDeadline: 'Qabul davri va bo‘sh o‘rinlarni aniqlashtiring. Sanalar bo‘sh o‘rinni kafolatlamaydi.',
  refine: 'Tanlovni aniqlashtirish — ixtiyoriy', refineIntro: 'Bu ma’lumotlar nimani tekshirishni ko‘rsatadi. Hujjatingiz yoki joy borligini avtomatik tasdiqlamaydi.', schoolCountry: 'Maktab ta’limi olingan davlat', credential: 'Maktab hujjatining nomi', startYear: 'O‘qishni boshlash yili', language: 'Istalgan ta’lim tili', examDate: 'Imtihon sanasi', languages: { English: 'Inglizcha', Korean: 'Koreyscha', other: 'Boshqa til' }, apply: 'Aniqliklarni qo‘llash', applied: 'Aniqliklar qo‘llandi. Shartlar va noma’lum ma’lumotlar qayta hisoblandi.', country: 'Davlat', programme: 'Dastur', intake: 'Qabul davri / yo‘li', incomplete: 'Shaxsiy hujjat, tanlov va bo‘sh joylar hali tasdiqlanmagan.',
  reasons: {
    FIELD_MATCH: 'O‘rganilgan dastur tanlangan yo‘nalishga mos.', FIELD_UNSPECIFIED: 'Yo‘nalish ochiq: tekshirilgan qamrovdan misollar ko‘rsatilmoqda.', REGION_MATCH: 'Nomzod tanlangan hududda.', REGION_UNSPECIFIED: 'Hudud cheklanmagan.', PERSONAL_CREDENTIAL_UNKNOWN: 'Universitet aniq maktab hujjatingiz va akademik tayyorgarligingizni tekshirishi kerak.', TURKU_PLACES_UNKNOWN: 'Bo‘sh joylar va tanlov suhbati hali tasdiqlanishi kerak.', ASU_SPRING_CS_INTAKE_UNCONFIRMED: 'Bu dastur uchun istalgan qabul davrini hali tasdiqlash kerak.', LANGUAGE_TEST_UNSPECIFIED: 'Til bo‘yicha dalil yo‘q. Muqobil variantlar va istisnolar tekshirilishi kerak.', LANGUAGE_SCALE_UNKNOWN: 'Bu imtihon yoki shkala tasdiqlangan ma’lumotlarga ko‘ra taqqoslanmaydi.', LANGUAGE_SCORE_MISSING: 'Imtihon balli noma’lum.', LANGUAGE_BELOW_PUBLISHED_THRESHOLD: 'IELTS natijangiz e’lon qilingan chegaradan past. Muqobil yoki istisno shartlarni tekshiring.', LANGUAGE_TEST_DATE_MISSING: 'Imtihon sanasi va sertifikat amal qilish muddati tekshirilishi kerak.', LANGUAGE_WAIVER_UNKNOWN: 'IELTS chegarasining o‘zi amal muddati, muqobil imtihon va istisnolarni tasdiqlamaydi.', BUDGET_MISSING: 'O‘qish budjeti noma’lum.', BUDGET_CURRENCY_UNKNOWN: 'Budjet valutasi noma’lum.', BUDGET_CURRENCY_MISMATCH: 'Valutalar farq qiladi; kurs taxmin qilinmagan.', BUDGET_BELOW_PUBLISHED_TUITION: 'Budjetingiz shu valutadagi e’lon qilingan o‘qish haqidan past.', BUDGET_COVERS_TUITION_ONLY: 'Mablag‘ faqat e’lon qilingan o‘qish haqini qoplaydi; boshqa to‘lovlar va qo‘llanish sohasi tasdiqlanmagan.', ADMISSION_ELIGIBILITY_INCOMPLETE: 'Bu ma’lumotlar barcha qabul shartlari bajarilganini tasdiqlamaydi.',
  },
  notes: {},
};

Object.assign(en.reasons, {
  SCHOLARSHIP_ELIGIBILITY_UNKNOWN: 'Scholarship eligibility and award are unconfirmed. The published tuition has not been reduced.',
  GRADE_REQUIREMENTS_UNKNOWN: 'Full academic eligibility is not established. Grades are not converted without a verified rule.',
  START_YEAR_MISMATCH: 'The published intake differs from your chosen year.',
  TEACHING_LANGUAGE_MISMATCH: 'This programme is taught in English, which differs from your language preference.',
  EXAM_VALIDITY_UNKNOWN: 'Certificate validity and accepted test conditions have not been fully assessed.',
  LANGUAGE_THRESHOLD_REACHED: 'Your IELTS Academic score reaches the published overall threshold. This is only one part of the conditions.',
});
Object.assign(ru.reasons, {
  SCHOLARSHIP_ELIGIBILITY_UNKNOWN: 'Допустимость и получение стипендии не подтверждены. Опубликованная стоимость обучения не уменьшена.',
  GRADE_REQUIREMENTS_UNKNOWN: 'Полное соответствие академическим условиям программы не установлено. Оценки не пересчитываются без проверенного правила.',
  START_YEAR_MISMATCH: 'Опубликованный набор отличается от выбранного года.',
  TEACHING_LANGUAGE_MISMATCH: 'Программа преподаётся на английском, что отличается от выбранного языка.',
  EXAM_VALIDITY_UNKNOWN: 'Срок действия сертификата и условия принятия экзамена полностью не проверены.',
  LANGUAGE_THRESHOLD_REACHED: 'Ваш общий IELTS Academic достигает опубликованного порога. Это только часть условий.',
});
Object.assign(uz.reasons, {
  SCHOLARSHIP_ELIGIBILITY_UNKNOWN: 'Stipendiyaga moslik va uni olish tasdiqlanmagan. E’lon qilingan o‘qish haqi kamaytirilmagan.',
  GRADE_REQUIREMENTS_UNKNOWN: 'Akademik talablarga to‘liq moslik aniqlanmagan. Tasdiqlangan qoidasiz baholar o‘girilmaydi.',
  START_YEAR_MISMATCH: 'O‘rganilgan qabul — 2027-yil avgust; istalgan yilingizdan farq qiladi.',
  TEACHING_LANGUAGE_MISMATCH: 'Dastur ingliz tilida, bu siz tanlagan tildan farq qiladi.',
  EXAM_VALIDITY_UNKNOWN: 'Sertifikat amal muddati va imtihonni qabul qilish shartlari to‘liq tekshirilmagan.',
  LANGUAGE_THRESHOLD_REACHED: 'IELTS Academic umumiy ballingiz e’lon qilingan chegaraga yetadi. Bu shartlarning faqat bir qismi.',
});

const selectionCopy = {
  en: {
    publishedCost: 'Published tuition reference', periods: { year: 'year', semester: 'semester' }, entryUnknown: 'Direct entry with your qualification is not established.', entryConditional: 'The published entry route still needs verification for your qualification.', publishedGaps: 'Unresolved points in the source research',
    resultsIntro: 'A researched selection of real programmes. Region and subject preferences are kept; unknown conditions remain visible. This is not a complete catalogue.',
    coverage: '{shown} different institutions shown. Fewer than five means the researched coverage is limited; we do not fill gaps with another region or invented programmes.',
    topBadge: 'Among the best matches to known criteria', topExplanation: 'Up to three candidates are highlighted using comparable academic and language evidence and your preferences. This is not confirmation of full eligibility or admission.',
    exploreExplanation: 'Options to explore, not a personal top ranking. The available answers or published conditions are insufficient to justify a top three.',
    attention: 'After improvement or clarification', alternativesTitle: 'Conditions to improve or clarify first', alternativesExplanation: 'These are separate from the main options. A published requirement, route threshold or budget needs attention; this does not constitute a final admissions decision.',
    noResultsBody: 'No researched option covers this combination yet. Edit your subject or regions, or leave preferences open. We never change these choices silently just to fill five places.',
  },
  ru: {
    publishedCost: 'Опубликованный ориентир стоимости', periods: { year: 'год', semester: 'семестр' }, entryUnknown: 'Прямое поступление с вашим документом не подтверждено.', entryConditional: 'Опубликованный путь поступления ещё нужно проверить для вашего документа.', publishedGaps: 'Пробелы в исследованных источниках',
    resultsIntro: 'Исследованная подборка реальных программ. Выбранные регион и направление сохраняются, неизвестные условия отмечены. Это не полный каталог.',
    coverage: 'Показано различных вузов: {shown}. Если их меньше пяти, проверенного охвата не хватает; другой регион или вымышленные программы не подставляются.',
    topBadge: 'Среди наиболее соответствующих известным критериям', topExplanation: 'До трёх вариантов выделены по сопоставимым академическим и языковым данным и вашим предпочтениям. Это не подтверждение полного допуска или поступления.',
    exploreExplanation: 'Варианты для изучения, а не персональный топ. Ответов или опубликованных условий пока недостаточно для обоснованной тройки.',
    attention: 'После улучшения или уточнения', alternativesTitle: 'Сначала улучшить или уточнить условия', alternativesExplanation: 'Эти варианты отделены от основной выдачи. Опубликованное условие, порог одного из путей или бюджет требуют внимания; это не окончательное решение о приёме.',
    noResultsBody: 'В исследованной подборке пока нет варианта под это сочетание. Измените направление или регионы либо оставьте предпочтения открытыми. Мы не меняем выбор скрыто ради пяти карточек.',
  },
  uz: {
    publishedCost: 'E’lon qilingan o‘qish haqi', periods: { year: 'yil', semester: 'semestr' }, entryUnknown: 'Hujjatingiz bilan to‘g‘ridan-to‘g‘ri kirish tasdiqlanmagan.', entryConditional: 'E’lon qilingan kirish yo‘li hujjatingiz uchun tekshirilishi kerak.', publishedGaps: 'O‘rganilgan manbalardagi ochiq masalalar',
    resultsIntro: 'Haqiqiy dasturlarning o‘rganilgan tanlovi. Tanlangan hudud va yo‘nalish saqlanadi, noma’lum shartlar ko‘rsatiladi. Bu to‘liq katalog emas.',
    coverage: 'Ko‘rsatilgan turli universitetlar: {shown}. Beshdan kam bo‘lsa, tekshirilgan qamrov cheklangan; boshqa hudud yoki o‘ylab topilgan dastur bilan to‘ldirmaymiz.',
    topBadge: 'Ma’lum mezonlarga eng mos variantlardan', topExplanation: 'Uchtagacha variant taqqoslanadigan akademik va til dalillari hamda istaklaringizga ko‘ra ajratilgan. Bu to‘liq moslik yoki qabul tasdig‘i emas.',
    exploreExplanation: 'O‘rganish uchun variantlar, shaxsiy reyting emas. Asosli uchlik uchun javoblar yoki e’lon qilingan shartlar yetarli emas.',
    attention: 'Yaxshilash yoki aniqlashtirishdan so‘ng', alternativesTitle: 'Avval shartlarni yaxshilash yoki aniqlashtirish', alternativesExplanation: 'Bu variantlar asosiy tanlovdan ajratilgan. Shart, yo‘llardan birining chegarasi yoki budjet e’tibor talab qiladi; bu yakuniy qabul qarori emas.',
    noResultsBody: 'O‘rganilgan tanlovda bu birikmaga mos variant hozircha yo‘q. Yo‘nalish yoki hududlarni o‘zgartiring yoki ochiq qoldiring. Besh kartochka uchun tanlovni yashirin o‘zgartirmaymiz.',
  },
};

const requirementCopy = {
  en: {
    FIELD_ROUTING_INFERRED: 'The subject grouping is an inferred catalogue mapping; the official programme title is shown unchanged.', TEACHING_LANGUAGE_UNCONFIRMED: 'The teaching language has not been fully verified for this programme.',
    ACADEMIC_MET: 'The documented academic criteria we could compare are met; this is not an admission decision.', ACADEMIC_UNMET: 'A verified applicable academic requirement is not met.', ACADEMIC_UNKNOWN: 'Academic applicability or comparable evidence is incomplete.',
    LANGUAGE_MET: 'The documented language condition is met in the evaluated scope.', LANGUAGE_UNMET: 'A verified applicable language requirement is not met.', LANGUAGE_UNKNOWN: 'The complete language route, alternatives or applicability need clarification.',
    REQUIREMENT_UNKNOWN: 'Part of the requirement or its complete logic is unknown.', REQUIREMENT_SCOPE_UNKNOWN: 'The published condition is not yet confirmed for your qualification or intended intake.', GRADE_SCALE_UNKNOWN: 'The original grading scales cannot be compared without a verified rule.', GRADE_DATA_UNKNOWN: 'Comparable grade information is missing.', GRADE_THRESHOLD_MET: 'Your grade meets the published threshold in the same scale and scope.', GRADE_THRESHOLD_BELOW: 'Your grade is below the published threshold in the same scale and scope.', EXAM_UNKNOWN: 'The relevant exam result is unknown or not comparable.', IELTS_THRESHOLD_MET: 'Your overall IELTS Academic meets the published threshold for this route.', IELTS_THRESHOLD_BELOW: 'Your overall IELTS Academic is below the published threshold for this route.', LANGUAGE_SECTIONS_UNKNOWN: 'Required section scores have not been supplied or assessed.', EXAM_DATE_UNKNOWN: 'Certificate validity needs dates and a confirmed rule.', EXAM_DATE_INVALID: 'The exam date cannot support a valid comparison.', EXAM_EXPIRED: 'The certificate is outside the published validity period for the checked date.', COMPETITIVENESS_UNKNOWN: 'Competitiveness is not established. Meeting minima does not make this an easy or safe option.', TUITION_SCOPE_UNKNOWN: 'Annual tuition applicable to your category and intake is not established.',
  },
  ru: {
    FIELD_ROUTING_INFERRED: 'Группа направления определена по содержанию; официальное название программы сохранено.', TEACHING_LANGUAGE_UNCONFIRMED: 'Язык обучения этой программы полностью не подтверждён.',
    ACADEMIC_MET: 'Сопоставленные опубликованные академические критерии выполнены; это не решение о зачислении.', ACADEMIC_UNMET: 'Проверенное применимое академическое условие не выполнено.', ACADEMIC_UNKNOWN: 'Применимость академических условий или сопоставимые данные неполны.',
    LANGUAGE_MET: 'Опубликованное языковое условие выполнено в проверенной области.', LANGUAGE_UNMET: 'Проверенное применимое языковое условие не выполнено.', LANGUAGE_UNKNOWN: 'Полный языковой маршрут, альтернативы или применимость нужно уточнить.',
    REQUIREMENT_UNKNOWN: 'Часть условия или его полная логика неизвестны.', REQUIREMENT_SCOPE_UNKNOWN: 'Условие пока не подтверждено для вашего документа или желаемого набора.', GRADE_SCALE_UNKNOWN: 'Исходные шкалы оценок нельзя сопоставить без проверенного правила.', GRADE_DATA_UNKNOWN: 'Сопоставимые сведения об оценках отсутствуют.', GRADE_THRESHOLD_MET: 'Оценка достигает опубликованного порога в той же шкале и области применения.', GRADE_THRESHOLD_BELOW: 'Оценка ниже опубликованного порога в той же шкале и области применения.', EXAM_UNKNOWN: 'Результат нужного экзамена неизвестен или несопоставим.', IELTS_THRESHOLD_MET: 'Общий IELTS Academic достигает опубликованного порога этого пути.', IELTS_THRESHOLD_BELOW: 'Общий IELTS Academic ниже опубликованного порога этого пути.', LANGUAGE_SECTIONS_UNKNOWN: 'Необходимые баллы по секциям не указаны или не оценены.', EXAM_DATE_UNKNOWN: 'Для срока действия сертификата нужны даты и подтверждённое правило.', EXAM_DATE_INVALID: 'Дата экзамена не позволяет выполнить корректное сравнение.', EXAM_EXPIRED: 'Сертификат вне опубликованного срока действия на проверяемую дату.', COMPETITIVENESS_UNKNOWN: 'Конкурсность не установлена. Соблюдение минимумов не делает вариант лёгким или безопасным.', TUITION_SCOPE_UNKNOWN: 'Применимая годовая стоимость обучения для вашей категории и набора не установлена.',
  },
  uz: {
    FIELD_ROUTING_INFERRED: 'Yo‘nalish guruhi mazmun asosida belgilangan; rasmiy dastur nomi saqlangan.', TEACHING_LANGUAGE_UNCONFIRMED: 'Bu dasturning ta’lim tili to‘liq tasdiqlanmagan.',
    ACADEMIC_MET: 'Taqqoslangan akademik mezonlar bajarilgan; bu qabul qarori emas.', ACADEMIC_UNMET: 'Tasdiqlangan va qo‘llanadigan akademik shart bajarilmagan.', ACADEMIC_UNKNOWN: 'Akademik shartlar qo‘llanishi yoki taqqoslanadigan ma’lumotlar to‘liq emas.',
    LANGUAGE_MET: 'Baholangan doirada e’lon qilingan til sharti bajarilgan.', LANGUAGE_UNMET: 'Tasdiqlangan va qo‘llanadigan til sharti bajarilmagan.', LANGUAGE_UNKNOWN: 'To‘liq til yo‘li, muqobil variantlar yoki qo‘llanishi aniqlashtiriladi.',
    REQUIREMENT_UNKNOWN: 'Shartning bir qismi yoki to‘liq mantiqi noma’lum.', REQUIREMENT_SCOPE_UNKNOWN: 'Shart hujjatingiz yoki istalgan qabul davri uchun hali tasdiqlanmagan.', GRADE_SCALE_UNKNOWN: 'Asl baholash shkalalari tasdiqlangan qoidasiz taqqoslanmaydi.', GRADE_DATA_UNKNOWN: 'Taqqoslanadigan baho ma’lumoti yo‘q.', GRADE_THRESHOLD_MET: 'Baho bir xil shkala va doiradagi e’lon qilingan chegaraga yetadi.', GRADE_THRESHOLD_BELOW: 'Baho bir xil shkala va doiradagi chegaradan past.', EXAM_UNKNOWN: 'Kerakli imtihon natijasi noma’lum yoki taqqoslanmaydi.', IELTS_THRESHOLD_MET: 'IELTS Academic umumiy balli shu yo‘l chegarasiga yetadi.', IELTS_THRESHOLD_BELOW: 'IELTS Academic umumiy balli shu yo‘l chegarasidan past.', LANGUAGE_SECTIONS_UNKNOWN: 'Kerakli bo‘lim ballari kiritilmagan yoki baholanmagan.', EXAM_DATE_UNKNOWN: 'Sertifikat amal muddati uchun sanalar va tasdiqlangan qoida kerak.', EXAM_DATE_INVALID: 'Imtihon sanasi to‘g‘ri taqqoslashga imkon bermaydi.', EXAM_EXPIRED: 'Tekshirilayotgan sanada sertifikatning e’lon qilingan muddati o‘tgan.', COMPETITIVENESS_UNKNOWN: 'Tanlov darajasi aniqlanmagan. Minimumlar bajarilishi variantni oson yoki xavfsiz qilmaydi.', TUITION_SCOPE_UNKNOWN: 'Toifangiz va qabul davringizga tegishli yillik o‘qish haqi aniqlanmagan.',
  },
};

const productCopy = {
  en: {
    coverageSummary: '{shown} researched institutions · coverage and limits',
    resultsTitle: 'Your next step', resultsLead: 'Options to explore, not an admission forecast.',
    temporary: 'Answers stay in this tab for up to two hours. Saved universities belong to your account; the full survey is not synced.',
    save: 'Save university', saved: 'Saved', saving: 'Saving…', removing: 'Removing…', removeSaved: 'Remove from saved', saveRetry: 'Retry', saveLoading: 'Loading your saved universities…',
    saveError: 'We could not confirm the change. Your saved list has not been updated here. Retry.', saveDuplicates: 'More than one student profile was found. We cannot safely change your saved list.', saveProfileRequired: 'Sign in to save a university to your account.',
    saveStorageError: 'This tab cannot preserve the return to your selection. Enable session storage and retry; your current answers are still visible.', signInToSave: 'Sign in is needed only to save a university.',
    confirmSave: 'Confirm save', dismissSave: 'Dismiss', resumeSave: 'Save this university to the account you signed in to?', savedInAccount: 'University saved to your account.', removedFromAccount: 'University removed from your saved list.', sessionChanged: 'Your account changed. Reload and retry.',
    saveDraftExpired: 'The saved selection expired or the answers changed. Choose a university again from the current results.', saveCatalogExpired: 'The catalogue changed. Review the current results and choose again.',
    accountFavorites: 'Universities saved from the survey', savedInstitution: 'Saved university. This is not an admission assessment.',
    officialHomepage: 'University website', officialProgramme: 'Programme page', photoUnavailable: 'Verified university photo unavailable', photoCredit: 'Photo source and licence', photoScope: 'Photo coverage',
    story: { origin: 'YOUR NEXT CHAPTER', titles: ['A direction starts with curiosity.', 'Build on what you already know.', 'Make room for your possibilities.'], mobileTitles: ['Find your direction.', 'Your starting point.', 'Your possibilities.'], descriptions: ['Explore where your interests could take you. Choose a subject and the places you would consider.', 'Your preparation helps us compare published conditions. Unknown answers can stay open.', 'Keep the cost of tuition in view as you explore the next step.'], resultsTitle: 'Your next chapter takes shape.', resultsMobileTitle: 'Places to explore.', resultsDescription: 'Explore the evidence, then take the next step with the university.', labels: ['You', 'Your interests', 'University'], resultLabel: 'Your options', openRoute: 'Still open to possibilities', interest: 'Your direction', preparation: 'Your preparation', possibilities: 'Your tuition budget' },
  },
  ru: {
    coverageSummary: 'Вузов в подборке: {shown} · охват и ограничения',
    resultsTitle: 'Ваш следующий шаг', resultsLead: 'Варианты для изучения, не прогноз поступления.',
    temporary: 'Ответы остаются в этой вкладке до двух часов. Сохранённые вузы привязаны к аккаунту; вся анкета не синхронизируется.',
    save: 'Сохранить вуз', saved: 'Сохранено', saving: 'Сохраняем…', removing: 'Удаляем…', removeSaved: 'Убрать из сохранённых', saveRetry: 'Повторить', saveLoading: 'Загружаем сохранённые вузы…',
    saveError: 'Изменение не удалось подтвердить. Список здесь не обновлён. Повторите попытку.', saveDuplicates: 'Найдено несколько профилей студента. Безопасно изменить список пока нельзя.', saveProfileRequired: 'Войдите, чтобы сохранить вуз в аккаунт.',
    saveStorageError: 'Вкладка не может сохранить возврат к выбранному варианту. Разрешите хранение сессии и повторите; текущие ответы остаются на экране.', signInToSave: 'Вход нужен только для сохранения вуза.',
    confirmSave: 'Подтвердить сохранение', dismissSave: 'Отменить', resumeSave: 'Сохранить этот вуз в аккаунт, в который вы вошли?', savedInAccount: 'Вуз сохранён в вашем аккаунте.', removedFromAccount: 'Вуз убран из сохранённых.', sessionChanged: 'Аккаунт изменился. Обновите страницу и повторите.',
    saveDraftExpired: 'Выбор истёк или ответы изменились. Выберите вуз снова в текущей подборке.', saveCatalogExpired: 'Каталог изменился. Просмотрите текущую подборку и выберите вуз снова.',
    accountFavorites: 'Вузы, сохранённые из анкеты', savedInstitution: 'Сохранённый вуз. Это не оценка возможности поступления.',
    officialHomepage: 'Сайт университета', officialProgramme: 'Страница программы', photoUnavailable: 'Проверенное фото вуза недоступно', photoCredit: 'Источник и лицензия фотографии', photoScope: 'Что показано на фото',
    story: { origin: 'ВАША СЛЕДУЮЩАЯ ГЛАВА', titles: ['Направление начинается с интереса.', 'Опирайтесь на то, что уже знаете.', 'Откройте место возможностям.'], mobileTitles: ['Найдите направление.', 'Ваша отправная точка.', 'Ваши возможности.'], descriptions: ['Посмотрите, куда могут привести ваши интересы. Выберите направление и подходящие регионы.', 'Подготовка помогает сопоставить опубликованные условия. Неизвестное можно оставить открытым.', 'Учитывайте стоимость обучения, изучая следующий шаг.'], resultsTitle: 'Следующая глава обретает форму.', resultsMobileTitle: 'Варианты для изучения.', resultsDescription: 'Изучите источники и уточните следующий шаг у университета.', labels: ['Вы', 'Ваш интерес', 'Университет'], resultLabel: 'Ваши варианты', openRoute: 'Пока открыты к возможностям', interest: 'Ваше направление', preparation: 'Ваша подготовка', possibilities: 'Бюджет на обучение' },
  },
  uz: {
    coverageSummary: 'Tanlovdagi universitetlar: {shown} · qamrov va cheklovlar',
    resultsTitle: 'Keyingi qadamingiz', resultsLead: 'O‘rganish uchun variantlar, qabul prognozi emas.',
    temporary: 'Javoblar shu varaqda ikki soatgacha saqlanadi. Saqlangan universitetlar akkauntingizga bog‘lanadi; butun so‘rovnoma sinxronlanmaydi.',
    save: 'Universitetni saqlash', saved: 'Saqlandi', saving: 'Saqlanmoqda…', removing: 'O‘chirilmoqda…', removeSaved: 'Saqlanganlardan olib tashlash', saveRetry: 'Qayta urinish', saveLoading: 'Saqlangan universitetlar yuklanmoqda…',
    saveError: 'O‘zgarish tasdiqlanmadi. Bu yerdagi ro‘yxat yangilanmadi. Qayta urinib ko‘ring.', saveDuplicates: 'Bir nechta talaba profili topildi. Ro‘yxatni xavfsiz o‘zgartirib bo‘lmaydi.', saveProfileRequired: 'Universitetni akkauntingizga saqlash uchun kiring.',
    saveStorageError: 'Bu varaq tanlovga qaytishni saqlay olmayapti. Sessiya xotirasiga ruxsat berib qayta urining; joriy javoblar ekranda qoladi.', signInToSave: 'Kirish faqat universitetni saqlash uchun kerak.',
    confirmSave: 'Saqlashni tasdiqlash', dismissSave: 'Bekor qilish', resumeSave: 'Bu universitet kirgan akkauntingizga saqlansinmi?', savedInAccount: 'Universitet akkauntingizga saqlandi.', removedFromAccount: 'Universitet saqlanganlardan olib tashlandi.', sessionChanged: 'Akkaunt o‘zgardi. Sahifani yangilab qayta urining.',
    saveDraftExpired: 'Tanlov muddati tugadi yoki javoblar o‘zgardi. Joriy natijalardan universitetni qayta tanlang.', saveCatalogExpired: 'Katalog o‘zgardi. Joriy natijalarni ko‘rib qayta tanlang.',
    accountFavorites: 'So‘rovnomadan saqlangan universitetlar', savedInstitution: 'Saqlangan universitet. Bu qabul imkoniyati bahosi emas.',
    officialHomepage: 'Universitet sayti', officialProgramme: 'Dastur sahifasi', photoUnavailable: 'Tasdiqlangan universitet surati mavjud emas', photoCredit: 'Surat manbasi va litsenziyasi', photoScope: 'Suratda ko‘rsatilgan joy',
    story: { origin: 'KEYINGI SAHIFANGIZ', titles: ['Yo‘nalish qiziqishdan boshlanadi.', 'Bilganlaringizga tayaning.', 'Imkoniyatlarga joy oching.'], mobileTitles: ['Yo‘nalishingizni toping.', 'Boshlang‘ich nuqtangiz.', 'Imkoniyatlaringiz.'], descriptions: ['Qiziqishlaringiz qayerga olib borishini o‘rganing. Yo‘nalish va hududlarni tanlang.', 'Tayyorgarlik e’lon qilingan shartlarni taqqoslashga yordam beradi. Noma’lum javoblarni ochiq qoldiring.', 'Keyingi qadamni o‘rganayotganda o‘qish haqini hisobga oling.'], resultsTitle: 'Keyingi sahifangiz shakllanmoqda.', resultsMobileTitle: 'O‘rganish uchun variantlar.', resultsDescription: 'Manbalarni o‘rganing va keyingi qadamni universitetdan aniqlang.', labels: ['Siz', 'Qiziqishingiz', 'Universitet'], resultLabel: 'Variantlaringiz', openRoute: 'Imkoniyatlar hali ochiq', interest: 'Yo‘nalishingiz', preparation: 'Tayyorgarligingiz', possibilities: 'O‘qish budjetingiz' },
  },
};

const languageReferenceCopy = {
  en: { languageReference: 'Compared IELTS reference', languageReferenceLimit: 'The overall score alone does not confirm section scores, certificate validity, alternative routes or personal admission eligibility.', reasons: {
    LANGUAGE_REFERENCE_UNCONFIRMED: 'This published IELTS reference is not confirmed for your intake.',
    LANGUAGE_REFERENCE_HISTORICAL: 'This is a prior-season IELTS reference; current applicability is unconfirmed.',
  } },
  ru: { languageReference: 'Сравнённый ориентир IELTS', languageReferenceLimit: 'Один общий балл не подтверждает секции, срок действия сертификата, альтернативные пути или персональный допуск.', reasons: {
    LANGUAGE_REFERENCE_UNCONFIRMED: 'Применимость этого опубликованного ориентира IELTS к вашему набору не подтверждена.',
    LANGUAGE_REFERENCE_HISTORICAL: 'Это ориентир IELTS прошлого сезона; текущая применимость не подтверждена.',
  } },
  uz: { languageReference: 'Taqqoslangan IELTS ko‘rsatkichi', languageReferenceLimit: 'Umumiy ballning o‘zi bo‘lim ballari, sertifikat muddati, muqobil yo‘llar yoki shaxsiy qabulga muvofiqlikni tasdiqlamaydi.', reasons: {
    LANGUAGE_REFERENCE_UNCONFIRMED: 'Bu e’lon qilingan IELTS ko‘rsatkichi sizning qabul davringiz uchun tasdiqlanmagan.',
    LANGUAGE_REFERENCE_HISTORICAL: 'Bu oldingi mavsum IELTS ko‘rsatkichi; joriy qo‘llanishi tasdiqlanmagan.',
  } },
};

export const admissionCopy = {
  en: { ...en, ...selectionCopy.en, ...productCopy.en, ...polishCopy.en, ...languageReferenceCopy.en, locale: 'en', reasons: { ...en.reasons, ...requirementCopy.en, ...languageReferenceCopy.en.reasons }, sourceScopes: {} },
  ru: { ...ru, ...selectionCopy.ru, ...productCopy.ru, ...polishCopy.ru, ...languageReferenceCopy.ru, locale: 'ru', reasons: { ...ru.reasons, ...requirementCopy.ru, ...languageReferenceCopy.ru.reasons }, sourceScopes: {} },
  uz: { ...uz, ...selectionCopy.uz, ...productCopy.uz, ...polishCopy.uz, ...languageReferenceCopy.uz, locale: 'uz', reasons: { ...uz.reasons, ...requirementCopy.uz, ...languageReferenceCopy.uz.reasons }, sourceScopes: {} },
};

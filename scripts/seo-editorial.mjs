// Editorial records are opt-in. A draft is never emitted or linked.
const CHECKED_DATE = 'Checked 22 November 2026';

const polandSource = {
  label: 'Study in Poland — application guide',
  href: 'https://study.gov.pl/how-to-apply',
  detail: 'Checked 11 November 2026',
};
const germanySource = {
  label: 'DAAD — admission requirements overview',
  href: 'https://www.daad.de/en/studying-in-germany/requirements/overview/',
  detail: 'Checked 11 November 2026',
};
const ukSource = {
  label: 'Study UK (British Council) — official international student guide',
  href: 'https://study-uk.britishcouncil.org/',
  detail: CHECKED_DATE,
};
const ucasSource = {
  label: 'UCAS — official UK undergraduate admissions portal',
  href: 'https://www.ucas.com/',
  detail: CHECKED_DATE,
};
const italySource = {
  label: 'Study in Italy — Italian Ministry of Foreign Affairs',
  href: 'https://studyinitaly.esteri.it/',
  detail: CHECKED_DATE,
};
const universitalySource = {
  label: 'Universitaly — official Italian higher education portal',
  href: 'https://www.universitaly.it/',
  detail: CHECKED_DATE,
};
const usaSource = {
  label: 'EducationUSA — U.S. Department of State advising network',
  href: 'https://educationusa.state.gov/',
  detail: CHECKED_DATE,
};
const finlandSource = {
  label: 'Study in Finland — Finnish National Agency for Education',
  href: 'https://www.studyinfinland.fi/',
  detail: CHECKED_DATE,
};
const studyinfoSource = {
  label: 'Studyinfo.fi — official Finnish national application portal',
  href: 'https://opintopolku.fi/konfo/en/',
  detail: CHECKED_DATE,
};
const netherlandsSource = {
  label: 'Study in NL (Nuffic) — official Dutch higher education guide',
  href: 'https://www.studyinnl.org/',
  detail: CHECKED_DATE,
};
const koreaSource = {
  label: 'Study in Korea (NIIED) — Korean government portal',
  href: 'https://www.studyinkorea.go.kr/',
  detail: CHECKED_DATE,
};
const spainSource = {
  label: 'Ministry of Education, Vocational Training and Sports — Spain',
  href: 'https://www.educacionfpydeportes.gob.es/en/portada.html',
  detail: CHECKED_DATE,
};
const hungarySource = {
  label: 'Study in Hungary (Tempus Public Foundation) — official portal',
  href: 'https://studyinhungary.hu/',
  detail: CHECKED_DATE,
};
const irelandSource = {
  label: 'Education in Ireland — official national higher education portal',
  href: 'https://www.educationinireland.com/en/',
  detail: CHECKED_DATE,
};
const franceSource = {
  label: 'Campus France — official national agency for higher education in France',
  href: 'https://www.campusfrance.org/en',
  detail: CHECKED_DATE,
};
const austriaSource = {
  label: 'Study in Austria (OeAD) — official higher education portal',
  href: 'https://studyinaustria.at/en/',
  detail: CHECKED_DATE,
};

export const countries = {
  'united-kingdom': {
    name: 'United Kingdom',
    intro: 'Compare undergraduate bachelor’s degrees at UK universities across computer science, business and engineering. Verify international tuition bands, IELTS scores and accepted high school qualifications on each university profile and UCAS.',
    advice: 'Most full-time UK undergraduate applications go through UCAS, while international fee status, entry grades and accepted English tests are published per course by each university. Check whether your secondary school diploma qualifies for direct three-year entry or requires a foundation year.',
    source: ukSource,
    extraSources: [ucasSource],
  },
  germany: {
    name: 'Germany',
    intro: 'Explore German universities and use the programme sources to compare degree options in English and German. Before you settle on a shortlist, check whether your school qualification gives you direct access to the course you want.',
    advice: 'Use the DAAD admission resources to check how your qualification is recognised. Confirm the outcome, accepted IELTS or German certificates and any semester contribution with the university. Keep possible preparatory routes separate from direct entry when comparing how long each option could take.',
    source: germanySource,
  },
  italy: {
    name: 'Italy',
    intro: 'Browse Italian universities offering English-taught and Italian-taught bachelor’s degrees. Follow the official programme sources to check intake schedules, entrance tests and pre-enrolment rules.',
    advice: 'Non-EU applicants typically complete pre-enrolment steps alongside university-level admissions and any required entrance exams (such as TOLC or programme-specific assessments). Always check Universitaly and the university’s call for applications for the exact intake year.',
    source: italySource,
    extraSources: [universitalySource],
  },
  poland: {
    name: 'Poland',
    intro: 'Build a shortlist of Polish universities by degree, subject and city. For each programme, follow its source link to check the language of instruction, annual tuition and the current application round.',
    advice: 'Applications go directly to each institution. Make a separate checklist for each programme: required school documents, any translations or apostille steps, language evidence and the application deadline. The national study portal explains the process, and the university publishes the requirements for its own programme.',
    source: polandSource,
  },
  'united-states': {
    name: 'United States',
    intro: 'Explore U.S. universities on UniMatch and review verified programme pages before applying. Always verify published tuition scopes, scholarship policies and testing rules on each university’s official international admissions page.',
    advice: 'Undergraduate admissions in the United States evaluate high school transcripts, grade scales, language proficiency tests and institutional deadlines individually. Check EducationUSA alongside each university’s international admissions page for current fee schedules and financial aid rules.',
    source: usaSource,
  },
  finland: {
    name: 'Finland',
    intro: 'Compare English-taught bachelor’s programmes at Finnish universities and universities of applied sciences. Check joint application dates, non-EU tuition rules and entrance requirements before applying.',
    advice: 'Applications to degree programmes in Finland are managed through Studyinfo.fi, where application windows and eligibility rules are published per intake. Verify whether SAT scores, entrance exams or specific IELTS thresholds are required for your chosen programme.',
    source: finlandSource,
    extraSources: [studyinfoSource],
  },
  netherlands: {
    name: 'Netherlands',
    intro: 'Compare Dutch research universities and universities of applied sciences offering English-taught bachelor’s degrees. Review Numerus Fixus deadlines, matching procedures and statutory or institutional tuition scope.',
    advice: 'Check whether your chosen programme has an early Numerus Fixus selection deadline or a standard international deadline, and verify how Nuffic assesses your secondary diploma for research versus applied sciences entry.',
    source: netherlandsSource,
  },
  'south-korea': {
    name: 'South Korea',
    intro: 'Browse South Korean universities offering English-track and bilingual bachelor’s programmes in business, IT and engineering. Verify per-semester tuition in KRW, IELTS or TOPIK criteria and round deadlines on official admissions notices.',
    advice: 'International undergraduate admissions in South Korea generally open separately from domestic rounds and publish strict document authentication rules and tuition schedules per semester. Confirm whether your track requires IELTS, TOPIK or both.',
    source: koreaSource,
  },
  spain: {
    name: 'Spain',
    intro: 'Compare Spanish universities offering bilingual and English-taught bachelor’s degrees. Verify credential homologation or UNEDasiss assessment requirements and regional tuition rules before applying.',
    advice: 'International applicants from non-EU school systems typically verify how their secondary diploma maps onto Spanish university access criteria, alongside university-specific language requirements and intake calendars.',
    source: spainSource,
  },
  hungary: {
    name: 'Hungary',
    intro: 'Explore bachelor’s programmes in Hungary with verified tuition per semester, language thresholds and direct application links. Confirm exact entrance interview steps on each university’s international admissions page.',
    advice: 'Hungarian institutions publish separate self-financed tuition schedules and application deadlines for international applicants. Review the official programme source for required school subjects, medical or document checks, and interview rounds.',
    source: hungarySource,
  },
  ireland: {
    name: 'Ireland',
    intro: 'Browse Irish universities on UniMatch and review confirmed non-EU undergraduate tuition, IELTS requirements and entry standards using each programme’s official source.',
    advice: 'International non-EU applicants frequently apply directly to Irish institutions rather than through CAO, with published international fee schedules and country-specific high school grade equivalencies. Confirm exact dates and deposit rules with the admissions office.',
    source: irelandSource,
  },
  france: {
    name: 'France',
    intro: 'Explore bachelor’s programmes at French universities and compare language of instruction, application routes and official fees before applying.',
    advice: 'Depending on nationality, country of residence and institution type, applicants apply either through Campus France (Études en France), Parcoursup or direct institutional portals. Check which procedure applies to your residency status and intake year.',
    source: franceSource,
  },
  austria: {
    name: 'Austria',
    intro: 'Explore Austrian universities offering bachelor’s programmes and verify credential recognition, tuition category and accepted language certificates using official university sources.',
    advice: 'Admission to Austrian universities requires formal verification that your school-leaving certificate grants access to the same field of study (Reifezeugnis / special university entrance qualification) alongside published German or English proficiency levels.',
    source: austriaSource,
  },
};

export const guides = [
  {
    state: 'published',
    translationKey: 'check-university-application-requirements',
    slug: 'check-university-application-requirements',
    language: 'en',
    datePublished: '2026-11-11',
    dateModified: '2026-11-22',
    heading: 'How to check university application requirements',
    intro: 'Turn an overseas university shortlist into a checklist you can verify. Keep one record per programme and intake so requirements for different degrees or applicant groups do not get mixed together.',
    sections: [
      {
        heading: 'Record the exact programme and intake',
        paragraphs: ['Save the official programme and admissions links. Record the degree, campus, teaching language and intake. For example, in Poland you apply directly to each institution and use its programme page to confirm the required documents and deadlines.'],
        links: [polandSource],
      },
      {
        heading: 'Check how your qualification is assessed',
        paragraphs: ['Identify your school qualification by its exact name and country. In countries such as Germany, start with DAAD recognition resources and ask the university whether your qualification gives direct access or requires a preparatory route.'],
        links: [germanySource],
      },
      {
        heading: 'Separate confirmed details from open questions',
        paragraphs: ['Write down the date you checked each source, the language evidence it lists and the deadline that applies to your applicant group. If a page describes an earlier intake or another qualification, leave the field open and ask the admissions office to confirm it in writing.'],
      },
    ],
  },
  {
    state: 'published',
    translationKey: 'check-university-application-requirements',
    slug: 'kak-proverit-trebovaniya-k-postupleniyu',
    language: 'ru',
    datePublished: '2026-11-22',
    dateModified: '2026-11-22',
    heading: 'Как проверить требования к поступлению в зарубежный университет',
    intro: 'Превратите список зарубежных вузов в понятный чек-лист перед подачей документов. Ведите отдельную карточку для каждой программы и года набора, чтобы не смешивать условия разных стран и факультетов.',
    sections: [
      {
        heading: 'Фиксируйте точную программу и набор',
        paragraphs: ['Сохраняйте прямые ссылки на официальную страницу программы и приёмной комиссии. Записывайте степень, кампус, язык обучения, дату проверки и дедлайн именно для вашей категории абитуриента (например, non-EU).'],
        links: [polandSource, ukSource],
      },
      {
        heading: 'Проверяйте признание аттестата и язык',
        paragraphs: ['Уточняйте заранее, даёт ли ваш школьный аттестат прямой доступ к бакалавриату или требуется подготовительный год. Для Германии используйте базу DAAD, а для Великобритании — требования вузов и UCAS.'],
        links: [germanySource, ucasSource],
      },
    ],
  },
  {
    state: 'published',
    translationKey: 'check-university-application-requirements',
    slug: 'universitet-qabul-talablarini-tekshirish',
    language: 'uz',
    datePublished: '2026-11-22',
    dateModified: '2026-11-22',
    heading: 'Xorijiy universitetga qabul talablarini qanday tekshirish mumkin',
    intro: 'Xorijiy universitetlar ro‘yxatini hujjat topshirishdan oldin aniq tekshiruv jadvaliga aylantiring. Turli davlat va fakultet talablarini aralashtirib yubormaslik uchun har bir dastur va qabul yili uchun alohida yozuv yuriting.',
    sections: [
      {
        heading: 'Aniq dastur, til va qabul davrini qayd eting',
        paragraphs: ['Har bir universitet profilidagi rasmiy dastur va qabul sahifasini saqlab qo‘ying. Ta’lim bosqichi, kampus, o‘qitish tili va xalqaro abituriyentlar uchun amal qiladigan hujjat topshirish muddatini yozib oling.'],
        links: [polandSource, ukSource],
      },
      {
        heading: 'Maktab shahodatnomasi va til sertifikatini solishtiring',
        paragraphs: ['Attestat yoki diplom mamlakatda to‘g‘ridan-to‘g‘ri bakalavrga o‘tish huquqini berishini yoki tayyorlov bosqichi (foundation) kerakligini DAAD yoki rasmiy milliy portallar orqali tekshiring.'],
        links: [germanySource, studyinfoSource],
      },
    ],
  },
  {
    state: 'published',
    translationKey: 'compare-tuition-and-english-programmes',
    slug: 'compare-tuition-and-english-programmes',
    language: 'en',
    datePublished: '2026-11-22',
    dateModified: '2026-11-22',
    heading: 'How to compare tuition fees and English-taught bachelor’s programmes',
    intro: 'Compare international bachelor’s tuition across currencies, billing periods and fee categories accurately, while keeping tuition budgets separate from living costs.',
    sections: [
      {
        heading: 'Match the billing period and student category',
        paragraphs: ['Universities publish tuition per year, per semester or per credit, and often distinguish domestic or EU fees from international non-EU rates. Always verify the exact scope on the programme source before comparing totals.'],
        links: [netherlandsSource, finlandSource],
      },
      {
        heading: 'Check language of instruction and exam thresholds',
        paragraphs: ['Confirm whether the entire degree track is taught in English and which proficiency certificates (IELTS, TOEFL, Cambridge or TOPIK for Korean tracks) and sub-score minimums apply for the target intake.'],
        links: [koreaSource, italySource],
      },
    ],
  },
  {
    state: 'published',
    translationKey: 'compare-tuition-and-english-programmes',
    slug: 'sravnenie-stoimosti-obucheniya-i-programm-na-angliyskom',
    language: 'ru',
    datePublished: '2026-11-22',
    dateModified: '2026-11-22',
    heading: 'Как сравнивать стоимость обучения и программы бакалавриата на английском',
    intro: 'Сравнивайте стоимость обучения за рубежом корректно: учитывайте валюту, период оплаты и статус абитуриента (EU или non-EU), отделяя плату за учёбу от расходов на проживание.',
    sections: [
      {
        heading: 'Сверяйте период оплаты и категорию студента',
        paragraphs: ['В разных странах цена указывается за год, семестр или кредит. Перед расчётом бюджета уточните, для какой категории студентов (international / non-EU) указана сумма на официальной странице программы.'],
        links: [netherlandsSource, finlandSource],
      },
      {
        heading: 'Проверяйте язык обучения и минимальные баллы',
        paragraphs: ['Убедитесь, что выбранный трек полностью преподаётся на английском языке, и проверьте требования по IELTS, TOEFL или TOPIK (включая минимальные баллы по секциям, если они заданы).'],
        links: [koreaSource, italySource],
      },
    ],
  },
  {
    state: 'published',
    translationKey: 'compare-tuition-and-english-programmes',
    slug: 'oqish-haqi-va-ingliz-tilidagi-bakalavr-dasturlarini-solishtirish',
    language: 'uz',
    datePublished: '2026-11-22',
    dateModified: '2026-11-22',
    heading: 'O‘qish haqi va ingliz tilidagi bakalavr dasturlarini qanday solishtirish mumkin',
    intro: 'Turli mamlakatlardagi o‘qish haqini valyuta, to‘lov davri va talaba toifasi (xalqaro / non-EU) bo‘yicha to‘g‘ri taqqoslang hamda yashash xarajatlarini alohida hisoblang.',
    sections: [
      {
        heading: 'To‘lov davri va talaba toifasini aniqlang',
        paragraphs: ['Universitetlar o‘qish narxini yiliga, semestrga yoki kreditga qarab belgilaydi. Bir nechta dasturni solishtirishdan oldin ko‘rsatilgan summa xalqaro talabalar uchun ekanini rasmiy manbadan tekshiring.'],
        links: [netherlandsSource, finlandSource],
      },
      {
        heading: 'Ta’lim tili va sertifikat talablarini tekshiring',
        paragraphs: ['Dastur to‘liq ingliz tilida o‘qitilishini hamda qaysi IELTS, TOEFL yoki TOPIK ballari (jumladan bo‘limlar bo‘yicha minimal talablar) qabul qilinishini tasdiqlang.'],
        links: [koreaSource, italySource],
      },
    ],
  },
  {
    state: 'published',
    translationKey: 'prepare-academic-documents-and-language-scores',
    slug: 'prepare-academic-documents-and-language-scores',
    language: 'en',
    datePublished: '2026-11-22',
    dateModified: '2026-11-22',
    heading: 'Preparing transcripts, GPA scales and language certificates for bachelor’s applications',
    intro: 'Organise your secondary school transcripts, original grading scale, official translations and IELTS or TOPIK validity dates early so deadlines do not catch you off guard.',
    sections: [
      {
        heading: 'Keep your original GPA scale clearly documented',
        paragraphs: ['Universities evaluate applicants on their original national grading system or request certified evaluations rather than informal estimates. Keep official transcripts showing both grades and grading scales ready.'],
        links: [usaSource, irelandSource],
      },
      {
        heading: 'Plan language testing and official portals ahead of deadlines',
        paragraphs: ['Check certificate validity windows, score-sending timelines and whether your destination uses a centralised portal such as Campus France, Studyinfo.fi or UCAS.'],
        links: [franceSource, austriaSource],
      },
    ],
  },
  {
    state: 'published',
    translationKey: 'prepare-academic-documents-and-language-scores',
    slug: 'podgotovka-dokumentov-gpa-i-yazykovyh-sertifikatov',
    language: 'ru',
    datePublished: '2026-11-22',
    dateModified: '2026-11-22',
    heading: 'Подготовка аттестата, GPA и языковых сертификатов для поступления на бакалавриат',
    intro: 'Заранее подготовьте выписку оценок в оригинальной шкале, переводы документов и действительный сертификат IELTS или TOPIK, чтобы вовремя уложиться в приёмные окна.',
    sections: [
      {
        heading: 'Сохраняйте оригинальную шкалу оценок',
        paragraphs: ['Приёмные комиссии оценивают аттестат в исходной национальной системе или запрашивают официальную нострификацию. Не опирайтесь на примерные пересчёты без подтверждения со стороны вуза.'],
        links: [usaSource, irelandSource],
      },
      {
        heading: 'Учитывайте сроки национальных порталов и языковых тестов',
        paragraphs: ['Проверяйте срок действия сертификата на момент зачисления и порядок подачи через национальные системы вроде Campus France, Studyinfo.fi или UCAS.'],
        links: [franceSource, austriaSource],
      },
    ],
  },
  {
    state: 'published',
    translationKey: 'prepare-academic-documents-and-language-scores',
    slug: 'attestat-gpa-va-til-sertifikatlarini-tayyorlash',
    language: 'uz',
    datePublished: '2026-11-22',
    dateModified: '2026-11-22',
    heading: 'Bakalavriatga hujjat topshirishda attestat, GPA va til sertifikatlarini tayyorlash',
    intro: 'Qabul muddatlariga ulgurish uchun maktab baholari ko‘chirmasi, asl baholash shkalasi, rasmiy tarjimalar hamda IELTS yoki TOPIK sertifikatlaringizni oldindan tayyorlab qo‘ying.',
    sections: [
      {
        heading: 'Asl baholash shkalasini saqlab qo‘ying',
        paragraphs: ['Universitetlar abituriyentlarni milliy baholash tizimi asosida yoki rasmiy tasdiqlangan baholash hujjati orqali ko‘rib chiqadi. Universitet tasdiqlamagan taxminiy GPA konvertatsiyasiga tayanmang.'],
        links: [usaSource, irelandSource],
      },
      {
        heading: 'Til imtihonlari va markazlashgan portallarni oldindan rejalashtiring',
        paragraphs: ['Til sertifikatining amal qilish muddati va Campus France, Studyinfo.fi yoki UCAS kabi milliy portallar orqali ariza topshirish tartibini rasmiy manbalardan tekshiring.'],
        links: [franceSource, austriaSource],
      },
    ],
  },
  {
    state: 'published',
    slug: 'ielts-for-study-abroad',
    language: 'en',
    datePublished: '2026-11-22',
    dateModified: '2026-11-22',
    heading: 'What IELTS Score Do I Need to Study Abroad?',
    intro: 'Find out how to check which IELTS test and score your course accepts, and when to send your result.',
    sections: [
      {
        heading: 'Start with the course page',
        paragraphs: ['Open the university page for your course and start date. Check if the course accepts IELTS and which type of test to take. Look for two numbers: the overall score and the lowest score allowed in each part of the test.'],
        links: [
          { label: 'IELTS Academic test', href: 'https://ielts.org/take-a-test/test-types/ielts-academic-test', detail: 'Checked 22 November 2026' },
          { label: 'How universities set IELTS scores', href: 'https://ielts.org/organisations/academic-institutions', detail: 'Checked 22 November 2026' },
        ],
      },
      {
        heading: 'Make a score and date checklist',
        paragraphs: ['Copy this list into a note for each course. If anything is unclear, ask the university before you book a test. Leave enough time to get your result and send it.'],
        items: ['Course name and start date', 'IELTS test type and format accepted by the university', 'Overall score and the score you need in Listening, Reading, Writing and Speaking', 'Last day to send your score'],
      },
      {
        heading: 'Work through one example',
        paragraphs: ['Imagine a course asks for 6.5 overall and 6.0 in each part. If you score 6.5 overall and 5.5 in Writing, you still need a higher Writing score. Check both numbers on the official course page.'],
      },
    ],
  },
  {
    state: 'published',
    slug: 'study-abroad-costs',
    language: 'en',
    datePublished: '2026-11-22',
    dateModified: '2026-11-22',
    heading: 'How Much Does It Cost to Study Abroad?',
    intro: 'Work out your first-year budget. Add the cost of classes, rent, food and travel, then compare two courses.',
    sections: [
      {
        heading: 'Collect costs for one full year',
        paragraphs: ['Start with tuition, the amount you pay for classes. Look up the price for international students on the university website. Then find the cost of living in that city. Write down the currency and check whether each price is for one month, one term or one year.'],
        links: [
          { label: 'EducationUSA guide to university costs in the U.S.', href: 'https://www.educationusa.state.gov/your-5-steps-us-study/finance-your-studies/undergraduate', detail: 'Checked 22 November 2026' },
          { label: 'Cost of living at Trinity College Dublin', href: 'https://www.tcd.ie/study/international/welcome/cost-of-living/', detail: 'University budget example. Checked 22 November 2026' },
        ],
      },
      {
        heading: 'Add costs beyond tuition',
        paragraphs: ['Ask the university what its price includes. For rent, check whether water, power and internet cost extra. If you still need a price, mark it “to check.” If you have a confirmed scholarship, check how much it covers and when you will get it.'],
        items: ['Classes, university fees and books', 'Rent, food, local travel and insurance', 'One-time costs such as flights, visa fees and document translation'],
      },
      {
        heading: 'Compare two options fairly',
        paragraphs: ['Here is an example with sample prices. Course A costs €8,000 in university fees and €7,000 for living costs. That is €15,000 for the year. Course B costs €6,000 in fees and €10,000 for living costs. That is €16,000. Compare the total for the same time period and in the same currency.'],
      },
    ],
  },
  {
    state: 'published',
    slug: 'study-abroad-application-timeline',
    language: 'en',
    datePublished: '2026-11-22',
    dateModified: '2026-11-22',
    heading: 'When Should I Apply to Study Abroad?',
    intro: 'Use your course deadline to decide when to start looking, book a test and ask for school documents.',
    sections: [
      {
        heading: 'Start from the course deadline',
        paragraphs: ['Find the course page for the year you want to start. Write down the last day to apply. If you need a scholarship or a test, check those dates too. For U.S. study, EducationUSA suggests starting your research 12 to 18 months before classes begin. Use your own university’s dates to make your plan.'],
        links: [
          { label: 'EducationUSA guide to researching U.S. universities', href: 'https://www.educationusa.state.gov/your-5-steps-us-study/research-your-options', detail: 'Checked 22 November 2026' },
        ],
      },
      {
        heading: 'Work backwards in small steps',
        paragraphs: ['Start with the tasks that take time. Give your school time to send your grades and leave time for the university to answer your questions. Keep a separate plan for each course.'],
        items: ['Compare courses and check the dates on each university website', 'Book any required test early enough for the result to arrive', 'Ask for school records, letters or translations if the course needs them', 'Send your application and check that the university got it', 'Add any later dates for funding, a visa or housing'],
      },
      {
        heading: 'Put the dates on your calendar',
        paragraphs: ['Imagine your application is due on 15 January. If your school needs two weeks to send your grades, ask before the end of December and leave extra days for holidays. Save a reminder to check that your grades arrived before you send your application. Use this same approach for tests and letters.'],
      },
    ],
  },
];

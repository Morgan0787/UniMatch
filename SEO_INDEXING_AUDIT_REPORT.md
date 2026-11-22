# Итоговый технический SEO-аудит, отчёт об исправлениях UI/дизайна и верификации данных `https://getunimatch.app` (UniMatch)

**Роль:** Senior Technical SEO Specialist  
**Объект:** Продакшн `https://getunimatch.app` · База данных Supabase (104 опубликованные записи) · Репозиторий `UniMatch`  
**Инструментарий:** SEOmator CLI `v8.0.1`, Chromium + `axe-core 4.14.1` (Playwright, `1920×1080`, `1440×900`, `1280×900`, `768×1024`, `390×844`, `320×568`), `curl.exe` HTTP/TLS-диагностика, `scripts/check-seo.mjs`, `tsc`, `eslint`, локальные проверки каталога и мэтчинга  
**Дата аудита и исправлений:** 21–22 ноября 2026 г.

---

## 1. Исполнительное резюме (до и после правок)

### Что было подтверждено на живом продакшене (до правок)
1. **`https://www.getunimatch.app` не проходил TLS-проверку**: сертификат на Edge был выписан только на apex `getunimatch.app`, из-за чего `https://www.` падал с ошибкой несовпадения имени сертификата, а `http://www.` вёл туда же.
2. **Все 111 URL из live `sitemap.xml` возвращали HTTP `200`, но имели структурные и контентные дефекты**:
   - На всех **99 профилях** вузов (`scripts/seo-pages.mjs`) публиковалась ссылка `<a href="/University?id=<uuid>">`, дублирующая встроенный интерактивный блок `<details>` на самом каноническом профиле и ведущая на `noindex`-маршрут.
   - Интерактивный блок `<details>Show details</details>` в `src/App.jsx` ошибочно выводился даже на страницах без привязанного вуза (например, `/countries/poland`).
   - Профили не проецировали уже имеющиеся подтверждённые/опубликованные факты стоимости, дедлайнов, требований и обзора вуза, оставляя карточки однотипными (~75 слов).
   - В публичном HTML отображались внутренние пометки модераторов (`Accepted field source:`, `Accepted bachelor field source:`, `Manager-accepted ...`), технические пути (`!W_HU_MENU` на UCD, короткие числовые хвосты вроде `78`/`1`) и склеенные строки (`September2027`, `minimum6.0`, `;2027/28`).
   - Из **104** опубликованных записей в Supabase в статику попадали лишь **99**: **3 польских вуза** отсекались `adaptPublicCatalog` как `invalid_programme` / `invalid_historical_value`, а **2 бельгийских** (Гент и Антверпен) отсекались в `scripts/seo-catalog.mjs` из-за `web.archive.org` в `safeHttpsUrl`.
   - На `/`: `Lines` в `src/components/landing/ui.jsx` и заголовок в `src/components/home/UniMatchHero.jsx` склеивали текст в `textContent` (`"Find your universityabroad."`), что подтверждалось предупреждением SEOmator `js-h1-modified`.
   - `vercel.json` не задавал долгосрочный `Cache-Control` для `/assets/*` (ассеты отдавались с `max-age=0, must-revalidate`) и не содержал `308`-редиректов для `/en`, `/search`, `/ru`, `/ru/search`, `/uz`, `/uz/search`, `/admissions-survey`, `/admissionssurvey`.
3. **Разногласия UI/дизайна и доступность (WCAG)**:
   - Публичные SEO-страницы (`DiscoveryContent` в `src/lib/discoveryContent.js`), `Profile`, `Recommendations`, `EssayChecker`, `ComparisonModal` и `src/styles/release-pages.css` содержали устаревшие Cool Slate / `indigo` / `sky` / `teal` стили или глухую заливку `#f8f6f0`, перекрывавшую фон Warm Pearl Glass (`#f0eae7` + `.ambient-light-field`).
   - В `axe-core` фиксировались ошибки контрастности на лендинге (`a11y-axe-other`: 9 элементов в базовом замере) и нарушение WCAG 2.5.3 (`label-content-name-mismatch`) у переключателя языка в шапке (`LanguageSwitcher.jsx`), а гостевое/отключённое состояние `/EssayChecker` не содержало тега `<h1>`.
4. **Честное уточнение границ базового отчёта (v1)**:
   - В первой редакции отчёта переоценивался эффект на «95% потерянного спроса» и «половину краулингового бюджета» без логов Googlebot/GSC: фактически `99 из 2 063` — это доля опубликованных курируемых профилей каталога, а фактическое число проиндексированных Google страниц требует проверки в отчёте Google Search Console (доступов к GSC у агента нет).

---

## 2. Сводка верификации: ДО vs ПОСЛЕ (по измеренным данным)

| Проверка / Метрика | До правок (prod `2026-11-21`) | После правок (local preview `dist/`, `2026-11-22`) | Статус |
| :--- | :--- | :--- | :--- |
| **`sitemap.xml` (живой каталог Supabase)** | `111` URL (`99` профилей) | **`141` URL** (`104` профиля + `13` стран + `6` `/study/*` + `9` EN/RU/UZ гайдов + `4` индекса + `5` роутов) | Улучшено |
| **Выход `PUBLIC_CATALOG_LIMIT = 200`** | Риск падения при 201 записи сохранён | Документировано; сейчас проецируются `104` из `104` (до `200` запас есть) | Контролируется |
| **Дублирующие ссылки `/University?id=` на профилях** | `99/99` профилей | **`0/104` профилей** (`uuidLinks=0` в DOM и `check:seo`) | Исправлено |
| **Pre-JS заглушка `#public-entry` (FOUC)** | Белая карточка с буллитами (`Explore your options`), CLS `0.0726` на `/AdmissionsSurvey` | Заменена на **Warm Pearl Glass / Hero оболочки (`PublicEntryContent`)** + 6 превью-карточек на `/Search`, `preconnect`, `useLayoutEffect`; CLS `/AdmissionsSurvey` `0.0726 -> 0.0147` (`~80%` ниже), slow 3G CLS `0..0.0492` | Исправлено |
| **Внутренние метки / склеенные даты в HTML** | Утечки на десятках профилей (`Accepted...`, `September2027`) | **`0` утечек** (`leaked=false` в `30/30` прогонах и в `check:seo`) | Исправлено |
| **`Lines` / H1 склейка на `/`** | `js-h1-modified: WARN` (`"Find your universityabroad."`) | **`js-h1-modified: PASS`** (`"Find your university abroad."`) | Исправлено |
| **H1 на `/EssayChecker` (без авторизации / без AI)** | Отсутствовал (`null`) | **`h1="Essay feedback is unavailable"`** | Исправлено |
| **JSON-LD и перелинковка (хабы и гайды)** | Без `SearchAction`/`Course`/`FAQPage`; 2 страны, 1 EN гайд, баг `countrySlug` с пробелом | `WebSite` **`SearchAction`**, `CollegeOrUniversity` (`sameAs`) + **`Course`** + **`FAQPage`**, `Article` (`datePublished`/`dateModified`), **13 стран**, **6 `/study/*`**, **9 EN/RU/UZ гайдов** с `hreflang`, `<meta description>` `<= 158` симв. | Улучшено |
| **SEOmator категории (обход `141` стр. на `127.0.0.1`)** | `core=92`, `technical=99`, `schema=85`, `a11y=95`, `js=80` | **`core=94`, `technical=100`, `perf=93`, `schema=91 (0 fails)`, `a11y=97 (0 fails)`, `mobile=100`, `i18n=99`, `js=100`, `geo=79 (0 fails)`** | Улучшено |
| **`axe-core` на 15 роутах × 2 viewport (`1280×900`, `390×844`)** | 9 AAA-нарушений контрастности на `/`, `label-content-name-mismatch` | **30/30 `axe=PASS` (0 WCAG 2.0/2.1 AA ошибок)**, `0` JS-ошибок, `0` горизонтального скролла | Исправлено |
| **SEOmator CWV + AXE (`--cwv --mobile`) на `/`** | `a11y-axe-other`: 9 элементов | `a11y-color-contrast: PASS`; AAA-предупреждение снизилось **с 9 до 2 элементов** (`nav > .eyebrow`, `.footer-summary > .eyebrow` на полупрозрачном фоне) | Улучшено |
| **`Cache-Control` в `vercel.json`** | Не задан (`max-age=0`) | `/assets/*`, `/reference/*`: `max-age=31536000, immutable`; `catalog-preview.json`: `max-age=300`; `/images/*`, `/media/*`: `max-age=604800` | Готово (применится при деплое Vercel) |
| **`https://www.getunimatch.app` TLS** | Ошибка имени сертификата | Редирект в `vercel.json` настроен; домен требует проверки в Vercel Dashboard | **Внешнее действие владельца** |
| **SQL-патч источников в Supabase** | 4 двойных `https://`, 6 сломанных apex-доменов, 14 битых/устаревших source URL, 3 в карантине | **`scripts/supabase-seo-sources-patch.sql`** (`98` строк, `104/104` без ошибок; применить через `apply_supabase_patch.mjs`, если ещё остались неприменённые строки) | **Проверка/применение владельцем** |

---

## 3. Детали внесённых исправлений в коде (репозиторий)

### A. Техническое SEO, рендеринг, маршрутизация и кеширование
- **`vercel.json`**:
  - Добавлены постоянные `308`-редиректы для `/en` -> `/`, `/search` -> `/Search`, `/ru` -> `/ru/Search`, `/ru/search` -> `/ru/Search`, `/uz` -> `/uz/Search`, `/uz/search` -> `/uz/Search`, `/admissions-survey` -> `/AdmissionsSurvey`, `/admissionssurvey` -> `/AdmissionsSurvey`.
  - Добавлены правила `Cache-Control`: `public, max-age=31536000, immutable` для `/assets/(.*)` и `/reference/(.*)`, `public, max-age=300, must-revalidate` для `/assets/catalog-preview.json`, и `public, max-age=604800, stale-while-revalidate=86400` для `/images/(.*)` и `/media/(.*)`.
- **`scripts/seo-plugin.mjs`**: синхронизирована таблица локализованных/строчных `308`-редиректов в preview-middleware без циклов на регистре `/Search` -> `/Search`.
- **`scripts/seo-catalog.mjs`**:
  - Разрешены валидные снимки `https://web.archive.org/web/<timestamp>/https://...` в `safeHttpsUrl` (вернуло Гент и Антверпен в статику -> с `99` до `101` профиля) при сохранении защиты от двойных схем `https://https://`.
  - Добавлены `normalizeWebsiteUrl` и канонизация стран через `canonicalCountry` (`UK` -> `United Kingdom`).
  - Расширена проекция каждого профиля: передаются `tuition` (сумма, статус, оговорки), `deadline`, `academicRequirement`, `languageRequirement`, `sources` и очищенные названия источников.
- **`scripts/seo-pages.mjs`, `scripts/seo-editorial.mjs`, `scripts/seo-plugin.mjs` и `src/lib/seo.js`**:
  - Удалена дублирующая ссылка `<a href="/University?id=...">` с профилей вузов (`/universities/<slug>`), а для заголовков/описаний профилей добавлена генерация с ключевыми словами и обрезкой `<meta name="description">` до `<= 158` символов (без усечения видимого текста и оговорок на самой странице).
  - Карточки профилей обогащены структурированным обзором вуза, перелинковкой со странами, предметными хабами (`/study/*`) и похожими вузами одной страны, схемами `CollegeOrUniversity` (`sameAs`), `Course` (до 3 программ) и строго фактическим `FAQPage` JSON-LD (без синтеза непубликуемых цифр), а в `WebSite` добавлен `SearchAction`.
  - Исправлен баг сопоставления слагов многословных стран (`countrySlug`: `United Kingdom` -> `united-kingdom`, `United States` -> `united-states`, `South Korea` -> `south-korea`), расширено покрытие с `2` до **`13` официальных страновых хабов** (`/countries/*`, `200 OK`-проверенные государственные порталы) и **`6` предметных хабов `/study/*`** + индекс `/study`.
  - В `seo-editorial.mjs` добавлены **`9` проверенных гайдов** (`3` темы × `3` языка EN/RU/UZ) со связанными `translationKey`, `hreflang`, `datePublished`, `dateModified` и `BreadcrumbList`.
  - В `scripts/seo-plugin.mjs` и `src/lib/discoveryContent.js` старая белая карточка `#public-entry` на `/`, `/Search`, `/ru/Search`, `/uz/Search` и `/AdmissionsSurvey` заменена на визуальные Warm Pearl Glass / Hero оболочки **`PublicEntryContent`** с 6 карточками превью на Search из `catalog-preview.json` (уникальные доступные подписи `.sr-only`), `<link rel="preconnect">` к Supabase и `modulepreload` чанков.
- **`src/Layout.jsx`**: установка `document.body.dataset.unimatchTheme = 'warm-glass'` перенесена в `useLayoutEffect` для устранения кадра перерисовки оболочки перед первым рендером React.
- **`src/App.jsx`**: интерактивный блок `<details>Show details...</details>` монтируется **только** при `Boolean(publicPage.universityId)` (исправляет лишний `<details>` на `/countries/poland` и прочих обзорных страницах); `DiscoveryContent` встроен в общий `<Layout currentPageName="Discovery">`.
- **`src/components/landing/ui.jsx` и `src/components/home/UniMatchHero.jsx`**: добавлен разделительный пробел между масками строк `Lines` и элементами заголовка `<h1>`, устранивший склейку `"Find your universityabroad."` без визуального сдвига вёрстки.
- **`src/lib/admissions/factPresentation.js` и `src/lib/admissions/sourcePresentation.js`**:
  - Расширен `normalizeIntakeText`: очищает склеенные месяцы/годы (`September2027`, `1September2027`), пробелы вокруг цифр в заметках (`IELTS6.0`, `minimum6.0`, `at60%`, `210ECTS`) и точку с запятой (`;2027/28`).
  - `isGenericSourceTitle` и `readableUrlSegment` отфильтровывают внутренние подписи модераторов (`Accepted [bachelor] field source:`, `Manager-accepted ...`), технические пути (`!W_HU_MENU`, `usis`), числовые хвосты (`78`, `1`) и 2-буквенные коды (`en`, `lidx`), подменяя их понятными подписями (`Fees · sisweb.ucd.ie`, `University page · hub.ucd.ie`, `Official source · ...`).
- **`src/lib/normalizeUniversity.js` и `src/lib/admissions/publicCatalog.js`**: канонизируются `UK` -> `United Kingdom` и двойные схемы `website` в рантайме SPA.
- **`scripts/check-seo.mjs` и `docs/seo.md`**: автотесты и документация обновлены под расширенную проекцию, отсутствие `/University?id=` на профилях, запрет внутренних меток/опечаток в видимом тексте, новые `308`-редиректы и обновлённые правила публикации.

### B. Унификация UI / дизайна (Liquid Warm Pearl Glass) и WCAG
- **`src/lib/discoveryContent.js` и `src/index.css`**: страницы `/universities/*`, `/countries/*`, `/study/*`, `/guides/*` переведены с нестилизуемых/чужеродных классов на единую систему Warm Pearl Glass (`.discovery-canvas`, `.discovery-card`, `.discovery-card-link`, `.discovery-link`, `.discovery-cta`, `.discovery-details`).
- **`src/styles/product-theme.css`, `release-pages.css`, `survey-glass.css`, `search-page.css`, `recommendations-glass.css`, `university-glass.css`, `glass-controls.css`, `internal-pages.css`, `discovery-polish.css`, `auth-experience.css`, `landing.css`, `src/components/admissions/admissions.css`**:
  - `release-pages.css` и внутренние стили переведены с Cool Slate (`#f4f6f8` / `#263f49` / `#5f8294`) на единую оболочку **Warm Pearl Glass** (`#292823`, `#faf7ef`, `#855a36`, `#252c2f`, `--product-shell-max: 1360px`, на `>=1600px` `1440px`), выровнены ширины `.product-nav`, футера и основных контейнеров по всем экранам от `320px` до `1920px`.
  - Удалены глухие инлайн-фоны `#f8f6f0` в `Profile.jsx`, `Recommendations.jsx`, `EssayChecker.jsx`, `Search.jsx`, чтобы на всех внутренних страницах отображался единый `.ambient-light-field`.
  - Устранены расхождения палитры (`slate-*`, `indigo`, `violet`, `sky`, `teal`, `#294750`) в компонентах (`ComparisonModal.jsx`, `FeedbackPanel.jsx`, `BrainstormPanel.jsx`, `FilterPanel.jsx`, `UniversityCard.jsx`, `UniversityDetailModal.jsx`, `HelpDialog.jsx`, `OfficialSources.jsx`, `PublishedProgrammeFacts.jsx`, `FeedbackButton.jsx`, `OnboardingTour.jsx`, `ChanceIndicator.jsx`, `UserNotRegisteredError.jsx`, `AdminDataQuality.jsx`, `AdminFeedback.jsx`, `PageNotFound.jsx`, `ParticleScene.jsx`, `AuthExperience.jsx`).
  - Исправлены адаптивные и композиционные дефекты: выровнены строки карточек и кнопок на `/Search`, `/Recommendations` и `/AdmissionsSurvey#results`; полностью переработана с нуля страница деталей вуза (`/University`, `University.jsx`, `UniversityDetailModal.jsx`, `PublishedProgrammeFacts.jsx`, `OfficialSources.jsx`, `university-glass.css`): компактная верхняя панель возврата, редакционный split-Hero в стиле Warm Pearl (название, монограмма, `Save`/`Visit Website`, фото кампуса справа с авто-скрытием при отсутствии фото), 2-колоночный десктопный макет (`>= 1024px`, `1.48fr / .92fr`) с `2x2` bento-сеткой ключевых параметров программы, pill-раскрытиями условий и источников, и боковой колонкой Campus Life (`CheckCircle2`/`Minus`), объединённой карточкой International Support & Contacts и визовой справкой с кликабельными внешними URL, при сохранении компактного встроенного режима `.university-detail-embedded` на `/universities/*`; унифицированы типографика и внутренняя расстановка карточек вузов (`UniversityCover`, `SearchProgrammePreview`, `TuitionValue`, `UniversityCard`, `search-page.css`, `recommendations-glass.css`): убран контрастный жирный акцент на `Main university` и обрезка стран многоточием, узкая 2-колоночная сетка внутри карточек заменена на просторные полноширинные строки фактов в блоке Warm Pearl (убран висячий перенос `IELTS minimum / 6`), оформлены компактный бейдж года и 40px pill-кнопка `Conditions` без сырого подчёркивания, убраны случайные пустоты над `What to check`; восстановлены концентрические внутренние отступы стеклянной панели поиска (`16px 20px` десктоп / `14px 16px` мобильные), единая высота `48px` поля поиска и кнопки `Filters`, круглый бейдж счётчика фильтров, точное выравнивание ширины тулбара на мобильных по краям карточек и фикс подсчёта `scholarshipsOnly: false` в `FilterPanel.jsx`; фильтр на `/Search` переведён из модального окна с размытием (`Sheet`/`Drawer`) в **неблокирующую боковую липкую панель слева** (`>= 1024px`, открыта по умолчанию рядом с карточками) и **встроенную раскрывающуюся панель** без размытия (`< 1024px`); на `/Login` убрана пустая область внизу карточки (панели с плавной высотой через `ResizeObserver`), зафиксированы верхняя позиция карточки, высота `h1` и положение вкладок при переключении `Password`/`Magic Link`/`Sign Up`, смягчён морфинг и наведение `ParticleScene.jsx`, а `.unimatch-app` переведён на flex-оболочку `100dvh`, где `.product-footer` (`Layout.jsx`, `product-theme.css`) полностью переработан в единую округлую карточку **Warm Pearl Glass** по ширине `--product-shell-max` (логотип-эмблема `UNIMATCH` + описание, блок быстрых ссылок с иконками `Compass`/`Sparkles`/`LifeBuoy` и прямодоступные пилл-кнопки Telegram/Instagram с иконками `Send`/`Instagram`/`ArrowUpRight` без ломающего вёрстку раскрывающегося списка и разрозненных фонов по страницам, с резервом отступа под кнопку обратной связи); восстановлена компактная 3-колоночная сводка анкеты на планшетах (`641px–900px`); скрыты закрытые `<details>` контактов в футере (сняты скрытые ссылки за правым краем на `768px`/`1440px`); исправлена прокрутка результатов `/AdmissionsSurvey` (верхняя панель не прячется под фиксированным navbar); выровнено мобильное меню, таблет/tiny (`320px`) табы и касания `>=44px`; удалены нативные маркеры `<details>` (`▶`, `+`/`−`, подчёркивания) и символьные иконки (`✓`, `↗`, `→`, `•`, emoji) — везде подключены векторные иконки `lucide-react` и компактные pill-кнопки (`Photo credit`, `About these matches`); очищен избыточный копирайтинг (`copy.js`, `polishCopy.js`, `resultPresentation.js`, `ComparisonModal.jsx`, `PublishedProgrammeFacts.jsx`), нормализованы аббревиатуры (`EER`, `DACS`), дубль стран и `"Amount unconfirmed (USD)"`.
  - Затемнены вторичные/футерные оттенки и статусы (`.tuition-status` `#854905`, приглушённый текст `#47443f` / `#3b4144` / `#c2cbcf`), сокращены избыточные вертикальные пустоты (`160svh`/`100svh`), убраны горизонтальные швы фонового свечения между секциями `#intro`, `.experience-heading`, `.experience-media` и `#approach` с калибровкой триггеров GSAP, а блоки `.experience-details` и `.values-grid` полностью переработаны (`Landing.jsx`, `story.css`, `usePageMotion.js`) в единую 2+3 Warm Pearl Glass Bento-сетку с выровненными кнопками, контрастными пилл-бейджами и компактным планшетным/мобильным стеком, переделана панель фильтра направлений `#discover` (`.collection-controls` в стиле Warm Pearl Glass с иконкой и заголовком фильтра, читаемыми `44px` пиллами без мелкого капса, контрастным выделением активного фильтра и избранного, затемнённо-матовыми бейджами номеров и закладок на карточках, удалением дублирующей стрелки `.card-discover` с заменой на единую `44×44` кнопку `.university-arrow` в стиле Warm Pearl Glass, тёплым фоном загрузки карточек и `ParticleLoader` пиллом загрузки), а все полноэкранные и внутристраничные спиннеры загрузки заменены на единый микро-частичный лоадер `ParticleLoader` (`full` / `card` / `pill` / `orbit` на базе 2D Canvas 3D-сферы тёплых жемчужных частиц с поддержкой `prefers-reduced-motion` и нулевым влиянием на SEO `#public-entry`: `App.jsx`, `RequireAuth.jsx`, `HeroSceneFallback.jsx`, `University.jsx`, `EssayChecker.jsx`, `Search.jsx`, `Recommendations.jsx`, `Profile.jsx`, `AdminFeedback.jsx`).
- **`src/components/i18n/LanguageSwitcher.jsx`**: кнопка выбора языка переведена с переопределяющего `aria-label="Interface language: English"` на `<span>{language.toUpperCase()}</span><span className="sr-only"> — ...</span>` — это полностью сняло ошибку WCAG 2.5.3 `label-content-name-mismatch` во всех десктопных проверках `axe-core`.
- **`src/pages/EssayChecker.jsx`**: добавлен семантический `<h1>` для состояний отсутствия авторизации и отключённой функции проверки эссе.

---

## 4. Аудит базы данных Supabase, живая проверка 565 URL и верификация цен

Поскольку в рабочем каталоге отсутствует `SUPABASE_SERVICE_ROLE_KEY`, выполнен полный read-only аудит всех **104** опубликованных строк Supabase и **565 уникальных URL** (сайты вузов + ссылки на источники программ). По итогам прямой проверки официальных страниц сформирован идемпотентный SQL-патч **`scripts/supabase-seo-sources-patch.sql`** (обновляет **98** строк в транзакции `BEGIN; ... COMMIT;`), проверенный офлайн через `adaptPublicCatalog` и `projectSeoInstitutions` (**104/104 вузов без единой ошибки валидации**).

### Что исправляет `scripts/supabase-seo-sources-patch.sql`
1. **Снятие с карантина 3 польских вузов (`101` -> `104` в Sitemap)**:
   - `oc90-038` (Лодьзкий технический университет), `oc90-044` (Краковский экономический университет), `oc90-045` (Вроцлавский экономический университет): обнулён `tuition.value = null` при сохранении `tuition.historical`; на `oc90-044` дополнительно добавлено отсутствующее поле `"monthDay": null` в записях `deadline.historical.value.entries` (исправляет `invalid_historical_value`).
2. **Очистка 4 двойных схем и битых apex-доменов (`website`)**:
   - `https://https://www.msstate.edu/`, `iastate.edu/`, `sdstate.edu/`, `stonybrook.edu/` -> корректный `https://www....`.
   - Apex `uv.es/`, `univ-grenoble-alpes.fr/`, `unimore.it/`, `polito.it/`, `sdu.dk/`, `birmingham.ac.uk/` -> канонические `https://www....` (все проверены с HTTP `200`).
3. **Замена 14 мёртвых/проблемных ссылок на официальные `200 OK`-источники**:
   - `oc90-071` (Grenoble `les-frais-d-inscription/` `404`) -> официальная таблица тарифов UGA (`2026-2027`).
   - `oc90-030` (Deggendorf `flyer-ain-b-en.pdf` `404`) -> живая страница программы `https://www.th-deg.de/ain-b-en`.
   - `oc90-066` (UCD Global Excellence PDF `2026 27` `404`) -> действующий PDF `2027 28`.
   - `oc90-068` (UL `english-language-requirements` `404`) -> новый официальный URL требований по английскому `ul.ie/study/undergraduate/international-students/english-language-requirements`.
   - `oc90-042` (Lazarski `472025` PDF `404` и `studyinpoland.pl` `404`) -> актуальные Rules PDF на `lazarski.pl` и официальная страница бакалавриата Economics.
   - `oc90-041` (SWPS), `oc90-044` (Krakow UE), `oc90-045` (Wroclaw UEB) — мёртвые ссылки `studyinpoland.pl` заменены на прямые страницы самих польских университетов (`english.swps.pl`, `irk.uek.krakow.pl` + `study.uek.krakow.pl`, `rekrutacja.uew.pl`).
   - `oc90-047` (Padua 2025 PDF `404`) -> официальный раздел конкурсных объявлений `unipd.it/en/notices-admission-calls-and-rankings-bachelors-degrees`.
   - `oc90-049` (PoliMi `laureaonline.polimi.it/come-iscriversi/` `404`) -> официальная страница программы и тарифов `polimi.it`.
   - `oc90-036` (Poznan PUT таймаут на `maxine.put.poznan.pl`) -> рабочий официальный портал `put.poznan.pl/en/admission-for-international/first-cycle/fees`.
   - `oc90-052` (Pavia таймаут `bai.unipv.it`) -> действующий PDF приёма AI `2026-2027` на `en.unipv.it`.
   - `us-mississippi-state-university`: редиректный URL заменён на канонический `https://www.admissions.msstate.edu/tuition`.
   *(Примечание: оставшиеся **32** срабатывания `403`/таймаут из 565 URL в автоматическом прогоне `curl` принадлежат университетским WAF Cloudflare/Akamai/Incapsula вроде `ucas.com`, `swps.pl`, `rtu.lv`, `unito.it`, `herts.ac.uk`, `ntu.ac.uk` — не мёртвым `404`-страницам.)*
4. **Бельгийские и итальянские ссылки на `web.archive.org` + гигиена данных**:
   - На `oc90-084` (Ghent), `oc90-085` (Antwerp) и `oc90-051` (Turin) ссылки `name`/`degree` переведены с архивов `web.archive.org` на уже имеющиеся живые официальные источники в БД.
   - Унифицированы **4 записи `UK` -> `United Kingdom`**, очищены **210 внутренних заголовков источников** и **65 склеек в тексте** (`intake`, `tuition.label`, `publicNotes`).
5. **11 записей стоимости, подтверждённых напрямую на официальных страницах университетов (`200 OK`, без выдуманных цен)**:
   - **Maastricht University** (`oc90-065`): **€18,700 EUR / year** (`2027/28`, `current_verified` — не-ЕС институциональный тариф CS; ЕС €2,771).
   - **University College Dublin** (`oc90-066`): **€30,095 EUR / year** (`2027/28`, `current_verified` — официальная таблица SISWeb `DN201 - CSSA`).
   - **University of Limerick** (`oc90-068`): **€22,700 EUR / year** (`2026/27`, `historical_reference` — €22,596 обучение + €104 сбор; ЕС €7,366).
   - **RWTH Aachen** (`oc90-017`): **€0 EUR / semester** (`published_unconfirmed` — обучение бесплатно; в `excludedFees` указан обязательный семестровый взнос ~€300).
   - **Deggendorf Institute of Technology** (`oc90-030`): **€0 EUR / semester** (`published_unconfirmed` — без баварской платы за обучение, но с обязательным сервисным сбором DIT **€500/семестр** для не-ЕС + €60 за подачу в `excludedFees`/описании).
   - **Université Grenoble Alpes** (`oc90-071`): **€2,902 EUR / year** (`2026/27`, `historical_reference` — дифференцированный не-ЕС тариф Licence; ЕС €178).
   - **University of Padua** (`oc90-047`): **€2,990 EUR / year** (`2026/27`, `historical_reference` — Group B не-ЕС за рубежом; льготная ставка €996.66 для ряда стран).
   - **Ca' Foscari University of Venice** (`oc90-060`): **€1,300 EUR / year** (`2026/27`, `historical_reference` — стандартный не-ЕС тариф бакалавриата с явной пометкой диапазона €700–€2,100 по гражданству, включая €192+€16 сборов).
   - **Arizona State University** (`us-arizona-state-university`): **$39,062 USD / year** (`2026/27`, `historical_reference` — базовая ставка международного бакалавриата вместо устаревшей `$33,139`).
   - **Mississippi State University** (`us-mississippi-state-university`): **$30,086 USD / year** (`2026/27`, `historical_reference` — out-of-state обучение и сборы вместо `$27,637`).
   - **Murray State University** (`us-murray-state-university`): **$15,990 USD / year** (`2026/27`, `historical_reference` — актуальная международная страница `Costs.aspx` вместо `$19,836`).
   - *Честное ограничение по `DECISIONS.md`*: вузы со сложной ISEE-шкалой (Больнья, Турин, Политехи и др.), динамическим расчётом на JS/калькуляторах или привязанным к гражданству/кампусу тарифом (Birmingham, Sheffield, TUM Heilbronn, Wichita/TUHH за WAF/динамикой) **намеренно оставлены без синтезированной цены** (`unknown` или `published_unconfirmed`) до ручной проверки конкретной таблицы приёма.

---

## 5. Результаты финальных проверок после всех правок

1. **`npm run typecheck`** (`tsc -p ./jsconfig.json`) — **PASS (0 ошибок)**.
2. **`npm run lint`** (`eslint . --quiet`) — **PASS (0 ошибок)**. *(Согласно `docs/agents/context/DECISIONS.md`, ESLint игнорирует `src/lib/**`; эти файлы покрыты `typecheck` и runtime-чеками.)*
3. **`npm run check:matching`** — **PASS (`All 36 assertion groups passed.`)**.
4. **`npm run check:admissions`** — **PASS (все 11 скриптов каталога, презентации фактов и движка)**.
5. **`node scripts/check-catalog.mjs` и `node scripts/check-hero-scene.mjs`** — **PASS**.
6. **`SEO_FETCH_PUBLIC_CATALOG=1 npm run build` + `SEO_CHECK_ORIGIN=http://127.0.0.1:4173 npm run check:seo`** — **PASS**: `141 indexable pages` (`104` профиля, `13` стран, `6` `/study/*`, `9` EN/RU/UZ гайдов, `4` индекса, `5` роутов приложения), `sitemap.xml`, метаданные, JSON-LD (`SearchAction`, `Course`, `FAQPage`, `Article`, `BreadcrumbList`), `hreflang`, `noindex, follow`, 404 и 308-редиректы, визуальный `#public-entry` (`entry-shell`).
7. **Multi-viewport UI/Responsive, Pre-JS & `axe-core` аудит (Playwright, `1920×1080`, `1440×900`, `768×1024`, `390×844`, `320×568`)** — **PASS**: `43/43` проверок публичных и авторизованных маршрутов (`overflowX=0`, `offscreenCount=0`, `0` консольных/JS-ошибок), pre-JS скриншоты `#public-entry` (`oldBox=false`, `overflow=0px`), замер CLS при гидратации (`0` на `/`, `0.0147` desktop / `0.0364` slow 3G на `/AdmissionsSurvey`, `0.0537` desktop / `0.0492` slow 3G на `/Search`), и **30/30 `axe=PASS`** (`WCAG 2.0/2.1 AA` на `15` роутах × `1280×900` и `390×844`), `uuidLinks=0` на профилях/хабах, `leaked=false`.
8. **SEOmator `--crawl -m 160` по финальной сборке `http://127.0.0.1:4173` (`141` стр.)**: `core=94`, `technical=100`, `perf=93 (0 fails)`, `images=100`, `schema=91 (0 fails)`, `a11y=97 (0 fails)`, `mobile=100`, `i18n=99 (0 fails)`, `legal=100`, `js=100`, `redirect=100`, `htmlval=100`, `geo=79 (0 fails)` (оставшиеся системные предупреждения относятся к локальному `http://127.0.0.1` без HTTPS/HSTS/CDN и отсутствующим статическим страницам E-E-A-T `/about`, `/privacy`).
9. **Независимая существующая ошибка (не связана с правками)**: `node scripts/check-comparison.mjs` падает с кодом `1` на строке `9` (ожидает неформатированное `/17970 GBP/` вместо фактически возвращаемого `'17,970 GBP / year (2027/28)'`).

---

## 6. Что нужно сделать вручную после этого пуша (внешние панели)

1. **Настроить `www.getunimatch.app` в Vercel Dashboard**:
   - Открыть проект -> **Settings -> Domains** -> убедиться, что `www.getunimatch.app` добавлен как валидный домен (редирект на `getunimatch.app` с выпущенным TLS-сертификатом Let's Encrypt) или удалить A/CNAME DNS-запись `www`, если `www` не планируется поддерживать. После выпуска сертификата проверить `curl.exe -sI https://www.getunimatch.app/` -> должен отдавать `308` на `https://getunimatch.app/`.
2. **Применить SQL-патч в Supabase Dashboard**:
   - Открыть **SQL Editor** в проекте Supabase -> выполнить содержимое [`scripts/supabase-seo-sources-patch.sql`](scripts/supabase-seo-sources-patch.sql).
   - Запустить пересборку/деплой в Vercel, чтобы в продакшн `sitemap.xml` вышли все **116 URL** (**104 профиля** + 12 разделов/гайдов) с очищенными источниками и обновлёнными ценами.
3. **Проверить индексацию в Google Search Console**:
   - После деплоя проверить отчёт «Страницы» и `URL Inspection` для `/` и `/universities/*`, чтобы получить реальные данные о включении страниц в индекс и исключениях Google (Crawled – currently not indexed и др.).

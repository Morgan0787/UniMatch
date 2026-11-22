import React, { useState, useEffect, useMemo, useCallback, useDeferredValue } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { isUniversityFavorite, studentProfileQueryOptions, writeConfirmedUniversityFavorite } from '@/lib/studentProfile';
import { admissionCopy } from '@/components/admissions/copy';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon, SlidersHorizontal, GraduationCap, X, GitCompare, ChevronLeft, ChevronRight } from 'lucide-react';
import FilterPanel from '@/components/search/FilterPanel';
import UniversityCard from '@/components/search/UniversityCard';
import ComparisonModal from '@/components/comparison/ComparisonModal';
import { useLanguage } from '@/lib/i18n';
import { catalogContent, DiscoverySections } from '@/lib/discoveryContent';
import discoveryLinks from 'virtual:seo-discovery-links';
import { selectCatalogSearchResults, getCatalogPage } from '@/lib/catalogResults';
import { getUniversityPhoto } from '@/lib/admissions/presentation';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { DEFAULT_FILTERS, normalizeFilters, readCatalogState, readStoredCatalogFilters, serializeCatalogFilters, writeCatalogState } from '@/lib/catalogState';
import '@/styles/search-page.css';

const loadSavedFilters = () => {
    if (typeof window === 'undefined') return DEFAULT_FILTERS;

    try {
        const saved = window.localStorage.getItem('uniAdmitFilters');
        const parsed = saved ? JSON.parse(saved) : {};

        return readStoredCatalogFilters(parsed);
    } catch {
        return DEFAULT_FILTERS;
    }
};

async function loadCatalogPreview({ signal }) {
    const response = await fetch('/assets/catalog-preview.json', { signal });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return [];
    const { rows, total } = await response.json();
    if (!Array.isArray(rows) || rows.length > 6 || !Number.isInteger(total) || total < rows.length) return [];
    return rows;
}

export default function Search() {
    const { t, language } = useLanguage();
    const { session } = useAuth();
    const queryClient = useQueryClient();
    const owner = session?.user;
    const profileQuery = useQuery(studentProfileQueryOptions(owner));
    const userProfile = profileQuery.data?.[0];
    const savedUniversities = userProfile?.saved_universities;
    const favoriteText = admissionCopy[language] || admissionCopy.en;
    const favoriteMutation = useMutation({
        /** @param {import('@/lib/studentProfile').UniversityFavoriteRequest} request */
        mutationFn: ({ owner, university, remove }) => writeConfirmedUniversityFavorite(queryClient, owner, university, remove),
    });
    const favoriteAction = favoriteMutation.variables?.owner.id === owner?.id
        && favoriteMutation.variables?.owner.email === owner?.email ? favoriteMutation.variables : null;
    const saving = Boolean(favoriteAction && favoriteMutation.isPending);
    const pendingLabel = saving ? favoriteText[favoriteAction.remove ? 'removing' : 'saving'] : undefined;
    const editorial = {
        en: { title: 'Find your university', intro: 'Compare tuition, entry requirements and location.', hint: 'Add your GPA and language scores in Filters to narrow your search.' },
        ru: { title: 'Найдите свой университет', intro: 'Сравните стоимость, требования и расположение.', hint: 'Укажите GPA и результаты языковых тестов в фильтрах, чтобы сузить поиск.' },
        uz: { title: 'Universitetingizni toping', intro: 'O‘qish haqi, qabul talablari va joylashuvni solishtiring.', hint: 'Qidiruvni aniqlashtirish uchun filtrlarda GPA va til natijalarini kiriting.' },
    }[language] || { title: 'Your world. Your possibilities.', intro: '', hint: 'Add your GPA and language scores to see a personal chance estimate.' };
    const [searchParams, setSearchParams] = useSearchParams();
    const [savedFilters] = useState(loadSavedFilters);
    const { query: searchQuery, filters, page: resultPage } = useMemo(() => readCatalogState(searchParams, savedFilters), [searchParams, savedFilters]);
    const setFilters = useCallback(update => setSearchParams(params => {
        const previous = readCatalogState(params, savedFilters);
        const next = normalizeFilters(typeof update === 'function' ? update(previous.filters) : update);
        return writeCatalogState(params, { filters: next, page: 1 }, savedFilters);
    }, { replace: true }), [setSearchParams, savedFilters]);
    const setSearchQuery = query => setSearchParams(params => writeCatalogState(params, { query, page: 1 }, savedFilters), { replace: true });
    const deferredQuery = useDeferredValue(searchQuery);
    const [showFirstVisitHint, setShowFirstVisitHint] = useState(() => {
        if (typeof window === 'undefined') return false;
        return !window.localStorage.getItem('uniMatchSeenSearchHint');
    });
    const dismissHint = () => {
        setShowFirstVisitHint(false);
        if (typeof window !== 'undefined') window.localStorage.setItem('uniMatchSeenSearchHint', '1');
    };
    const location = useLocation();
    const navigate = useNavigate();
    const [isDesktopViewport, setIsDesktopViewport] = useState(() => (typeof window === 'undefined' ? true : window.matchMedia('(min-width: 1024px)').matches));
    const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(true);
    const [compactFiltersOpen, setCompactFiltersOpen] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const mql = window.matchMedia('(min-width: 1024px)');
        const onChange = () => setIsDesktopViewport(mql.matches);
        mql.addEventListener('change', onChange);
        setIsDesktopViewport(mql.matches);
        return () => mql.removeEventListener('change', onChange);
    }, []);
    useEffect(() => {
        if (!compactFiltersOpen || isDesktopViewport) return undefined;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setCompactFiltersOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [compactFiltersOpen, isDesktopViewport]);
    const filtersExpanded = isDesktopViewport ? desktopFiltersOpen : compactFiltersOpen;
    const toggleFilters = () => (isDesktopViewport ? setDesktopFiltersOpen(open => !open) : setCompactFiltersOpen(open => !open));
    const [compareList, setCompareList] = useState(() => location.state?.catalogCompareList || []);
    const [showComparison, setShowComparison] = useState(false);

    useEffect(() => { localStorage.setItem('uniAdmitFilters', serializeCatalogFilters(filters)); }, [filters]);
    useEffect(() => {
        if (showFirstVisitHint && (filters.gpa != null || filters.ielts != null)) {
            dismissHint();
        }
    }, [filters.gpa, filters.ielts]);
    const { data: universities = [], isLoading, isError, isFetching, refetch } = useQuery({ queryKey: ['universityCatalog'], queryFn: () => apiClient.entities.University.listCatalog(), retry: 1 });
    const activeFilterCount = Object.entries(filters).filter(([key, value]) => Array.isArray(value) ? value.length > 0 : value !== DEFAULT_FILTERS[key]).length;
    const canShowPreview = isLoading && !owner?.id && !searchQuery && activeFilterCount === 0 && resultPage === 1 && !location.state?.catalogFocusId;
    const { data: previewRows = [] } = useQuery({
        queryKey: ['universityCatalogPreview'], queryFn: loadCatalogPreview, enabled: canShowPreview,
        retry: false, staleTime: Infinity,
    });
    useEffect(() => {
        if (!userProfile || searchParams.has('filters')) return;
        setFilters(filters => ({ ...filters,
            gpa: userProfile.gpa ?? filters.gpa,
            ielts: userProfile.english_proficiency ?? filters.ielts,
            topikLevel: userProfile.topikLevel ?? filters.topikLevel,
        }));
    }, [userProfile, searchParams, setFilters]);

    const shownResults = useMemo(() => selectCatalogSearchResults(universities, filters, deferredQuery), [universities, filters, deferredQuery]);
    const pageInfo = getCatalogPage(shownResults, resultPage);
    const showingPreview = canShowPreview && previewRows.length > 0;
    const pageRows = showingPreview ? previewRows.map(university => ({ university, programme: null, budget: null })) : pageInfo.rows;
    const priorityPhotoId = pageRows.find(({ university }) => getUniversityPhoto(university))?.university.id;
    const pagingLabels = { en: ['Previous', 'Next', 'University results pages'], ru: ['Назад', 'Далее', 'Страницы университетов'], uz: ['Oldingi', 'Keyingi', 'Universitetlar sahifalari'] }[language] || ['Previous', 'Next', 'University results pages'];
    const pageLabel = { en: 'Page', ru: 'Страница', uz: 'Sahifa' }[language] || 'Page';
    const pageWindowStart = Math.max(2, Math.min(pageInfo.page - 1, pageInfo.pages - 4));
    const pageWindowEnd = Math.min(pageInfo.pages - 1, Math.max(pageInfo.page + 1, 5));
    const pageNumbers = Array.from({ length: pageInfo.pages }, (_, index) => index + 1)
        .filter(page => page === 1 || page === pageInfo.pages || (page >= pageWindowStart && page <= pageWindowEnd));
    const changePage = (page) => {
        setSearchParams(params => writeCatalogState(params, { page }, savedFilters));
        const grid = document.getElementById('catalog-items');
        const navHeight = document.querySelector('.product-nav')?.getBoundingClientRect().height || 64;
        if (grid) window.scrollTo({ top: Math.max(0, grid.getBoundingClientRect().top + window.scrollY - navHeight - 16), behavior: 'auto' });
    };

    const handleSave = async universityId => {
        if (!owner?.id || !owner?.email) {
            await apiClient.auth.redirectToLogin(window.location.pathname + window.location.search + window.location.hash);
            return;
        }
        const university = universities.find(row => row.id === universityId);
        if (!university || saving || profileQuery.isLoading || profileQuery.isError) return;
        favoriteMutation.mutate({ owner, university, remove: isUniversityFavorite(savedUniversities, university) });
    };

    const rememberCatalogPosition = university => {
        navigate(location.pathname + location.search + location.hash, { replace: true, state: { ...location.state, catalogScrollY: window.scrollY, catalogCompareList: compareList, catalogFocusId: university.id } });
    };
    useEffect(() => {
        if (isLoading || !location.state?.catalogFocusId) return;
        const frame = requestAnimationFrame(() => {
            document.getElementById('university-link-' + location.state.catalogFocusId)?.focus({ preventScroll: true });
            window.scrollTo(0, location.state.catalogScrollY || 0);
        });
        return () => cancelAnimationFrame(frame);
    }, [isLoading]);

    const resetFilters = () => setSearchParams(params => writeCatalogState(params, { filters: DEFAULT_FILTERS, query: '', page: 1 }), { replace: true });
    const compareStatus = {en:'3 of 3 selected. Remove a university to add another.',ru:'Выбрано 3 из 3. Уберите один вуз, чтобы добавить другой.',uz:'3 tadan 3 tasi tanlandi. Boshqasini qo‘shish uchun bittasini olib tashlang.'}[language];
    const handleCompareToggle = useCallback((universityId) => {
        setCompareList(prev => prev.includes(universityId) ? prev.filter(id => id !== universityId) : prev.length < 3 ? [...prev, universityId] : prev);
    }, [compareList]);
    const handleRemoveFromCompare = (universityId) => setCompareList(prev => prev.filter(id => id !== universityId));
    const compareUniversities = useMemo(() => universities.filter(uni => compareList.includes(uni.id)), [universities, compareList]);
    const loadingLabel = { en: 'Loading all universities…', ru: 'Загружаем полный каталог…', uz: 'To‘liq katalog yuklanmoqda…' }[language];
    const filterDoneLabel = { en: 'Show results', ru: 'Показать результаты', uz: 'Natijalarni ko‘rsatish' }[language] || 'Show results';
    const unsetLabel = { en: 'Not set', ru: 'Не указано', uz: 'Kiritilmagan' }[language] || 'Not set';
    const desktopFilterFields = <FilterPanel filters={filters} setFilters={setFilters} onReset={resetFilters} universities={universities} />;
    const inlineFilterFields = <FilterPanel filters={filters} setFilters={setFilters} onReset={resetFilters} universities={universities} onClose={() => setCompactFiltersOpen(false)} />;
    const inlineFilterFooter = <div className="search-inline-filter-footer"><Button type="button" className="w-full min-h-11 rounded-full bg-[#252c2f] hover:bg-[#354044] text-white" onClick={() => setCompactFiltersOpen(false)}>{filterDoneLabel} ({shownResults.length})</Button></div>;

    return (
        <div className="catalog-page search-page min-h-screen">
            <header className="max-w-7xl mx-auto px-4 sm:px-6 catalog-heading">
                <h1>{editorial.title}</h1>
                <p>{editorial.intro}</p>
            </header>
            {showFirstVisitHint && (
                <div className="search-profile-hint max-w-7xl mx-auto px-4 sm:px-6 mb-3">
                    <div className="rounded-2xl border border-white/95 bg-[#fffaf2]/85 px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm">
                        <p className="text-sm font-medium text-[#3a342e]">{editorial.hint}</p>
                        <button aria-label={t('common.close')} onClick={dismissHint} className="min-h-10 min-w-10 rounded-full inline-flex items-center justify-center text-[#55504a] hover:text-[#292823] hover:bg-white/70 flex-shrink-0"><X className="w-4 h-4" /></button>
                    </div>
                </div>
            )}
            {favoriteAction && favoriteMutation.isError && <p role="alert" className="max-w-7xl mx-auto px-4 py-2 text-sm text-red-700">{favoriteText.saveError}</p>}
            {profileQuery.isError && <div className="max-w-7xl mx-auto px-4 py-2 text-sm"><p role="alert">{favoriteText[profileQuery.error?.message === 'Your profile could not be selected safely.' ? 'saveDuplicates' : 'saveError']}</p><Button variant="outline" onClick={() => void profileQuery.refetch()}>{favoriteText.saveRetry}</Button></div>}
            <p role="status" className="sr-only">{pendingLabel || (favoriteAction && favoriteMutation.isSuccess ? favoriteText[favoriteAction.remove ? 'removedFromAccount' : 'savedInAccount'] : '')}</p>
            <div className="catalog-toolbar">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                        <div className="relative flex-1 w-full">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#55504a]" />
                            <Input aria-label={t('search.placeholder')} placeholder={t('search.placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-12 pl-12 pr-10 py-0 text-base bg-[#fffdf8] border-[#ded5c6] rounded-full focus:bg-white" />
                            {searchQuery && <button aria-label={t('filters.reset')} onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 min-h-10 min-w-10 inline-flex items-center justify-center rounded-full text-[#55504a] hover:text-[#292823]"><X className="w-4 h-4" /></button>}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            aria-expanded={filtersExpanded}
                            aria-controls={isDesktopViewport ? 'catalog-filters-sidebar' : 'catalog-filters-inline'}
                            onClick={toggleFilters}
                            className={`search-filter-trigger gap-2 shrink-0 w-full md:w-auto h-12 min-h-12 px-5 rounded-full border-white/95 text-[#292823] shadow-sm ${filtersExpanded ? 'is-open bg-[#f6ead8] border-[#dfbe93]' : 'bg-[#fffdf8]/90 hover:bg-white'}`}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span>{t('search.filters')}</span>
                            {activeFilterCount > 0 && <Badge className="bg-[#252c2f] text-white ml-0.5 min-w-6 h-6 px-1.5 rounded-full justify-center font-semibold tabular-nums">{activeFilterCount}</Badge>}
                        </Button>
                    </div>
                    <div className="catalog-results flex flex-wrap items-center justify-between mt-4 gap-4">
                        <p className="text-[#55504a]" role="status">{isLoading ? loadingLabel : <><span className="font-semibold text-[#292823]">{shownResults.length}</span> {t('search.results')}</>}</p>
                        <div className="flex flex-wrap items-center gap-3">
                            {compareList.length > 0 && <Button disabled={isLoading} onClick={() => setShowComparison(true)} className="bg-[#252c2f] hover:bg-[#354044] text-white rounded-full gap-2 min-h-10" size="sm"><GitCompare className="w-4 h-4" />{t('search.compare')} ({compareList.length})</Button>}
                            <div className="flex gap-2 items-center text-sm text-[#47443f]"><span>{t('search.yourGpa')}:</span><Badge variant="secondary" className="bg-[#f4e4cc] text-[#5c3c1b] border border-[#e3caa6]">{filters.gpa == null ? unsetLabel : filters.gpa.toFixed(1)}</Badge></div>
                        </div>
                    </div>
                </div>
            </div>
            {compactFiltersOpen && (
                <section id="catalog-filters-inline" aria-label={t('search.filters')} className="lg:hidden search-inline-filters max-w-7xl mx-auto">
                    <div className="search-filter-surface search-glass-drawer">
                        {inlineFilterFields}
                        {inlineFilterFooter}
                    </div>
                </section>
            )}
            <p id="catalog-compare-status" role="status" aria-live="polite" className={`max-w-7xl mx-auto px-4 sm:px-6 text-sm text-[#55504a] ${compareList.length ? 'pt-4' : 'sr-only'}`}>{compareList.length === 3 ? compareStatus : compareList.length > 0 ? `${compareList.length} / 3` : ''}</p>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 catalog-workspace" data-filters-open={desktopFiltersOpen ? 'true' : 'false'}>
                {desktopFiltersOpen && (
                    <aside id="catalog-filters-sidebar" aria-label={t('search.filters')} className="hidden lg:block catalog-filter-sidebar search-filter-surface search-glass-drawer">
                        {desktopFilterFields}
                    </aside>
                )}
                <div className="catalog-results-column min-w-0">
                    <div id="catalog-items" aria-busy={searchQuery !== deferredQuery} className="min-w-0">
                        {isLoading && !showingPreview ? (
                            <div className="catalog-grid grid grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="bg-[#fffdf8]/85 rounded-[22px] overflow-hidden border border-white/95"><Skeleton className="h-44" /><div className="p-5 space-y-3"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-16" /><Skeleton className="h-8 w-24" /></div></div>)}</div>
                        ) : isError ? (
                            <div role="alert" className="catalog-load-error"><h2>{{en:'Unable to load universities',ru:'Не удалось загрузить университеты',uz:'Universitetlarni yuklab bo‘lmadi'}[language]}</h2><p>{{en:'Your search and filters are kept. Try loading the catalogue again.',ru:'Поиск и фильтры сохранены. Попробуйте загрузить каталог ещё раз.',uz:'Qidiruv va filtrlar saqlandi. Katalogni qayta yuklab ko‘ring.'}[language]}</p><Button disabled={isFetching} className="rounded-full bg-[#252c2f] hover:bg-[#354044] text-white" onClick={() => void refetch()}>{{en:'Try again',ru:'Попробовать снова',uz:'Qayta urinish'}[language]}</Button></div>
                        ) : pageRows.length ? (
                            <>
                                <h2 className="sr-only">{{en:'University results',ru:'Результаты поиска университетов',uz:'Universitet qidiruvi natijalari'}[language]}</h2>
                                <div className="catalog-grid grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {pageRows.map(({ university, programme, budget }) => (
                                        <UniversityCard key={university.id} university={university} programme={programme} budget={budget}
                                            userGpa={filters.gpa} userIelts={filters.ielts} userTopik={filters.topikLevel} isSaved={isUniversityFavorite(savedUniversities, university)}
                                            saveDisabled={saving || profileQuery.isLoading || profileQuery.isError} savePendingLabel={favoriteAction?.university.id === university.id ? pendingLabel : undefined}
                                            onSave={handleSave} onView={rememberCatalogPosition} isComparing={compareList.includes(university.id)}
                                            compareLimitReached={compareList.length >= 3} onCompareToggle={handleCompareToggle} previewOnly={showingPreview}
                                            prioritizePhotoLoading={university.id === priorityPhotoId} />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-20"><div className="w-16 h-16 bg-[#f4e4cc] rounded-full flex items-center justify-center mx-auto mb-4"><GraduationCap className="w-8 h-8 text-[#704a2d]" /></div><h3 className="text-lg font-semibold text-[#292823] mb-2">{t('search.noResults')}</h3><p className="text-[#55504a] mb-6">{t('search.tryAdjusting')}</p><Button variant="outline" className="rounded-full" onClick={resetFilters}>{t('search.resetFilters')}</Button></div>
                        )}
                    </div>
                    {!isLoading && shownResults.length > 0 && <nav aria-label={pagingLabels[2]} className="catalog-pagination pt-8 pb-2">
                        <div className="catalog-pagination-controls">
                            <Button variant="outline" className="catalog-page-previous" disabled={pageInfo.page === 1} onClick={() => changePage(pageInfo.page - 1)}><ChevronLeft aria-hidden="true" />{pagingLabels[0]}</Button>
                            <ul className="catalog-page-numbers">
                                {pageNumbers.map((page, index) => <React.Fragment key={page}>
                                    {index > 0 && page - pageNumbers[index - 1] > 1 && <li aria-hidden="true"><span className="catalog-page-ellipsis">…</span></li>}
                                    <li><Button variant="outline" className="catalog-page-number" aria-label={`${pageLabel} ${page}`} aria-current={page === pageInfo.page ? 'page' : undefined} onClick={() => changePage(page)}>{page}</Button></li>
                                </React.Fragment>)}
                            </ul>
                            <Button variant="outline" className="catalog-page-next" disabled={pageInfo.page === pageInfo.pages} onClick={() => changePage(pageInfo.page + 1)}>{pagingLabels[1]}<ChevronRight aria-hidden="true" /></Button>
                        </div>
                    </nav>}
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
                <DiscoverySections sections={catalogContent(language, discoveryLinks).sections} />
            </div>
            <ComparisonModal universities={compareUniversities} isOpen={showComparison} onClose={() => setShowComparison(false)} onRemove={handleRemoveFromCompare} userProfile={userProfile} />
        </div>
    );
}

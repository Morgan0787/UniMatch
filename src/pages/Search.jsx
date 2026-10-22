import React, { useState, useEffect, useMemo, useCallback, useDeferredValue, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { admissionFavoriteRepository } from '@/lib/admissions/favoriteRepository';
import { canonicalFavoriteIds, serializeFavoriteWrite, writeAdmissionFavorite } from '@/lib/admissions/favorites';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search as SearchIcon, SlidersHorizontal, GraduationCap, X, GitCompare } from 'lucide-react';
import FilterPanel from '@/components/search/FilterPanel';
import UniversityCard from '@/components/search/UniversityCard';
import UniversityDetailModal from '@/components/search/UniversityDetailModal';
import ComparisonModal from '@/components/comparison/ComparisonModal';
import { useLanguage } from '@/lib/i18n';
import { selectCatalogResults, getCatalogPage } from '@/lib/catalogResults';

const DEFAULT_FILTERS = { gpa: null, ielts: null, topikLevel: null, budget: null, region: '', country: '', languages: [], degree: '', scholarshipsOnly: false };

const toNumber = (value, fallback) => {
    const normalized = typeof value === 'string' ? Number(value.replace(/,/g, '').trim()) : Number(value);
    return Number.isFinite(normalized) ? normalized : fallback;
};

const normalizeFilters = (value = {}) => ({
    ...DEFAULT_FILTERS,
    ...(value && typeof value === 'object' ? value : {}),
    gpa: value?.gpa == null || value.gpa === '' ? null : toNumber(value.gpa, null),
    ielts: value?.ielts == null || value.ielts === '' ? null : toNumber(value.ielts, null),
    budget: value?.budget == null || value.budget === '' ? null : toNumber(value.budget, null),
    topikLevel: typeof value?.topikLevel === 'string' && value.topikLevel ? value.topikLevel : null,
    region: typeof value?.region === 'string' && value.region !== 'all' ? value.region : DEFAULT_FILTERS.region,
    country: typeof value?.country === 'string' && value.country !== 'all' ? value.country : DEFAULT_FILTERS.country,
    languages: Array.isArray(value?.languages) ? value.languages.filter(Boolean) : DEFAULT_FILTERS.languages,
    degree: typeof value?.degree === 'string' ? value.degree : DEFAULT_FILTERS.degree,
    scholarshipsOnly: Boolean(value?.scholarshipsOnly),
});

const loadSavedFilters = () => {
    if (typeof window === 'undefined') return DEFAULT_FILTERS;

    try {
        const saved = window.localStorage.getItem('uniAdmitFilters');
        const parsed = saved ? JSON.parse(saved) : {};

        return normalizeFilters(parsed);
    } catch {
        return DEFAULT_FILTERS;
    }
};

export default function Search() {
    const { t, language } = useLanguage();
    const { session } = useAuth();
    const queryClient = useQueryClient();
    const ownerId = session?.user?.id || null;
    const ownerEmail = session?.user?.email || null;
    const ownerKey = JSON.stringify([ownerId, ownerEmail]);
    const ownerRef = useRef(ownerKey);
    ownerRef.current = ownerKey;
    const savePending = useRef(false);
    const [savedOwner, setSavedOwner] = useState(null);
    const [saveError, setSaveError] = useState(false);
    const [savingPublished, setSavingPublished] = useState(false);
    const editorial = {
        en: { title: 'Your world. Your possibilities.', intro: 'Explore universities at your own pace. Bring your grades, budget and interests into focus.', hint: 'Add your GPA and language scores to see a personal chance estimate.' },
        ru: { title: 'Ваш мир. Ваши возможности.', intro: 'Исследуйте университеты в своём темпе. Учитывайте оценки, бюджет и то, что вам интересно.', hint: 'Добавьте GPA и результаты языковых тестов, чтобы увидеть персональную оценку шансов.' },
        uz: { title: 'Sizning dunyongiz. Sizning imkoniyatlaringiz.', intro: 'Universitetlarni o‘z sur’atingizda o‘rganing. Baholar, byudjet va qiziqishlaringizni hisobga oling.', hint: 'Shaxsiy imkoniyat bahosini ko‘rish uchun GPA va til imtihoni natijalarini kiriting.' },
    }[language] || { title: 'Your world. Your possibilities.', intro: '', hint: 'Add your GPA and language scores to see a personal chance estimate.' };
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState(loadSavedFilters);
    const deferredQuery = useDeferredValue(searchQuery);
    const [resultPage, setResultPage] = useState({ key: '', page: 1 });
    const [showFirstVisitHint, setShowFirstVisitHint] = useState(() => {
        if (typeof window === 'undefined') return false;
        return !window.localStorage.getItem('uniMatchSeenSearchHint');
    });
    const dismissHint = () => {
        setShowFirstVisitHint(false);
        if (typeof window !== 'undefined') window.localStorage.setItem('uniMatchSeenSearchHint', '1');
    };
    const [selectedUniversity, setSelectedUniversity] = useState(null);
    const [savedUniversities, setSavedUniversities] = useState([]);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [compareList, setCompareList] = useState([]);
    const [showComparison, setShowComparison] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => { localStorage.setItem('uniAdmitFilters', JSON.stringify(filters)); }, [filters]);
    useEffect(() => {
        if (showFirstVisitHint && (filters.gpa != null || filters.ielts != null)) {
            dismissHint();
        }
    }, [filters.gpa, filters.ielts]);
    const { data: universities = [], isLoading } = useQuery({ queryKey: ['universities'], queryFn: () => apiClient.entities.University.list() });
    useEffect(() => {
        let active = true;
        setSavedUniversities([]); setSavedOwner(null); setUserProfile(null); setSaveError(false);
        if (!ownerId || !ownerEmail) return () => { active = false; };
        apiClient.entities.StudentProfile.filter({ created_by: ownerEmail }).then(profiles => {
            if (!active || profiles.length !== 1) return;
            const currentProfile = profiles[0];
            setUserProfile(currentProfile);
            setSavedUniversities(Array.isArray(currentProfile.saved_universities) ? currentProfile.saved_universities : []);
            setSavedOwner(ownerKey);
            setFilters(f => normalizeFilters({ ...f, gpa: currentProfile.gpa ?? f.gpa, ielts: currentProfile.english_proficiency ?? f.ielts, budget: currentProfile.budget_max ?? f.budget, topikLevel: currentProfile.topikLevel ?? f.topikLevel }));
        }).catch(() => {});
        return () => { active = false; };
    }, [ownerId, ownerEmail, ownerKey]);
    const registry = useMemo(() => universities.map(row => row.admissionCatalog?.identity).filter(Boolean), [universities]);
    const currentSaved = savedOwner === ownerKey ? savedUniversities : [];
    const isUniversitySaved = university => university?.admissionCatalog?.identity
        ? canonicalFavoriteIds(currentSaved, registry).includes(university.admissionCatalog.identity.institutionId)
        : currentSaved.includes(university?.id);

    const sortedUniversities = useMemo(() => selectCatalogResults(universities, filters, deferredQuery), [universities, filters, deferredQuery]);
    const resultKey = useMemo(() => JSON.stringify([filters, deferredQuery]), [filters, deferredQuery]);
    useEffect(() => { setResultPage({ key: resultKey, page: 1 }); }, [resultKey]);
    const pageInfo = getCatalogPage(sortedUniversities, resultPage.key === resultKey ? resultPage.page : 1);
    const pagingLabels = { en: ['Previous', 'Next', 'University results pages'], ru: ['Назад', 'Далее', 'Страницы университетов'], uz: ['Oldingi', 'Keyingi', 'Universitetlar sahifalari'] }[language] || ['Previous', 'Next', 'University results pages'];
    const changePage = (page) => {
        setResultPage({ key: resultKey, page });
        const grid = document.getElementById('catalog-items');
        const toolbarHeight = document.querySelector('.catalog-toolbar')?.getBoundingClientRect().height || 0;
        const navHeight = document.querySelector('.product-nav')?.getBoundingClientRect().height || 64;
        if (grid) window.scrollTo({ top: Math.max(0, grid.getBoundingClientRect().top + window.scrollY - toolbarHeight - navHeight - 16), behavior: 'auto' });
    };

    const handleSave = useCallback(async (universityId) => {
        const published = universities.find(row => row.id === universityId)?.admissionCatalog;
        if (published) {
            if (published.status !== 'valid' || !published.identity || savePending.current) return;
            if (!ownerId || !ownerEmail) { await apiClient.auth.redirectToLogin('/Search'); return; }
            savePending.current = true; setSavingPublished(true); setSaveError(false);
            try {
                const owner = { id: ownerId, email: ownerEmail };
                const remove = canonicalFavoriteIds(currentSaved, registry).includes(published.identity.institutionId);
                const profile = await serializeFavoriteWrite(ownerId, () => writeAdmissionFavorite(admissionFavoriteRepository(owner), owner, published.identity.institutionId, remove, registry));
                if (ownerRef.current === ownerKey) { setSavedUniversities(profile.saved_universities); setSavedOwner(ownerKey); }
                await queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
            } catch { if (ownerRef.current === ownerKey) setSaveError(true); }
            finally { savePending.current = false; setSavingPublished(false); }
            return;
        }
        try {
            const newSaved = savedUniversities.includes(universityId) ? savedUniversities.filter(id => id !== universityId) : [...savedUniversities, universityId];
            setSavedUniversities(newSaved);
            const user = await apiClient.auth.me();
            const profiles = await apiClient.entities.StudentProfile.filter({ created_by: user.email });
            if (profiles.length > 0) await apiClient.entities.StudentProfile.update(profiles[0].id, { saved_universities: newSaved });
        } catch (e) {}
    }, [savedUniversities, universities, ownerId, ownerEmail, ownerKey, currentSaved, registry, queryClient]);

    const resetFilters = useCallback(() => { setFilters(DEFAULT_FILTERS); setSearchQuery(''); }, []);
    const handleCompareToggle = useCallback((universityId) => setCompareList(prev => prev.includes(universityId) ? prev.filter(id => id !== universityId) : prev.length < 3 ? [...prev, universityId] : prev), []);
    const handleRemoveFromCompare = (universityId) => setCompareList(prev => prev.filter(id => id !== universityId));
    const compareUniversities = useMemo(() => universities.filter(uni => compareList.includes(uni.id)), [universities, compareList]);
    const activeFilterCount = Object.entries(filters).filter(([key, value]) => Array.isArray(value) ? value.length > 0 : value !== DEFAULT_FILTERS[key]).length;
    const filterDoneLabel = { en: 'Show results', ru: 'Показать результаты', uz: 'Natijalarni ko‘rsatish' }[language] || 'Show results';
    const unsetLabel = { en: 'Not set', ru: 'Не указано', uz: 'Kiritilmagan' }[language] || 'Not set';

    return (
        <div className="catalog-page min-h-screen bg-slate-50">
            <header className="max-w-7xl mx-auto px-4 sm:px-6 catalog-heading">
                <div className="product-eyebrow">UniMatch / {t('nav.findUniversities')}</div>
                <h1>{editorial.title}</h1>
                <p>{editorial.intro}</p>
            </header>
            {showFirstVisitHint && (
                <div className="bg-indigo-600 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
                        <p className="text-sm font-medium">{editorial.hint}</p>
                        <button aria-label={t('common.close')} onClick={dismissHint} className="text-white/80 hover:text-white flex-shrink-0"><X className="w-4 h-4" /></button>
                    </div>
                </div>
            )}
            {saveError && <p role="alert" className="max-w-7xl mx-auto px-4 py-2 text-sm text-red-700">{{en: 'The save could not be confirmed. Please retry.', ru: 'Сохранение не подтверждено. Повторите попытку.', uz: 'Saqlash tasdiqlanmadi. Qayta urinib ko‘ring.'}[language]}</p>}
            <div className="catalog-toolbar bg-white border-b border-slate-100 sticky top-0 z-40"><div className="max-w-7xl mx-auto px-4 sm:px-6 py-4"><div className="flex flex-col md:flex-row gap-4 items-center"><div className="relative flex-1 w-full"><SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><Input aria-label={t('search.placeholder')} placeholder={t('search.placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 pr-4 py-6 text-lg bg-slate-50 border-slate-200 rounded-xl focus:bg-white" />{searchQuery && <button aria-label={t('filters.reset')} onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>}</div><Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}><SheetTrigger asChild><Button variant="outline" className="gap-2 shrink-0 min-h-11"><SlidersHorizontal className="w-4 h-4" />{t('search.filters')}{activeFilterCount > 0 && <Badge className="bg-indigo-600 text-white ml-1">{activeFilterCount}</Badge>}</Button></SheetTrigger><SheetContent side="right" aria-describedby={undefined} className="catalog-filter-drawer w-full sm:w-96 p-0 flex flex-col max-h-screen"><SheetTitle className="sr-only">{t('search.filters')}</SheetTitle><div className="flex-1 overflow-y-auto p-4 pt-10"><FilterPanel filters={filters} setFilters={setFilters} onReset={resetFilters} universities={universities} /></div><div className="border-t p-4"><Button className="w-full min-h-11" onClick={() => setMobileFiltersOpen(false)}>{filterDoneLabel} ({sortedUniversities.length})</Button></div></SheetContent></Sheet></div><div className="catalog-results flex flex-wrap items-center justify-between mt-4 gap-4"><p className="text-slate-600"><span className="font-semibold text-slate-800">{sortedUniversities.length}</span> {t('search.results')}</p><div className="flex flex-wrap items-center gap-3">{compareList.length > 0 && <Button onClick={() => setShowComparison(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2" size="sm"><GitCompare className="w-4 h-4" />{t('search.compare')} ({compareList.length})</Button>}<div className="flex gap-2 items-center text-sm text-slate-500"><span>{t('search.yourGpa')}:</span><Badge variant="secondary" className="bg-indigo-100 text-indigo-700">{filters.gpa == null ? unsetLabel : filters.gpa.toFixed(1)}</Badge></div></div></div></div></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6"><div className="flex gap-8"><main id="catalog-items" aria-busy={searchQuery !== deferredQuery} className="flex-1 min-w-0">{isLoading ? <div className="catalog-grid grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100"><Skeleton className="h-32" /><div className="p-5 space-y-3"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-16" /><Skeleton className="h-8 w-24" /></div></div>)}</div> : sortedUniversities.length === 0 ? <div className="text-center py-20"><div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><GraduationCap className="w-8 h-8 text-slate-400" /></div><h3 className="text-lg font-semibold text-slate-800 mb-2">{t('search.noResults')}</h3><p className="text-slate-500 mb-6">{t('search.tryAdjusting')}</p><Button variant="outline" onClick={resetFilters}>{t('search.resetFilters')}</Button></div> : <div className="catalog-grid grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{pageInfo.rows.map((university) => <UniversityCard key={university.id} university={university} userGpa={filters.gpa} userIelts={filters.ielts} userTopik={filters.topikLevel} isSaved={isUniversitySaved(university)} saveDisabled={savingPublished} onSave={handleSave} onView={setSelectedUniversity} isComparing={compareList.includes(university.id)} onCompareToggle={handleCompareToggle} />)}</div>}</main></div></div>
            {!isLoading && sortedUniversities.length > 0 && <nav aria-label={pagingLabels[2]} className="catalog-pagination max-w-7xl mx-auto px-4 sm:px-6 pb-8 flex flex-wrap items-center justify-center gap-4">
                <Button variant="outline" disabled={pageInfo.page === 1} onClick={() => changePage(pageInfo.page - 1)}>{pagingLabels[0]}</Button>
                <span aria-live="polite">{pageInfo.start}–{pageInfo.end} / {sortedUniversities.length} · {pageInfo.page} / {pageInfo.pages}</span>
                <Button variant="outline" disabled={pageInfo.page === pageInfo.pages} onClick={() => changePage(pageInfo.page + 1)}>{pagingLabels[1]}</Button>
            </nav>}
            <UniversityDetailModal university={selectedUniversity} isOpen={!!selectedUniversity} onClose={() => setSelectedUniversity(null)} userGpa={filters.gpa} userIelts={filters.ielts} userTopik={filters.topikLevel} isSaved={isUniversitySaved(selectedUniversity)} saveDisabled={savingPublished} onSave={handleSave} />
            <ComparisonModal universities={compareUniversities} isOpen={showComparison} onClose={() => setShowComparison(false)} onRemove={handleRemoveFromCompare} userProfile={userProfile} />
        </div>
    );
}

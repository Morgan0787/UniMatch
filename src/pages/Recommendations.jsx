import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useNavigationType, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, GraduationCap, Globe, Coins, BookOpen, Pencil, ArrowRight, AlertCircle, GitCompare, SlidersHorizontal, ArrowDownUp, X } from 'lucide-react';
import UniversityCard from '@/components/search/UniversityCard';
import ComparisonModal from '@/components/comparison/ComparisonModal';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useLanguage } from '@/lib/i18n';
import { VERDICT, calculateMatchScore, describeMissingChanceData, hasCostData } from '@/lib/matching';
import ChanceIndicator from '@/components/ui/ChanceIndicator';
import { admissionCopy } from '@/components/admissions/copy';
import { useAuth } from '@/lib/AuthContext';
import { catalogValue } from '@/lib/catalogCopy';
import { readRecommendationState, writeRecommendationState } from '@/lib/recommendationState';
import { isUniversityFavorite, studentProfileQueryOptions, writeConfirmedUniversityFavorite } from '@/lib/studentProfile';
import '@/styles/internal-pages.css';
import '@/styles/release-pages.css';
import '@/styles/recommendations-glass.css';

const recommendationMessages = {
    en: {
        compare: 'Add to comparison',
        uncompare: 'Remove from comparison',
        compareLimit: 'You can compare up to 3 universities. Remove one to add another.',
    },
    ru: {
        compare: 'Добавить к сравнению',
        uncompare: 'Убрать из сравнения',
        compareLimit: 'Можно сравнить не более 3 университетов. Уберите один, чтобы добавить другой.',
    },
    uz: {
        compare: 'Taqqoslashga qo‘shish',
        uncompare: 'Taqqoslashdan olib tashlash',
        compareLimit: 'Ko‘pi bilan 3 ta universitetni taqqoslash mumkin. Boshqasini qo‘shish uchun bittasini olib tashlang.',
    },
};

// How many universities this page shows.
const RECOMMENDATION_LIMIT = 20;

// How many of those slots are held back for rows we cannot score, so that a
// university with no published GPA cutoff still reaches the student as an
// honest "Not enough data" row instead of being ranked away. Only ~24 of
// ~1,968 rows publish a cutoff, so without a reservation the scored tiers
// would fill every slot and no unknown row would ever render.
const RESERVED_UNSCORED_ROWS = 5;


// Daily shuffle function - gives different order each day but consistent within the day
function getDailyShuffle(arr) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const seed = today.split('-').reduce((acc, val) => acc + parseInt(val), 0);
    
    const shuffled = [...arr];
    let currentSeed = seed;
    
    // Seeded shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
        currentSeed = (currentSeed * 9301 + 49297) % 233280;
        const j = Math.floor((currentSeed / 233280) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
}

function MatchScoreIndicator({ score, missingReason }) {
    const { t } = useLanguage();

    // null is "we cannot say", not a low score and not an absent one. Reuse the
    // same neutral indicator the cards and modal use so a missing GPA cutoff
    // reads identically everywhere.
    if (score === null) {
        return <ChanceIndicator chance={VERDICT.UNKNOWN} reason={missingReason} />;
    }
    
    const getColor = () => {
        if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-[#47443f] bg-[#f4efe6] border-[#ded5c6]';
    };
    
    const getLabel = () => {
        if (score >= 80) return t('recommendations.excellentMatch');
        if (score >= 60) return t('recommendations.goodMatch');
        if (score >= 40) return t('recommendations.fairMatch');
        return t('recommendations.consider');
    };
    
    return (
        <div className="recommendation-score flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-semibold ${getColor()}`}>
                <Target className="w-4 h-4" />
                <span>{score}%</span>
            </div>
            <span className="text-sm text-[#55504a]">{getLabel()}</span>
        </div>
    );
}

function RecommendationCard({ university, profile, matchScore, isSaved, onSave, saveDisabled, savePendingLabel, saveError, saveNotice, onView, isComparing, onCompareToggle, compareLimitReached }) {
    return <UniversityCard university={university} userGpa={profile.gpa} userIelts={profile.english_proficiency}
        userTopik={profile.topikLevel} isSaved={isSaved} onSave={onSave} isComparing={isComparing}
        onCompareToggle={onCompareToggle} compareLimitReached={compareLimitReached} onView={onView}
        saveDisabled={saveDisabled} savePendingLabel={savePendingLabel}>
        {saveError && <p role="alert" className="text-sm text-[#855a36]">{saveError}</p>}
        <span role="status" className={savePendingLabel ? 'block text-sm font-medium text-[#55504a]' : 'sr-only'}>{savePendingLabel || saveNotice}</span>
        {university.admissionCatalog === undefined && <MatchScoreIndicator score={matchScore}
            missingReason={describeMissingChanceData(university)?.note} />}
    </UniversityCard>;
}

export default function Recommendations() {
    const { t, language } = useLanguage();
    const { session } = useAuth();
    const owner = session?.user;
    const queryClient = useQueryClient();
    const location = useLocation();
    const navigate = useNavigate();
    const navigationType = useNavigationType();
    const [searchParams] = useSearchParams();
    const { filter: resultFilter, sort: sortOrder } = readRecommendationState(searchParams);
    const messages = recommendationMessages[language] || recommendationMessages.en;
    const favoriteText = admissionCopy[language] || admissionCopy.en;
    const [compareList, setCompareList] = useState([]);
    const [showComparison, setShowComparison] = useState(false);
    const [countryWeights, setCountryWeights] = useState({});
    const [compareNotice, setCompareNotice] = useState('');
    const profileQuery = useQuery(studentProfileQueryOptions(owner));
    const userProfile = profileQuery.data?.[0];
    const favoriteMutation = useMutation({
        /** @param {import('@/lib/studentProfile').UniversityFavoriteRequest} request */
        mutationFn: ({ owner, university, remove }) => writeConfirmedUniversityFavorite(queryClient, owner, university, remove),
    });
    const favoriteOwner = favoriteMutation.variables?.owner;
    const favoriteAction = favoriteOwner?.id === owner?.id && favoriteOwner?.email === owner?.email ? favoriteMutation.variables : null;
    const savingFavorite = Boolean(favoriteAction && favoriteMutation.isPending);
    const copy = {
        ru: {title:'Ваши персональные рекомендации', subtitle:'Варианты на основе вашего профиля. Проверьте условия каждой программы.', all:'Все варианты', budget:'По бюджету', unknown:'Требуют уточнения', sort:'Сначала подходящие', name:'По названию', edit:'Изменить профиль', year:'EUR / год', upTo:'До', comparison:'Для сравнения', clear:'Очистить сравнение', empty:'По этим условиям вариантов пока нет', reset:'Показать все варианты', settings:'Настроить подбор', results:'вариантов', budgetNote:'Учитываются только варианты с опубликованной стоимостью обучения и проживания.'},
        en: {title:'Your personal recommendations', subtitle:'Options based on your profile. Check the conditions of each programme.', all:'All options', budget:'Within budget', unknown:'Needs clarification', sort:'Best matches first', name:'University name', edit:'Edit profile', year:'EUR / year', upTo:'Up to', comparison:'To compare', clear:'Clear comparison', empty:'No options match these conditions yet', reset:'Show all options', settings:'Adjust preferences', results:'options', budgetNote:'Only options with published tuition and living costs are included.'},
        uz: {title:'Siz uchun shaxsiy tavsiyalar', subtitle:'Profilingizga asoslangan variantlar. Har bir dastur shartlarini tekshiring.', all:'Barcha variantlar', budget:'Budjet doirasida', unknown:'Aniqlashtirish kerak', sort:'Avval mos variantlar', name:'Universitet nomi', edit:'Profilni tahrirlash', year:'EUR / yil', upTo:'Gacha', comparison:'Taqqoslash uchun', clear:'Taqqoslashni tozalash', empty:'Bu shartlarga mos variantlar hozircha yo‘q', reset:'Barcha variantlar', settings:'Tanlovni sozlash', results:'ta variant', budgetNote:'Faqat o‘qish va yashash xarajatlari e’lon qilingan variantlar hisobga olinadi.'},
    }[language] || {title:t('recommendations.title'), subtitle:t('recommendations.subtitle')};
    
    const { data: universities = [], isLoading: loadingUniversities, isError, refetch } = useQuery({
        queryKey: ['universities', new Date().toISOString().split('T')[0]], // Daily cache key
        queryFn: () => apiClient.entities.University.list(),
        staleTime: 1000 * 60 * 60, // 1 hour
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });
    
    const changeResults = patch => {
        const query = writeRecommendationState(searchParams, patch).toString();
        navigate({ pathname: location.pathname, search: query, hash: location.hash }, { replace: true });
    };

    const rememberPosition = university => {
        navigate(location.pathname + location.search + location.hash, {
            replace: true,
            state: { recommendationFocusId: university.id, recommendationScrollY: window.scrollY },
        });
    };

    const handleSave = universityId => {
        const university = universities.find(row => row.id === universityId);
        if (!owner?.id || !owner?.email || !userProfile || !university || savingFavorite) return;
        favoriteMutation.mutate({
            owner,
            university,
            remove: isUniversityFavorite(userProfile.saved_universities, university),
        });
    };
    
    const handleCompareToggle = (universityId) => {
        if (!compareList.includes(universityId) && compareList.length >= 3) {
            setCompareNotice(messages.compareLimit);
            return;
        }

        setCompareList(prev => {
            if (prev.includes(universityId)) {
                return prev.filter(id => id !== universityId);
            } else if (prev.length < 3) {
                return [...prev, universityId];
            } else {
                return prev;
            }
        });
        setCompareNotice('');
    };
    
    const handleRemoveFromCompare = (universityId) => {
        setCompareList(prev => prev.filter(id => id !== universityId));
    };
    
    const updateCountryWeight = (country, weight) => {
        setCountryWeights(prev => ({ ...prev, [country]: weight }));
    };
    
    // Calculate match scores, sort, and apply daily shuffle to similar scores
    const recommendedUniversities = React.useMemo(() => {
        const withScores = universities.map(uni => ({
            ...uni,
            // null, not a placeholder 50: with no profile there is no score to
            // report. This branch is unreachable while the page gates on
            // `userProfile` below, and `RecommendationCard` reads `profile.gpa`
            // unconditionally, so the grid cannot render without one.
            matchScore: userProfile ? calculateMatchScore(uni, userProfile, countryWeights) : null
        }));
        
        // Sort by score. A null score means "we cannot say", not "worst": keep
        // unscored rows at the end instead of letting `null - 70` rank them as
        // if they had scored below zero.
        const sorted = withScores.sort((a, b) => {
            if (a.matchScore === null) return b.matchScore === null ? 0 : 1;
            if (b.matchScore === null) return -1;
            return b.matchScore - a.matchScore;
        });
        
        // Group by score tiers and shuffle within each tier for daily variety
        const scored = sorted.filter(u => u.matchScore !== null);
        const tiers = {
            excellent: scored.filter(u => u.matchScore >= 80),
            good: scored.filter(u => u.matchScore >= 60 && u.matchScore < 80),
            fair: scored.filter(u => u.matchScore >= 40 && u.matchScore < 60),
            consider: scored.filter(u => u.matchScore < 40)
        };
        
        // Apply daily shuffle to each score tier
        const shuffledTiers = [
            ...getDailyShuffle(tiers.excellent),
            ...getDailyShuffle(tiers.good),
            ...getDailyShuffle(tiers.fair),
            ...getDailyShuffle(tiers.consider)
        ];
        
        // Rows we cannot score honestly — no published GPA cutoff, so nothing to
        // compare the student's grades against — are not ranked, but they are
        // also not hidden. The product decision is to show "Not enough data"
        // rather than drop these universities from the list, which needs
        // reserved room: only ~24 of ~1,968 rows publish a cutoff, so letting
        // the scored tiers take the whole slice would silently exclude all
        // ~1,944 others and make the unknown state unreachable on this page.
        const scoredSlots = Math.max(RECOMMENDATION_LIMIT - RESERVED_UNSCORED_ROWS, 0);
        
        // Cut the candidate pool down to the quota before shuffling. `unscored`
        // is ~1,944 rows and the quota is 5, so shuffling the whole set would
        // copy and Fisher-Yates all of them on every recompute just to pick
        // five. `sort` is stable and the null-last comparator above leaves the
        // unscored rows in a fixed order at the tail, so `slice` picks the same
        // five rows every load for a given dataset: the daily seed permutes
        // their order within the reserved slots, not which rows appear.
        // Widening the pool is what would add variety, and it would reintroduce
        // the full-set shuffle this slice exists to avoid. `slice` yields fewer
        // when fewer exist, and `getDailyShuffle([])` is `[]`.
        const unscored = sorted.filter(u => u.matchScore === null);
        const reservedUnscored = getDailyShuffle(unscored.slice(0, RESERVED_UNSCORED_ROWS));
        
        // Scored matches keep the leading slots in score order; the reserved
        // unknown rows follow them, so an unscored row can never displace a
        // genuinely scored match.
        return [
            ...shuffledTiers.slice(0, scoredSlots),
            ...reservedUnscored
        ].slice(0, RECOMMENDATION_LIMIT);
    }, [universities, userProfile, countryWeights]);
    
    const visibleUniversities = React.useMemo(() => {
        const rows = recommendedUniversities.filter(uni => {
            // Programme fees may have a different period/currency. Only use the
            // legacy annual EUR pair here; never add those unlike amounts.
            if (resultFilter === 'budget') return uni.admissionCatalog === undefined
                && userProfile?.budget_max != null && hasCostData(uni)
                && (uni.tuition_max ?? uni.tuition_min) + uni.living_cost_estimate <= userProfile.budget_max;
            if (resultFilter === 'unknown') return uni.matchScore === null || uni.admissionCatalog !== undefined;
            return true;
        });
        return sortOrder === 'name' ? [...rows].sort((a,b) => a.name.localeCompare(b.name, language)) : rows;
    }, [recommendedUniversities, resultFilter, sortOrder, userProfile?.budget_max, language]);

    const compareUniversities = universities.filter(uni => compareList.includes(uni.id));
    
    const isLoading = loadingUniversities || profileQuery.isLoading;
    const focusId = location.state?.recommendationFocusId;
    const scrollY = location.state?.recommendationScrollY;
    
    useEffect(() => {
        if (navigationType !== 'POP' || isLoading || typeof focusId !== 'string') return;
        const frame = requestAnimationFrame(() => {
            const link = document.getElementById(`university-link-${focusId}`);
            if (link && Number.isFinite(scrollY)) {
                link.focus({ preventScroll: true });
                window.scrollTo(0, scrollY);
            } else {
                document.getElementById('recommendations-title')?.focus();
            }
        });
        return () => cancelAnimationFrame(frame);
    }, [navigationType, location.key, isLoading, focusId, scrollY]);

    if (!userProfile && !isLoading && !profileQuery.isError) {
        return (
            <div className="recommendations-page recommendations-gate min-h-screen flex items-center justify-center p-6 text-[#292823]">
                <Card className="product-card max-w-md w-full">
                    <CardHeader>
                        <div className="w-12 h-12 bg-[#f4e4cc] rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-6 h-6 text-[#704a2d]" />
                        </div>
                        <h1 className="text-center text-2xl font-semibold">{t('recommendations.completeProfile')}</h1>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-[#47443f] text-center">
                            {t('recommendations.completeProfileDesc')}
                        </p>
                        <Button asChild className="w-full rounded-full bg-[#252c2f] hover:bg-[#354044] text-white">
                            <Link to={createPageUrl('Profile')}>
                                {t('recommendations.goToProfile')}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="recommendations-page release-page internal-page min-h-screen text-[#292823]">
            {/* Header */}
            <div className="product-page-hero text-[#292823]">
                <div className="recommendations-hero-inner recommendations-container">
                    <div className="product-hero-heading flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">

                            <h1 id="recommendations-title" tabIndex={-1} className="text-3xl font-bold">{copy.title}</h1>
                        </div>
                        {userProfile?.preferred_countries?.length > 0 && (
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" className="recommendation-preferences gap-2">
                                        <SlidersHorizontal className="w-4 h-4" />
                                        {copy.settings}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>{t('recommendations.countryWeights')}</SheetTitle>
                                    </SheetHeader>
                                    <div className="mt-6 space-y-6">
                                        <p className="text-sm text-[#55504a]">
                                            {t('recommendations.countryWeightsDesc')}
                                        </p>
                                        {userProfile.preferred_countries.map(country => (
                                            <div key={country} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label id={`country-weight-label-${country.replace(/[^a-z0-9]+/gi, '-')}`} className="text-sm font-medium">{catalogValue(country, language)}</Label>
                                                    <span className="text-sm font-semibold text-[#704a2d]">
                                                        {countryWeights[country] ?? 100}%
                                                    </span>
                                                </div>
                                                <Slider
                                                    aria-labelledby={`country-weight-label-${country.replace(/[^a-z0-9]+/gi, '-')}`}
                                                    value={[countryWeights[country] ?? 100]}
                                                    onValueChange={([val]) => updateCountryWeight(country, val)}
                                                    min={0}
                                                    max={100}
                                                    step={10}
                                                    className="py-2"
                                                />
                                                <div className="flex justify-between text-xs text-[#55504a]">
                                                    <span>{t('recommendations.notImportant')}</span>
                                                    <span>{t('recommendations.veryImportant')}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </SheetContent>
                            </Sheet>
                        )}
                    </div>
                    <p className="text-[#55504a] text-lg max-w-2xl">
                        {copy.subtitle}
                    </p>
                    
                    {userProfile && <div className="recommendation-profile-strip">
                        <div className="recommendation-profile-metric"><GraduationCap aria-hidden="true" /><span>GPA {userProfile.gpa == null ? '—' : userProfile.gpa.toFixed(1)}</span></div>
                        <div className="recommendation-profile-metric"><Globe aria-hidden="true" /><span>IELTS {userProfile.english_proficiency > 0 ? userProfile.english_proficiency : '—'}</span></div>
                        <div className="recommendation-profile-metric"><Coins aria-hidden="true" /><span>{userProfile.budget_max ? copy.upTo+' '+userProfile.budget_max.toLocaleString(language)+' '+copy.year : '—'}</span></div>
                        <div className="recommendation-profile-metric"><BookOpen aria-hidden="true" /><span>{catalogValue(userProfile.target_degree, language) || '—'}</span></div>
                        <Button asChild variant="outline" className="recommendation-edit"><Link to={createPageUrl('Profile')}><Pencil size={18} aria-hidden="true" />{copy.edit}</Link></Button>
                    </div>}
                </div>
            </div>
            
            {/* Recommendations */}
            <div className="recommendations-container recommendations-results">
                {isLoading ? (
                    <div className="recommendations-grid">
                        {[1,2,3,4,5,6].map(i => (
                            <Card key={i}>
                                <Skeleton className="h-40" />
                                <CardContent className="p-5 space-y-3">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-20" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : isError || profileQuery.isError ? (
                    <div className="recommendation-empty" role="alert">
                        <h2>{{ru:'Не удалось загрузить рекомендации',en:'Unable to load recommendations',uz:'Tavsiyalarni yuklab bo‘lmadi'}[language]}</h2>
                        <Button variant="outline" onClick={() => void (profileQuery.isError ? profileQuery.refetch() : refetch())}>{{ru:'Попробовать снова',en:'Try again',uz:'Qayta urinish'}[language]}</Button>
                    </div>
                ) : (
                    <>
                        <div className="recommendation-toolbar">
                            <div className="recommendation-segments" role="group" aria-label={copy.title}>
                                {[['all',copy.all],['budget',copy.budget],['unknown',copy.unknown]].map(([value,label]) => <button key={value} type="button" aria-pressed={resultFilter === value} onClick={() => changeResults({ filter: value })}>{label}</button>)}
                            </div>
                            <Select value={sortOrder} onValueChange={sort => changeResults({ sort })}>
                                <SelectTrigger className="recommendation-sort" aria-label={{ en: 'Sort recommendations', ru: 'Сортировка рекомендаций', uz: 'Tavsiyalarni saralash' }[language]}>
                                    <ArrowDownUp size={18} aria-hidden="true" className="shrink-0" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass-filter-options recommendation-sort-options" align="end">
                                    <SelectItem value="match">{copy.sort}</SelectItem>
                                    <SelectItem value="name">{copy.name}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="recommendation-result-count" role="status">{visibleUniversities.length} {copy.results}{resultFilter === 'budget' && <span> · {copy.budgetNote}</span>}</p>
                        {visibleUniversities.length === 0 && <div className="recommendation-empty"><h2>{copy.empty}</h2><Button variant="outline" onClick={() => changeResults({ filter: 'all' })}>{copy.reset}</Button></div>}
                        {compareNotice && <p role="status" className="mb-4 text-sm text-[#855a36]">{compareNotice}</p>}
                        <p id="catalog-compare-status" className="sr-only">{messages.compareLimit}</p>
                        
                        <div className="recommendations-grid">
                            {visibleUniversities.map(university => {
                                const affected = favoriteAction?.university.id === university.id;
                                return (
                                    <RecommendationCard
                                        key={university.id}
                                        university={university}
                                        profile={userProfile}
                                        matchScore={university.matchScore}
                                        isSaved={isUniversityFavorite(userProfile?.saved_universities, university)}
                                        onSave={handleSave}
                                        saveDisabled={savingFavorite}
                                        savePendingLabel={affected && savingFavorite ? favoriteText[favoriteAction.remove ? 'removing' : 'saving'] : undefined}
                                        saveError={affected && favoriteMutation.isError ? favoriteText.saveError : ''}
                                        saveNotice={affected && favoriteMutation.isSuccess ? favoriteText[favoriteAction.remove ? 'removedFromAccount' : 'savedInAccount'] : ''}
                                        onView={rememberPosition}
                                        isComparing={compareList.includes(university.id)}
                                        onCompareToggle={handleCompareToggle}
                                        compareLimitReached={compareList.length >= 3}
                                    />
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
            
            {compareList.length > 0 && <aside className="recommendation-compare-dock" aria-label={t('search.compare')}>
                <span className="recommendation-compare-count">{copy.comparison}: <strong>{compareList.length}</strong></span>
                <div className="recommendation-compare-items">{compareUniversities.map(uni => <button key={uni.id} type="button" onClick={() => handleRemoveFromCompare(uni.id)} aria-label={messages.uncompare+': '+uni.name}><span>{uni.name}</span><X size={14} aria-hidden="true" /></button>)}</div>
                <Button className="recommendation-compare-open" onClick={() => setShowComparison(true)}><GitCompare size={18} aria-hidden="true" />{t('search.compare')}<ArrowRight size={18} aria-hidden="true" /></Button>
                <button className="recommendation-compare-clear" type="button" aria-label={copy.clear} onClick={() => {setCompareList([]);setCompareNotice('');}}><X size={20} aria-hidden="true" /></button>
            </aside>}

            
            {/* Comparison Modal */}
            <ComparisonModal
                universities={compareUniversities}
                isOpen={showComparison}
                onClose={() => setShowComparison(false)}
                onRemove={handleRemoveFromCompare}
                userProfile={userProfile}
            />
        </div>
    );
}

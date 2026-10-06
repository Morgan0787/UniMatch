import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Sparkles, Target, TrendingUp, Award, MapPin, 
    DollarSign, Globe, Bookmark, BookmarkCheck,
    ArrowRight, AlertCircle, GitCompare, SlidersHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';
import UniversityDetailModal from '@/components/search/UniversityDetailModal';
import ComparisonModal from '@/components/comparison/ComparisonModal';
import UniversityCover from '@/components/ui/UniversityCover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useLanguage } from '@/lib/i18n';
import { VERDICT, calculateMatchScore, describeMissingChanceData, hasCostData, hasGpaData } from '@/lib/matching';
import ChanceIndicator from '@/components/ui/ChanceIndicator';

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
        return 'text-slate-600 bg-slate-50 border-slate-200';
    };
    
    const getLabel = () => {
        if (score >= 80) return t('recommendations.excellentMatch');
        if (score >= 60) return t('recommendations.goodMatch');
        if (score >= 40) return t('recommendations.fairMatch');
        return t('recommendations.consider');
    };
    
    return (
        <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-semibold ${getColor()}`}>
                <Target className="w-4 h-4" />
                <span>{score}%</span>
            </div>
            <span className="text-sm text-slate-600">{getLabel()}</span>
        </div>
    );
}

function RecommendationCard({ university, profile, matchScore, isSaved, onSave, onView, isComparing, onCompareToggle }) {
    const { t } = useLanguage();
    // null when the cost is unknown, so no badge below can assert a budget fit
    // from invented numbers.
    const totalCost = hasCostData(university)
        ? university.tuition_min + university.living_cost_estimate
        : null;
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group"
        >
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-slate-200">
                <div className="relative h-40 overflow-hidden">
                    <UniversityCover university={university} size="medium" />
                    <div className="absolute top-3 right-3 flex gap-2">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onCompareToggle(university.id)}
                            className={`bg-white/90 hover:bg-white ${isComparing ? 'ring-2 ring-indigo-600' : ''}`}
                        >
                            <GitCompare className={`w-4 h-4 ${isComparing ? 'text-indigo-600' : ''}`} />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onSave(university.id)}
                            className="bg-white/90 hover:bg-white"
                        >
                            {isSaved ? (
                                <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                            ) : (
                                <Bookmark className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>
                
                <CardContent className="p-5 space-y-4">
                    {/* University Name */}
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{university.name}</h3>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <MapPin className="w-3 h-3" />
                            <span>{university.city}, {university.country}</span>
                        </div>
                    </div>
                    
                    {/* Match Score */}
                    <div>
                        <p className="text-xs text-slate-500 mb-2">{t('recommendations.matchScore')}</p>
                        <MatchScoreIndicator
                            score={matchScore}
                            missingReason={describeMissingChanceData(university)?.note}
                        />
                    </div>
                    
                    {/* Key Stats */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            <div>
                                <p className="text-xs text-slate-500">{t('university.tuition')}</p>
                                <p className="font-semibold text-slate-800">
                                    {university.tuition_min === 0 ? t('university.free') : university.tuition_min === null || university.tuition_min === undefined ? (
                                        <span className="text-slate-400 italic font-normal text-sm">Not published</span>
                                    ) : (
                                        `€${university.tuition_min.toLocaleString()}`
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            <div>
                                <p className="text-xs text-slate-500">{t('university.minGpa')}</p>
                                <p className="font-semibold text-slate-800">
                                    {university.min_gpa === null || university.min_gpa === undefined ? (
                                        <span className="text-slate-400 italic font-normal text-sm">Not published</span>
                                    ) : (
                                        university.min_gpa.toFixed(1)
                                    )}
                                </p>
                            </div>
                        </div>
                        {university.required_ielts && (
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-violet-500" />
                                <div>
                                    <p className="text-xs text-slate-500">IELTS</p>
                                    <p className="font-semibold text-slate-800">{university.required_ielts}+</p>
                                </div>
                            </div>
                        )}
                        {university.scholarships_available && (
                            <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-amber-500" />
                                <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-xs">
                                    {t('university.scholarships')}
                                </Badge>
                            </div>
                        )}
                    </div>
                    
                    {/* Why Recommended */}
                    <div className="pt-3 border-t space-y-1">
                        <p className="text-xs font-medium text-slate-700">{t('recommendations.whyRecommended')}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {profile.gpa && hasGpaData(university) && profile.gpa >= university.min_gpa && (
                                <Badge variant="outline" className="text-xs">
                                    ✓ {t('recommendations.gpaFit')}
                                </Badge>
                            )}
                            {profile.budget_max && totalCost !== null && totalCost <= profile.budget_max && (
                                <Badge variant="outline" className="text-xs">
                                    ✓ {t('recommendations.withinBudget')}
                                </Badge>
                            )}
                            {profile.preferred_countries?.includes(university.country) && (
                                <Badge variant="outline" className="text-xs">
                                    ✓ {t('recommendations.preferredCountry')}
                                </Badge>
                            )}
                            {university.ranking && university.ranking <= 100 && (
                                <Badge variant="outline" className="text-xs">
                                    ✓ {t('recommendations.topRanked')}
                                </Badge>
                            )}
                            {university.international_students_percent !== null
                                && university.international_students_percent !== undefined
                                && university.international_students_percent >= 15 && (
                                <Badge variant="outline" className="text-xs">
                                    ✓ {t('recommendations.diverseCampus')}
                                </Badge>
                            )}
                            {university.scholarships_available && (
                                <Badge variant="outline" className="text-xs">
                                    ✓ {t('university.scholarships')}
                                </Badge>
                            )}
                        </div>
                    </div>
                    
                    <Button 
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => onView(university)}
                    >
                        {t('university.viewDetails')}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function Recommendations() {
    const { t } = useLanguage();
    const [userProfile, setUserProfile] = useState(null);
    const [selectedUniversity, setSelectedUniversity] = useState(null);
    const [savedUniversities, setSavedUniversities] = useState([]);
    const [compareList, setCompareList] = useState([]);
    const [showComparison, setShowComparison] = useState(false);
    const [countryWeights, setCountryWeights] = useState({});
    
    const { data: universities = [], isLoading: loadingUniversities } = useQuery({
        queryKey: ['universities', new Date().toISOString().split('T')[0]], // Daily cache key
        queryFn: () => apiClient.entities.University.list(),
        staleTime: 1000 * 60 * 60, // 1 hour
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });
    
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const user = await apiClient.auth.me();
                const profiles = await apiClient.entities.StudentProfile.filter({ created_by: user.email });
                if (profiles.length > 0) {
                    setUserProfile(profiles[0]);
                    setSavedUniversities(profiles[0].saved_universities || []);
                    
                    // Initialize country weights to 100% for preferred countries
                    if (profiles[0].preferred_countries?.length > 0) {
                        const initialWeights = {};
                        profiles[0].preferred_countries.forEach(country => {
                            initialWeights[country] = 100;
                        });
                        setCountryWeights(initialWeights);
                    }
                }
            } catch (e) {
                // Not logged in or no profile
            }
        };
        loadProfile();
    }, []);
    
    const handleSave = async (universityId) => {
        try {
            const newSaved = savedUniversities.includes(universityId)
                ? savedUniversities.filter(id => id !== universityId)
                : [...savedUniversities, universityId];
            setSavedUniversities(newSaved);
            
            const user = await apiClient.auth.me();
            const profiles = await apiClient.entities.StudentProfile.filter({ created_by: user.email });
            if (profiles.length > 0) {
                await apiClient.entities.StudentProfile.update(profiles[0].id, { saved_universities: newSaved });
            }
        } catch (e) {
            // Handle error
        }
    };
    
    const handleCompareToggle = (universityId) => {
        setCompareList(prev => {
            if (prev.includes(universityId)) {
                return prev.filter(id => id !== universityId);
            } else if (prev.length < 3) {
                return [...prev, universityId];
            } else {
                return prev;
            }
        });
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
    
    const compareUniversities = universities.filter(uni => compareList.includes(uni.id));
    
    const isLoading = loadingUniversities;
    
    if (!userProfile && !isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-6 h-6 text-indigo-600" />
                        </div>
                        <CardTitle className="text-center">{t('recommendations.completeProfile')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-slate-600 text-center">
                            {t('recommendations.completeProfileDesc')}
                        </p>
                        <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
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
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-bold">{t('recommendations.title')}</h1>
                        </div>
                        {userProfile?.preferred_countries?.length > 0 && (
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" className="bg-white/20 hover:bg-white/30 text-white gap-2">
                                        <SlidersHorizontal className="w-4 h-4" />
                                        {t('recommendations.adjustPreferences')}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>{t('recommendations.countryWeights')}</SheetTitle>
                                    </SheetHeader>
                                    <div className="mt-6 space-y-6">
                                        <p className="text-sm text-slate-600">
                                            {t('recommendations.countryWeightsDesc')}
                                        </p>
                                        {userProfile.preferred_countries.map(country => (
                                            <div key={country} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium">{country}</Label>
                                                    <span className="text-sm font-semibold text-indigo-600">
                                                        {countryWeights[country] || 100}%
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[countryWeights[country] || 100]}
                                                    onValueChange={([val]) => updateCountryWeight(country, val)}
                                                    min={0}
                                                    max={100}
                                                    step={10}
                                                    className="py-2"
                                                />
                                                <div className="flex justify-between text-xs text-slate-400">
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
                    <p className="text-white/90 text-lg max-w-2xl">
                        {t('recommendations.subtitle')}
                    </p>
                    
                    {userProfile && (
                        <div className="mt-6 flex flex-wrap gap-3">
                            {userProfile.gpa && (
                                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                                    GPA: {userProfile.gpa.toFixed(1)}
                                </Badge>
                            )}
                            {userProfile.english_proficiency > 0 && (
                                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                                    IELTS: {userProfile.english_proficiency}
                                </Badge>
                            )}
                            {userProfile.budget_max && (
                                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                                    Budget: €{userProfile.budget_max.toLocaleString()}/yr
                                </Badge>
                            )}
                            {userProfile.target_degree && (
                                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                                    {userProfile.target_degree}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Recommendations */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {isLoading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                ) : (
                    <>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-800">
                                    {t('recommendations.topMatches', { count: recommendedUniversities.length })}
                                </h2>
                                <p className="text-slate-500">{t('recommendations.sortedByMatch')}</p>
                            </div>
                            {compareList.length > 0 && (
                                <Button 
                                    onClick={() => setShowComparison(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                                >
                                    <GitCompare className="w-4 h-4" />
                                    {t('search.compare')} ({compareList.length})
                                </Button>
                            )}
                        </div>
                        
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendedUniversities.map((university) => (
                                <RecommendationCard
                                    key={university.id}
                                    university={university}
                                    profile={userProfile}
                                    matchScore={university.matchScore}
                                    isSaved={savedUniversities.includes(university.id)}
                                    onSave={handleSave}
                                    onView={setSelectedUniversity}
                                    isComparing={compareList.includes(university.id)}
                                    onCompareToggle={handleCompareToggle}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
            
            {/* University Detail Modal */}
            <UniversityDetailModal
                university={selectedUniversity}
                isOpen={!!selectedUniversity}
                onClose={() => setSelectedUniversity(null)}
                userGpa={userProfile?.gpa}
                userIelts={userProfile?.english_proficiency}
                userTopik={userProfile?.topikLevel || "Not taken"}
                isSaved={selectedUniversity && savedUniversities.includes(selectedUniversity.id)}
                onSave={handleSave}
            />
            
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

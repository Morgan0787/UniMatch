import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { universityPageUrl } from '@/lib/universityNavigation';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Bookmark, BookmarkCheck, ArrowRight, Award, GitCompare } from 'lucide-react';
import LanguageReadiness from './LanguageReadiness';
import { catalogText, catalogValue } from '@/lib/catalogCopy';
import EstimatedField from '@/components/ui/EstimatedField';
import { motion } from 'framer-motion';
import UniversityCover from '@/components/ui/UniversityCover';
import { useLanguage } from '@/lib/i18n';
import { calculateChance } from '@/lib/matching';
import SearchProgrammePreview from './SearchProgrammePreview';
import { comparisonProgrammes } from '@/lib/comparisonPresentation';
import UniversityPhoto from './UniversityPhoto';

export default function UniversityCard({ university, userGpa, userIelts, userTopik, isSaved, saveDisabled = false, onSave, onView = undefined, isComparing, onCompareToggle, compareLimitReached = false, prioritizePhotoLoading = false, previewOnly = false, children = null }) {
    const { t, language } = useLanguage();
    const location = useLocation();
    const detailUrl = universityPageUrl(university.id, location.pathname + location.search + location.hash);
    const limitLabel = {en:'Limit: 3 universities — remove one first',ru:'Лимит: 3 вуза — сначала уберите один',uz:'Limit: 3 ta universitet — avval bittasini olib tashlang'}[language];
    const hasAdmissionCatalog = university.admissionCatalog !== undefined;
    const limited = !previewOnly && comparisonProgrammes(university).length === 0;
    const limitedLabel = {en:'General university data · programme terms unknown',ru:'Общие сведения о вузе · условия программ неизвестны',uz:'Universitet haqida umumiy ma’lumot · dastur shartlari noma’lum'}[language];
    const chance = userGpa == null ? 'unknown' : calculateChance(university, userGpa, userIelts, userTopik);
    // FIX (2026-07-26): tuition_min can now correctly be null (see apiClient.js fix),
    // and we also show the tuition_max range when it differs from the min instead of
    // silently dropping that data.
    const hasTuitionMin = university.tuition_min !== null && university.tuition_min !== undefined;
    const hasTuitionMax = university.tuition_max !== null && university.tuition_max !== undefined && university.tuition_max !== university.tuition_min;
    const showHolisticGpaNote = university.country === 'United States' && (university.min_gpa === null || university.min_gpa === undefined);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="catalog-card search-university-card product-card group overflow-hidden border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 bg-white h-full flex flex-col">
                {/* Header with cover */}
                <div className="catalog-cover relative overflow-hidden">
                    <UniversityPhoto university={university} language={language} showDetails={false} prioritizeLoading={prioritizePhotoLoading} responsivePreview />
                    <UniversityCover university={university} size="small" showName actions={
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`${t(isSaved ? 'university.saved' : 'university.save')}: ${university.name}`}
                            aria-pressed={Boolean(isSaved)}
                            disabled={previewOnly || saveDisabled || (hasAdmissionCatalog && university.admissionCatalog.status !== 'valid')}
                            className="catalog-save hover:bg-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSave(university.id);
                            }}
                        >
                            {isSaved ? (
                                <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                            ) : (
                                <Bookmark className="w-4 h-4 text-slate-400" />
                            )}
                        </Button>
                    }>
                    {!previewOnly && !hasAdmissionCatalog && university.scholarships_available && (
                        <div className="catalog-scholarship mt-1">
                            <Badge className="bg-emerald-500 text-white border-0 shadow-sm whitespace-normal">
                                <Award className="w-3 h-3 mr-1" />
                                {t('university.scholarships')}
                            </Badge>
                        </div>
                    )}
                    </UniversityCover>
                </div>

                {/* Content */}
                <div className="catalog-card-body p-4 flex-1 flex flex-col">
                    {!previewOnly && <>
                    {/* Quick stats */}
                    <div className="catalog-card-facts space-y-1.5">
                        {hasAdmissionCatalog ? (
                            <SearchProgrammePreview admissionCatalog={university.admissionCatalog} language={language} />
                        ) : <>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">{t('university.tuition')}</p>
                                <p className="catalog-tuition font-semibold text-slate-800 break-words">
                                    {hasTuitionMin ? (
                                        university.tuition_min === 0 ? (
                                            <span className="text-emerald-600">{t('university.free')}</span>
                                        ) : (
                                            <>
                                                €{university.tuition_min.toLocaleString(language)}
                                                {hasTuitionMax && <>–€{university.tuition_max.toLocaleString(language)}</>}
                                            </>
                                        )
                                    ) : (
                                        <span className="text-slate-500 font-normal">{{en:'Unknown',ru:'Неизвестно',uz:'Noma’lum'}[language]}</span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide">{t('university.minGpa')}</p>
                                <p className="text-sm">
                                    {showHolisticGpaNote ? (
                                        <span className="italic text-slate-500" title={catalogText(language, 'holisticNote')}>{catalogText(language, 'holistic')}</span>
                                    ) : (
                                        <EstimatedField value={university.min_gpa} field="gpa" region={university.region} format={(v) => Number(v).toFixed(1)} />
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="text-xs text-slate-600">
                            <span className="text-slate-500">IELTS:</span>{' '}
                            <EstimatedField value={university.required_ielts} field="ielts" region={university.region} unit="+" />
                            {university.language === 'English' && university.required_ielts && userIelts != null && userIelts === 0 && (
                                <span className="ml-1 text-amber-600">({t('university.required')})</span>
                            )}
                        </div>
                        {university.country === "South Korea" && university.topikLevel ? (
                            <div className="text-xs text-slate-600">
                                <span className="text-slate-500">🇰🇷 TOPIK:</span> {university.topikLevel.split(' ')[1]}+
                                <span className="block text-slate-500">{t('university.forKorean')}</span>
                            </div>
                        ) : null}
                        </>}
                    </div>

                    {/* Tags */}
                    {!hasAdmissionCatalog && <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal text-[10px] px-1.5 py-0.5">
                            <Globe className="w-2.5 h-2.5 mr-1" />
                            {catalogValue(university.language, language) || {en:'Unknown',ru:'Неизвестно',uz:'Noma’lum'}[language]}
                        </Badge>
                        {university.degree_levels?.slice(0, 2).map(deg => (
                            <Badge key={catalogValue(deg, language)} variant="secondary" className="bg-indigo-50 text-indigo-600 font-normal text-[10px] px-1.5 py-0.5">
                                {catalogValue(deg, language)}
                            </Badge>
                        ))}
                    </div>}

                    {/* Chance indicator */}
                    {!hasAdmissionCatalog && <div className="mb-2">
                        <LanguageReadiness university={university} ielts={userIelts} topik={userTopik} chance={chance} />
                    </div>}
                    </>}

                    {children}

                    {/* Action buttons */}
                    <div className={`catalog-card-actions mt-auto ${compareLimitReached && !isComparing ? 'catalog-card-actions-limited' : ''}`}>
                        {limited && <p className="catalog-coverage">{limitedLabel}</p>}
                        <Button asChild
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-9 text-sm"
                        >
                            <Link id={`university-link-${university.id}`} to={detailUrl} state={{ fromApp: true }} onClick={() => onView?.(university)}>
                            {{en:'Details',ru:'Подробнее',uz:'Batafsil'}[language] || t('university.viewDetails')}
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5" aria-hidden="true" />
                            </Link>
                        </Button>
                        <Button 
                            variant="outline"
                            size="sm"
                            aria-pressed={isComparing}
                            disabled={previewOnly}
                            aria-disabled={previewOnly || (compareLimitReached && !isComparing)}
                            aria-describedby="catalog-compare-status"
                            className={`catalog-compare w-full min-h-11 h-auto py-2 whitespace-normal text-xs ${isComparing ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 hover:border-indigo-600 hover:bg-indigo-50"}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onCompareToggle(university.id);
                            }}
                        >
                            <GitCompare className="w-3 h-3 mr-1.5" />
                            {isComparing ? t('university.added') : compareLimitReached ? limitLabel : t('university.compare')}
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}

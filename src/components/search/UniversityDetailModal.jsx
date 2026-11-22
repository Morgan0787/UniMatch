import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    MapPin, Globe, GraduationCap, Bookmark, BookmarkCheck, LoaderCircle,
    ExternalLink, Award, Calendar, Users, TrendingUp, DollarSign,
    Building2, BookOpen, Home, Heart,
    Shield, Phone, Mail, CheckCircle2, ChevronRight
} from 'lucide-react';
import LanguageReadiness from './LanguageReadiness';
import { catalogText, catalogValue, catalogDescription } from '@/lib/catalogCopy';
import EstimatedField from '@/components/ui/EstimatedField';
import UniversityCover from '@/components/ui/UniversityCover';
import { useLanguage } from '@/lib/i18n';
import { US_GENERIC_VISA_INFO } from '@/lib/usGenericInfo';
import { calculateChance } from '@/lib/matching';
import PublishedProgrammeFacts from '@/components/admissions/PublishedProgrammeFacts';
import UniversityPhoto from './UniversityPhoto';
import { legacyTuitionPresentation } from '@/lib/legacyTuitionPresentation';

function UniversityInfoSection({ expanded, title, icon: Icon, children }) {
    const titleContent = <><Icon className="w-5 h-5" aria-hidden="true" />{title}</>;
    if (expanded) return <section className="university-info-section">
        <h2 className="university-info-title">{titleContent}</h2>
        <div className="university-info-body">{children}</div>
    </section>;
    return <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 min-h-11 hover:bg-[#faf5ed] rounded-xl transition-colors">
            <h3 className="text-lg font-semibold text-[#292823] flex items-center gap-2">{titleContent}</h3>
            <ChevronRight className="w-5 h-5 text-[#55504a]" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">{children}</CollapsibleContent>
    </Collapsible>;
}

export function UniversityDetails({ university, userGpa, userIelts, userTopik, isSaved, saveDisabled = false, savePendingLabel = undefined, onSave, heading = 'h2', programmeId = '' }) {
    const { t, language } = useLanguage();
    const About = heading === 'h1' ? 'section' : 'details';
    const AboutTitle = heading === 'h1' ? 'h2' : 'summary';
    
    if (!university) return null;
    
    const chance = userGpa == null ? 'unknown' : calculateChance(university, userGpa, userIelts, userTopik);
    const hasAdmissionCatalog = university.admissionCatalog !== undefined;

    // FIX (2026-07-26): tuition_min can now correctly be null (see apiClient.js fix).
    // Also show tuition_max as a range when it differs from tuition_min, instead of
    // dropping that data entirely.
    const hasTuitionMin = university.tuition_min !== null && university.tuition_min !== undefined;
    const hasTuitionMax = university.tuition_max !== null && university.tuition_max !== undefined && university.tuition_max !== university.tuition_min;
    const legacyTuition = hasTuitionMin && university.tuition_min !== 0
        ? legacyTuitionPresentation(university.tuition_min, hasTuitionMax ? university.tuition_max : null, language)
        : null;
    const hasLivingCost = university.living_cost_estimate !== null && university.living_cost_estimate !== undefined;

    // A total is only a total when both operands are real. The old
    // `(tuition_min || 0) + (living_cost_estimate || 8000)` printed a confident
    // figure for every row: a NULL tuition became 0 and a NULL living cost became
    // 8000, so the ~1,944 College Scorecard rows with neither published a €8,000
    // "Total Estimated Cost per Year" in the largest type on the page. Same rule
    // as `hasCostData` in src/pages/Recommendations.jsx — see also the living-cost
    // tile below, which used the same fabricated 8000.
    const totalCost = hasTuitionMin && hasLivingCost
        ? university.tuition_min + university.living_cost_estimate
        : null;

    // Generic US fallbacks (2026-07-26): US universities import (College Scorecard)
    // has no visa_info / min_gpa at all. Rather than a blank "not available", show
    // honest general facts (F-1 visa rules, holistic admissions) clearly labeled as
    // general — never as this-specific-university data.
    const isUsUniversity = university.country === 'United States';
    const showGenericVisa = isUsUniversity && !university.visa_info;
    const showHolisticGpaNote = isUsUniversity && (university.min_gpa === null || university.min_gpa === undefined);

    const actions = <div className="university-actions flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                onClick={() => onSave(university.id)}
                                aria-pressed={Boolean(isSaved)}
                                aria-busy={Boolean(savePendingLabel)}
                                disabled={saveDisabled || (hasAdmissionCatalog && university.admissionCatalog.status !== 'valid')}
                                className={`min-h-11 rounded-full ${isSaved ? "border-[#d6aa79] bg-[#f6e3c9]" : ""}`}
                            >
                                {savePendingLabel ? (
                                    <><LoaderCircle className="w-4 h-4 mr-2 motion-safe:animate-spin" aria-hidden="true" />{savePendingLabel}</>
                                ) : isSaved ? (
                                    <><BookmarkCheck className="w-4 h-4 mr-2 text-[#704a2d]" /> {t('university.saved')}</>
                                ) : (
                                    <><Bookmark className="w-4 h-4 mr-2" /> {t('university.save')}</>
                                )}
                            </Button>
                            {university.website && (
                                <Button asChild className="min-h-11 rounded-full bg-[#252c2f] hover:bg-[#354044] text-white">
                                    <a href={university.website} target="_blank" rel="noopener noreferrer">
                                        {t('university.visitWebsite')}
                                        <ExternalLink className="w-4 h-4 ml-2" />
                                    </a>
                                </Button>
                            )}
                        </div>;

    return (
        <article className={`university-detail-content ${hasAdmissionCatalog ? 'university-detail-programmes' : ''}`}>
                <header className="university-detail-header">
                    <div className="university-page-cover">
                        <UniversityCover university={university} size="large" heading={heading} />
                    </div>
                    {hasAdmissionCatalog && actions}
                </header>

                {heading === 'h1' && <UniversityPhoto university={university} language={language} />}

                <div className="space-y-6 w-full">
                    {!hasAdmissionCatalog && <div className="university-overview flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm text-[#55504a] mb-1">{t('university.admissionChance')}</p>
                            <LanguageReadiness university={university} ielts={userIelts} topik={userTopik} chance={chance} size="lg" />
                        </div>
                        {actions}
                    </div>}

                    {hasAdmissionCatalog && <PublishedProgrammeFacts key={`${university.id}:${programmeId || ''}`} admissionCatalog={university.admissionCatalog} language={language} initialProgrammeId={programmeId} focused />}

                    {!hasAdmissionCatalog && <>
                    {/* Key Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="p-3 bg-[#fffdf8] border border-[#e3d7c6] rounded-xl">
                                    <DollarSign className="w-4 h-4 text-[#855a36] mb-1" />
                                    <p className="text-[10px] text-[#55504a] uppercase tracking-wide">{t('university.tuition')}</p>
                                    <p className="font-semibold text-[#292823] text-base break-words">
                                        {university.tuition_min === 0 ? (
                                            t('university.free')
                                        ) : hasTuitionMin ? (
                                            legacyTuition || catalogText(language, 'notPublished')
                                        ) : (
                                            <span className="text-[#656158] italic font-normal text-sm">{catalogText(language, 'notPublished')}</span>
                                        )}
                                    </p>
                                </div>
                                <div className="p-3 bg-[#fffdf8] border border-[#e3d7c6] rounded-xl">
                                    <Building2 className="w-4 h-4 text-[#855a36] mb-1" />
                                    <p className="text-[10px] text-[#55504a] uppercase tracking-wide">{t('university.livingCost')}</p>
                                    <p className="font-semibold text-[#292823] text-base break-words">
                                        {hasLivingCost ? (
                                            <>€{university.living_cost_estimate.toLocaleString()}/{t('common.year')}</>
                                        ) : (
                                            <span className="text-[#656158] italic font-normal text-sm">{catalogText(language, 'notPublished')}</span>
                                        )}
                                    </p>
                                </div>
                                <div className="p-3 bg-[#fffdf8] border border-[#e3d7c6] rounded-xl">
                                    <TrendingUp className="w-4 h-4 text-[#855a36] mb-1" />
                                    <p className="text-[10px] text-[#55504a] uppercase tracking-wide">{t('university.minGpa')}</p>
                                    <p className="text-base">
                                        {showHolisticGpaNote ? (
                                            <span className="italic text-[#55504a] text-sm" title={catalogText(language, 'holisticNote')}>
                                                {catalogText(language, 'holistic')}
                                                <span className="ml-1 text-[10px] not-italic uppercase tracking-wide text-[#55504a] align-middle">{catalogText(language, 'noFixedGpa')}</span>
                                            </span>
                                        ) : (
                                            <EstimatedField value={university.min_gpa} field="gpa" region={university.region} format={(v) => Number(v).toFixed(1)} />
                                        )}
                                    </p>
                                </div>
                                <div className="p-3 bg-[#fffdf8] border border-[#e3d7c6] rounded-xl">
                                    <Users className="w-4 h-4 text-[#855a36] mb-1" />
                                    <p className="text-[10px] text-[#55504a] uppercase tracking-wide">{t('university.intlStudents')}</p>
                                    <p className="font-semibold text-[#292823] text-base">
                                        {university.international_students_percent ? `${university.international_students_percent}%` : <span className="text-[#656158] italic font-normal text-sm">{catalogText(language, 'notPublished')}</span>}
                                    </p>
                                </div>
                            </div>

                            {/* Total Cost Highlight */}
                            <div className="p-4 bg-[#f6e3c9]/65 border border-[#d6aa79] rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-[#704a2d] font-medium">{t('university.totalCost')}</p>
                                        <p className="text-xs text-[#625e59] mt-0.5">{t('university.totalCostDesc')}</p>
                                    </div>
                                    <p className="text-2xl font-bold text-[#5c3c1b]">
                                        {totalCost === null ? (
                                            <span className="text-base text-[#656158] italic font-normal">{catalogText(language, 'notPublished')}</span>
                                        ) : (
                                            <>€{totalCost.toLocaleString()}</>
                                        )}
                                    </p>
                                </div>
                            </div>
                    </>}

                            {/* Description */}
                            {university.description && (
                                <About className={`university-about ${heading === 'h1' ? 'university-info-section' : 'programme-disclosure'}`}>
                                    <AboutTitle className={heading === 'h1' ? 'university-info-title' : undefined}>{t('university.about')}</AboutTitle>
                                    <div>
                                        <p className="text-[#47443f] leading-relaxed" lang={catalogDescription(university.description, language) === university.description ? 'en' : language}>{catalogDescription(university.description, language)}</p>{language !== 'en' && catalogDescription(university.description, language) === university.description && <p className="text-xs text-[#55504a] mt-2">{catalogText(language, 'sourceLanguageNote')}</p>}
                                    </div>
                                </About>
                            )}

                            {!hasAdmissionCatalog && <>
                            {/* Quick Info */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-[#704a2d]" />
                                            {t('university.programs')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary" className="bg-[#f4efe6]">
                                                <Globe className="w-3 h-3 mr-1" />
                                                {catalogValue(university.language, language)}
                                            </Badge>
                                            {university.degree_levels?.map(deg => (
                                                <Badge key={catalogValue(deg, language)} variant="secondary" className="bg-[#f4e4cc] text-[#5c3c1b]">
                                                    <GraduationCap className="w-3 h-3 mr-1" />
                                                    {catalogValue(deg, language)}
                                                </Badge>
                                            ))}
                                        </div>
                                        {university.notable_programs?.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium text-[#292823] mb-2">{t('university.notablePrograms')}</p>
                                                <div className="flex flex-wrap gap-1.5 max-w-full">
                                                    {university.notable_programs.map((prog, i) => (
                                                        <Badge key={i} variant="outline" className="font-normal text-xs break-words">
                                                            {prog}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-[#704a2d]" />
                                            {t('university.languageReq')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {university.required_ielts ? (
                                            <div>
                                                <p className="text-sm text-[#55504a]">{t('university.ieltsRequired')}</p>
                                                <p className="font-semibold text-[#292823] text-lg">{university.required_ielts}+</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-sm text-[#55504a]">{t('university.ieltsRequired')}</p>
                                                <p className="text-lg"><EstimatedField value={null} field="ielts" region={university.region} unit="+" /></p>
                                            </div>
                                        )}
                                        {university.country === "South Korea" && university.topikLevel && (
                                            <div>
                                                <p className="text-sm text-[#55504a]">🇰🇷 {t('university.topikRequired')}</p>
                                                <p className="font-semibold text-[#5c3c1b] text-lg">{university.topikLevel}</p>
                                                <p className="text-xs text-[#625e59] mt-1">{t('university.forKorean')}</p>
                                            </div>
                                        )}
                                        {university.admission_requirements?.english_test && (
                                            <div>
                                                <p className="text-sm text-[#55504a]">{t('university.otherTests')}</p>
                                                <p className="font-medium text-[#292823]">{university.admission_requirements.english_test}</p>
                                            </div>
                                        )}
                                        {university.application_deadline && (
                                            <div className="pt-3 border-t">
                                                <p className="text-sm text-[#55504a]">{t('university.applicationDeadline')}</p>
                                                <p className="font-medium text-[#292823]">{university.application_deadline}</p>
                                            </div>
                                        )}
                                        {university.admission_requirements?.application_fee_eur && (
                                            <div>
                                                <p className="text-sm text-[#55504a]">{t('university.applicationFee')}</p>
                                                <p className="font-medium text-[#292823]">€{university.admission_requirements.application_fee_eur}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                            </>}

                            <Separator className="my-6" />

                            {/* Campus Life */}
                            <UniversityInfoSection expanded={heading === 'h1'} title={t('university.campusLife')} icon={Home}>
                                    {university.campus_life ? (
                                <>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Home className="w-5 h-5 text-[#704a2d]" />
                                                {t('university.campusFacilities')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <CheckCircle2 className={`w-5 h-5 ${university.campus_life.housing_available ? 'text-green-500' : 'text-[#b5aba0]'}`} />
                                                        <div>
                                                            <p className="font-medium text-[#292823]">{t('university.studentHousing')}</p>
                                                            {university.campus_life.housing_available && university.campus_life.housing_cost_monthly && (
                                                                <p className="text-sm text-[#55504a]">€{university.campus_life.housing_cost_monthly}/{t('common.month')}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <CheckCircle2 className={`w-5 h-5 ${university.campus_life.sports_facilities ? 'text-green-500' : 'text-[#b5aba0]'}`} />
                                                        <p className="font-medium text-[#292823]">{t('university.sportsFacilities')}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    {university.campus_life.student_organizations && (
                                                        <div>
                                                            <p className="text-sm text-[#55504a]">{t('university.studentOrganizations')}</p>
                                                            <p className="font-semibold text-[#292823] text-lg">{university.campus_life.student_organizations}+</p>
                                                        </div>
                                                    )}
                                                    {university.campus_life.cafeterias && (
                                                        <div>
                                                            <p className="text-sm text-[#55504a]">{t('university.campusCafeterias')}</p>
                                                            <p className="font-semibold text-[#292823] text-lg">{university.campus_life.cafeterias}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {university.campus_life.campus_description && (
                                                <p className="text-[#47443f] leading-relaxed mt-4 pt-4 border-t">
                                                    {university.campus_life.campus_description}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                    {university.campus_life.city_description && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <MapPin className="w-5 h-5 text-[#704a2d]" />
                                                    {t('university.lifeIn')} {university.city}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-[#47443f] leading-relaxed">
                                                    {university.campus_life.city_description}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                        </>
                                    ) : (
                                        <p className="text-[#55504a] text-center py-6">{t('university.campusInfoNotAvailable')}</p>
                                    )}
                                </UniversityInfoSection>

                            <Separator className="my-6" />

                            {/* Support */}
                            <UniversityInfoSection expanded={heading === 'h1'} title={t('university.support')} icon={Heart}>
                            {university.international_support ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Heart className="w-5 h-5 text-[#704a2d]" />
                                            {t('university.support')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid sm:grid-cols-2 gap-3 mb-6">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className={`w-5 h-5 ${university.international_support.international_office ? 'text-green-500' : 'text-[#b5aba0]'}`} />
                                                <p className="text-[#292823]">{t('university.internationalOffice')}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className={`w-5 h-5 ${university.international_support.orientation_program ? 'text-green-500' : 'text-[#b5aba0]'}`} />
                                                <p className="text-[#292823]">{t('university.orientationProgram')}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className={`w-5 h-5 ${university.international_support.language_courses ? 'text-green-500' : 'text-[#b5aba0]'}`} />
                                                <p className="text-[#292823]">{t('university.freeLanguageCourses')}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className={`w-5 h-5 ${university.international_support.buddy_program ? 'text-green-500' : 'text-[#b5aba0]'}`} />
                                                <p className="text-[#292823]">{t('university.buddyProgram')}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className={`w-5 h-5 ${university.international_support.career_services ? 'text-green-500' : 'text-[#b5aba0]'}`} />
                                                <p className="text-[#292823]">{t('university.careerServices')}</p>
                                            </div>
                                        </div>
                                        {university.international_support.support_description && (
                                            <div className="pt-4 border-t">
                                                <p className="text-[#47443f] leading-relaxed">
                                                    {university.international_support.support_description}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <p className="text-[#55504a] text-center py-6">{t('university.supportInfoNotAvailable')}</p>
                            )}

                            {university.contact_info && (
                                <div className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Phone className="w-5 h-5 text-[#704a2d]" />
                                            {t('university.contact')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {university.contact_info.email && (
                                            <div className="flex items-center gap-3">
                                                <Mail className="w-4 h-4 text-[#625e59]" />
                                                <a href={`mailto:${university.contact_info.email}`} className="text-[#704a2d] hover:underline">
                                                    {university.contact_info.email}
                                                </a>
                                            </div>
                                        )}
                                        {university.contact_info.phone && (
                                            <div className="flex items-center gap-3">
                                                <Phone className="w-4 h-4 text-[#625e59]" />
                                                <p className="text-[#292823]">{university.contact_info.phone}</p>
                                            </div>
                                        )}
                                        {university.contact_info.admissions_office && (
                                            <div className="flex items-start gap-3">
                                                <Building2 className="w-4 h-4 text-[#625e59] mt-1" />
                                                <p className="text-[#292823]">{university.contact_info.admissions_office}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                                </div>
                            )}
                        </UniversityInfoSection>

                    <Separator className="my-6" />

                    {/* Visa */}
                    <UniversityInfoSection expanded={heading === 'h1'} title={t('university.visa')} icon={Shield}>
                            {university.visa_info ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-[#704a2d]" />
                                            {t('university.visaWorkPermit')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                                            <div>
                                                <p className="text-sm text-[#55504a] mb-1">{t('university.visaRequired')}</p>
                                                <Badge variant={university.visa_info.visa_required ? "default" : "secondary"}>
                                                    {university.visa_info.visa_required ? t('university.yes') : t('university.no')}
                                                </Badge>
                                            </div>
                                            {university.visa_info.processing_time_weeks && (
                                                <div>
                                                    <p className="text-sm text-[#55504a] mb-1">{t('university.processingTime')}</p>
                                                    <p className="font-semibold text-[#292823]">{university.visa_info.processing_time_weeks} {t('university.weeks')}</p>
                                                </div>
                                            )}
                                            {university.visa_info.visa_cost_eur && (
                                                <div>
                                                    <p className="text-sm text-[#55504a] mb-1">{t('university.visaCost')}</p>
                                                    <p className="font-semibold text-[#292823]">€{university.visa_info.visa_cost_eur}</p>
                                                </div>
                                            )}
                                            {university.visa_info.work_allowed_hours && (
                                                <div>
                                                    <p className="text-sm text-[#55504a] mb-1">{t('university.workAllowed')}</p>
                                                    <p className="font-semibold text-[#292823]">{university.visa_info.work_allowed_hours} {t('university.hoursPerWeek')}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-6 pt-6 border-t space-y-3">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className={`w-5 h-5 ${university.visa_info.post_study_work_visa ? 'text-green-500' : 'text-[#b5aba0]'}`} />
                                                <p className="text-[#292823]">{t('university.postStudyWorkVisa')}</p>
                                            </div>
                                        </div>
                                        {university.visa_info.visa_details && (
                                            <div className="mt-6 pt-6 border-t">
                                                <p className="text-[#47443f] leading-relaxed">{university.visa_info.visa_details}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : showGenericVisa ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-[#704a2d]" />
                                            {t('university.visaWorkPermit')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Badge variant="outline" className="mb-4 text-amber-600 border-amber-200 bg-amber-50">
                                            General F-1 visa information — not specific to this university
                                        </Badge>
                                        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                                            <div>
                                                <p className="text-sm text-[#55504a] mb-1">{t('university.visaRequired')}</p>
                                                <Badge>{t('university.yes')}</Badge>
                                            </div>
                                            <div>
                                                <p className="text-sm text-[#55504a] mb-1">{t('university.workAllowed')}</p>
                                                <p className="font-semibold text-[#292823]">{US_GENERIC_VISA_INFO.work_allowed_hours} {t('university.hoursPerWeek')}</p>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-6 border-t space-y-3">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                <p className="text-[#292823]">{t('university.postStudyWorkVisa')} (OPT)</p>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-6 border-t">
                                            <p className="text-[#47443f] leading-relaxed">{US_GENERIC_VISA_INFO.visa_details}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <p className="text-[#55504a] text-center py-6">{t('university.visaInfoNotAvailable')}</p>
                            )}
                        </UniversityInfoSection>

                    {!hasAdmissionCatalog && <>
                    <Separator className="my-6" />

                    {/* Scholarships */}
                    <UniversityInfoSection expanded={heading === 'h1'} title={t('university.scholarships')} icon={Award}>
                            {university.scholarships && university.scholarships.length > 0 ? (
                                <div className="space-y-4">
                                    {university.scholarships.map((scholarship, index) => (
                                        <Card key={index}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <CardTitle className="text-lg">{scholarship.name}</CardTitle>
                                                        {scholarship.amount_eur && (
                                                            <p className="text-2xl font-bold text-[#704a2d] mt-2">
                                                                €{scholarship.amount_eur.toLocaleString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {scholarship.renewable && (
                                                        <Badge className="bg-emerald-500 text-white">{t('university.renewable')}</Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {scholarship.coverage && (
                                                    <div>
                                                        <p className="text-sm font-medium text-[#292823] mb-1">{t('university.coverage')}</p>
                                                        <p className="text-[#47443f]">{scholarship.coverage}</p>
                                                    </div>
                                                )}
                                                {scholarship.eligibility && (
                                                    <div>
                                                        <p className="text-sm font-medium text-[#292823] mb-1">{t('university.eligibility')}</p>
                                                        <p className="text-[#47443f]">{scholarship.eligibility}</p>
                                                    </div>
                                                )}
                                                {scholarship.deadline && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="w-4 h-4 text-[#625e59]" />
                                                        <span className="text-[#47443f]">{t('university.deadline')}: <strong>{scholarship.deadline}</strong></span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[#55504a] text-center py-6">{t('university.noScholarshipInfo')}</p>
                            )}
                        </UniversityInfoSection>
                    </>}
                </div>
        </article>
    );
}

export default function UniversityDetailModal({ isOpen, onClose, university, userGpa, userIelts, userTopik, isSaved, saveDisabled = false, onSave }) {
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent aria-describedby={undefined} className="max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
            <DialogTitle className="sr-only">{university?.name}</DialogTitle>
            <UniversityDetails university={university} userGpa={userGpa} userIelts={userIelts} userTopik={userTopik} isSaved={isSaved} saveDisabled={saveDisabled} onSave={onSave} />
        </DialogContent>
    </Dialog>;
}

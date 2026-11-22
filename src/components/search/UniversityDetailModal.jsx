import React from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    MapPin, Globe, GraduationCap, Bookmark, BookmarkCheck, LoaderCircle,
    ExternalLink, ArrowUpRight, Award, Calendar, Users, TrendingUp, DollarSign,
    Building2, BookOpen, Home, Heart,
    Shield, Phone, Mail, CheckCircle2, Minus, ChevronRight
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

function renderLinkedText(text) {
    if (typeof text !== 'string' || !text.includes('http')) return text;
    const parts = text.split(/(https?:\/\/[^\s)]+)/g);
    return parts.map((part, index) => {
        if (!/^https?:\/\//i.test(part)) return <React.Fragment key={index}>{part}</React.Fragment>;
        const match = part.match(/^(.*?)([.,;:!?]+)?$/);
        const rawUrl = match?.[1] || part;
        const trailing = match?.[2] || '';
        try {
            const parsed = new URL(rawUrl);
            if (!['http:', 'https:'].includes(parsed.protocol)) return <React.Fragment key={index}>{part}</React.Fragment>;
            const displayUrl = `${parsed.hostname.replace(/^www\./, '')}${parsed.pathname !== '/' ? parsed.pathname : ''}`;
            const tailStart = Math.max(0, displayUrl.length - 6);
            return (
                <React.Fragment key={index}>
                    <a
                        href={parsed.toString()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="university-inline-link"
                    >
                        {displayUrl.slice(0, tailStart)}
                        <span className="whitespace-nowrap">
                            {displayUrl.slice(tailStart)}
                            <ArrowUpRight size={13} className="university-inline-link-icon" aria-hidden="true" />
                        </span>
                    </a>
                    {trailing}
                </React.Fragment>
            );
        } catch {
            return <React.Fragment key={index}>{part}</React.Fragment>;
        }
    });
}

function FeatureStatusRow({ available, label, detail = null }) {
    return (
        <div className={`university-feature-row ${available ? 'is-available' : 'is-unavailable'}`}>
            <span className="university-feature-mark" aria-hidden="true">
                {available ? <CheckCircle2 size={16} /> : <Minus size={14} />}
            </span>
            <div className="min-w-0">
                <p className="university-feature-label">{label}</p>
                {detail && <p className="university-feature-detail">{detail}</p>}
            </div>
        </div>
    );
}

function UniversityInfoSection({ expanded, title, icon: Icon, children, className = '' }) {
    const titleContent = <><Icon className="w-5 h-5" aria-hidden="true" /><span>{title}</span></>;
    if (expanded) {
        return (
            <section className={`university-info-section university-rail-card ${className}`.trim()}>
                <h2 className="university-info-title">{titleContent}</h2>
                <div className="university-info-body">{children}</div>
            </section>
        );
    }
    return (
        <Collapsible className="university-collapsible-section">
            <CollapsibleTrigger className="university-collapsible-trigger flex items-center justify-between w-full p-4 min-h-11 rounded-2xl transition-colors">
                <h3 className="text-base font-semibold text-[#292823] flex items-center gap-2.5">{titleContent}</h3>
                <ChevronRight className="w-4 h-4 text-[#55504a] transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent className="university-collapsible-body pt-3">{children}</CollapsibleContent>
        </Collapsible>
    );
}

export function UniversityDetails({ university, userGpa, userIelts, userTopik, isSaved, saveDisabled = false, savePendingLabel = undefined, onSave, heading = 'h2', programmeId = '' }) {
    const { t, language } = useLanguage();
    const isStandalone = heading === 'h1';
    const About = isStandalone ? 'section' : 'details';
    const AboutTitle = isStandalone ? 'h2' : 'summary';

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

    // A total is only a total when both operands are real (consistent with `hasCostData` in Recommendations).
    const totalCost = hasTuitionMin && hasLivingCost
        ? university.tuition_min + university.living_cost_estimate
        : null;

    // Generic US fallbacks (2026-07-26): clearly labeled as general F-1 / holistic policy.
    const isUsUniversity = university.country === 'United States';
    const showGenericVisa = isUsUniversity && !university.visa_info;
    const showHolisticGpaNote = isUsUniversity && (university.min_gpa === null || university.min_gpa === undefined);

    const actions = (
        <div className="university-actions flex flex-wrap gap-2.5">
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
                    <><BookmarkCheck className="w-4 h-4 mr-2 text-[#704a2d]" aria-hidden="true" />{t('university.saved')}</>
                ) : (
                    <><Bookmark className="w-4 h-4 mr-2" aria-hidden="true" />{t('university.save')}</>
                )}
            </Button>
            {university.website && (
                <Button asChild className="min-h-11 rounded-full bg-[#252c2f] hover:bg-[#354044] text-white">
                    <a href={university.website} target="_blank" rel="noopener noreferrer">
                        <span>{t('university.visitWebsite')}</span>
                        <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
                    </a>
                </Button>
            )}
        </div>
    );

    const campusSection = (university.campus_life || !hasAdmissionCatalog || !isStandalone) ? (
        <UniversityInfoSection expanded={isStandalone} title={t('university.campusLife')} icon={Home}>
            {university.campus_life ? (
                <div className="space-y-4">
                    <div className="university-feature-list">
                        <FeatureStatusRow
                            available={Boolean(university.campus_life.housing_available)}
                            label={t('university.studentHousing')}
                            detail={university.campus_life.housing_available && university.campus_life.housing_cost_monthly
                                ? `€${university.campus_life.housing_cost_monthly}/${t('common.month')}`
                                : null}
                        />
                        <FeatureStatusRow
                            available={Boolean(university.campus_life.sports_facilities)}
                            label={t('university.sportsFacilities')}
                        />
                    </div>
                    {(university.campus_life.student_organizations || university.campus_life.cafeterias) && (
                        <div className="university-mini-metrics">
                            {university.campus_life.student_organizations && (
                                <div className="university-mini-metric">
                                    <span>{t('university.studentOrganizations')}</span>
                                    <strong>{university.campus_life.student_organizations}+</strong>
                                </div>
                            )}
                            {university.campus_life.cafeterias && (
                                <div className="university-mini-metric">
                                    <span>{t('university.campusCafeterias')}</span>
                                    <strong>{university.campus_life.cafeterias}</strong>
                                </div>
                            )}
                        </div>
                    )}
                    {university.campus_life.campus_description && (
                        <p className="university-rail-prose">{university.campus_life.campus_description}</p>
                    )}
                    {university.campus_life.city_description && (
                        <div className="university-sub-block">
                            <h3 className="university-sub-heading">
                                <MapPin size={15} aria-hidden="true" />
                                <span>{t('university.lifeIn')} {university.city}</span>
                            </h3>
                            <p className="university-rail-prose">{university.campus_life.city_description}</p>
                        </div>
                    )}
                </div>
            ) : (
                <p className="university-rail-empty">{t('university.campusInfoNotAvailable')}</p>
            )}
        </UniversityInfoSection>
    ) : null;

    const supportSection = (university.international_support || university.contact_info || !hasAdmissionCatalog || !isStandalone) ? (
        <UniversityInfoSection expanded={isStandalone} title={t('university.support')} icon={Heart}>
            {university.international_support ? (
                <div className="space-y-4">
                    <div className="university-feature-list">
                        <FeatureStatusRow available={Boolean(university.international_support.international_office)} label={t('university.internationalOffice')} />
                        <FeatureStatusRow available={Boolean(university.international_support.orientation_program)} label={t('university.orientationProgram')} />
                        <FeatureStatusRow available={Boolean(university.international_support.language_courses)} label={t('university.freeLanguageCourses')} />
                        <FeatureStatusRow available={Boolean(university.international_support.buddy_program)} label={t('university.buddyProgram')} />
                        <FeatureStatusRow available={Boolean(university.international_support.career_services)} label={t('university.careerServices')} />
                    </div>
                    {university.international_support.support_description && (
                        <p className="university-rail-prose university-rail-divider">{university.international_support.support_description}</p>
                    )}
                </div>
            ) : (
                <p className="university-rail-empty">{t('university.supportInfoNotAvailable')}</p>
            )}
            {university.contact_info && (
                <div className="university-sub-block">
                    <h3 className="university-sub-heading">
                        <Phone size={15} aria-hidden="true" />
                        <span>{t('university.contact')}</span>
                    </h3>
                    <div className="university-contact-list">
                        {university.contact_info.email && (
                            <a href={`mailto:${university.contact_info.email}`} className="university-inline-link">
                                <Mail size={14} className="shrink-0" aria-hidden="true" />
                                <span>{university.contact_info.email}</span>
                            </a>
                        )}
                        {university.contact_info.phone && (
                            <p className="university-contact-row">
                                <Phone size={14} className="shrink-0" aria-hidden="true" />
                                <span>{university.contact_info.phone}</span>
                            </p>
                        )}
                        {university.contact_info.admissions_office && (
                            <p className="university-contact-row">
                                <Building2 size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                                <span>{university.contact_info.admissions_office}</span>
                            </p>
                        )}
                    </div>
                </div>
            )}
        </UniversityInfoSection>
    ) : null;

    const visaSection = (university.visa_info || showGenericVisa || !hasAdmissionCatalog || !isStandalone) ? (
        <UniversityInfoSection expanded={isStandalone} title={t('university.visa')} icon={Shield}>
            {university.visa_info ? (
                <div className="space-y-4">
                    <div className="university-mini-metrics">
                        <div className="university-mini-metric">
                            <span>{t('university.visaRequired')}</span>
                            <strong>
                                <Badge variant={university.visa_info.visa_required ? "default" : "secondary"} className="university-visa-pill">
                                    {university.visa_info.visa_required ? t('university.yes') : t('university.no')}
                                </Badge>
                            </strong>
                        </div>
                        {university.visa_info.processing_time_weeks && (
                            <div className="university-mini-metric">
                                <span>{t('university.processingTime')}</span>
                                <strong>{university.visa_info.processing_time_weeks} {t('university.weeks')}</strong>
                            </div>
                        )}
                        {university.visa_info.visa_cost_eur && (
                            <div className="university-mini-metric">
                                <span>{t('university.visaCost')}</span>
                                <strong>€{university.visa_info.visa_cost_eur}</strong>
                            </div>
                        )}
                        {university.visa_info.work_allowed_hours && (
                            <div className="university-mini-metric">
                                <span>{t('university.workAllowed')}</span>
                                <strong>{university.visa_info.work_allowed_hours} {t('university.hoursPerWeek')}</strong>
                            </div>
                        )}
                    </div>
                    <FeatureStatusRow
                        available={Boolean(university.visa_info.post_study_work_visa)}
                        label={t('university.postStudyWorkVisa')}
                    />
                    {university.visa_info.visa_details && (
                        <p className="university-rail-prose university-rail-divider">{renderLinkedText(university.visa_info.visa_details)}</p>
                    )}
                </div>
            ) : showGenericVisa ? (
                <div className="space-y-4">
                    <Badge variant="outline" className="university-notice-pill">
                        General F-1 visa information — not specific to this university
                    </Badge>
                    <div className="university-mini-metrics">
                        <div className="university-mini-metric">
                            <span>{t('university.visaRequired')}</span>
                            <strong><Badge className="university-visa-pill">{t('university.yes')}</Badge></strong>
                        </div>
                        <div className="university-mini-metric">
                            <span>{t('university.workAllowed')}</span>
                            <strong>{US_GENERIC_VISA_INFO.work_allowed_hours} {t('university.hoursPerWeek')}</strong>
                        </div>
                    </div>
                    <FeatureStatusRow available label={`${t('university.postStudyWorkVisa')} (OPT)`} />
                    <p className="university-rail-prose university-rail-divider">{renderLinkedText(US_GENERIC_VISA_INFO.visa_details)}</p>
                </div>
            ) : (
                <p className="university-rail-empty">{t('university.visaInfoNotAvailable')}</p>
            )}
        </UniversityInfoSection>
    ) : null;

    const legacyOverviewAndStats = !hasAdmissionCatalog && (
        <>
            <div className="university-overview flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-[#55504a] mb-1">{t('university.admissionChance')}</p>
                    <LanguageReadiness university={university} ielts={userIelts} topik={userTopik} chance={chance} size="lg" />
                </div>
                {!isStandalone && actions}
            </div>

            <div className="university-legacy-stats grid sm:grid-cols-2 gap-3.5">
                <div className="programme-stat">
                    <dt><DollarSign size={16} aria-hidden="true" /><span>{t('university.tuition')}</span></dt>
                    <dd className="programme-value">
                        {university.tuition_min === 0 ? (
                            t('university.free')
                        ) : hasTuitionMin ? (
                            legacyTuition || catalogText(language, 'notPublished')
                        ) : (
                            <span className="programme-value-unknown">{catalogText(language, 'notPublished')}</span>
                        )}
                    </dd>
                </div>
                <div className="programme-stat">
                    <dt><Building2 size={16} aria-hidden="true" /><span>{t('university.livingCost')}</span></dt>
                    <dd className="programme-value">
                        {hasLivingCost ? (
                            <>€{university.living_cost_estimate.toLocaleString()}/{t('common.year')}</>
                        ) : (
                            <span className="programme-value-unknown">{catalogText(language, 'notPublished')}</span>
                        )}
                    </dd>
                </div>
                <div className="programme-stat">
                    <dt><TrendingUp size={16} aria-hidden="true" /><span>{t('university.minGpa')}</span></dt>
                    <dd className="programme-value">
                        {showHolisticGpaNote ? (
                            <span className="text-sm font-normal text-[#55504a]" title={catalogText(language, 'holisticNote')}>
                                {catalogText(language, 'holistic')} · {catalogText(language, 'noFixedGpa')}
                            </span>
                        ) : (
                            <EstimatedField value={university.min_gpa} field="gpa" region={university.region} format={(v) => Number(v).toFixed(1)} />
                        )}
                    </dd>
                </div>
                <div className="programme-stat">
                    <dt><Users size={16} aria-hidden="true" /><span>{t('university.intlStudents')}</span></dt>
                    <dd className="programme-value">
                        {university.international_students_percent
                            ? `${university.international_students_percent}%`
                            : <span className="programme-value-unknown">{catalogText(language, 'notPublished')}</span>}
                    </dd>
                </div>
            </div>

            <div className="university-total-cost-banner">
                <div>
                    <p className="text-sm font-semibold text-[#5c3c1b]">{t('university.totalCost')}</p>
                    <p className="text-xs text-[#55504a] mt-0.5">{t('university.totalCostDesc')}</p>
                </div>
                <p className="text-2xl font-semibold text-[#292823] tabular-nums">
                    {totalCost === null ? (
                        <span className="text-base font-normal text-[#656158]">{catalogText(language, 'notPublished')}</span>
                    ) : (
                        <>€{totalCost.toLocaleString()}</>
                    )}
                </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                <section className="university-subpanel">
                    <h3 className="university-sub-heading">
                        <BookOpen size={16} aria-hidden="true" />
                        <span>{t('university.programs')}</span>
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="secondary" className="bg-[#f4efe6] text-[#292823]">
                            <Globe className="w-3 h-3 mr-1" aria-hidden="true" />
                            {catalogValue(university.language, language)}
                        </Badge>
                        {university.degree_levels?.map(deg => (
                            <Badge key={catalogValue(deg, language)} variant="secondary" className="bg-[#f4e4cc] text-[#5c3c1b]">
                                <GraduationCap className="w-3 h-3 mr-1" aria-hidden="true" />
                                {catalogValue(deg, language)}
                            </Badge>
                        ))}
                    </div>
                    {university.notable_programs?.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs font-medium text-[#55504a] mb-2">{t('university.notablePrograms')}</p>
                            <div className="flex flex-wrap gap-1.5 max-w-full">
                                {university.notable_programs.map((prog, i) => (
                                    <Badge key={i} variant="outline" className="font-normal text-xs break-words bg-white/60">
                                        {prog}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                <section className="university-subpanel">
                    <h3 className="university-sub-heading">
                        <Globe size={16} aria-hidden="true" />
                        <span>{t('university.languageReq')}</span>
                    </h3>
                    <div className="space-y-3 mt-3">
                        <div>
                            <p className="text-xs text-[#55504a]">{t('university.ieltsRequired')}</p>
                            <p className="font-semibold text-[#292823] text-lg tabular-nums">
                                {university.required_ielts
                                    ? `${university.required_ielts}+`
                                    : <EstimatedField value={null} field="ielts" region={university.region} unit="+" />}
                            </p>
                        </div>
                        {university.country === "South Korea" && university.topikLevel && (
                            <div>
                                <p className="text-xs text-[#55504a]">{t('university.topikRequired')}</p>
                                <p className="font-semibold text-[#5c3c1b] text-base">{university.topikLevel}</p>
                                <p className="text-xs text-[#55504a] mt-0.5">{t('university.forKorean')}</p>
                            </div>
                        )}
                        {university.admission_requirements?.english_test && (
                            <div>
                                <p className="text-xs text-[#55504a]">{t('university.otherTests')}</p>
                                <p className="text-sm font-medium text-[#292823]">{university.admission_requirements.english_test}</p>
                            </div>
                        )}
                        {university.application_deadline && (
                            <div className="pt-2 border-t border-[#8f765c24]">
                                <p className="text-xs text-[#55504a]">{t('university.applicationDeadline')}</p>
                                <p className="text-sm font-medium text-[#292823]">{university.application_deadline}</p>
                            </div>
                        )}
                        {university.admission_requirements?.application_fee_eur && (
                            <div>
                                <p className="text-xs text-[#55504a]">{t('university.applicationFee')}</p>
                                <p className="text-sm font-medium text-[#292823]">€{university.admission_requirements.application_fee_eur}</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </>
    );

    const aboutSection = university.description ? (
        <About className={`university-about ${isStandalone ? 'university-info-section university-panel' : 'programme-disclosure'}`}>
            <AboutTitle className={isStandalone ? 'university-info-title' : undefined}>{t('university.about')}</AboutTitle>
            <div>
                <p className="text-[#47443f] leading-relaxed" lang={catalogDescription(university.description, language) === university.description ? 'en' : language}>
                    {catalogDescription(university.description, language)}
                </p>
                {language !== 'en' && catalogDescription(university.description, language) === university.description && (
                    <p className="text-xs text-[#55504a] mt-2">{catalogText(language, 'sourceLanguageNote')}</p>
                )}
            </div>
        </About>
    ) : null;

    const scholarshipsSection = !hasAdmissionCatalog ? (
        <UniversityInfoSection expanded={isStandalone} title={t('university.scholarships')} icon={Award} className="university-panel">
            {university.scholarships && university.scholarships.length > 0 ? (
                <div className="space-y-3">
                    {university.scholarships.map((scholarship, index) => (
                        <div key={index} className="university-subpanel space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <h3 className="text-base font-semibold text-[#292823]">{scholarship.name}</h3>
                                    {scholarship.amount_eur && (
                                        <p className="text-xl font-semibold text-[#704a2d] mt-1 tabular-nums">
                                            €{scholarship.amount_eur.toLocaleString()}
                                        </p>
                                    )}
                                </div>
                                {scholarship.renewable && (
                                    <Badge className="rounded-full bg-[#e9dfd0] text-[#5c3c1b] border border-[#d6aa79]">{t('university.renewable')}</Badge>
                                )}
                            </div>
                            {scholarship.coverage && (
                                <div>
                                    <p className="text-xs font-medium text-[#55504a]">{t('university.coverage')}</p>
                                    <p className="text-sm text-[#292823] mt-0.5">{scholarship.coverage}</p>
                                </div>
                            )}
                            {scholarship.eligibility && (
                                <div>
                                    <p className="text-xs font-medium text-[#55504a]">{t('university.eligibility')}</p>
                                    <p className="text-sm text-[#47443f] mt-0.5">{scholarship.eligibility}</p>
                                </div>
                            )}
                            {scholarship.deadline && (
                                <div className="flex items-center gap-2 text-xs text-[#55504a]">
                                    <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
                                    <span>{t('university.deadline')}: <strong className="text-[#292823]">{scholarship.deadline}</strong></span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="university-rail-empty">{t('university.noScholarshipInfo')}</p>
            )}
        </UniversityInfoSection>
    ) : null;

    if (!isStandalone) {
        return (
            <article className={`university-detail-content university-detail-embedded ${hasAdmissionCatalog ? 'university-detail-programmes' : ''}`}>
                <header className="university-detail-header">
                    <div className="university-page-cover">
                        <UniversityCover university={university} size="large" heading={heading} />
                    </div>
                    {hasAdmissionCatalog && actions}
                </header>
                <div className="space-y-6 w-full">
                    {legacyOverviewAndStats}
                    {hasAdmissionCatalog && <PublishedProgrammeFacts key={`${university.id}:${programmeId || ''}`} admissionCatalog={university.admissionCatalog} language={language} initialProgrammeId={programmeId} focused />}
                    {aboutSection}
                    {campusSection}
                    {supportSection}
                    {visaSection}
                    {scholarshipsSection}
                </div>
            </article>
        );
    }

    const railSections = [campusSection, supportSection, visaSection].filter(Boolean);

    return (
        <article className={`university-detail-content university-detail-standalone ${hasAdmissionCatalog ? 'university-detail-programmes' : ''}`}>
            <header className="university-hero">
                <div className="university-hero-main">
                    <div className="university-page-cover">
                        <UniversityCover university={university} size="large" heading={heading} />
                    </div>
                    {actions}
                </div>
                <UniversityPhoto university={university} language={language} prioritizeLoading responsivePreview />
            </header>

            <div className="university-workspace">
                <div className="university-workspace-main">
                    {hasAdmissionCatalog ? (
                        <section className="university-panel">
                            <PublishedProgrammeFacts
                                key={`${university.id}:${programmeId || ''}`}
                                admissionCatalog={university.admissionCatalog}
                                language={language}
                                initialProgrammeId={programmeId}
                                focused
                            />
                        </section>
                    ) : (
                        <section className="university-panel space-y-5">
                            {legacyOverviewAndStats}
                        </section>
                    )}
                    {aboutSection}
                    {scholarshipsSection}
                </div>

                {railSections.length > 0 && (
                    <aside className="university-workspace-rail">
                        {railSections}
                    </aside>
                )}
            </div>
        </article>
    );
}

export default function UniversityDetailModal({ isOpen, onClose, university, userGpa, userIelts, userTopik, isSaved, saveDisabled = false, onSave }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent aria-describedby={undefined} className="max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                <DialogTitle className="sr-only">{university?.name}</DialogTitle>
                <UniversityDetails university={university} userGpa={userGpa} userIelts={userIelts} userTopik={userTopik} isSaved={isSaved} saveDisabled={saveDisabled} onSave={onSave} />
            </DialogContent>
        </Dialog>
    );
}

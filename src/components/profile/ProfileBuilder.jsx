import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { catalogValue } from '@/lib/catalogCopy';

const countries = [
    "Uzbekistan", "Kazakhstan", "Kyrgyzstan", "Tajikistan", "Turkmenistan",
    "Russia", "Ukraine", "Azerbaijan", "Georgia", "Armenia",
    "India", "Pakistan", "Bangladesh", "Vietnam", "Indonesia",
    "Nigeria", "Kenya", "Ghana", "Egypt", "Morocco", "Other"
];

const languages = ["English", "German", "French", "Russian", "Mixed"];
const interests = [
    "Engineering", "Computer Science", "Business", "Medicine", "Law",
    "Arts & Design", "Natural Sciences", "Social Sciences", "Economics", "Architecture"
];

export default function ProfileBuilder({ profile, onSave, isLoading }) {
    const { t, language } = useLanguage();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        gpa: profile?.gpa || 3.0,
        english_proficiency: profile?.english_proficiency || 0,
        topikLevel: profile?.topikLevel || "Not taken",
        budget_max: profile?.budget_max || 10000,
        home_country: profile?.home_country || "",
        grade_level: profile?.grade_level || "",
        target_degree: profile?.target_degree || "Bachelor",
        preferred_languages: profile?.preferred_languages || [],
        interests: profile?.interests || []
    });

    const updateField = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const toggleArrayField = (key, value) => {
        setFormData(prev => {
            const current = prev[key] || [];
            const updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [key]: updated };
        });
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    const totalSteps = 3;

    return (
        <Card className="product-card max-w-2xl mx-auto overflow-hidden">
            <CardHeader className="product-page-hero border-0 pb-5 sm:pb-6" style={{ backgroundColor: '#f8f6f0', color: '#292823' }}>
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-[#855a36]" aria-hidden="true" />
                    <span className="text-sm font-medium text-slate-600">{t('profile.personalizedMatching')}</span>
                </div>
                <h1 className="text-2xl font-semibold">{t('profile.buildProfile')}</h1>
                <CardDescription className="text-slate-600">
                    {t('profile.buildProfileDesc')}
                </CardDescription>
                {/* Progress */}
                <div className="flex gap-2 mt-5" role="progressbar" aria-valuemin={1} aria-valuemax={totalSteps} aria-valuenow={step} aria-label={`${step} / ${totalSteps}`}>
                    {[1, 2, 3].map(s => (
                        <div
                            key={s}
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                                s <= step ? 'bg-[#855a36]' : 'bg-[#dedbd3]'
                            }`}
                            aria-hidden="true"
                        />
                    ))}
                </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-7">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            <div>
                                <h2 className="font-semibold text-slate-800 mb-4">{t('profile.academicInfo')}</h2>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label id="profile-gpa-label">{t('profile.gpaScale')}</Label>
                                        <div className="flex items-center gap-4">
                                            <Slider
                                                aria-labelledby="profile-gpa-label"
                                                value={[formData.gpa]}
                                                onValueChange={([val]) => updateField('gpa', val)}
                                                min={1.0}
                                                max={4.0}
                                                step={0.1}
                                                className="flex-1"
                                            />
                                            <span className="w-12 text-center font-semibold text-indigo-600 text-lg">
                                                {formData.gpa.toFixed(1)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            {t('profile.gpaNote')}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="profile-grade-level">{t('profile.currentGradeLevel')}</Label>
                                        <Select
                                            value={formData.grade_level}
                                            onValueChange={(val) => updateField('grade_level', val)}
                                        >
                                            <SelectTrigger id="profile-grade-level">
                                                <SelectValue placeholder={t('profile.selectGrade')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Grade 10">{t('profile.grade10')}</SelectItem>
                                                <SelectItem value="Grade 11">{t('profile.grade11')}</SelectItem>
                                                <SelectItem value="Grade 12">{t('profile.grade12')}</SelectItem>
                                                <SelectItem value="Gap Year">{t('profile.gapYear')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label id="profile-degree-label">{t('profile.targetDegree')}</Label>
                                        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="profile-degree-label">
                                            {["Bachelor", "Master", "PhD"].map(deg => (
                                                <Button
                                                    key={deg}
                                                    type="button"
                                                    aria-pressed={formData.target_degree === deg}
                                                    variant={formData.target_degree === deg ? "default" : "outline"}
                                                    className={formData.target_degree === deg ? "bg-[#292823] text-[#f8f6f0] hover:bg-[#454238]" : ""}
                                                    onClick={() => updateField('target_degree', deg)}
                                                >
                                                    {catalogValue(deg, language)}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="profile-ielts">{t('profile.englishProficiency')}</Label>
                                        <Select
                                            value={String(formData.english_proficiency)}
                                            onValueChange={(val) => updateField('english_proficiency', Number(val))}
                                        >
                                            <SelectTrigger id="profile-ielts">
                                                <SelectValue placeholder={t('profile.selectIelts')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">{t('profile.noCertificate')}</SelectItem>
                                                <SelectItem value="5.5">IELTS 5.5</SelectItem>
                                                <SelectItem value="6.0">IELTS 6.0</SelectItem>
                                                <SelectItem value="6.5">IELTS 6.5</SelectItem>
                                                <SelectItem value="7.0">IELTS 7.0+</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-slate-400">
                                            {t('profile.ieltsNote')}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="profile-topik">{t('profile.koreanProficiency')} 🇰🇷</Label>
                                        <Select
                                            value={formData.topikLevel || "Not taken"}
                                            onValueChange={(val) => updateField('topikLevel', val)}
                                        >
                                            <SelectTrigger id="profile-topik">
                                                <SelectValue placeholder={t('profile.selectTopik')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Not taken">{t('profile.notTaken')}</SelectItem>
                                                <SelectItem value="TOPIK 1">TOPIK 1</SelectItem>
                                                <SelectItem value="TOPIK 2">TOPIK 2</SelectItem>
                                                <SelectItem value="TOPIK 3">TOPIK 3</SelectItem>
                                                <SelectItem value="TOPIK 4">TOPIK 4</SelectItem>
                                                <SelectItem value="TOPIK 5">TOPIK 5</SelectItem>
                                                <SelectItem value="TOPIK 6">TOPIK 6</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-slate-400">
                                            {t('profile.topikNote')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            <div>
                                <h2 className="font-semibold text-slate-800 mb-4">{t('profile.budgetBackground')}</h2>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label id="profile-budget-label">{t('profile.maxAnnualBudget')}</Label>
                                        <div className="flex items-center gap-4">
                                            <Slider
                                                aria-labelledby="profile-budget-label"
                                                value={[formData.budget_max]}
                                                onValueChange={([val]) => updateField('budget_max', val)}
                                                min={0}
                                                max={50000}
                                                step={1000}
                                                className="flex-1"
                                            />
                                            <span className="w-20 text-center font-semibold text-indigo-600 text-lg">
                                                €{formData.budget_max.toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            {t('profile.budgetNote')}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="profile-home-country">{t('profile.homeCountry')}</Label>
                                        <Select
                                            value={formData.home_country}
                                            onValueChange={(val) => updateField('home_country', val)}
                                        >
                                            <SelectTrigger id="profile-home-country">
                                                <SelectValue placeholder={t('profile.selectCountry')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {countries.map(c => (
                                                    <SelectItem key={c} value={c}>{catalogValue(c, language)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label id="profile-languages-label">{t('profile.languagesToStudy')}</Label>
                                        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="profile-languages-label">
                                            {languages.map(lang => (
                                                <Button
                                                    key={lang}
                                                    type="button"
                                                    aria-pressed={formData.preferred_languages.includes(lang)}
                                                    variant={formData.preferred_languages.includes(lang) ? "default" : "outline"}
                                                    className={`cursor-pointer transition-all ${
                                                        formData.preferred_languages.includes(lang)
                                                            ? "bg-[#292823] text-[#f8f6f0] hover:bg-[#454238]"
                                                            : "hover:bg-slate-100"
                                                    }`}
                                                    onClick={() => toggleArrayField('preferred_languages', lang)}
                                                >
                                                    {formData.preferred_languages.includes(lang) && (
                                                        <Check aria-hidden="true" className="w-3 h-3 mr-1" />
                                                    )}
                                                    {catalogValue(lang, language)}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            <div>
                                <h2 className="font-semibold text-slate-800 mb-4">{t('profile.yourInterests')}</h2>
                                <p className="text-sm text-slate-500 mb-4">
                                    {t('profile.interestsNote')}
                                </p>

                                <div className="flex flex-wrap gap-2" role="group" aria-label={t('profile.yourInterests')}>
                                    {interests.map(interest => (
                                        <Button
                                            key={interest}
                                            type="button"
                                            aria-pressed={formData.interests.includes(interest)}
                                            variant={formData.interests.includes(interest) ? "default" : "outline"}
                                            className={`cursor-pointer transition-all py-2 px-3 ${
                                                formData.interests.includes(interest)
                                                    ? "bg-[#292823] text-[#f8f6f0] hover:bg-[#454238]"
                                                    : "hover:bg-slate-100"
                                            }`}
                                            onClick={() => toggleArrayField('interests', interest)}
                                        >
                                            {formData.interests.includes(interest) && (
                                                <Check aria-hidden="true" className="w-3 h-3 mr-1" />
                                            )}
                                            {catalogValue(interest, language)}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex justify-between mt-6 pt-5 border-t">
                    <Button
                        variant="ghost"
                        onClick={() => setStep(s => s - 1)}
                        disabled={step === 1}
                    >
                        {t('profile.back')}
                    </Button>

                    {step < totalSteps ? (
                        <Button onClick={() => setStep(s => s + 1)} className="bg-[#292823] text-[#f8f6f0] hover:bg-[#454238]">
                            {t('profile.continue')}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="bg-[#292823] text-[#f8f6f0] hover:bg-[#454238]"
                        >
                            {isLoading ? t('profile.saving') : t('profile.completeProfile')}
                            <Sparkles className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from '@/lib/apiClient';
import { invokeAI } from '@/lib/aiService';
import { 
    X, Sparkles, Lock, TrendingUp, DollarSign, Globe, 
    GraduationCap, Award, CheckCircle2, AlertCircle
} from 'lucide-react';
import ChanceIndicator from '@/components/ui/ChanceIndicator';
import { calculateChance, describeMissingChanceData } from '@/lib/matching';
import { useLanguage } from '@/lib/i18n';

export default function ComparisonModal({ universities, isOpen, onClose, onRemove, userProfile }) {
    const { language } = useLanguage();
    const [aiInsights, setAiInsights] = useState(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [showLoginGate, setShowLoginGate] = useState(false);

    useEffect(() => {
        if (isOpen && universities.length >= 2) {
            generateComparison();
        }
    }, [isOpen, universities]);

    const generateComparison = async () => {
        setIsLoadingAI(true);
        try {
            const languageInstructions = {
                en: 'Respond ONLY in English.',
                ru: 'Отвечай ТОЛЬКО на русском языке. Весь текст должен быть на русском.',
                uz: 'Faqat o\'zbek tilida javob bering. Barcha matn o\'zbek tilida bo\'lishi kerak.'
            };

            const prompt = `${languageInstructions[language]}

Compare these universities for international students. Focus on practical aspects:

${universities.map((uni, i) => `
University ${i + 1}: ${uni.name} (${uni.country})
- Tuition: €${uni.tuition_min}/year
- Min GPA: ${uni.min_gpa}
- IELTS: ${uni.required_ielts || 'Varies'}
- Language: ${uni.language}
- Scholarships: ${uni.scholarships_available ? 'Yes' : 'No'}
`).join('\n')}

Provide a brief comparison covering:
1. Cost advantage (which is most affordable)
2. Academic requirements (which is easier to get into)
3. Language of instruction
4. Scholarship opportunities
5. Overall best value

Keep it under 150 words, practical and direct.`;

            const result = await invokeAI({
                prompt: prompt,
                add_context_from_internet: false
            });

            setAiInsights(result);
        } catch (e) {
            console.error('Failed to generate comparison:', e);
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handlePersonalizedAction = async (action) => {
        try {
            const isAuth = await apiClient.auth.isAuthenticated();
            if (!isAuth || !userProfile) {
                setShowLoginGate(true);
                return;
            }
            
            // Handle personalized actions
            if (action === 'personalized') {
                generatePersonalizedComparison();
            } else if (action === 'chances') {
                calculatePersonalizedChances();
            } else if (action === 'save') {
                saveComparison();
            }
        } catch (e) {
            setShowLoginGate(true);
        }
    };

    const generatePersonalizedComparison = async () => {
        setIsLoadingAI(true);
        try {
            const languageInstructions = {
                en: 'Respond ONLY in English.',
                ru: 'Отвечай ТОЛЬКО на русском языке. Весь текст должен быть на русском.',
                uz: 'Faqat o\'zbek tilida javob bering. Barcha matn o\'zbek tilida bo\'lishi kerak.'
            };

            const prompt = `${languageInstructions[language]}

Given this student profile:
- GPA: ${userProfile.gpa}
- IELTS: ${userProfile.english_proficiency === 0 ? 'No certificate' : userProfile.english_proficiency}
- Budget: €${userProfile.budget_max}/year
- Target: ${userProfile.target_degree}
- Interests: ${userProfile.interests?.join(', ') || 'Not specified'}

Compare these universities specifically for THIS student:
${universities.map((uni, i) => `
${i + 1}. ${uni.name}
- Tuition: €${uni.tuition_min}/year
- Min GPA: ${uni.min_gpa}
- IELTS: ${uni.required_ielts || 'Varies'}
`).join('\n')}

Which university is the best match and why? Consider their qualifications, budget, and admission chances. Be direct and specific. Under 200 words.`;

            const result = await invokeAI({
                prompt: prompt,
                add_context_from_internet: false
            });

            setAiInsights(result);
        } catch (e) {
            console.error('Failed to generate personalized comparison:', e);
        } finally {
            setIsLoadingAI(false);
        }
    };

    const calculatePersonalizedChances = () => {
        // Already calculated in the comparison table
        setShowLoginGate(false);
    };

    const saveComparison = async () => {
        try {
            const user = await apiClient.auth.me();
            alert('Comparison saved! (Feature coming soon)');
        } catch (e) {
            setShowLoginGate(true);
        }
    };

    const handleLoginRedirect = () => {
        apiClient.auth.redirectToLogin();
    };

    if (universities.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <GraduationCap className="w-6 h-6 text-indigo-600" />
                        Compare Universities
                        <Badge variant="secondary" className="ml-2">{universities.length} selected</Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* AI Insights */}
                    <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                AI Comparison Insights
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoadingAI ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            ) : aiInsights ? (
                                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{aiInsights}</p>
                            ) : (
                                <p className="text-slate-500">Generating comparison...</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Personalized Actions */}
                    <div className="flex flex-wrap gap-3">
                        <Button 
                            variant="outline" 
                            onClick={() => handlePersonalizedAction('personalized')}
                            className="gap-2"
                        >
                            {!userProfile ? <Lock className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                            Which is better for me?
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => handlePersonalizedAction('chances')}
                            className="gap-2"
                        >
                            {!userProfile ? <Lock className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                            Calculate my chances
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => handlePersonalizedAction('save')}
                            className="gap-2"
                        >
                            <Lock className="w-4 h-4" />
                            Save comparison
                        </Button>
                    </div>

                    {/* Login Gate Message */}
                    {showLoginGate && (
                        <Card className="bg-indigo-50 border-indigo-200">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Lock className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-800 mb-1">
                                            Create a free profile to get personalized insights
                                        </h4>
                                        <p className="text-sm text-slate-600 mb-4">
                                            Get a personalized comparison based on your GPA, IELTS, budget and goals. It takes less than 2 minutes.
                                        </p>
                                        <div className="flex gap-2">
                                            <Button onClick={handleLoginRedirect} className="bg-indigo-600 hover:bg-indigo-700">
                                                Create Free Profile
                                            </Button>
                                            <Button variant="ghost" onClick={() => setShowLoginGate(false)}>
                                                Maybe later
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Comparison Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-200">
                                    <th className="text-left p-4 font-semibold text-slate-700 bg-slate-50">Criteria</th>
                                    {universities.map((uni, i) => (
                                        <th key={i} className="p-4 bg-slate-50 relative">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-2 right-2 h-6 w-6"
                                                onClick={() => onRemove(uni.id)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                            <div className="pr-8">
                                                <p className="font-semibold text-slate-800 text-sm">{uni.name}</p>
                                                <p className="text-xs text-slate-500">{uni.city}, {uni.country}</p>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Tuition */}
                                <tr className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-700 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-slate-400" />
                                        Tuition/year
                                    </td>
                                    {universities.map((uni, i) => (
                                        <td key={i} className="p-4 text-center">
                                            <p className="font-semibold text-slate-800">
                                                {uni.tuition_min === 0 ? (
                                                    <span className="text-emerald-600">Free</span>
                                                ) : uni.tuition_min === null || uni.tuition_min === undefined ? (
                                                    <span className="text-slate-400 italic font-normal text-sm">Not published</span>
                                                ) : (
                                                    `€${uni.tuition_min.toLocaleString()}`
                                                )}
                                            </p>
                                        </td>
                                    ))}
                                </tr>

                                {/* Min GPA */}
                                <tr className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-700 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-slate-400" />
                                        Min GPA
                                    </td>
                                    {universities.map((uni, i) => (
                                        <td key={i} className="p-4 text-center">
                                            <p className="font-semibold text-slate-800">
                                                {uni.min_gpa === null || uni.min_gpa === undefined ? (
                                                    <span className="text-slate-400 italic font-normal text-sm">Not published</span>
                                                ) : (
                                                    uni.min_gpa.toFixed(1)
                                                )}
                                            </p>
                                        </td>
                                    ))}
                                </tr>

                                {/* IELTS */}
                                <tr className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-700 flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-slate-400" />
                                        IELTS
                                    </td>
                                    {universities.map((uni, i) => (
                                        <td key={i} className="p-4 text-center">
                                            <p className="font-semibold text-slate-800">
                                                {uni.required_ielts ? `${uni.required_ielts}+` : <span className="text-slate-400">Varies</span>}
                                            </p>
                                        </td>
                                    ))}
                                </tr>

                                {/* Language */}
                                <tr className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-700 flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-slate-400" />
                                        Language
                                    </td>
                                    {universities.map((uni, i) => (
                                        <td key={i} className="p-4 text-center">
                                            <Badge variant="secondary">{uni.language}</Badge>
                                        </td>
                                    ))}
                                </tr>

                                {/* Scholarships */}
                                <tr className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="p-4 font-medium text-slate-700 flex items-center gap-2">
                                        <Award className="w-4 h-4 text-slate-400" />
                                        Scholarships
                                    </td>
                                    {universities.map((uni, i) => (
                                        <td key={i} className="p-4 text-center">
                                            {uni.scholarships_available ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-slate-300 mx-auto" />
                                            )}
                                        </td>
                                    ))}
                                </tr>

                                {/* Your Admission Chance (if profile exists) */}
                                {userProfile && (
                                    <tr className="border-b border-slate-100 hover:bg-slate-50 bg-indigo-50/50">
                                        <td className="p-4 font-medium text-slate-700 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-indigo-600" />
                                            Your Chance
                                        </td>
                                        {universities.map((uni, i) => {
                                            // Shared scoring, so the tray cannot disagree with
                                            // the card it was opened from. Returns 'unknown'
                                            // when the row has no published GPA to compare.
                                            const chance = calculateChance(uni, userProfile.gpa, userProfile.english_proficiency, userProfile.topikLevel);

                                            return (
                                                <td key={i} className="p-4 text-center">
                                                    <div className="flex justify-center">
                                                        <ChanceIndicator chance={chance} reason={describeMissingChanceData(uni)?.note} size="sm" />
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

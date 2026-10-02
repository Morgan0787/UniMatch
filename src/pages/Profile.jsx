import React, { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    User, GraduationCap, Bookmark, Settings, Search, 
    MapPin, Globe, Trash2, ExternalLink, Sparkles, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import ProfileBuilder from '@/components/profile/ProfileBuilder';
import ChanceIndicator from '@/components/ui/ChanceIndicator';
import { useLanguage } from '@/lib/i18n';
import { calculateChance, describeMissingChanceData } from '@/lib/matching';

export default function Profile() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const [showProfileBuilder, setShowProfileBuilder] = useState(false);

    // Check auth
    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => apiClient.auth.me(),
    });

    // Get student profile
    const { data: profiles = [], isLoading: profileLoading } = useQuery({
        queryKey: ['studentProfile', user?.email],
        queryFn: () => apiClient.entities.StudentProfile.filter({ created_by: user?.email }),
        enabled: !!user?.email,
    });

    const profile = profiles[0];

    // Get saved universities
    const { data: universities = [] } = useQuery({
        queryKey: ['universities'],
        queryFn: () => apiClient.entities.University.list(),
    });

    const savedUniversities = universities.filter(uni => 
        profile?.saved_universities?.includes(uni.id)
    );

    // Mutations
    const saveProfileMutation = useMutation({
        mutationFn: async (data) => {
            if (profile) {
                return apiClient.entities.StudentProfile.update(profile.id, data);
            } else {
                return apiClient.entities.StudentProfile.create(data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
            setShowProfileBuilder(false);
            toast.success('Profile saved successfully!');
        },
    });

    const removeSavedMutation = useMutation({
        mutationFn: async (universityId) => {
            const newSaved = (profile?.saved_universities || []).filter(id => id !== universityId);
            return apiClient.entities.StudentProfile.update(profile.id, { saved_universities: newSaved });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
        },
    });

    if (userLoading || profileLoading) {
        return (
            <div className="min-h-screen bg-slate-50 p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-40 rounded-2xl" />
                    <Skeleton className="h-80 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full text-center p-8">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('profile.signInRequired')}</h2>
                    <p className="text-slate-600 mb-6">
                        {t('profile.createAccount')}
                    </p>
                    <Button onClick={() => apiClient.auth.redirectToLogin()} className="bg-indigo-600 hover:bg-indigo-700">
                        {t('profile.signUp')}
                    </Button>
                </Card>
            </div>
        );
    }

    if (!profile || showProfileBuilder) {
        return (
            <div className="min-h-screen bg-slate-50 py-12 px-6">
                <ProfileBuilder 
                    profile={profile}
                    onSave={(data) => saveProfileMutation.mutate(data)}
                    isLoading={saveProfileMutation.isPending}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-2xl font-bold">
                                {user.full_name?.[0] || user.email[0].toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{user.full_name || t('profile.student')}</h1>
                                <p className="text-indigo-100">{user.email}</p>
                                <Badge className="mt-2 bg-white/20 text-white border-0">
                                    {profile.grade_level || t('profile.student')} • {profile.home_country || t('profile.unknown')}
                                </Badge>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            className="text-white hover:bg-white/20"
                            onClick={() => setShowProfileBuilder(true)}
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            {t('profile.editProfile')}
                        </Button>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                            <p className="text-2xl sm:text-3xl font-bold">{profile.gpa?.toFixed(1) || '-'}</p>
                            <p className="text-indigo-100 text-xs sm:text-sm">{t('profile.yourGpa')}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                            <p className="text-2xl sm:text-3xl font-bold">
                                {profile.english_proficiency === 0 ? '-' : profile.english_proficiency?.toFixed(1)}
                            </p>
                            <p className="text-indigo-100 text-xs sm:text-sm">{t('profile.ielts')}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                            <p className="text-2xl sm:text-3xl font-bold">€{profile.budget_max?.toLocaleString() || '-'}</p>
                            <p className="text-indigo-100 text-xs sm:text-sm">{t('profile.maxBudget')}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                            <p className="text-2xl sm:text-3xl font-bold">{savedUniversities.length}</p>
                            <p className="text-indigo-100 text-xs sm:text-sm">{t('profile.savedUnis')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {/* Essay Tools Card */}
                <Card className="mb-6 bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-100">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                                    {t('profile.essayCoach')}
                                    <Badge variant="secondary" className="text-xs">{t('profile.usesAiCredits')}</Badge>
                                </h3>
                                <p className="text-sm text-slate-600 mb-3">
                                    {t('profile.essayDesc')}
                                </p>
                                <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                                    <Link to={createPageUrl("EssayChecker")}>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        {t('profile.openEssay')}
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Tabs defaultValue="saved" className="space-y-6">
                    <TabsList className="bg-white border">
                        <TabsTrigger value="saved" className="gap-2">
                            <Bookmark className="w-4 h-4" />
                            {t('profile.savedUniversities')}
                        </TabsTrigger>
                        <TabsTrigger value="profile" className="gap-2">
                            <User className="w-4 h-4" />
                            {t('profile.myProfile')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="saved">
                        {savedUniversities.length === 0 ? (
                            <Card className="text-center p-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bookmark className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-2">{t('profile.noSaved')}</h3>
                                <p className="text-slate-500 mb-6">
                                    {t('profile.startExploring')}
                                </p>
                                <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                                    <Link to={createPageUrl("Search")}>
                                        <Search className="w-4 h-4 mr-2" />
                                        {t('profile.browse')}
                                    </Link>
                                </Button>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {savedUniversities.map(uni => (
                                    <Card key={uni.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-6 p-6">
                                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <GraduationCap className="w-8 h-8 text-indigo-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-slate-800 truncate">{uni.name}</h3>
                                                <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    <span>{uni.city}, {uni.country}</span>
                                                    <span className="mx-2">•</span>
                                                    <Globe className="w-3.5 h-3.5" />
                                                    <span>{uni.language}</span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <ChanceIndicator chance={calculateChance(uni, profile?.gpa, profile?.english_proficiency || 0, profile?.topikLevel || "Not taken")} reason={describeMissingChanceData(uni)?.note} size="sm" />
                                                    <span className="text-sm text-slate-600">
                                                        {uni.tuition_min === 0 ? (
                                                            <span className="text-emerald-600 font-medium">{t('profile.freeTuition')}</span>
                                                        ) : uni.tuition_min === null || uni.tuition_min === undefined ? (
                                                            // A NULL tuition must not render as a bare "€/year":
                                                            // that reads as a near-zero price, which is the same lie
                                                            // as "Free". Same wording as the comparison table.
                                                            <span className="text-slate-400 italic font-normal text-sm">Not published</span>
                                                        ) : (
                                                            <>€{uni.tuition_min.toLocaleString()}/{t('common.year')}</>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {uni.website && (
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={uni.website} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    className="text-slate-400 hover:text-red-500"
                                                    onClick={() => removeSavedMutation.mutate(uni.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="profile">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-600" />
                                    {t('profile.profileDetails')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm text-slate-500">{t('profile.gpa')}</p>
                                        <p className="font-semibold text-slate-800 text-lg">{profile.gpa?.toFixed(1) || t('profile.notSet')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">{t('profile.englishProficiency')}</p>
                                        <p className="font-semibold text-slate-800 text-lg">
                                            {profile.english_proficiency === 0 ? t('profile.noCertificate') : profile.english_proficiency?.toFixed(1) || t('profile.notSet')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">{t('profile.koreanProficiency')} 🇰🇷</p>
                                        <p className="font-semibold text-slate-800 text-lg">
                                            {profile.topikLevel || t('profile.notTaken')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">{t('profile.maximumBudget')}</p>
                                        <p className="font-semibold text-slate-800 text-lg">€{profile.budget_max?.toLocaleString() || t('profile.notSet')}/{t('common.year')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">{t('profile.homeCountry')}</p>
                                        <p className="font-semibold text-slate-800 text-lg">{profile.home_country || t('profile.notSet')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">{t('profile.gradeLevel')}</p>
                                        <p className="font-semibold text-slate-800 text-lg">{profile.grade_level || t('profile.notSet')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">{t('profile.targetDegree')}</p>
                                        <p className="font-semibold text-slate-800 text-lg">{profile.target_degree || t('profile.notSet')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">{t('profile.studyLanguages')}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {profile.preferred_languages?.length > 0 ? (
                                                profile.preferred_languages.map(lang => (
                                                    <Badge key={lang} variant="secondary">{lang}</Badge>
                                                ))
                                            ) : (
                                                <span className="text-slate-400">{t('profile.notSet')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {profile.interests?.length > 0 && (
                                    <div>
                                        <p className="text-sm text-slate-500 mb-2">{t('profile.interests')}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.interests.map(interest => (
                                                <Badge key={interest} className="bg-indigo-100 text-indigo-700 border-0">
                                                    {interest}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <Button 
                                    variant="outline" 
                                    onClick={() => setShowProfileBuilder(true)}
                                    className="mt-4"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    {t('profile.updateProfile')}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
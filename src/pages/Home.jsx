import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Search, Globe2, CheckCircle2, Star, TrendingUp, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import { useLanguage } from '@/lib/i18n';
import UniMatchHero from '@/components/home/UniMatchHero';

export default function Home() {
    const { t } = useLanguage();
    const features = [
        { icon: Search, title: t('home.featureSearch'), description: t('home.featureSearchDesc') },
        { icon: TrendingUp, title: t('home.featureChance'), description: t('home.featureChanceDesc') },
        { icon: Globe2, title: t('home.featureUniversities'), description: t('home.featureUniversitiesDesc') },
        { icon: Heart, title: t('home.featureMatches'), description: t('home.featureMatchesDesc') }
    ];
    const stats = [
        { value: "400+", label: t('home.statsUniversities') },
        { value: "50+", label: t('home.statsCountries') },
        { value: "€0", label: t('home.statsFreeOptions') },
        { value: "24/7", label: t('home.statsAccess') }
    ];
    const testimonials = [
        { name: "Aziza M.", country: "Uzbekistan", text: "I thought I could only afford expensive US universities. This platform showed me free options in Germany I never knew existed!", university: "TU Munich" },
        { name: "Rustam K.", country: "Kazakhstan", text: "The chance calculator helped me focus on universities where I actually had a shot. Saved months of research.", university: "Charles University" }
    ];
    const affordablePoints = [t('home.affordablePoint1'), t('home.affordablePoint2'), t('home.affordablePoint3'), t('home.affordablePoint4')];
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <OnboardingTour />
            <UniMatchHero />
            <section id="unimatch-after-hero" className="py-12 bg-white border-y border-slate-100"><div className="max-w-6xl mx-auto px-4 sm:px-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-8">{stats.map((stat, i) => (<motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center"><p className="text-3xl md:text-4xl font-bold text-indigo-600">{stat.value}</p><p className="text-slate-500 mt-1">{stat.label}</p></motion.div>))}</div></div></section>
            <section className="py-20 md:py-28"><div className="max-w-6xl mx-auto px-4 sm:px-6"><div className="text-center mb-16"><Badge className="mb-4 bg-violet-100 text-violet-700 border-0">{t('home.howItWorks')}</Badge><h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t('home.howItWorksTitle')}</h2><p className="text-slate-600 max-w-2xl mx-auto">{t('home.howItWorksSubtitle')}</p></div><div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">{features.map((feature, i) => (<motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}><Card className="p-6 h-full border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 bg-white"><div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-4"><feature.icon className="w-6 h-6 text-indigo-600" /></div><h3 className="font-semibold text-slate-800 mb-2">{feature.title}</h3><p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p></Card></motion.div>))}</div></div></section>
            <section className="py-20 bg-gradient-to-br from-indigo-600 to-violet-700 text-white relative overflow-hidden"><div className="absolute inset-0 opacity-10"><div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" /><div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-3xl" /></div><div className="max-w-6xl mx-auto px-4 sm:px-6 relative"><div className="grid md:grid-cols-2 gap-12 items-center"><div><Badge className="mb-6 bg-white/20 text-white border-0"><Star className="w-3.5 h-3.5 mr-1.5" />{t('home.hiddenGems')}</Badge><h2 className="text-3xl md:text-4xl font-bold mb-6">{t('home.affordableTitle')}</h2><p className="text-indigo-100 text-lg leading-relaxed mb-8">{t('home.affordableSubtitle')}</p><div className="space-y-3">{affordablePoints.map((item, i) => (<div key={i} className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" /><span className="text-indigo-50">{item}</span></div>))}</div></div><div className="grid grid-cols-2 gap-4"><Card className="p-6 bg-white/10 backdrop-blur border-white/20 text-white"><GraduationCap className="w-8 h-8 mb-4 text-indigo-200" /><p className="text-3xl font-bold">€0</p><p className="text-indigo-200 text-sm">{t('home.germanPublicUnis')}</p></Card><Card className="p-6 bg-white/10 backdrop-blur border-white/20 text-white mt-8"><Globe2 className="w-8 h-8 mb-4 text-indigo-200" /><p className="text-3xl font-bold">50+</p><p className="text-indigo-200 text-sm">{t('home.countriesAvailable')}</p></Card><Card className="p-6 bg-white/10 backdrop-blur border-white/20 text-white"><TrendingUp className="w-8 h-8 mb-4 text-indigo-200" /><p className="text-3xl font-bold">85%</p><p className="text-indigo-200 text-sm">{t('home.findAMatch')}</p></Card><Card className="p-6 bg-white/10 backdrop-blur border-white/20 text-white mt-8"><Heart className="w-8 h-8 mb-4 text-indigo-200" /><p className="text-3xl font-bold">{t('home.freeToUse')}</p><p className="text-indigo-200 text-sm">{t('home.platformAccess')}</p></Card></div></div></div></section>
            <section className="py-20 md:py-28 bg-slate-50"><div className="max-w-6xl mx-auto px-4 sm:px-6"><div className="text-center mb-16"><Badge className="mb-4 bg-emerald-100 text-emerald-700 border-0">{t('home.successStories')}</Badge><h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t('home.testimonialTitle')}</h2></div><div className="grid md:grid-cols-2 gap-8">{testimonials.map((testimonial, i) => (<motion.div key={testimonial.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}><Card className="p-8 h-full bg-white border-slate-100 hover:shadow-lg transition-all"><div className="flex gap-1 mb-4">{[1,2,3,4,5].map(s => (<Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />))}</div><p className="text-slate-600 leading-relaxed mb-6 text-lg">"{testimonial.text}"</p><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center text-white font-semibold">{testimonial.name[0]}</div><div><p className="font-semibold text-slate-800">{testimonial.name}</p><p className="text-sm text-slate-500">{testimonial.country} → {testimonial.university}</p></div></div></Card></motion.div>))}</div></div></section>
            <section className="py-20"><div className="max-w-4xl mx-auto px-4 sm:px-6 text-center"><h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">{t('home.ctaTitle')}</h2><p className="text-slate-600 text-lg mb-10 max-w-2xl mx-auto">{t('home.ctaSubtitle')}</p><Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-lg px-10 py-6 rounded-xl shadow-lg shadow-indigo-200"><Link to={createPageUrl("Search")}><Search className="w-5 h-5 mr-2" />{t('home.startYourSearch')}</Link></Button></div></section>
        </div>
    );
}

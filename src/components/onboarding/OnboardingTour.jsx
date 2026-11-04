import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Search, Sparkles, MessageSquarePlus, Bookmark, User, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const TOUR_STEPS = [
    {
        title: "Welcome to UniMatch! 🎓",
        description: "Let's take a quick tour to help you find your perfect university abroad. This will only take a minute!",
        icon: Sparkles,
        color: "text-indigo-600"
    },
    {
        title: "Complete Your Profile",
        description: "First, tell us about your GPA, IELTS score, budget, and preferred countries. This helps us show you the most relevant universities and calculate your admission chances.",
        icon: User,
        color: "text-violet-600",
        action: { label: "Go to Profile", link: "Profile" }
    },
    {
        title: "Search & Filter Universities",
        description: "Use our powerful search to find universities by country, budget, language, degree level, and more. We'll show you universities where you have the best chances!",
        icon: Search,
        color: "text-blue-600"
    },
    {
        title: "Get Personalized Recommendations",
        description: "Based on your profile, we'll recommend universities that match your preferences and qualifications. Check the Recommendations page for your best matches!",
        icon: Sparkles,
        color: "text-amber-600",
        action: { label: "View Recommendations", link: "Recommendations" }
    },
    {
        title: "Save & Compare Universities",
        description: "Bookmark universities you like and add them to comparison to see detailed side-by-side analysis. This helps you make the best decision!",
        icon: Bookmark,
        color: "text-emerald-600"
    },
    {
        title: "Share Your Feedback",
        description: "See something we can improve? Use the floating feedback button (bottom-right corner) to send us suggestions, report bugs, or share your thoughts!",
        icon: MessageSquarePlus,
        color: "text-rose-600"
    }
];

export default function OnboardingTour() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Check if user has seen the tour
        const hasSeenTour = localStorage.getItem('hasSeenOnboarding');
        if (!hasSeenTour) {
            // Small delay before showing
            setTimeout(() => setIsOpen(true), 1000);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('hasSeenOnboarding', 'true');
    };

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const handleSkip = () => {
        handleClose();
    };

    const step = TOUR_STEPS[currentStep];
    const Icon = step.icon;
    const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-lg">
                <button
                    onClick={handleSkip}
                    className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                    <X className="h-4 w-4" />
                </button>

                <DialogHeader>
                    <div className="flex items-center justify-center mb-4">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center`}>
                            <Icon className={`w-8 h-8 ${step.color}`} />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-xl">{step.title}</DialogTitle>
                </DialogHeader>

                <div className="py-6">
                    <p className="text-slate-600 text-center leading-relaxed">
                        {step.description}
                    </p>

                    {step.action && (
                        <div className="mt-6 flex justify-center">
                            <Button asChild variant="outline" className="gap-2">
                                <Link to={createPageUrl(step.action.link)} onClick={handleClose}>
                                    {step.action.label}
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>Step {currentStep + 1} of {TOUR_STEPS.length}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    <DialogFooter className="flex-row gap-2 sm:justify-between">
                        <Button variant="ghost" onClick={handleSkip}>
                            Skip Tour
                        </Button>
                        <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700">
                            {currentStep < TOUR_STEPS.length - 1 ? "Next" : "Get Started"}
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
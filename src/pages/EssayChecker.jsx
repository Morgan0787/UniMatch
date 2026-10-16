import React, { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { invokeAI } from '@/lib/aiService';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
    Sparkles, FileText, Lightbulb, Send, Loader2, 
    CheckCircle2, BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import FeedbackPanel from '@/components/essay/FeedbackPanel';
import BrainstormPanel from '@/components/essay/BrainstormPanel';

export default function EssayChecker() {
    const [essay, setEssay] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('write');

    // Fetch user profile for brainstorming context
    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => apiClient.auth.me(),
    });

    const { data: profiles = [] } = useQuery({
        queryKey: ['studentProfile', user?.email],
        queryFn: () => apiClient.entities.StudentProfile.filter({ created_by: user?.email }),
        enabled: !!user?.email,
    });

    const profile = profiles[0];

    const analyzeEssay = async () => {
        if (!essay.trim()) {
            toast.error('Please write something first');
            return;
        }

        if (essay.length < 50) {
            toast.error('Essay is too short. Please write at least 50 characters.');
            return;
        }

        setIsAnalyzing(true);
        try {
            const result = await invokeAI({
                prompt: `You are an expert university admissions essay consultant. Analyze the following university application essay and provide detailed, constructive feedback.

Essay:
"""
${essay}
"""

Provide a comprehensive analysis with the following structure:
1. Overall Score (1-10)
2. Strengths (list 3-4 specific strong points)
3. Clarity Score (1-10 with brief explanation)
4. Grammar Issues (list specific issues found, or state "No major issues")
5. Tone Assessment (describe the tone and whether it's appropriate for university applications)
6. Specific Suggestions (provide 4-6 actionable suggestions for improvement)
7. Revised Sentences (pick 2-3 sentences that could be improved and show how to rewrite them)

Be encouraging but honest. Focus on helping the student tell their authentic story effectively.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        overall_score: { type: "number" },
                        strengths: { 
                            type: "array",
                            items: { type: "string" }
                        },
                        clarity_score: { type: "number" },
                        clarity_explanation: { type: "string" },
                        grammar_issues: {
                            type: "array",
                            items: { type: "string" }
                        },
                        tone_assessment: { type: "string" },
                        suggestions: {
                            type: "array",
                            items: { type: "string" }
                        },
                        revised_sentences: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    original: { type: "string" },
                                    improved: { type: "string" }
                                }
                            }
                        }
                    }
                }
            });

            setFeedback(result);
            setActiveTab('feedback');
            toast.success('Analysis complete!');
        } catch (error) {
            toast.error('Failed to analyze essay. Please try again.');
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const wordCount = essay.trim().split(/\s+/).filter(w => w.length > 0).length;
    const charCount = essay.length;

    return (
        <div className="essay-page min-h-screen bg-slate-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">AI Essay Coach</h1>
                            <p className="text-slate-500">Get instant feedback on your university application essays</p>
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-white border">
                        <TabsTrigger value="write" className="gap-2">
                            <FileText className="w-4 h-4" />
                            Write Essay
                        </TabsTrigger>
                        <TabsTrigger value="feedback" className="gap-2" disabled={!feedback}>
                            <CheckCircle2 className="w-4 h-4" />
                            Feedback
                        </TabsTrigger>
                        <TabsTrigger value="brainstorm" className="gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Brainstorm Ideas
                        </TabsTrigger>
                    </TabsList>

                    {/* Write Tab */}
                    <TabsContent value="write">
                        <div className="grid lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Your Essay</CardTitle>
                                        <CardDescription>
                                            Write or paste your university application essay below
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Textarea
                                            value={essay}
                                            onChange={(e) => setEssay(e.target.value)}
                                            placeholder="Start writing your essay here...&#10;&#10;Example: 'Growing up in Tashkent, I always wondered what lay beyond the horizon...'"
                                            className="min-h-[400px] text-base leading-relaxed"
                                        />
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-4 text-sm text-slate-500">
                                                <span>{wordCount} words</span>
                                                <span>•</span>
                                                <span>{charCount} characters</span>
                                            </div>
                                            <Button 
                                                onClick={analyzeEssay}
                                                disabled={isAnalyzing || !essay.trim()}
                                                className="bg-indigo-600 hover:bg-indigo-700"
                                            >
                                                {isAnalyzing ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Analyzing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4 mr-2" />
                                                        Analyze Essay
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Tips Sidebar */}
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <BookOpen className="w-5 h-5 text-indigo-600" />
                                            Writing Tips
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        <div className="flex gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-slate-600">Be authentic and tell your unique story</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-slate-600">Use specific examples and anecdotes</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-slate-600">Show growth and reflection</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-slate-600">Keep it clear and concise</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-slate-600">Avoid clichés and generic statements</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-slate-600">Proofread multiple times</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100">
                                    <CardContent className="pt-6">
                                        <Lightbulb className="w-8 h-8 text-indigo-600 mb-3" />
                                        <p className="text-sm text-slate-700 font-medium mb-2">Need inspiration?</p>
                                        <p className="text-xs text-slate-600 mb-3">
                                            Check out the Brainstorm Ideas tab for personalized essay topics and prompts
                                        </p>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setActiveTab('brainstorm')}
                                            className="w-full"
                                        >
                                            Get Ideas
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Feedback Tab */}
                    <TabsContent value="feedback">
                        {feedback ? (
                            <FeedbackPanel feedback={feedback} essay={essay} />
                        ) : (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500">Write and analyze an essay to see feedback here</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Brainstorm Tab */}
                    <TabsContent value="brainstorm">
                        <BrainstormPanel profile={profile} user={user} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
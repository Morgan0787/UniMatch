import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Mail, Globe, Calendar, AlertCircle, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminFeedback() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const currentUser = await apiClient.auth.me();
                setUser(currentUser);
                setIsAdmin(currentUser.role === 'admin');
            } catch (e) {
                setUser(null);
                setIsAdmin(false);
            }
        };
        checkAuth();
    }, []);

    const { data: feedbackList = [], isLoading } = useQuery({
        queryKey: ['user-feedback'],
        queryFn: () => apiClient.entities.UserFeedback.list('-created_date', 100),
        enabled: isAdmin,
    });

    // Not authorized
    if (!isAdmin && !isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full">
                    <CardHeader>
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-600 text-center">
                            This page is only accessible to administrators.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const getTypeColor = (type) => {
        switch(type) {
            case 'Suggestion':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Bug / Problem':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'General Feedback':
                return 'bg-slate-100 text-slate-700 border-slate-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800">User Feedback</h1>
                    </div>
                    <p className="text-slate-600">
                        View all feedback submitted by users
                    </p>
                </div>
            </div>

            {/* Feedback List */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <Card key={i}>
                                <CardContent className="p-6">
                                    <Skeleton className="h-6 w-1/4 mb-4" />
                                    <Skeleton className="h-20 w-full mb-3" />
                                    <Skeleton className="h-4 w-1/3" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : feedbackList.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">No feedback yet</h3>
                            <p className="text-slate-500">
                                User feedback will appear here once submitted
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {feedbackList.map((feedback) => (
                            <Card key={feedback.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <Badge className={`${getTypeColor(feedback.feedback_type)} border`}>
                                            {feedback.feedback_type}
                                        </Badge>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                                {format(new Date(feedback.created_date), 'MMM d, yyyy HH:mm')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                                        <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                                            {feedback.message}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                        {feedback.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-slate-400" />
                                                <a 
                                                    href={`mailto:${feedback.email}`} 
                                                    className="text-indigo-600 hover:underline"
                                                >
                                                    {feedback.email}
                                                </a>
                                            </div>
                                        )}
                                        {feedback.page_url && (
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-slate-400" />
                                                <a 
                                                    href={feedback.page_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:underline truncate max-w-xs"
                                                >
                                                    {feedback.page_url.replace(/^https?:\/\//, '')}
                                                </a>
                                            </div>
                                        )}
                                        {!feedback.email && (
                                            <div className="flex items-center gap-2 text-slate-400 italic">
                                                <Mail className="w-4 h-4" />
                                                <span>No email provided</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquarePlus, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n';
import { feedbackCopy } from '@/lib/feedbackCopy';

export default function FeedbackButton() {
    const { language } = useLanguage();
    const c = feedbackCopy[language] || feedbackCopy.en;
    const [isOpen, setIsOpen] = useState(false);
    const [feedbackType, setFeedbackType] = useState('Suggestion');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const submitLock = useRef(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitLock.current) return;
        if (!message.trim()) {
            toast.error(c.empty);
            return;
        }
        submitLock.current = true;
        setIsSubmitting(true);
        try {
            await apiClient.entities.UserFeedback.create({ feedback_type: feedbackType, message, email, page_url: window.location.pathname });
            setShowSuccess(true);
            setTimeout(() => {
                setMessage('');
                setEmail('');
                setFeedbackType('Suggestion');
                setShowSuccess(false);
                setIsOpen(false);
            }, 2000);
        } catch {
            toast.error(c.error);
        } finally {
            submitLock.current = false;
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Button aria-label={c.title} onClick={() => setIsOpen(true)} className="product-feedback-trigger fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300" size="icon"><MessageSquarePlus className="w-6 h-6" /></Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><MessageSquarePlus className="w-5 h-5 text-indigo-600" />{c.title}</DialogTitle></DialogHeader>
                    {showSuccess ? (
                        <div className="py-8 text-center"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8 text-emerald-600" /></div><h3 className="text-lg font-semibold text-slate-800 mb-2">{c.thanks}</h3><p className="text-slate-600">{c.sent}</p></div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2"><Label htmlFor="feedback-type">{c.type}</Label><Select value={feedbackType} onValueChange={setFeedbackType}><SelectTrigger id="feedback-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Suggestion">{c.suggestion}</SelectItem><SelectItem value="Bug / Problem">{c.bug}</SelectItem><SelectItem value="General Feedback">{c.general}</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><Label htmlFor="message">{c.message} <span className="text-red-500">*</span></Label><Textarea id="message" placeholder={c.placeholder} value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[120px] resize-none" maxLength={4000} required /></div>
                            <div className="space-y-2"><Label htmlFor="email">{c.email}</Label><Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} /><p className="text-xs text-slate-500">{c.contact}</p></div>
                            <div className="flex gap-3 pt-2"><Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">{c.cancel}</Button><Button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700">{isSubmitting ? c.sending : c.title}</Button></div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

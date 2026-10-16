import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquarePlus, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

export default function FeedbackButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [feedbackType, setFeedbackType] = useState('Suggestion');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) {
            toast.error('Please enter your feedback');
            return;
        }
        setIsSubmitting(true);
        try {
            await apiClient.entities.UserFeedback.create({ feedback_type: feedbackType, message: message.trim(), email: email.trim() || null, page_url: window.location.href });
            setShowSuccess(true);
            setTimeout(() => {
                setMessage('');
                setEmail('');
                setFeedbackType('Suggestion');
                setShowSuccess(false);
                setIsOpen(false);
            }, 2000);
        } catch (error) {
            toast.error('Failed to send feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Button aria-label="Send feedback" onClick={() => setIsOpen(true)} className="product-feedback-trigger fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300" size="icon"><MessageSquarePlus className="w-6 h-6" /></Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><MessageSquarePlus className="w-5 h-5 text-indigo-600" />Send Feedback</DialogTitle></DialogHeader>
                    {showSuccess ? (
                        <div className="py-8 text-center"><div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8 text-emerald-600" /></div><h3 className="text-lg font-semibold text-slate-800 mb-2">Thank you!</h3><p className="text-slate-600">Your feedback has been sent.</p></div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2"><Label htmlFor="feedback-type">Feedback Type</Label><Select value={feedbackType} onValueChange={setFeedbackType}><SelectTrigger id="feedback-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Suggestion">Suggestion</SelectItem><SelectItem value="Bug / Problem">Bug / Problem</SelectItem><SelectItem value="General Feedback">General Feedback</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><Label htmlFor="message">Message <span className="text-red-500">*</span></Label><Textarea id="message" placeholder="Describe your feedback or issue..." value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[120px] resize-none" required /></div>
                            <div className="space-y-2"><Label htmlFor="email">Email (optional)</Label><Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /><p className="text-xs text-slate-500">If you want us to contact you about this feedback</p></div>
                            <div className="flex gap-3 pt-2"><Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">Cancel</Button><Button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700">{isSubmitting ? 'Sending...' : 'Send Feedback'}</Button></div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

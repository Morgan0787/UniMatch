import { useLocation } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';
import { useQuery } from '@tanstack/react-query';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData = {}, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await apiClient.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <div className="release-page min-h-[calc(100dvh-160px)] flex items-center justify-center p-6">
            <div className="max-w-md w-full rounded-[24px] border border-white/95 bg-[#fffdf8]/90 p-8 shadow-sm text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-6xl font-light text-[#855a36]">404</h1>
                    <div className="h-0.5 w-16 bg-[#e3d7c6] mx-auto"></div>
                </div>
                <div className="space-y-3">
                    <h2 className="text-2xl font-semibold text-[#292823]">Page Not Found</h2>
                    <p className="text-[#55504a] leading-relaxed">The page <span className="font-medium text-[#292823]">"{pageName}"</span> could not be found in this application.</p>
                </div>
                {isFetched && authData.isAuthenticated && authData.user?.role === 'admin' && (
                    <div className="mt-6 p-4 bg-[#faf5ed] rounded-xl border border-[#e3d7c6]">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#f4e4cc] flex items-center justify-center mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-[#855a36]"></div>
                            </div>
                            <div className="text-left space-y-1">
                                <p className="text-sm font-medium text-[#292823]">Admin Note</p>
                                <p className="text-sm text-[#55504a] leading-relaxed">This could mean that the AI hasn't implemented this page yet. Ask it to implement it in the chat.</p>
                            </div>
                        </div>
                    </div>
                )}
                <div className="pt-2">
                    <button onClick={() => window.location.href = '/'} className="inline-flex items-center justify-center min-h-11 px-6 py-2.5 text-sm font-medium text-white bg-[#252c2f] hover:bg-[#354044] rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#855a36]">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        Go Home
                    </button>
                </div>
            </div>
        </div>
    )
}

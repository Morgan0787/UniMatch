import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { apiClient } from '@/lib/apiClient';
import { pagesConfig } from '@/pages.config';
import { rememberPublicRoute } from './loginReturn';
import { catalogLanguage } from './discoveryContent';

export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { Pages, mainPage } = pagesConfig;
    const mainPageKey = mainPage ?? Object.keys(Pages)[0];

    useEffect(() => {
        rememberPublicRoute(location);

        const pathname = location.pathname;
        let pageName;

        if (pathname === '/' || pathname === '') {
            pageName = mainPageKey;
        } else if (catalogLanguage(pathname)) {
            pageName = 'Search';
        } else {
            const pathSegment = pathname.replace(/^\//, '').split('/')[0];
            const pageKeys = Object.keys(Pages);
            const matchedKey = pageKeys.find(key => key.toLowerCase() === pathSegment.toLowerCase());
            pageName = matchedKey || null;
        }

        if (isAuthenticated && pageName) {
            apiClient.appLogs.logUserInApp(pageName).catch(() => {});
        }
    }, [location, isAuthenticated, Pages, mainPageKey]);

    return null;
}

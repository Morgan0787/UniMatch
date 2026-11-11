import { lazy } from 'react';
import __Layout from './Layout.jsx';

export const PAGES = {
    "AdminDataQuality": lazy(() => import('./pages/AdminDataQuality')),
    "AdminFeedback": lazy(() => import('./pages/AdminFeedback')),
    "EssayChecker": lazy(() => import('./pages/EssayChecker')),
    "Home": lazy(() => import('./pages/Home')),
    "Login": lazy(() => import('./pages/Login')),
    "Profile": lazy(() => import('./pages/Profile')),
    "Recommendations": lazy(() => import('./pages/Recommendations')),
    "Search": lazy(() => import('./pages/Search')),
    "AdmissionsSurvey": lazy(() => import('./pages/AdmissionsSurvey')),
    "University": lazy(() => import('./pages/University')),
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};

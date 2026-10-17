import AdminDataQuality from './pages/AdminDataQuality';
import AdminFeedback from './pages/AdminFeedback';
import EssayChecker from './pages/EssayChecker';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Recommendations from './pages/Recommendations';
import Search from './pages/Search';
import AdmissionsSurvey from './pages/AdmissionsSurvey';
import __Layout from './Layout.jsx';

export const PAGES = {
    "AdminDataQuality": AdminDataQuality,
    "AdminFeedback": AdminFeedback,
    "EssayChecker": EssayChecker,
    "Home": Home,
    "Login": Login,
    "Profile": Profile,
    "Recommendations": Recommendations,
    "Search": Search,
    "AdmissionsSurvey": AdmissionsSurvey,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { DarkModeProvider } from './context/DarkModeContext';
import { DataSaverProvider } from './context/DataSaverContext';
import { LanguageProvider } from './context/LanguageContext';
import { FestivalThemeProvider } from './context/FestivalThemeContext';
import { ToastProvider } from './components/ui/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import NewsFeed from './pages/NewsFeed';
import Messages from './pages/Messages';
import Groups from './pages/Groups';
import GroupPage from './pages/GroupPage';
import CreateGroup from './pages/CreateGroup';
import Pages from './pages/Pages';
import PagePage from './pages/PagePage';
import CreatePage from './pages/CreatePage';
import ReviewsGivenPage from './pages/ReviewsGivenPage';
import CheckinsListPage from './pages/CheckinsListPage';
import SearchResults from './pages/SearchResults';
import PrivacySettings from './pages/PrivacySettings';
import Security from './pages/Security';
import FriendRequests from './pages/FriendRequests';
import Events from './pages/Events';
import EventPage from './pages/EventPage';
import CreateEvent from './pages/CreateEvent';
import AdminPanel from './pages/AdminPanel';
import NotificationsPage from './pages/NotificationsPage';
import TrendingPage from './pages/TrendingPage';
import MemoriesPage from './pages/MemoriesPage';
import SavedPostsPage from './pages/SavedPostsPage';
import ReelsFeed from './components/ReelsFeed';
import CreateReel from './components/CreateReel';
import ShortsPage from './components/ShortsPage';
import CreatorDashboard from './pages/CreatorDashboard';
import CreatorEarnings from './pages/CreatorEarnings';
import CreatorSubscriptionManager from './pages/CreatorSubscriptionManager';
import MonetizationApplicationPage from './pages/MonetizationApplicationPage';
import AdsManagerDashboard from './pages/AdsManagerDashboard';
import SubscriptionTiersPage from './pages/SubscriptionTiersPage';
import MarketplacePage from './pages/MarketplacePage';
import ListingDetail from './pages/ListingDetail';
import HashtagPage from './pages/HashtagPage';
import TopicFeedPage from './pages/TopicFeedPage';
import CreatePost from './pages/CreatePost';
import NotesPage from './pages/NotesPage';
import NoteDetail from './pages/NoteDetail';
import { PaymentSuccess, PaymentCancel, PaymentFail } from './pages/PaymentResult';
import HelpFeed from './pages/HelpFeed';
import Para from './pages/Para';
import HelpRequestDetail from './pages/HelpRequestDetail';
import { MultiAdNetworks } from './components/MultiAdNetworks';
import AdNetworksManager from './pages/AdNetworksManager';
import ContactUs from './pages/ContactUs';
import SupportTickets from './pages/SupportTickets';
import SupportTicketDetail from './pages/SupportTicketDetail';
import FeedbackPage from './pages/FeedbackPage';
import AppealPage from './pages/AppealPage';
import VerificationRequestPage from './pages/VerificationRequestPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/feed" replace /> : children;
};

const AppContent = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/feed" element={<ProtectedRoute><NewsFeed /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/messages/:id" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:id/reviews-given" element={<ProtectedRoute><ReviewsGivenPage /></ProtectedRoute>} />
        <Route path="/profile/:id/checkins" element={<ProtectedRoute><CheckinsListPage /></ProtectedRoute>} />
        <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
        <Route path="/groups/create" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
        <Route path="/groups/:id" element={<ProtectedRoute><GroupPage /></ProtectedRoute>} />
        <Route path="/pages" element={<ProtectedRoute><Pages /></ProtectedRoute>} />
        <Route path="/pages/create" element={<ProtectedRoute><CreatePage /></ProtectedRoute>} />
        <Route path="/pages/:id" element={<ProtectedRoute><PagePage /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><FriendRequests /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path="/events/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
        <Route path="/events/:id" element={<ProtectedRoute><EventPage /></ProtectedRoute>} />
        <Route path="/privacy" element={<ProtectedRoute><PrivacySettings /></ProtectedRoute>} />
        <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="/trending" element={<ProtectedRoute><TrendingPage /></ProtectedRoute>} />
        <Route path="/memories" element={<ProtectedRoute><MemoriesPage /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><SavedPostsPage /></ProtectedRoute>} />
        <Route path="/reels" element={<ProtectedRoute><ReelsFeed /></ProtectedRoute>} />
        <Route path="/reels/:id" element={<ProtectedRoute><ReelsFeed /></ProtectedRoute>} />
        <Route path="/reels/create" element={<ProtectedRoute><CreateReel /></ProtectedRoute>} />
        <Route path="/shorts" element={<ProtectedRoute><ShortsPage /></ProtectedRoute>} />
        <Route path="/creator" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
        <Route path="/creator/earnings" element={<ProtectedRoute><CreatorEarnings /></ProtectedRoute>} />
        <Route path="/creator/subscriptions" element={<ProtectedRoute><CreatorSubscriptionManager /></ProtectedRoute>} />
        <Route path="/creator/subscriptions/:creatorId" element={<ProtectedRoute><SubscriptionTiersPage /></ProtectedRoute>} />
        <Route path="/creator/apply" element={<ProtectedRoute><MonetizationApplicationPage /></ProtectedRoute>} />
        <Route path="/ads/manager" element={<ProtectedRoute><AdsManagerDashboard /></ProtectedRoute>} />
        <Route path="/admin/ad-networks" element={<ProtectedRoute><AdNetworksManager /></ProtectedRoute>} />
        <Route path="/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
        <Route path="/marketplace/:id" element={<ProtectedRoute><ListingDetail /></ProtectedRoute>} />
        <Route path="/hashtag/:name" element={<ProtectedRoute><HashtagPage /></ProtectedRoute>} />
        <Route path="/topics" element={<ProtectedRoute><TopicFeedPage /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
        <Route path="/notes/:id" element={<ProtectedRoute><NoteDetail /></ProtectedRoute>} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="/payment/fail" element={<PaymentFail />} />
        <Route path="/help" element={<ProtectedRoute><HelpFeed /></ProtectedRoute>} />
        <Route path="/para" element={<ProtectedRoute><Para /></ProtectedRoute>} />
        <Route path="/help/:id" element={<ProtectedRoute><HelpRequestDetail /></ProtectedRoute>} />
        <Route path="/contact" element={<ProtectedRoute><ContactUs /></ProtectedRoute>} />
        <Route path="/support/tickets" element={<ProtectedRoute><SupportTickets /></ProtectedRoute>} />
        <Route path="/support/tickets/:id" element={<ProtectedRoute><SupportTicketDetail /></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
        <Route path="/appeal" element={<ProtectedRoute><AppealPage /></ProtectedRoute>} />
        <Route path="/verification" element={<ProtectedRoute><VerificationRequestPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <MultiAdNetworks />
    </Router>
  );
};

function App() {
  return (
    <DarkModeProvider>
      <FestivalThemeProvider>
        <LanguageProvider>
          <DataSaverProvider>
            <AuthProvider>
              <SocketProvider>
                <ToastProvider>
                  <AppContent />
                </ToastProvider>
              </SocketProvider>
            </AuthProvider>
          </DataSaverProvider>
        </LanguageProvider>
      </FestivalThemeProvider>
    </DarkModeProvider>
  );
}

export default App;

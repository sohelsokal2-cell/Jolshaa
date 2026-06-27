import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { DarkModeProvider } from './context/DarkModeContext';
import { ToastProvider } from './components/ui/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Signup from './pages/Signup';
import Login from './pages/Login';
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
import CreatorDashboard from './pages/CreatorDashboard';
import MarketplacePage from './pages/MarketplacePage';
import ListingDetail from './pages/ListingDetail';
import HashtagPage from './pages/HashtagPage';
import TopicFeedPage from './pages/TopicFeedPage';

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/feed" replace /> : children;
};

const AppContent = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/feed" element={<ProtectedRoute><NewsFeed /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/messages/:id" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
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
        <Route path="/creator" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
        <Route path="/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
        <Route path="/marketplace/:id" element={<ProtectedRoute><ListingDetail /></ProtectedRoute>} />
        <Route path="/hashtag/:name" element={<ProtectedRoute><HashtagPage /></ProtectedRoute>} />
        <Route path="/topics" element={<ProtectedRoute><TopicFeedPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </DarkModeProvider>
  );
}

export default App;

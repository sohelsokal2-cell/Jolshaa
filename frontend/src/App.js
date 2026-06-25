import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { DarkModeProvider } from './context/DarkModeContext';
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
import AdminPanel from './pages/AdminPanel';

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
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
        <Route path="/groups/create" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
        <Route path="/groups/:id" element={<ProtectedRoute><GroupPage /></ProtectedRoute>} />
        <Route path="/pages" element={<ProtectedRoute><Pages /></ProtectedRoute>} />
        <Route path="/pages/create" element={<ProtectedRoute><CreatePage /></ProtectedRoute>} />
        <Route path="/pages/:id" element={<ProtectedRoute><PagePage /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
        <Route path="/privacy" element={<ProtectedRoute><PrivacySettings /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
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
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </DarkModeProvider>
  );
}

export default App;

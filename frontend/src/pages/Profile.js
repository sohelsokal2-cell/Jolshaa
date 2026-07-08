import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import Avatar from '../components/ui/Avatar';
import { PostSkeleton } from '../components/ui/Skeleton';
import AlbumGrid from '../components/AlbumGrid';
import PostCard from '../components/PostCard';
import ReportModal from '../components/ReportModal';
import FriendButton from '../components/FriendButton';
import SubscribeButton from '../components/SubscribeButton';
import SubscriptionTiersPage from './SubscriptionTiersPage';
import StoryHighlights from '../components/StoryHighlights';
import FriendsPreviewGrid from '../components/FriendsPreviewGrid';
import CreatePostBox from '../components/CreatePostBox';
import WorkHistoryList from '../components/WorkHistoryList';
import EducationHistoryList from '../components/EducationHistoryList';
import FollowersListModal from '../components/FollowersListModal';
import FollowingListModal from '../components/FollowingListModal';
import PinnedPostCard from '../components/PinnedPostCard';
import ProfileCompletionCard from '../components/ProfileCompletionCard';
import SharedInCommonCard from '../components/SharedInCommonCard';
import FriendsTabContent from '../components/FriendsTabContent';
import ReelsTabContent from '../components/ReelsTabContent';
import ManageSectionsModal from '../components/ManageSectionsModal';

const Profile = () => {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const { onlineUsers } = useSocket();
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('posts');
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [helpHistory, setHelpHistory] = useState(null);
  const [helpLoading, setHelpLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [showManageSections, setShowManageSections] = useState(false);
  const [postsError, setPostsError] = useState(null);
  const [postFilter, setPostFilter] = useState('all');
  const [postSort, setPostSort] = useState('newest');
  const [postViewMode, setPostViewMode] = useState('list');
  const [managePostsMode, setManagePostsMode] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [friendsError, setFriendsError] = useState(null);
  const [helpError, setHelpError] = useState(null);
  const [onlineStatus, setOnlineStatus] = useState(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [pinnedPost, setPinnedPost] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef(null);

  const isOwnProfile = !id || id === currentUser?.id;
  const profileUserId = profileUser?.id || profileUser?._id;

  // If a visitor lands on a section the owner has hidden, fall back to Posts
  useEffect(() => {
    if (!profileUser || isOwnProfile) return;
    const settings = profileUser.profileSectionSettings;
    if (!settings || settings.length === 0) return;
    const visibleKeys = settings.filter(s => s.enabled).map(s => s.key);
    if (activeTab !== 'more' && !visibleKeys.includes(activeTab)) {
      setActiveTab('posts');
    }
  }, [profileUser, isOwnProfile]);

  // Real-time online status from Socket.io
  const isSocketOnline = useMemo(() => {
    if (!profileUserId) return false;
    return onlineUsers.has(profileUserId);
  }, [profileUserId, onlineUsers]);

  // Determine effective online status (socket takes priority over fetched status)
  const effectiveOnline = isOwnProfile ? false : (onlineStatus?.showStatus !== false && (isSocketOnline || onlineStatus?.online === true));

  // Format last seen time
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return '';
    const now = new Date();
    const then = new Date(lastSeen);
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Active now';
    if (diffMin < 60) return `Active ${diffMin}m ago`;
    if (diffHr < 24) return `Active ${diffHr}h ago`;
    return `Last seen ${then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: diffDay > 365 ? 'numeric' : undefined })}`;
  };

  const statusText = effectiveOnline
    ? 'Active now'
    : onlineStatus?.showStatus !== false
      ? formatLastSeen(onlineStatus?.lastSeen)
      : '';

  useEffect(() => {
    if (isOwnProfile) {
      setProfileUser(currentUser);
      setLoading(false);
      fetchOnlineStatus(currentUser?.id || currentUser?._id);
    } else {
      fetchUserProfile(id);
    }
  }, [id, isOwnProfile, currentUser]);

  useEffect(() => {
    if (activeTab === 'posts' && profileUser) {
      setPosts([]);
      setPage(1);
      fetchPosts(1);
      fetchPinnedPost();
    }
    if (activeTab === 'friends' && profileUser) {
      fetchFriends();
    }
    if (activeTab === 'help' && profileUser) {
      fetchHelpHistory();
    }
  }, [activeTab, profileUser]);

  useEffect(() => {
    if (activeTab === 'posts' && profileUser) {
      setPosts([]);
      setPage(1);
      fetchPosts(1);
    }
  }, [postFilter, postSort, managePostsMode]);

  // Fetch online status when viewing another user's profile
  useEffect(() => {
    if (!isOwnProfile && profileUser) {
      fetchOnlineStatus(profileUser.id || profileUser._id);
    }
  }, [isOwnProfile, profileUser]);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUserProfile = async (userId) => {
    setProfileError(null);
    try {
      const res = await API.get(`/users/${userId}`);
      setProfileUser(res.data);
    } catch (err) {
      console.error('Failed to fetch user profile');
      setProfileError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOnlineStatus = async (userId) => {
    try {
      const res = await API.get(`/users/${userId}/online`);
      setOnlineStatus(res.data);
    } catch (_) {
      // Non-critical — ignore silently
    }
  };

  const fetchPinnedPost = async () => {
    const userId = profileUser?.id || profileUser?._id;
    if (!userId) return;
    try {
      const res = await API.get(`/users/pinned-post/${userId}`);
      setPinnedPost(res.data.pinnedPost);
    } catch (_) {
      // Non-critical
    }
  };

  const handlePinnedPostUnpin = () => {
    setPinnedPost(null);
    refreshProfile();
  };

  const handleToggleProfileLock = async () => {
    try {
      const res = await API.put('/users/profile-lock');
      setProfileUser(prev => ({ ...prev, profileLocked: res.data.profileLocked }));
    } catch (err) {
      console.error('Failed to toggle profile lock');
    }
  };

  const fetchPosts = async (pageNum) => {
    setPostsLoading(true);
    setPostsError(null);
    try {
      const params = new URLSearchParams({ page: pageNum, limit: 10, sort: postSort });
      if (postFilter !== 'all') params.set('type', postFilter);
      if (isOwnProfile && managePostsMode) params.set('manage', 'true');
      const res = await API.get(`/users/${profileUser.id}/posts?${params.toString()}`);
      if (pageNum === 1) setPosts(res.data.posts);
      else setPosts(prev => [...prev, ...res.data.posts]);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch posts');
      setPostsError('Failed to load posts.');
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchFriends = async () => {
    setFriendsLoading(true);
    setFriendsError(null);
    try {
      const userId = profileUser.id || profileUser._id;
      const res = await API.get(`/friends/${userId}`);
      setFriends(res.data.friends);
    } catch (err) {
      console.error('Failed to fetch friends');
      setFriendsError('Failed to load friends.');
    } finally {
      setFriendsLoading(false);
    }
  };

  const fetchHelpHistory = async () => {
    setHelpLoading(true);
    setHelpError(null);
    try {
      const userId = profileUser.id || profileUser._id;
      const res = await API.get(`/help/user/${userId}/history`);
      setHelpHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch help history');
      setHelpError('Failed to load help history.');
    } finally {
      setHelpLoading(false);
    }
  };

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostArchiveToggle = (postId) => {
    // Whichever mode we're in, the post no longer belongs in the current list once toggled
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  const handlePostHideToggle = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  const toggleSelectPost = (postId) => {
    setSelectedPostIds(prev =>
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedPostIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      await API.put('/posts/bulk-archive', { postIds: selectedPostIds, action });
      setPosts(prev => prev.filter(p => !selectedPostIds.includes(p._id)));
      setSelectedPostIds([]);
    } catch (err) {
      console.error('Bulk action failed');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleMessage = async () => {
    setMessageLoading(true);
    try {
      const res = await API.post('/conversations', { participantId: profileUser.id || profileUser._id });
      navigate(`/messages/${res.data._id}`);
    } catch (err) {
      console.error('Failed to start conversation');
      alert('Failed to start conversation. Please try again.');
    } finally {
      setMessageLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (isOwnProfile) {
      try {
        const res = await API.get(`/users/${currentUser.id || currentUser._id}`);
        setProfileUser(res.data);
      } catch (_) {
        // ignore
      }
    } else {
      fetchUserProfile(id);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  };

  const handleFriendStatusChange = (newStatus) => {
    setProfileUser(prev => {
      const wasFriends = prev.friendStatus === 'friends';
      const isFriends = newStatus === 'friends';
      let friendCount = prev.friendCount || 0;
      if (!wasFriends && isFriends) friendCount += 1;
      else if (wasFriends && !isFriends) friendCount = Math.max(0, friendCount - 1);
      return { ...prev, friendStatus: newStatus, friendCount };
    });
  };

  if (loading || !profileUser) {
    return (
      <Layout showSidebar={true}>
        <div className="space-y-4">
          <div className="h-48 skeleton rounded-xl" />
          <div className="h-24 skeleton rounded-xl" />
          <PostSkeleton />
        </div>
      </Layout>
    );
  }

  if (profileError) {
    return (
      <Layout showSidebar={true}>
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-jolshaa-surface-container rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <p className="text-sm text-jolshaa-on-surface-variant mb-4">{profileError}</p>
          <button
            onClick={() => { setProfileError(null); setLoading(true); if (isOwnProfile) { setProfileUser(currentUser); setLoading(false); } else { fetchUserProfile(id); } }}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-jolshaa-teal text-jolshaa-on-teal hover:bg-jolshaa-teal-container transition-colors"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  const getMediaUrl = (item) => (typeof item === 'string' ? item : item.url);
  const isImageMedia = (item) => {
    const url = getMediaUrl(item);
    return !(item?.type === 'video' || url?.endsWith('.mp4') || url?.endsWith('.webm') || url?.endsWith('.mov'));
  };
  const recentPhotos = posts
    .flatMap(p => (p.media || []).filter(isImageMedia).map(getMediaUrl))
    .slice(0, 4);

  const sectionLabels = {
    posts: t('profile.posts'),
    about: t('profile.about'),
    albums: 'Albums',
    friends: t('profile.friends'),
    reels: 'Reels',
  };
  const defaultSectionSettings = [
    { key: 'posts', enabled: true, order: 0 },
    { key: 'about', enabled: true, order: 1 },
    { key: 'albums', enabled: true, order: 2 },
    { key: 'friends', enabled: true, order: 3 },
    { key: 'reels', enabled: true, order: 4 },
  ];
  const sectionSettings = profileUser.profileSectionSettings && profileUser.profileSectionSettings.length > 0
    ? profileUser.profileSectionSettings
    : defaultSectionSettings;
  const orderedSections = [...sectionSettings].sort((a, b) => a.order - b.order);
  const visibleSections = orderedSections.filter(s => isOwnProfile || s.enabled);

  const tabs = [
    ...visibleSections.map(s => ({
      key: s.key,
      label: sectionLabels[s.key] || s.key,
      count: s.key === 'friends' ? (profileUser.friendCount || 0) : undefined,
      hidden: isOwnProfile && !s.enabled,
    })),
    { key: 'more', label: 'More ▾' },
  ];

  return (
    <Layout showSidebar={true}>
      <div>
        {/* Cover Photo */}
        <div className="relative">
          <div className="h-48 sm:h-64 bg-gradient-to-r from-jolshaa-teal to-jolshaa-teal-container rounded-xl overflow-hidden shadow-ambient">
            {profileUser.coverPhoto && (
              <img src={profileUser.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
            )}
          </div>
        </div>

        {/* Profile Header */}
        <div className="relative px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12 mb-4">
            <div className="relative">
              <Avatar src={profileUser.profilePhoto} alt={profileUser.name} size="3xl" className="ring-4 ring-jolshaa-surface shadow-ambient-hover" />
              {/* Online indicator dot on profile photo */}
              {!isOwnProfile && onlineStatus?.showStatus !== false && (
                <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-jolshaa-surface ${effectiveOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              )}
            </div>
            <div className="flex-1 min-w-0 sm:pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h1 className="text-2xl font-bold font-display text-jolshaa-on-surface">{profileUser.name}</h1>
                {profileUser.isVerified && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-2xs font-semibold bg-jolshaa-teal/10 text-jolshaa-teal border border-jolshaa-teal/20 w-fit">
                    <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                    Verified
                  </span>
                )}
                {!isOwnProfile && onlineStatus?.showStatus !== false && statusText && (
                  <span className={`inline-flex items-center gap-1 text-xs ${effectiveOnline ? 'text-green-500' : 'text-jolshaa-on-surface-variant'}`}>
                    <span className={`w-2 h-2 rounded-full ${effectiveOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {statusText}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {profileUser.friendCount > 0 && (
                  <p className="text-sm text-jolshaa-on-surface-variant">
                    {profileUser.friendCount} friend{profileUser.friendCount !== 1 ? 's' : ''}
                  </p>
                )}
                {(profileUser.followerCount > 0 || profileUser.followingCount > 0) && (
                  <div className="flex items-center gap-2 text-sm text-jolshaa-on-surface-variant">
                    {profileUser.followerCount > 0 && (
                      <button
                        onClick={() => setShowFollowers(true)}
                        className="hover:underline hover:text-jolshaa-on-surface transition-colors"
                      >
                        {profileUser.followerCount} follower{profileUser.followerCount !== 1 ? 's' : ''}
                      </button>
                    )}
                    {profileUser.followerCount > 0 && profileUser.followingCount > 0 && ' · '}
                    {profileUser.followingCount > 0 && (
                      <button
                        onClick={() => setShowFollowing(true)}
                        className="hover:underline hover:text-jolshaa-on-surface transition-colors"
                      >
                        following {profileUser.followingCount}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:pb-1">
              {!isOwnProfile ? (
                <>
                  <FriendButton
                    userId={profileUser.id || profileUser._id}
                    initialStatus={profileUser.friendStatus}
                    initialRequestId={profileUser.friendRequestId}
                    onStatusChange={handleFriendStatusChange}
                  />
                  <button
                    onClick={handleMessage}
                    disabled={messageLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-jolshaa-indigo/10 text-jolshaa-indigo hover:bg-jolshaa-indigo/20 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Message
                  </button>
                  {profileUser.isCreator && (
                    <SubscribeButton userId={profileUser.id || profileUser._id} />
                  )}
                </>
              ) : (
                <Link
                  to="/edit-profile"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-jolshaa-teal text-jolshaa-on-teal hover:bg-jolshaa-teal-container transition-colors shadow-ambient"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  {t('profile.editProfile')}
                </Link>
              )}
              {!isOwnProfile && (
                <button
                  onClick={() => setShowReport(true)}
                  className="inline-flex items-center justify-center p-2.5 rounded-lg text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low transition-colors"
                  aria-label="Report user"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                </button>
              )}
            </div>
          </div>

          {/* Mutual friends */}
          {!isOwnProfile && profileUser.mutualFriendsCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex -space-x-2">
                {profileUser.mutualFriends?.slice(0, 3).map((f) => (
                  <Avatar key={f._id} src={f.profilePhoto} alt={f.name} size="xs" className="ring-2 ring-jolshaa-surface" />
                ))}
              </div>
              <p className="text-xs text-jolshaa-on-surface-variant">
                {profileUser.mutualFriendsCount} mutual friend{profileUser.mutualFriendsCount !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Bio & Info */}
          <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4 mb-4">
            <div className="space-y-3">
              {profileUser.bio && (
                <p className="text-sm text-jolshaa-on-surface">{profileUser.bio}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-jolshaa-on-surface-variant">
                {profileUser.workHistory && profileUser.workHistory.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {profileUser.workHistory[0].position
                      ? `${profileUser.workHistory[0].position} at ${profileUser.workHistory[0].company}`
                      : profileUser.workHistory[0].company}
                  </span>
                )}
                {profileUser.educationHistory && profileUser.educationHistory.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                    {profileUser.educationHistory[0].degree
                      ? `${profileUser.educationHistory[0].degree} at ${profileUser.educationHistory[0].institution}`
                      : profileUser.educationHistory[0].institution}
                  </span>
                )}
                {profileUser.location && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {profileUser.location}
                  </span>
                )}
                {profileUser.website && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                    <a
                      href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-jolshaa-teal hover:underline"
                    >
                      {profileUser.website.replace(/^https?:\/\//, '')}
                    </a>
                  </span>
                )}
                {profileUser.phone && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {profileUser.phone}
                  </span>
                )}
              </div>
              <p className="text-xs text-jolshaa-on-surface-variant/80">
                {t('profile.joined')} {new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Friends Preview Grid */}
        {profileUser.friendCount > 0 && (
          <div className="px-4 sm:px-0 mb-4">
            <FriendsPreviewGrid
              friends={profileUser.friends || []}
              friendCount={profileUser.friendCount}
              onSeeAll={visibleSections.some(s => s.key === 'friends') ? () => setActiveTab('friends') : undefined}
            />
          </div>
        )}

        {/* Story Highlights */}
        <div className="px-4 sm:px-0 mb-4">
          <StoryHighlights userId={profileUser.id || profileUser._id} isOwnProfile={isOwnProfile} />
        </div>

        {/* Subscription Tiers (for creators) */}
        {!isOwnProfile && profileUser.isCreator && (
          <div className="px-4 sm:px-0 mb-4">
            <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
              <SubscriptionTiersPage creatorId={profileUser.id || profileUser._id} />
            </div>
          </div>
        )}

        {/* Profile Lock banners */}
        {isOwnProfile && profileUser.profileLocked && (
          <div className="px-4 sm:px-0 mb-4">
            <div className="flex items-center gap-3 bg-jolshaa-teal/10 border border-jolshaa-teal/20 rounded-xl p-4">
              <svg className="w-5 h-5 text-jolshaa-teal flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm text-jolshaa-on-surface">
                Your profile is locked. Only friends can see your posts, photos, and full profile details.
              </p>
            </div>
          </div>
        )}
        {!isOwnProfile && profileUser.isLimitedView && (
          <div className="px-4 sm:px-0 mb-4">
            <div className="flex items-center gap-3 bg-jolshaa-surface-container-low border border-jolshaa-outline-variant rounded-xl p-4">
              <svg className="w-5 h-5 text-jolshaa-on-surface-variant flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm text-jolshaa-on-surface-variant">
                {profileUser.name} has a locked profile. Add them as a friend to see their posts and full profile.
              </p>
            </div>
          </div>
        )}

        {/* Profile Completion (own profile only) */}
        {isOwnProfile && (
          <div className="px-4 sm:px-0 mb-4">
            <ProfileCompletionCard />
          </div>
        )}

        {/* Shared Groups & Pages in Common (other profiles only) */}
        {!isOwnProfile && (
          <div className="px-4 sm:px-0 mb-4">
            <SharedInCommonCard profileUserId={id} />
          </div>
        )}

        {/* Tabs */}
        <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient mb-4">
          <div className="flex overflow-x-auto border-b border-jolshaa-outline-variant scrollbar-hide">
            {tabs.map((tab) => (
              tab.key === 'more' ? (
                <div key="more" className="relative" ref={moreMenuRef}>
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                      showMoreMenu
                        ? 'border-jolshaa-teal text-jolshaa-teal'
                        : 'border-transparent text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface hover:border-jolshaa-outline-variant'
                    }`}
                  >
                    {tab.label}
                  </button>
                  {showMoreMenu && (
                    <div className="absolute left-0 top-full mt-0 w-56 bg-jolshaa-surface-container-lowest rounded-xl shadow-elevated border border-jolshaa-outline-variant z-30 py-1">
                      <Link
                        to={`/profile/${id || ''}/checkins`}
                        onClick={() => setShowMoreMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low transition-colors"
                      >
                        <svg className="w-4 h-4 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        Check-ins
                      </Link>
                      <Link
                        to="/events"
                        onClick={() => setShowMoreMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low transition-colors"
                      >
                        <svg className="w-4 h-4 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Events
                      </Link>
                      <Link
                        to={`/profile/${id || ''}/reviews-given`}
                        onClick={() => setShowMoreMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low transition-colors"
                      >
                        <svg className="w-4 h-4 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Reviews
                      </Link>
                      <Link
                        to="/groups"
                        onClick={() => setShowMoreMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low transition-colors"
                      >
                        <svg className="w-4 h-4 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4" />
                        </svg>
                        Groups
                      </Link>
                      {isOwnProfile && (
                        <>
                          <div className="border-t border-jolshaa-outline-variant my-1" />
                          <Link
                            to="/security"
                            onClick={() => setShowMoreMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low transition-colors"
                          >
                            <svg className="w-4 h-4 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            {t('profile.security')}
                          </Link>
                          {!profileUser.isVerified && !profileUser.verificationRequested && (
                            <Link
                              to="/verification"
                              onClick={() => setShowMoreMenu(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low transition-colors"
                            >
                              <svg className="w-4 h-4 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              {t('profile.applyVerification')}
                            </Link>
                          )}
                          {profileUser.verificationRequested && (
                            <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-jolshaa-on-surface-variant">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {t('profile.verificationPending')}
                            </div>
                          )}
                          <div className="border-t border-jolshaa-outline-variant my-1" />
                          <Link
                            to="/support/tickets"
                            onClick={() => setShowMoreMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low transition-colors"
                          >
                            <svg className="w-4 h-4 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                            {t('profile.supportTickets')}
                          </Link>
                          <Link
                            to="/contact"
                            onClick={() => setShowMoreMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low transition-colors"
                          >
                            <svg className="w-4 h-4 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {t('profile.contactUs')}
                          </Link>
                          <Link
                            to="/feedback"
                            onClick={() => setShowMoreMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low transition-colors"
                          >
                            <svg className="w-4 h-4 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                            {t('profile.feedback')}
                          </Link>
                          <Link
                            to="/appeal"
                            onClick={() => setShowMoreMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low transition-colors"
                          >
                            <svg className="w-4 h-4 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l3 9a5.002 5.002 0 01-6.001 0M18 7l-3 9m0 0l3-9m-3 9l-6-2" />
                            </svg>
                            {t('profile.appeal')}
                          </Link>
                          <button
                            onClick={() => { setShowMoreMenu(false); setShowManageSections(true); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low transition-colors"
                          >
                            <svg className="w-4 h-4 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            Manage Sections
                          </button>
                          <button
                            onClick={() => { setShowMoreMenu(false); handleToggleProfileLock(); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low transition-colors"
                          >
                            <svg className="w-4 h-4 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            {profileUser.profileLocked ? 'Unlock Profile' : 'Lock Profile'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.key
                      ? 'border-jolshaa-teal text-jolshaa-teal'
                      : 'border-transparent text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface hover:border-jolshaa-outline-variant'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-2xs ${
                      activeTab === tab.key
                        ? 'bg-jolshaa-teal/10 text-jolshaa-teal'
                        : 'bg-jolshaa-surface-container text-jolshaa-on-surface-variant'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 sm:px-0">
          {activeTab === 'posts' && (
            <div className="flex flex-col lg:flex-row gap-4 items-start">
              {/* Intro + Recent Photos widgets */}
              <div className="w-full lg:w-[280px] flex-shrink-0 space-y-4">
                {((profileUser.workHistory && profileUser.workHistory.length > 0) || (profileUser.educationHistory && profileUser.educationHistory.length > 0) || profileUser.location || profileUser.createdAt) && (
                  <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
                    <h3 className="text-base font-semibold font-display text-jolshaa-on-surface mb-3">Intro</h3>
                    <div className="space-y-3 text-sm text-jolshaa-on-surface-variant">
                      {profileUser.workHistory && profileUser.workHistory.length > 0 && (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          {profileUser.workHistory[0].position
                            ? `${profileUser.workHistory[0].position} at ${profileUser.workHistory[0].company}`
                            : profileUser.workHistory[0].company}
                        </span>
                      )}
                      {profileUser.educationHistory && profileUser.educationHistory.length > 0 && (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                          {profileUser.educationHistory[0].degree
                            ? `${profileUser.educationHistory[0].degree} at ${profileUser.educationHistory[0].institution}`
                            : profileUser.educationHistory[0].institution}
                        </span>
                      )}
                      {profileUser.location && (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          Lives in {profileUser.location}
                        </span>
                      )}
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {t('profile.joined')} {new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                )}

                {recentPhotos.length > 0 && (
                  <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold font-display text-jolshaa-on-surface">Recent Photos</h3>
                      <button
                        onClick={() => setActiveTab('albums')}
                        className="text-xs font-medium text-jolshaa-teal hover:underline"
                      >
                        See All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {recentPhotos.map((url, i) => (
                        <img key={i} src={url} alt="" className="w-full h-20 object-cover rounded-lg" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Composer + Feed */}
              <div className="flex-1 min-w-0 w-full space-y-4">
                {isOwnProfile && <CreatePostBox onPostCreated={handlePostCreated} />}

                {/* Post Filters + Manage Posts + View Toggle */}
                <div className="flex flex-wrap items-center gap-2 bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-3">
                  <select
                    value={postFilter}
                    onChange={(e) => setPostFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-sm bg-jolshaa-surface-container border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none"
                  >
                    <option value="all">All Posts</option>
                    <option value="photos">Photos</option>
                    <option value="videos">Videos</option>
                    <option value="text">Text Only</option>
                  </select>
                  <select
                    value={postSort}
                    onChange={(e) => setPostSort(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-sm bg-jolshaa-surface-container border border-jolshaa-outline-variant text-jolshaa-on-surface focus:outline-none"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={() => setPostViewMode('list')}
                      aria-label="List view"
                      className={`p-2 rounded-lg transition-colors ${postViewMode === 'list' ? 'bg-jolshaa-teal/10 text-jolshaa-teal' : 'text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <button
                      onClick={() => setPostViewMode('grid')}
                      aria-label="Grid view"
                      className={`p-2 rounded-lg transition-colors ${postViewMode === 'grid' ? 'bg-jolshaa-teal/10 text-jolshaa-teal' : 'text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" /></svg>
                    </button>
                    {isOwnProfile && (
                      <button
                        onClick={() => { setManagePostsMode(!managePostsMode); setSelectedPostIds([]); }}
                        className={`ml-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${managePostsMode ? 'bg-jolshaa-teal text-jolshaa-on-teal' : 'bg-jolshaa-surface-container text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low'}`}
                      >
                        {managePostsMode ? 'Exit Manage Posts' : 'Manage Posts'}
                      </button>
                    )}
                  </div>
                </div>
                {managePostsMode && (
                  <p className="text-xs text-jolshaa-on-surface-variant px-1">
                    Showing archived and hidden posts only. Unarchive or unhide a post to bring it back to your profile.
                  </p>
                )}
                {managePostsMode && selectedPostIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 bg-jolshaa-teal/10 rounded-xl p-3">
                    <span className="text-sm font-medium text-jolshaa-on-surface">
                      {selectedPostIds.length} selected
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => handleBulkAction('unarchive')}
                        disabled={bulkActionLoading}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-jolshaa-surface-container-lowest text-jolshaa-on-surface hover:bg-jolshaa-surface-container disabled:opacity-50"
                      >
                        Unarchive
                      </button>
                      <button
                        onClick={() => handleBulkAction('unhide')}
                        disabled={bulkActionLoading}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-jolshaa-surface-container-lowest text-jolshaa-on-surface hover:bg-jolshaa-surface-container disabled:opacity-50"
                      >
                        Unhide
                      </button>
                      <button
                        onClick={() => setSelectedPostIds([])}
                        disabled={bulkActionLoading}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-lowest disabled:opacity-50"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}


                {postsLoading && posts.length === 0 ? (
                  <>
                    <PostSkeleton />
                    <PostSkeleton />
                  </>
                ) : postsError ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-jolshaa-on-surface-variant mb-3">{postsError}</p>
                    <button
                      onClick={() => fetchPosts(1)}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-jolshaa-surface-container-low text-jolshaa-on-surface hover:bg-jolshaa-surface-container transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-jolshaa-surface-container rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                    </div>
                    <p className="text-sm text-jolshaa-on-surface-variant">
                      {managePostsMode ? 'No archived or hidden posts' : t('profile.noPosts')}
                    </p>
                  </div>
                ) : postViewMode === 'grid' ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {posts.map(post => {
                        const thumb = post.video?.thumbnailUrl || post.media?.[0]?.thumbnailUrl || post.media?.[0]?.url;
                        return (
                          <button
                            key={post._id}
                            onClick={() => { setPostViewMode('list'); }}
                            className="relative aspect-square rounded-lg overflow-hidden bg-jolshaa-surface-container group"
                          >
                            {thumb ? (
                              <img src={thumb} alt="" className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center p-3 text-xs text-jolshaa-on-surface-variant text-center">
                                {post.text?.slice(0, 80) || 'Post'}
                              </div>
                            )}
                            {post.media?.[0]?.type === 'video' && (
                              <div className="absolute top-1.5 right-1.5 bg-black/50 rounded-full p-1">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {page < totalPages && (
                      <div className="flex justify-center py-4">
                        <button
                          onClick={loadMore}
                          disabled={postsLoading}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-jolshaa-surface-container-low text-jolshaa-on-surface hover:bg-jolshaa-surface-container transition-colors disabled:opacity-50"
                        >
                          {postsLoading ? 'Loading…' : 'Load more'}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Pinned Post */}
                    {!managePostsMode && pinnedPost && (
                      <PinnedPostCard
                        post={pinnedPost}
                        onDelete={handleDeletePost}
                        onUnpin={handlePinnedPostUnpin}
                      />
                    )}
                    {posts
                      .filter(post => managePostsMode || !pinnedPost || post._id !== pinnedPost._id)
                      .map(post => (
                        <div key={post._id} className="flex items-start gap-2">
                          {managePostsMode && (
                            <input
                              type="checkbox"
                              checked={selectedPostIds.includes(post._id)}
                              onChange={() => toggleSelectPost(post._id)}
                              className="mt-4 w-4 h-4 accent-jolshaa-teal flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <PostCard
                              post={post}
                              onDelete={handleDeletePost}
                              isPinned={false}
                              onPin={isOwnProfile ? () => { fetchPinnedPost(); } : undefined}
                              onArchiveToggle={handlePostArchiveToggle}
                              onHideToggle={handlePostHideToggle}
                            />
                          </div>
                        </div>
                      ))}
                    {page < totalPages && (
                      <div className="flex justify-center py-4">
                        <button
                          onClick={loadMore}
                          disabled={postsLoading}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-jolshaa-surface-container-low text-jolshaa-on-surface hover:bg-jolshaa-surface-container transition-colors disabled:opacity-50"
                        >
                          {postsLoading ? 'Loading…' : 'Load more'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">
              {/* Overview */}
              <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
                <h3 className="text-base font-semibold font-display text-jolshaa-on-surface mb-4">Overview</h3>
                {profileUser.bio ? (
                  <p className="text-sm text-jolshaa-on-surface">{profileUser.bio}</p>
                ) : (
                  <p className="text-sm text-jolshaa-on-surface-variant">No bio to show</p>
                )}
              </div>

              {/* Work and Education */}
              {((profileUser.workHistory && profileUser.workHistory.length > 0) || (profileUser.educationHistory && profileUser.educationHistory.length > 0) || isOwnProfile) && (
                <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
                  <h3 className="text-base font-semibold font-display text-jolshaa-on-surface mb-4">Work and Education</h3>
                  <div className="space-y-5">
                    <WorkHistoryList
                      workHistory={profileUser.workHistory || []}
                      isOwner={isOwnProfile}
                      onUpdate={refreshProfile}
                    />
                    <EducationHistoryList
                      educationHistory={profileUser.educationHistory || []}
                      isOwner={isOwnProfile}
                      onUpdate={refreshProfile}
                    />
                  </div>
                </div>
              )}

              {/* Places */}
              {(profileUser.location || profileUser.hometown || profileUser.currentCity) && (
                <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
                  <h3 className="text-base font-semibold font-display text-jolshaa-on-surface mb-4">Places</h3>
                  <div className="space-y-3">
                    {profileUser.currentCity && (
                      <div className="flex items-center gap-2 text-sm text-jolshaa-on-surface">
                        <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Lives in {profileUser.currentCity}
                      </div>
                    )}
                    {profileUser.hometown && (
                      <div className="flex items-center gap-2 text-sm text-jolshaa-on-surface">
                        <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7m-9-2v10a1 1 0 001 1h3m6-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        From {profileUser.hometown}
                      </div>
                    )}
                    {profileUser.location && profileUser.location !== profileUser.currentCity && (
                      <div className="flex items-center gap-2 text-sm text-jolshaa-on-surface">
                        <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {profileUser.location}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contact and Basic Info */}
              {(profileUser.email || profileUser.phone || profileUser.website || profileUser.gender || profileUser.dateOfBirth || profileUser.createdAt || (profileUser.relationshipStatus && profileUser.relationshipStatus !== 'prefer not to say') || (profileUser.languagesSpoken && profileUser.languagesSpoken.length > 0)) && (
                <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
                  <h3 className="text-base font-semibold font-display text-jolshaa-on-surface mb-4">Contact and Basic Info</h3>
                  <div className="space-y-4">
                    {profileUser.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span className="text-jolshaa-on-surface">{profileUser.email}</span>
                      </div>
                    )}
                    {profileUser.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        <span className="text-jolshaa-on-surface">{profileUser.phone}</span>
                      </div>
                    )}
                    {profileUser.website && (
                      <div className="flex items-center gap-3 text-sm">
                        <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                        <a
                          href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-jolshaa-teal hover:underline"
                        >
                          {profileUser.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {profileUser.relationshipStatus && profileUser.relationshipStatus !== 'prefer not to say' && (
                      <div className="flex items-center gap-3 text-sm">
                        <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 10-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        <span className="text-jolshaa-on-surface capitalize">{profileUser.relationshipStatus}</span>
                      </div>
                    )}
                    {profileUser.languagesSpoken && profileUser.languagesSpoken.length > 0 && (
                      <div className="flex items-center gap-3 text-sm">
                        <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9l4.5-9 4.5 9m-8.25-2h7.5" /></svg>
                        <span className="text-jolshaa-on-surface">{profileUser.languagesSpoken.join(', ')}</span>
                      </div>
                    )}
                    {profileUser.gender && profileUser.gender !== 'prefer not to say' && (
                      <div className="flex items-center gap-3 text-sm">
                        <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <span className="text-jolshaa-on-surface capitalize">{profileUser.gender}</span>
                      </div>
                    )}
                    {profileUser.dateOfBirth && (
                      <div className="flex items-center gap-3 text-sm">
                        <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-jolshaa-on-surface">{new Date(profileUser.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    )}
                    {profileUser.createdAt && (
                      <div className="flex items-center gap-3 text-sm">
                        <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-jolshaa-on-surface-variant">
                          {t('profile.joined')} {new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!profileUser.bio && (!profileUser.workHistory || profileUser.workHistory.length === 0) && (!profileUser.educationHistory || profileUser.educationHistory.length === 0) && !profileUser.location && !profileUser.hometown && !profileUser.currentCity && !profileUser.email && !profileUser.phone && !profileUser.website && !profileUser.gender && !profileUser.dateOfBirth && (!profileUser.relationshipStatus || profileUser.relationshipStatus === 'prefer not to say') && (!profileUser.languagesSpoken || profileUser.languagesSpoken.length === 0) && !isOwnProfile && (
                <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
                  <p className="text-sm text-jolshaa-on-surface-variant text-center py-4">No info to show</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'albums' && <AlbumGrid userId={profileUser.id || profileUser._id} />}

          {activeTab === 'friends' && (
            <FriendsTabContent
              userId={profileUser.id || profileUser._id}
              isOwnProfile={isOwnProfile}
              onUnfriend={() => setProfileUser(prev => ({ ...prev, friendCount: Math.max(0, (prev.friendCount || 0) - 1) }))}
            />
          )}

          {activeTab === 'reels' && (
            <ReelsTabContent
              userId={profileUser.id || profileUser._id}
              isOwnProfile={isOwnProfile}
            />
          )}

          {activeTab === 'help' && (
            <div className="space-y-4">
              {helpLoading ? (
                <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading help history...</div>
              ) : helpError ? (
                <div className="text-center py-12">
                  <p className="text-sm text-jolshaa-on-surface-variant mb-3">{helpError}</p>
                  <button
                    onClick={fetchHelpHistory}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-jolshaa-surface-container-low text-jolshaa-on-surface hover:bg-jolshaa-surface-container transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : helpHistory ? (
                <>
                  {/* Stats */}
                  <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-jolshaa-teal/10 rounded-xl">
                        <p className="text-2xl font-bold text-jolshaa-teal">{helpHistory.helpedOthersCount}</p>
                        <p className="text-xs text-jolshaa-on-surface-variant mt-0.5">🤝 Helped others</p>
                      </div>
                      <div className="p-3 bg-jolshaa-indigo/10 rounded-xl">
                        <p className="text-2xl font-bold text-jolshaa-indigo">{helpHistory.helpedCount}</p>
                        <p className="text-xs text-jolshaa-on-surface-variant mt-0.5">💙 Received help</p>
                      </div>
                    </div>
                  </div>

                  {/* Given help */}
                  {helpHistory.given?.length > 0 && (
                    <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
                      <h3 className="font-display text-sm font-bold text-jolshaa-on-surface mb-3">🤝 Helped Others</h3>
                      <div className="space-y-2">
                        {helpHistory.given.map(req => (
                          <Link
                            key={req._id}
                            to={`/help/${req._id}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-jolshaa-surface-container-low transition-colors"
                          >
                            <span className="text-lg">{req.helpType === 'medical' ? '🏥' : req.helpType === 'flood' ? '🌊' : req.helpType === 'fire' ? '🔥' : '🆘'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-jolshaa-on-surface truncate">{req.title}</p>
                              <p className="text-xs text-jolshaa-on-surface-variant">{req.requester?.name} · {req.location?.district}</p>
                            </div>
                            <span className="text-xs text-jolshaa-teal">✓ Resolved</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Received help */}
                  {helpHistory.received?.length > 0 && (
                    <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
                      <h3 className="font-display text-sm font-bold text-jolshaa-on-surface mb-3">💙 Received Help</h3>
                      <div className="space-y-2">
                        {helpHistory.received.map(req => (
                          <Link
                            key={req._id}
                            to={`/help/${req._id}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-jolshaa-surface-container-low transition-colors"
                          >
                            <span className="text-lg">{req.helpType === 'medical' ? '🏥' : req.helpType === 'flood' ? '🌊' : req.helpType === 'fire' ? '🔥' : '🆘'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-jolshaa-on-surface truncate">{req.title}</p>
                              <p className="text-xs text-jolshaa-on-surface-variant">{req.helpers?.length || 0} helpers · {req.location?.district}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              req.status === 'resolved' ? 'bg-jolshaa-teal/10 text-jolshaa-teal' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {req.status === 'resolved' ? '✓ Resolved' : 'Active'}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {helpHistory.given?.length === 0 && helpHistory.received?.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-4xl mb-2">🤝</p>
                      <p className="text-sm text-jolshaa-on-surface-variant">No help history yet</p>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {showReport && (
        <ReportModal targetType="user" targetId={profileUser._id || profileUser.id} userId={profileUser._id || profileUser.id} onClose={() => setShowReport(false)} />
      )}

      <FollowersListModal
        isOpen={showFollowers}
        onClose={() => setShowFollowers(false)}
        userId={profileUser.id || profileUser._id}
        isOwner={isOwnProfile}
      />

      <FollowingListModal
        isOpen={showFollowing}
        onClose={() => setShowFollowing(false)}
        userId={profileUser.id || profileUser._id}
        isOwner={isOwnProfile}
      />

      {isOwnProfile && showManageSections && (
        <ManageSectionsModal
          isOpen={showManageSections}
          onClose={() => setShowManageSections(false)}
          sections={sectionSettings}
          onSaved={(updated) => setProfileUser(prev => ({ ...prev, profileSectionSettings: updated }))}
        />
      )}
    </Layout>
  );
};

export default Profile;

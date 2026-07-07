import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
import CreatePostBox from '../components/CreatePostBox';

const Profile = () => {
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
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

  const isOwnProfile = !id || id === currentUser?.id;

  useEffect(() => {
    if (isOwnProfile) {
      setProfileUser(currentUser);
      setLoading(false);
    } else {
      fetchUserProfile(id);
    }
  }, [id, isOwnProfile, currentUser]);

  useEffect(() => {
    if (activeTab === 'posts' && profileUser) {
      setPosts([]);
      setPage(1);
      fetchPosts(1);
    }
    if (activeTab === 'friends' && profileUser) {
      fetchFriends();
    }
    if (activeTab === 'help' && profileUser) {
      fetchHelpHistory();
    }
  }, [activeTab, profileUser]);

  const fetchUserProfile = async (userId) => {
    try {
      const res = await API.get(`/users/${userId}`);
      setProfileUser(res.data);
    } catch (err) {
      console.error('Failed to fetch user profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (pageNum) => {
    setPostsLoading(true);
    try {
      const res = await API.get(`/users/${profileUser.id}/posts?page=${pageNum}&limit=10`);
      if (pageNum === 1) setPosts(res.data.posts);
      else setPosts(prev => [...prev, ...res.data.posts]);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch posts');
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchFriends = async () => {
    setFriendsLoading(true);
    try {
      const userId = profileUser.id || profileUser._id;
      const res = await API.get(`/friends/${userId}`);
      setFriends(res.data.friends);
    } catch (err) {
      console.error('Failed to fetch friends');
    } finally {
      setFriendsLoading(false);
    }
  };

  const fetchHelpHistory = async () => {
    setHelpLoading(true);
    try {
      const userId = profileUser.id || profileUser._id;
      const res = await API.get(`/help/user/${userId}/history`);
      setHelpHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch help history');
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

  const handleMessage = async () => {
    setMessageLoading(true);
    try {
      const res = await API.post('/conversations', { participantId: profileUser.id || profileUser._id });
      navigate(`/messages/${res.data._id}`);
    } catch (err) {
      console.error('Failed to start conversation');
    } finally {
      setMessageLoading(false);
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

  const getMediaUrl = (item) => (typeof item === 'string' ? item : item.url);
  const isImageMedia = (item) => {
    const url = getMediaUrl(item);
    return !(item?.type === 'video' || url?.endsWith('.mp4') || url?.endsWith('.webm') || url?.endsWith('.mov'));
  };
  const recentPhotos = posts
    .flatMap(p => (p.media || []).filter(isImageMedia).map(getMediaUrl))
    .slice(0, 4);

  const tabs = isOwnProfile
    ? [
        { key: 'posts', label: t('profile.posts') },
        { key: 'about', label: t('profile.about') },
        { key: 'albums', label: 'Albums' },
        { key: 'help', label: '🤝 Help' },
      ]
    : [
        { key: 'posts', label: t('profile.posts') },
        { key: 'about', label: t('profile.about') },
        { key: 'albums', label: 'Albums' },
        { key: 'friends', label: t('profile.friends'), count: profileUser.friendCount || 0 },
        { key: 'help', label: '🤝 Help' },
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
              </div>
              {profileUser.friendCount > 0 && (
                <p className="text-sm text-jolshaa-on-surface-variant mt-0.5">
                  {profileUser.friendCount} friend{profileUser.friendCount !== 1 ? 's' : ''}
                </p>
              )}
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
                {profileUser.work && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {profileUser.work}
                  </span>
                )}
                {profileUser.education && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                    {profileUser.education}
                  </span>
                )}
                {profileUser.location && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {profileUser.location}
                  </span>
                )}
              </div>
              <p className="text-xs text-jolshaa-on-surface-variant/80">
                {t('profile.joined')} {new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Story Highlights */}
        <div className="px-4 sm:px-0 mb-4">
          <StoryHighlights userId={profileUser.id || profileUser._id} />
        </div>

        {/* Subscription Tiers (for creators) */}
        {!isOwnProfile && profileUser.isCreator && (
          <div className="px-4 sm:px-0 mb-4">
            <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
              <SubscriptionTiersPage creatorId={profileUser.id || profileUser._id} />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient mb-4">
          <div className="flex overflow-x-auto border-b border-jolshaa-outline-variant scrollbar-hide">
            {tabs.map((tab) => (
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
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 sm:px-0">
          {activeTab === 'posts' && (
            <div className="flex flex-col lg:flex-row gap-4 items-start">
              {/* Intro + Recent Photos widgets */}
              <div className="w-full lg:w-[280px] flex-shrink-0 space-y-4">
                {(profileUser.work || profileUser.education || profileUser.location || profileUser.createdAt) && (
                  <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
                    <h3 className="text-base font-semibold font-display text-jolshaa-on-surface mb-3">Intro</h3>
                    <div className="space-y-3 text-sm text-jolshaa-on-surface-variant">
                      {profileUser.work && (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          {profileUser.work}
                        </span>
                      )}
                      {profileUser.education && (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-jolshaa-outline flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                          {profileUser.education}
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

                {postsLoading && posts.length === 0 ? (
                  <>
                    <PostSkeleton />
                    <PostSkeleton />
                  </>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-jolshaa-surface-container rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                    </div>
                    <p className="text-sm text-jolshaa-on-surface-variant">
                      {t('profile.noPosts')}
                    </p>
                  </div>
                ) : (
                  <>
                    {posts.map(post => (
                      <PostCard key={post._id} post={post} onDelete={handleDeletePost} />
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
            <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
              <h3 className="text-base font-semibold font-display text-jolshaa-on-surface mb-4">About {profileUser.name}</h3>
              <div className="space-y-4">
                {[
                  { label: 'Bio', value: profileUser.bio },
                  { label: 'Work', value: profileUser.work },
                  { label: 'Education', value: profileUser.education },
                  { label: 'Location', value: profileUser.location },
                  { label: 'Gender', value: profileUser.gender !== 'prefer not to say' ? profileUser.gender : null },
                  { label: 'Date of Birth', value: profileUser.dateOfBirth ? new Date(profileUser.dateOfBirth).toLocaleDateString() : null },
                ].filter(item => item.value).map(item => (
                  <div key={item.label}>
                    <p className="text-xs font-medium text-jolshaa-on-surface-variant uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm text-jolshaa-on-surface mt-0.5 capitalize">{item.value}</p>
                  </div>
                ))}
                {!profileUser.bio && !profileUser.work && !profileUser.education && !profileUser.location && (
                  <p className="text-sm text-jolshaa-on-surface-variant text-center py-4">No info to show</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'albums' && <AlbumGrid userId={profileUser.id || profileUser._id} />}

          {activeTab === 'friends' && (
            <div>
              {friendsLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl skeleton h-16" />
                  ))}
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-jolshaa-surface-container rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-jolshaa-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <p className="text-sm text-jolshaa-on-surface-variant">
                    {isOwnProfile ? "You haven't added friends yet" : `${profileUser.name} hasn't added friends yet`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {friends.map((friend) => (
                    <Link
                      key={friend._id}
                      to={`/profile/${friend._id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-jolshaa-surface-container-lowest shadow-ambient hover:bg-jolshaa-surface-container-low transition-colors"
                    >
                      <Avatar src={friend.profilePhoto} alt={friend.name} size="lg" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-jolshaa-on-surface truncate">{friend.name}</p>
                        {friend.bio && (
                          <p className="text-xs text-jolshaa-on-surface-variant truncate">{friend.bio}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'help' && (
            <div className="space-y-4">
              {helpLoading ? (
                <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading help history...</div>
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
    </Layout>
  );
};

export default Profile;

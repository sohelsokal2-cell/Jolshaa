import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { PostSkeleton } from '../components/ui/Skeleton';
import AlbumGrid from '../components/AlbumGrid';
import PostCard from '../components/PostCard';
import ReportModal from '../components/ReportModal';
import FriendButton from '../components/FriendButton';
import StoryHighlights from '../components/StoryHighlights';

const Profile = () => {
  const { user: currentUser } = useAuth();
  const { id } = useParams();
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

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  };

  const handleFriendStatusChange = (newStatus) => {
    setProfileUser(prev => ({
      ...prev,
      friendStatus: newStatus,
      friendCount: newStatus === 'friends' ? (prev.friendCount || 0) + 1 : Math.max(0, (prev.friendCount || 0) - 1)
    }));
  };

  if (loading || !profileUser) {
    return (
      <Layout showSidebar={false}>
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="h-48 skeleton rounded-xl" />
          <div className="h-24 skeleton rounded-xl" />
          <PostSkeleton />
        </div>
      </Layout>
    );
  }

  const tabs = isOwnProfile
    ? [
        { key: 'posts', label: 'Posts' },
        { key: 'about', label: 'About' },
        { key: 'albums', label: 'Albums' },
      ]
    : [
        { key: 'posts', label: 'Posts' },
        { key: 'about', label: 'About' },
        { key: 'albums', label: 'Albums' },
        { key: 'friends', label: 'Friends', count: profileUser.friendCount || 0 },
      ];

  return (
    <Layout showSidebar={false}>
      <div className="max-w-2xl mx-auto">
        {/* Cover Photo */}
        <div className="relative">
          <div className="h-48 sm:h-64 bg-gradient-to-r from-primary-400 to-primary-600 rounded-xl overflow-hidden">
            {profileUser.coverPhoto && (
              <img src={profileUser.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
            )}
          </div>
        </div>

        {/* Profile Header */}
        <div className="relative px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12 mb-4">
            <div className="relative">
              <Avatar src={profileUser.profilePhoto} alt={profileUser.name} size="3xl" className="ring-4 ring-white dark:ring-neutral-800 shadow-lg" />
            </div>
            <div className="flex-1 min-w-0 sm:pb-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{profileUser.name}</h1>
                {profileUser.isVerified && (
                  <Badge variant="primary" size="sm">
                    <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                    Verified
                  </Badge>
                )}
              </div>
              {profileUser.friendCount > 0 && (
                <p className="text-sm text-neutral-500 mt-0.5">
                  {profileUser.friendCount} friend{profileUser.friendCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 sm:pb-1">
              {!isOwnProfile ? (
                <FriendButton
                  userId={profileUser.id || profileUser._id}
                  initialStatus={profileUser.friendStatus}
                  initialRequestId={profileUser.friendRequestId}
                  onStatusChange={handleFriendStatusChange}
                />
              ) : (
                <Link to="/edit-profile">
                  <Button variant="secondary" size="sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit profile
                  </Button>
                </Link>
              )}
              {!isOwnProfile && (
                <Button variant="ghost" size="sm" onClick={() => setShowReport(true)}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                </Button>
              )}
            </div>
          </div>

          {/* Mutual friends */}
          {!isOwnProfile && profileUser.mutualFriendsCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex -space-x-2">
                {profileUser.mutualFriends?.slice(0, 3).map((f) => (
                  <Avatar key={f._id} src={f.profilePhoto} alt={f.name} size="xs" className="ring-2 ring-white dark:ring-neutral-800" />
                ))}
              </div>
              <p className="text-xs text-neutral-500">
                {profileUser.mutualFriendsCount} mutual friend{profileUser.mutualFriendsCount !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Bio & Info */}
          <Card className="mb-4">
            <div className="space-y-3">
              {profileUser.bio && (
                <p className="text-sm text-neutral-700 dark:text-neutral-300">{profileUser.bio}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-neutral-500">
                {profileUser.work && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {profileUser.work}
                  </span>
                )}
                {profileUser.education && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                    {profileUser.education}
                  </span>
                )}
                {profileUser.location && (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {profileUser.location}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Joined {new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </Card>
        </div>

        {/* Story Highlights */}
        <div className="px-4 sm:px-0 mb-4">
          <StoryHighlights userId={profileUser.id || profileUser._id} />
        </div>

        {/* Tabs */}
        <Card padding={false} className="mb-4">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </Card>

        {/* Tab Content */}
        <div className="px-4 sm:px-0">
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {postsLoading && posts.length === 0 ? (
                <>
                  <PostSkeleton />
                  <PostSkeleton />
                </>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                  </div>
                  <p className="text-sm text-neutral-500">
                    {isOwnProfile ? "You haven't posted anything yet" : `${profileUser.name} hasn't posted yet`}
                  </p>
                </div>
              ) : (
                <>
                  {posts.map(post => (
                    <PostCard key={post._id} post={post} onDelete={handleDeletePost} />
                  ))}
                  {page < totalPages && (
                    <div className="flex justify-center py-4">
                      <Button variant="secondary" onClick={loadMore} loading={postsLoading}>
                        Load more
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <Card>
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">About {profileUser.name}</h3>
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
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm text-neutral-900 dark:text-neutral-100 mt-0.5 capitalize">{item.value}</p>
                  </div>
                ))}
                {!profileUser.bio && !profileUser.work && !profileUser.education && !profileUser.location && (
                  <p className="text-sm text-neutral-400 text-center py-4">No info to show</p>
                )}
              </div>
            </Card>
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
                  <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <p className="text-sm text-neutral-500">
                    {isOwnProfile ? "You haven't added friends yet" : `${profileUser.name} hasn't added friends yet`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {friends.map((friend) => (
                    <Link
                      key={friend._id}
                      to={`/profile/${friend._id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                    >
                      <Avatar src={friend.profilePhoto} alt={friend.name} size="lg" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">{friend.name}</p>
                        {friend.bio && (
                          <p className="text-xs text-neutral-500 truncate">{friend.bio}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
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

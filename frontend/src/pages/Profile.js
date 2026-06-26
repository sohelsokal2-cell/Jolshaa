import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import AlbumGrid from '../components/AlbumGrid';
import PostCard from '../components/PostCard';
import ReportModal from '../components/ReportModal';
import FriendButton from '../components/FriendButton';
import StoryHighlights from '../components/StoryHighlights';

const Profile = () => {
  const { user: currentUser, logout } = useAuth();
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
      if (pageNum === 1) {
        setPosts(res.data.posts);
      } else {
        setPosts(prev => [...prev, ...res.data.posts]);
      }
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

  if (loading || !profileUser) return null;

  const tabs = isOwnProfile
    ? ['posts', 'about', 'albums']
    : ['posts', 'about', 'albums', 'friends'];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md px-6 py-3 flex justify-between items-center">
        <Link to="/feed" className="text-xl font-bold text-blue-600">Jolshaa</Link>
        <div className="flex items-center gap-4">
          {!isOwnProfile && (
            <button onClick={() => setShowReport(true)} className="text-sm text-gray-500 hover:text-red-600 hover:underline">
              Report
            </button>
          )}
          {isOwnProfile && (
            <Link to="/edit-profile" className="text-sm text-blue-600 hover:underline">
              Edit Profile
            </Link>
          )}
          <button onClick={logout} className="text-sm text-red-600 hover:underline">Logout</button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-blue-400 to-blue-600">
            {profileUser.coverPhoto && (
              <img src={profileUser.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
            )}
          </div>

          <div className="px-6 pb-6">
            <div className="relative -mt-16 mb-4 flex items-end gap-4">
              <img
                src={profileUser.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                alt={profileUser.name}
                className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-md"
              />
              {!isOwnProfile && (
                <div className="mb-2">
                  <FriendButton
                    userId={profileUser.id || profileUser._id}
                    initialStatus={profileUser.friendStatus}
                    initialRequestId={profileUser.friendRequestId}
                    onStatusChange={handleFriendStatusChange}
                  />
                </div>
              )}
            </div>

            <h2 className="text-2xl font-bold text-gray-800">{profileUser.name}</h2>
            {profileUser.bio && (
              <p className="text-gray-600 mt-1">{profileUser.bio}</p>
            )}

            {/* Friend count & mutual friends */}
            {profileUser.friendCount > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                <Link to={isOwnProfile ? '/friends' : '#'} className="hover:underline font-medium">
                  {profileUser.friendCount} friend{profileUser.friendCount !== 1 ? 's' : ''}
                </Link>
              </p>
            )}

            {!isOwnProfile && profileUser.mutualFriendsCount > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex -space-x-2">
                  {profileUser.mutualFriends?.slice(0, 3).map((f) => (
                    <img
                      key={f._id}
                      src={f.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                      alt=""
                      className="w-6 h-6 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  {profileUser.mutualFriendsCount} mutual friend{profileUser.mutualFriendsCount !== 1 ? 's' : ''}
                  {profileUser.mutualFriends?.length > 0 && (
                    <span> including {profileUser.mutualFriends.slice(0, 2).map(f => f.name).join(' and ')}</span>
                  )}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              {profileUser.work && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  {profileUser.work}
                </span>
              )}
              {profileUser.education && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                  {profileUser.education}
                </span>
              )}
              {profileUser.location && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {profileUser.location}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Member since {new Date(profileUser.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <StoryHighlights userId={profileUser.id || profileUser._id} />

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mt-4">
          <div className="flex border-b">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-center font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
                {tab === 'friends' && profileUser.friendCount > 0 && (
                  <span className="ml-1 text-xs text-gray-400">({profileUser.friendCount})</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'posts' && (
              <div>
                {postsLoading && posts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Loading posts...</div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No posts yet.</div>
                ) : (
                  <>
                    {posts.map(post => (
                      <PostCard key={post._id} post={post} onDelete={handleDeletePost} />
                    ))}
                    {page < totalPages && (
                      <button
                        onClick={loadMore}
                        disabled={postsLoading}
                        className="w-full py-2 text-blue-600 text-sm hover:underline disabled:opacity-50"
                      >
                        {postsLoading ? 'Loading...' : 'Load More'}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4 text-sm">
                <h3 className="font-semibold text-gray-800">About {profileUser.name}</h3>
                {profileUser.bio && (
                  <div>
                    <p className="text-gray-500 font-medium">Bio</p>
                    <p className="text-gray-700">{profileUser.bio}</p>
                  </div>
                )}
                {profileUser.work && (
                  <div>
                    <p className="text-gray-500 font-medium">Work</p>
                    <p className="text-gray-700">{profileUser.work}</p>
                  </div>
                )}
                {profileUser.education && (
                  <div>
                    <p className="text-gray-500 font-medium">Education</p>
                    <p className="text-gray-700">{profileUser.education}</p>
                  </div>
                )}
                {profileUser.location && (
                  <div>
                    <p className="text-gray-500 font-medium">Location</p>
                    <p className="text-gray-700">{profileUser.location}</p>
                  </div>
                )}
                {profileUser.gender && profileUser.gender !== 'prefer not to say' && (
                  <div>
                    <p className="text-gray-500 font-medium">Gender</p>
                    <p className="text-gray-700 capitalize">{profileUser.gender}</p>
                  </div>
                )}
                {profileUser.dateOfBirth && (
                  <div>
                    <p className="text-gray-500 font-medium">Date of Birth</p>
                    <p className="text-gray-700">{new Date(profileUser.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                )}
                {!profileUser.bio && !profileUser.work && !profileUser.education && !profileUser.location && (
                  <p className="text-gray-400">No info to show</p>
                )}
              </div>
            )}

            {activeTab === 'albums' && <AlbumGrid userId={profileUser.id || profileUser._id} />}

            {activeTab === 'friends' && (
              <div>
                {friendsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading friends...</div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {isOwnProfile ? 'You have no friends yet' : `${profileUser.name} has no friends yet`}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {friends.map((friend) => (
                      <Link
                        key={friend._id}
                        to={`/profile/${friend._id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border"
                      >
                        <img
                          src={friend.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-800 truncate">{friend.name}</p>
                          {friend.bio && (
                            <p className="text-xs text-gray-500 truncate">{friend.bio}</p>
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
      </div>

      {showReport && (
        <ReportModal targetType="user" targetId={profileUser._id || profileUser.id} userId={profileUser._id || profileUser.id} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
};

export default Profile;

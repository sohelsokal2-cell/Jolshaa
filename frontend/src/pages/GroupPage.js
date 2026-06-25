import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import PostCard from '../components/PostCard';
import CreatePostBox from '../components/CreatePostBox';
import NotificationBell from '../components/NotificationBell';
import Toast from '../components/Toast';

const GroupPage = () => {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [pendingUsers, setPendingUsers] = useState([]);

  useEffect(() => {
    fetchGroup();
    fetchPosts();
  }, [id]);

  const fetchGroup = async () => {
    try {
      const res = await API.get(`/groups/${id}`);
      setGroup(res.data);
      if (res.data.isAdmin) fetchPendingRequests();
    } catch (err) {
      console.error('Failed to fetch group');
    }
  };

  const fetchPosts = async (pageNum = 1) => {
    try {
      const res = await API.get(`/groups/${id}/feed?page=${pageNum}&limit=10`);
      if (pageNum === 1) {
        setPosts(res.data.posts);
      } else {
        setPosts(prev => [...prev, ...res.data.posts]);
      }
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await API.get(`/groups/${id}`);
      setPendingUsers(res.data.pendingRequests || []);
    } catch (err) {
      console.error('Failed to fetch pending requests');
    }
  };

  const handleJoin = async () => {
    try {
      const res = await API.put(`/groups/${id}/join`);
      if (res.data.status === 'member') {
        setGroup(prev => ({
          ...prev,
          isMember: true,
          memberCount: (prev.memberCount || 0) + 1
        }));
      } else {
        setGroup(prev => ({ ...prev, hasPendingRequest: true }));
      }
    } catch (err) {
      console.error('Failed to join group');
    }
  };

  const handleLeave = async () => {
    try {
      await API.put(`/groups/${id}/leave`);
      setGroup(prev => ({
        ...prev,
        isMember: false,
        isAdmin: false,
        memberCount: (prev.memberCount || 0) - 1
      }));
    } catch (err) {
      console.error('Failed to leave group');
    }
  };

  const handleApprove = async (userId) => {
    try {
      await API.put(`/groups/${id}/approve/${userId}`);
      setPendingUsers(prev => prev.filter(u => u._id !== userId));
      setGroup(prev => ({
        ...prev,
        memberCount: (prev.memberCount || 0) + 1
      }));
    } catch (err) {
      console.error('Failed to approve request');
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await API.delete(`/groups/${id}/remove/${userId}`);
      setGroup(prev => ({
        ...prev,
        memberCount: (prev.memberCount || 0) - 1
      }));
    } catch (err) {
      console.error('Failed to remove member');
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  if (!group) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md px-6 py-3 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/feed" className="text-xl font-bold text-blue-600">Jolshaa</Link>
          <div className="flex items-center gap-4">
            <Link to="/groups" className="text-sm text-gray-600 hover:text-blue-600">Groups</Link>
            <NotificationBell />
            <button onClick={logout} className="text-sm text-red-600 hover:underline">Logout</button>
          </div>
        </div>
      </nav>

      {/* Cover Photo */}
      <div className="h-64 bg-gradient-to-r from-blue-400 to-blue-600 relative">
        {group.coverPhoto && (
          <img src={group.coverPhoto} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Group Info */}
        <div className="bg-white rounded-lg shadow-md p-6 -mt-16 relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <p className="text-gray-500 mt-1">
                {group.memberCount} members · {group.privacy === 'public' ? 'Public' : 'Private'} Group
              </p>
            </div>
            <div className="flex gap-2">
              {!group.isMember ? (
                <button
                  onClick={handleJoin}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  {group.hasPendingRequest ? 'Request Pending' : 'Join Group'}
                </button>
              ) : !group.isCreator ? (
                <button
                  onClick={handleLeave}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Leave Group
                </button>
              ) : null}
            </div>
          </div>
          {group.description && (
            <p className="text-gray-600 mt-3">{group.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-4 border-b bg-white rounded-t-lg px-4">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-3 text-sm font-medium border-b-2 ${
              activeTab === 'posts' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-3 text-sm font-medium border-b-2 ${
              activeTab === 'members' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            Members
          </button>
          {group.isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-3 text-sm font-medium border-b-2 ${
                activeTab === 'admin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
              }`}
            >
              Admin ({pendingUsers.length})
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mt-4 pb-8">
          {activeTab === 'posts' && (
            <>
              {group.isMember && (
                <CreatePostBox
                  onPostCreated={handlePostCreated}
                  postedInType="group"
                  postedInRefId={id}
                />
              )}
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading posts...</div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No posts yet</div>
              ) : (
                posts.map(post => (
                  <PostCard key={post._id} post={post} onDelete={handleDeletePost} />
                ))
              )}
            </>
          )}

          {activeTab === 'members' && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold mb-3">Members ({group.memberCount})</h3>
              <div className="grid grid-cols-2 gap-3">
                {group.members?.map(member => (
                  <div key={member._id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                    <img
                      src={member.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      {group.admins?.some(a => a._id === member._id) && (
                        <span className="text-xs text-blue-600">Admin</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'admin' && group.isAdmin && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold mb-3">Pending Requests ({pendingUsers.length})</h3>
              {pendingUsers.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending requests</p>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map(request => (
                    <div key={request._id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-3">
                        <img
                          src={request.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="font-medium text-sm">{request.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRemoveMember(request._id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Toast />
    </div>
  );
};

export default GroupPage;

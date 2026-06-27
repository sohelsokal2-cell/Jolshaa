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
  const [editingRules, setEditingRules] = useState(false);
  const [rulesText, setRulesText] = useState('');

  useEffect(() => {
    fetchGroup();
    fetchPosts();
  }, [id]);

  const fetchGroup = async () => {
    try {
      const res = await API.get(`/groups/${id}`);
      setGroup(res.data);
      setRulesText((res.data.rules || []).join('\n'));
      if (res.data.isAdmin || res.data.isModerator) fetchPendingRequests();
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
        setGroup(prev => ({ ...prev, isMember: true, memberCount: (prev.memberCount || 0) + 1 }));
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
      setGroup(prev => ({ ...prev, isMember: false, isAdmin: false, isModerator: false, memberCount: (prev.memberCount || 0) - 1 }));
    } catch (err) {
      console.error('Failed to leave group');
    }
  };

  const handleApprove = async (userId) => {
    try {
      await API.put(`/groups/${id}/approve/${userId}`);
      setPendingUsers(prev => prev.filter(u => u._id !== userId));
      setGroup(prev => ({ ...prev, memberCount: (prev.memberCount || 0) + 1 }));
    } catch (err) {
      console.error('Failed to approve request');
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await API.delete(`/groups/${id}/remove/${userId}`);
      setGroup(prev => ({ ...prev, memberCount: (prev.memberCount || 0) - 1 }));
    } catch (err) {
      console.error('Failed to remove member');
    }
  };

  const handleAddModerator = async (userId) => {
    try {
      await API.put(`/groups/${id}/moderator/${userId}`);
      fetchGroup();
    } catch (err) {
      console.error('Failed to add moderator');
    }
  };

  const handleRemoveModerator = async (userId) => {
    try {
      await API.delete(`/groups/${id}/moderator/${userId}`);
      fetchGroup();
    } catch (err) {
      console.error('Failed to remove moderator');
    }
  };

  const handlePinPost = async (postId) => {
    try {
      const res = await API.put(`/groups/${id}/pin/${postId}`);
      fetchGroup();
    } catch (err) {
      console.error('Failed to pin post');
    }
  };

  const handleSaveRules = async () => {
    const rules = rulesText.split('\n').filter(r => r.trim());
    try {
      await API.put(`/groups/${id}/rules`, { rules });
      setGroup(prev => ({ ...prev, rules }));
      setEditingRules(false);
    } catch (err) {
      console.error('Failed to save rules');
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  if (!group) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  const canModerate = group.isAdmin || group.isModerator;

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
                {group.isModerator && !group.isAdmin && <span className="ml-2 text-blue-600 font-medium">Moderator</span>}
              </p>
            </div>
            <div className="flex gap-2">
              {!group.isMember ? (
                <button onClick={handleJoin} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  {group.hasPendingRequest ? 'Request Pending' : 'Join Group'}
                </button>
              ) : !group.isCreator ? (
                <button onClick={handleLeave} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                  Leave Group
                </button>
              ) : null}
            </div>
          </div>
          {group.description && <p className="text-gray-600 mt-3">{group.description}</p>}

          {/* Rules */}
          {group.rules && group.rules.length > 0 && !editingRules && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-gray-700">Group Rules</h4>
                {group.isAdmin && (
                  <button onClick={() => setEditingRules(true)} className="text-xs text-blue-600 hover:underline">Edit</button>
                )}
              </div>
              <ol className="list-decimal list-inside space-y-1">
                {group.rules.map((rule, i) => (
                  <li key={i} className="text-sm text-gray-600">{rule}</li>
                ))}
              </ol>
            </div>
          )}

          {group.isAdmin && editingRules && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Edit Rules (one per line)</h4>
              <textarea
                value={rulesText}
                onChange={(e) => setRulesText(e.target.value)}
                rows={5}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Be respectful&#10;No spam&#10;No self-promotion"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleSaveRules} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Save</button>
                <button onClick={() => setEditingRules(false)} className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">Cancel</button>
              </div>
            </div>
          )}

          {group.isAdmin && !editingRules && (!group.rules || group.rules.length === 0) && (
            <button onClick={() => setEditingRules(true)} className="mt-3 text-sm text-blue-600 hover:underline">
              + Add Group Rules
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-4 border-b bg-white rounded-t-lg px-4">
          {['posts', 'members'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium border-b-2 capitalize ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
          {canModerate && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-3 text-sm font-medium border-b-2 ${
                activeTab === 'admin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
              }`}
            >
              Admin {group.isAdmin && `(${pendingUsers.length})`}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mt-4 pb-8">
          {activeTab === 'posts' && (
            <>
              {/* Pinned Post */}
              {group.pinnedPost && (
                <div className="mb-4">
                  <div className="flex items-center gap-1 text-sm text-blue-600 font-medium mb-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                    </svg>
                    Pinned Post
                  </div>
                  <PostCard post={group.pinnedPost} onDelete={handleDeletePost} />
                </div>
              )}

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
              {/* Moderators */}
              {group.moderators && group.moderators.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2 text-sm text-gray-700">Moderators</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {group.moderators.map(mod => (
                      <Link key={mod._id} to={`/profile/${mod._id}`} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
                        <img src={mod.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <span className="text-sm font-medium">{mod.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="font-semibold mb-3">All Members ({group.memberCount})</h3>
              <div className="grid grid-cols-2 gap-3">
                {group.members?.map(member => (
                  <div key={member._id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                    <img
                      src={member.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{member.name}</p>
                      <div className="flex gap-1">
                        {group.admins?.some(a => a._id === member._id) && (
                          <span className="text-xs text-purple-600">Admin</span>
                        )}
                        {group.moderators?.some(m => m._id === member._id) && (
                          <span className="text-xs text-blue-600">Mod</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'admin' && canModerate && (
            <div className="space-y-4">
              {/* Pending Requests (admin only) */}
              {group.isAdmin && (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="font-semibold mb-3">Pending Requests ({pendingUsers.length})</h3>
                  {pendingUsers.length === 0 ? (
                    <p className="text-gray-500 text-sm">No pending requests</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingUsers.map(request => (
                        <div key={request._id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-3">
                            <img src={request.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'} alt="" className="w-10 h-10 rounded-full object-cover" />
                            <span className="font-medium text-sm">{request.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(request._id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Approve</button>
                            <button onClick={() => handleRemoveMember(request._id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Reject</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Manage Moderators (admin only) */}
              {group.isAdmin && (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="font-semibold mb-3">Manage Moderators</h3>
                  <p className="text-sm text-gray-500 mb-3">Moderators can approve requests, pin posts, and create announcements.</p>
                  <div className="space-y-2">
                    {group.members?.filter(m => !group.admins?.some(a => a._id === m._id)).map(member => {
                      const isMod = group.moderators?.some(m => m._id === member._id);
                      return (
                        <div key={member._id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-3">
                            <img src={member.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'} alt="" className="w-8 h-8 rounded-full object-cover" />
                            <span className="text-sm">{member.name}</span>
                          </div>
                          <button
                            onClick={() => isMod ? handleRemoveModerator(member._id) : handleAddModerator(member._id)}
                            className={`text-xs px-3 py-1 rounded ${isMod ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                          >
                            {isMod ? 'Remove Mod' : 'Make Mod'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pin Post */}
              {group.pinnedPost && (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="font-semibold mb-2">Pinned Post</h3>
                  <button onClick={() => handlePinPost(group.pinnedPost._id)} className="text-sm text-red-600 hover:underline">
                    Unpin Post
                  </button>
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

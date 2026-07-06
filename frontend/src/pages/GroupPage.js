import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import PostCard from '../components/PostCard';
import CreatePostBox from '../components/CreatePostBox';
import Layout from '../components/layout/Layout';
import Toast from '../components/ui/Toast';

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

  if (!group) return (
    <Layout>
      <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>
    </Layout>
  );

  const canModerate = group.isAdmin || group.isModerator;

  return (
    <Layout>
      {/* Cover Photo */}
      <div className="h-48 sm:h-64 bg-gradient-to-r from-jolshaa-teal to-jolshaa-indigo relative rounded-t-xl overflow-hidden -mx-4 -mt-4 sm:mx-0 sm:mt-0">
        {group.coverPhoto && (
          <img src={group.coverPhoto} alt={group.name} className="w-full h-full object-cover" />
        )}
      </div>

      <div>
        {/* Group Info */}
        <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-6 -mt-16 relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold font-display text-jolshaa-on-surface">{group.name}</h1>
              <p className="text-jolshaa-on-surface-variant mt-1">
                {group.memberCount} members · {group.privacy === 'public' ? 'Public' : 'Private'} Group
                {group.isModerator && !group.isAdmin && <span className="ml-2 text-jolshaa-indigo font-medium">Moderator</span>}
              </p>
            </div>
            <div className="flex gap-2">
              {!group.isMember ? (
                <button onClick={handleJoin} className="bg-jolshaa-teal text-jolshaa-on-teal px-4 py-2 rounded-lg text-sm font-medium hover:bg-jolshaa-teal-container transition-colors shadow-ambient">
                  {group.hasPendingRequest ? 'Request Pending' : 'Join Group'}
                </button>
              ) : !group.isCreator ? (
                <button onClick={handleLeave} className="px-4 py-2 rounded-lg text-sm font-medium text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low transition-colors">
                  Leave Group
                </button>
              ) : null}
            </div>
          </div>
          {group.description && <p className="text-jolshaa-on-surface-variant mt-3">{group.description}</p>}

          {/* Rules */}
          {group.rules && group.rules.length > 0 && !editingRules && (
            <div className="mt-4 p-3 bg-jolshaa-surface-container-low rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-display font-medium text-sm text-jolshaa-on-surface">Group Rules</h4>
                {group.isAdmin && (
                  <button onClick={() => setEditingRules(true)} className="text-xs text-jolshaa-teal hover:underline">Edit</button>
                )}
              </div>
              <ol className="list-decimal list-inside space-y-1">
                {group.rules.map((rule, i) => (
                  <li key={i} className="text-sm text-jolshaa-on-surface-variant">{rule}</li>
                ))}
              </ol>
            </div>
          )}

          {group.isAdmin && editingRules && (
            <div className="mt-4 p-3 bg-jolshaa-surface-container-low rounded-lg">
              <h4 className="font-display font-medium text-sm text-jolshaa-on-surface mb-2">Edit Rules (one per line)</h4>
              <textarea
                value={rulesText}
                onChange={(e) => setRulesText(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-lg text-sm text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
                placeholder="Be respectful&#10;No spam&#10;No self-promotion"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleSaveRules} className="px-3 py-1.5 bg-jolshaa-teal text-jolshaa-on-teal rounded-lg text-sm font-medium hover:bg-jolshaa-teal-container transition-colors">Save</button>
                <button onClick={() => setEditingRules(false)} className="px-3 py-1.5 text-sm text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low rounded-lg transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {group.isAdmin && !editingRules && (!group.rules || group.rules.length === 0) && (
            <button onClick={() => setEditingRules(true)} className="mt-3 text-sm text-jolshaa-teal hover:underline">
              + Add Group Rules
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-4 border-b border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest rounded-t-xl px-4">
          {['posts', 'members'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium border-b-2 capitalize transition-colors ${
                activeTab === tab ? 'border-jolshaa-teal text-jolshaa-teal' : 'border-transparent text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface'
              }`}
            >
              {tab}
            </button>
          ))}
          {canModerate && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'admin' ? 'border-jolshaa-teal text-jolshaa-teal' : 'border-transparent text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface'
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
                  <div className="flex items-center gap-1 text-sm text-jolshaa-teal font-medium mb-1">
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
                <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading posts...</div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-jolshaa-on-surface-variant">No posts yet</div>
              ) : (
                posts.map(post => (
                  <PostCard key={post._id} post={post} onDelete={handleDeletePost} />
                ))
              )}
            </>
          )}

          {activeTab === 'members' && (
            <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
              {/* Moderators */}
              {group.moderators && group.moderators.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-display font-semibold mb-2 text-sm text-jolshaa-on-surface">Moderators</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {group.moderators.map(mod => (
                      <Link key={mod._id} to={`/profile/${mod._id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-jolshaa-surface-container-low transition-colors">
                        <img src={mod.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'} alt={mod.name} className="w-8 h-8 rounded-full object-cover" />
                        <span className="text-sm font-medium text-jolshaa-on-surface">{mod.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="font-display font-semibold mb-3 text-jolshaa-on-surface">All Members ({group.memberCount})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.members?.map(member => (
                  <div key={member._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-jolshaa-surface-container-low transition-colors">
                    <img
                      src={member.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-jolshaa-on-surface truncate">{member.name}</p>
                      <div className="flex gap-1">
                        {group.admins?.some(a => a._id === member._id) && (
                          <span className="text-xs text-jolshaa-teal">Admin</span>
                        )}
                        {group.moderators?.some(m => m._id === member._id) && (
                          <span className="text-xs text-jolshaa-indigo">Mod</span>
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
                <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
                  <h3 className="font-display font-semibold mb-3 text-jolshaa-on-surface">Pending Requests ({pendingUsers.length})</h3>
                  {pendingUsers.length === 0 ? (
                    <p className="text-jolshaa-on-surface-variant text-sm">No pending requests</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingUsers.map(request => (
                        <div key={request._id} className="flex items-center justify-between p-2 border border-jolshaa-outline-variant rounded-lg">
                          <div className="flex items-center gap-3">
                            <img src={request.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'} alt={request.name} className="w-10 h-10 rounded-full object-cover" />
                            <span className="font-medium text-sm text-jolshaa-on-surface">{request.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(request._id)} className="px-3 py-1 bg-jolshaa-teal text-jolshaa-on-teal rounded-lg text-sm font-medium hover:bg-jolshaa-teal-container transition-colors">Approve</button>
                            <button onClick={() => handleRemoveMember(request._id)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">Reject</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Manage Moderators (admin only) */}
              {group.isAdmin && (
                <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
                  <h3 className="font-display font-semibold mb-3 text-jolshaa-on-surface">Manage Moderators</h3>
                  <p className="text-sm text-jolshaa-on-surface-variant mb-3">Moderators can approve requests, pin posts, and create announcements.</p>
                  <div className="space-y-2">
                    {group.members?.filter(m => !group.admins?.some(a => a._id === m._id)).map(member => {
                      const isMod = group.moderators?.some(mod => mod._id === member._id);
                      return (
                        <div key={member._id} className="flex items-center justify-between p-2 border border-jolshaa-outline-variant rounded-lg">
                          <div className="flex items-center gap-3">
                            <img src={member.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                            <span className="text-sm text-jolshaa-on-surface">{member.name}</span>
                          </div>
                          <button
                            onClick={() => isMod ? handleRemoveModerator(member._id) : handleAddModerator(member._id)}
                            className={`text-xs px-3 py-1 rounded-lg transition-colors ${isMod ? 'bg-red-500/15 text-red-500 hover:bg-red-500/25' : 'bg-jolshaa-teal/15 text-jolshaa-teal hover:bg-jolshaa-teal/25'}`}
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
                <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
                  <h3 className="font-display font-semibold mb-2 text-jolshaa-on-surface">Pinned Post</h3>
                  <button onClick={() => handlePinPost(group.pinnedPost._id)} className="text-sm text-red-500 hover:underline">
                    Unpin Post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Toast />
    </Layout>
  );
};

export default GroupPage;

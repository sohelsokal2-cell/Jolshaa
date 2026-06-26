import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import PostCard from '../components/PostCard';
import CreatePostBox from '../components/CreatePostBox';
import NotificationBell from '../components/NotificationBell';
import Toast from '../components/Toast';

const PagePage = () => {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const [page, setPage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [insights, setInsights] = useState(null);
  const [editData, setEditData] = useState({ name: '', description: '', category: '' });
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const categories = ['Business', 'Entertainment', 'Health', 'Education', 'Technology', 'Sports', 'Music', 'Art', 'Food', 'Travel', 'Other'];

  useEffect(() => { fetchPage(); fetchPosts(); }, [id]);

  const fetchPage = async () => {
    try {
      const res = await API.get(`/pages/${id}`);
      setPage(res.data);
      setEditData({ name: res.data.name, description: res.data.description || '', category: res.data.category });
    } catch (err) { console.error('Failed to fetch page'); }
  };

  const fetchPosts = async (p = 1) => {
    try {
      const res = await API.get(`/pages/${id}/feed?page=${p}&limit=10`);
      setPosts(p === 1 ? res.data.posts : [...posts, ...res.data.posts]);
    } catch (err) { console.error('Failed to fetch posts'); } finally { setLoading(false); }
  };

  const fetchInsights = async () => {
    try { const res = await API.get(`/pages/${id}/insights`); setInsights(res.data); } catch (err) { console.error('Failed'); }
  };

  const handleFollow = async () => {
    try {
      const res = await API.put(`/pages/${id}/follow`);
      setPage(prev => ({ ...prev, isFollowing: res.data.isFollowing, followerCount: res.data.isFollowing ? (prev.followerCount || 0) + 1 : (prev.followerCount || 1) - 1 }));
    } catch (err) { console.error('Failed'); }
  };

  const handleFeaturePost = async (postId) => {
    try { await API.put(`/pages/${id}/feature/${postId}`); fetchPage(); } catch (err) { console.error('Failed'); }
  };

  const handleSaveSettings = async () => {
    try { const res = await API.put(`/pages/${id}`, editData); setPage(prev => ({ ...prev, ...res.data })); } catch (err) { console.error('Failed'); }
  };

  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append(type, file);
    try { await API.put(`/pages/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); fetchPage(); } catch (err) { console.error('Failed'); }
  };

  const handlePostCreated = (newPost) => setPosts([newPost, ...posts]);
  const handleDeletePost = (postId) => setPosts(posts.filter(p => p._id !== postId));

  const handleTabChange = (tab) => { setActiveTab(tab); if (tab === 'insights' && !insights) fetchInsights(); };

  if (!page) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md px-6 py-3 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/feed" className="text-xl font-bold text-blue-600">Jolshaa</Link>
          <div className="flex items-center gap-4">
            <Link to="/pages" className="text-sm text-gray-600 hover:text-blue-600">Pages</Link>
            <NotificationBell />
            <button onClick={logout} className="text-sm text-red-600 hover:underline">Logout</button>
          </div>
        </div>
      </nav>

      <div className="h-64 bg-gradient-to-r from-purple-400 to-purple-600 relative">
        {page.coverPhoto && <img src={page.coverPhoto} alt="" className="w-full h-full object-cover" />}
        {page.isAdmin && (<>
          <input type="file" ref={coverInputRef} accept="image/*" onChange={(e) => handlePhotoUpload(e, 'coverPhoto')} className="hidden" />
          <button onClick={() => coverInputRef.current.click()} className="absolute bottom-2 right-2 bg-white text-sm px-3 py-1 rounded shadow">Change Cover</button>
        </>)}
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 -mt-16 relative z-10">
          <div className="flex items-start gap-4">
            <div className="relative">
              {page.profilePhoto ? (
                <img src={page.profilePhoto} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center border-4 border-white shadow-md">
                  <span className="text-purple-600 font-bold text-2xl">{page.name.charAt(0)}</span>
                </div>
              )}
              {page.isAdmin && (<>
                <input type="file" ref={profileInputRef} accept="image/*" onChange={(e) => handlePhotoUpload(e, 'profilePhoto')} className="hidden" />
                <button onClick={() => profileInputRef.current.click()} className="absolute bottom-0 right-0 bg-white text-xs px-2 py-1 rounded shadow">Edit</button>
              </>)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    {page.name}
                    {page.isVerified && (
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded-full text-xs">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                      </span>
                    )}
                  </h1>
                  <p className="text-gray-500 mt-1">{page.followerCount} followers · {page.category}</p>
                </div>
                <div className="flex gap-2">
                  {!page.isAdmin && (
                    <button onClick={handleFollow} className={`px-4 py-2 rounded-lg transition ${page.isFollowing ? 'bg-gray-200 text-gray-700' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                      {page.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>
              {page.description && <p className="text-gray-600 mt-3">{page.description}</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-4 border-b bg-white rounded-t-lg px-4">
          {['posts', ...(page.isAdmin ? ['insights', 'settings'] : [])].map(tab => (
            <button key={tab} onClick={() => handleTabChange(tab)} className={`py-3 text-sm font-medium border-b-2 capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-4 pb-8">
          {activeTab === 'posts' && (<>
            {page.featuredPost && (
              <div className="mb-4">
                <div className="flex items-center gap-1 text-sm text-purple-600 font-medium mb-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  Featured Post
                </div>
                <PostCard post={page.featuredPost} onDelete={handleDeletePost} />
              </div>
            )}
            {page.isAdmin && <CreatePostBox onPostCreated={handlePostCreated} postedInType="page" postedInRefId={id} />}
            {loading ? <div className="text-center py-8 text-gray-500">Loading...</div> :
              posts.length === 0 ? <div className="text-center py-8 text-gray-500">No posts yet</div> :
              posts.map(post => (
                <div key={post._id} className="mb-4">
                  <PostCard post={post} onDelete={handleDeletePost} />
                  {page.isAdmin && (
                    <div className="text-right -mt-2 mb-2">
                      <button onClick={() => handleFeaturePost(post._id)} className="text-xs text-purple-600 hover:underline">
                        {page.featuredPost?._id === post._id ? 'Unfeature' : 'Feature Post'}
                      </button>
                    </div>
                  )}
                </div>
              ))
            }
          </>)}

          {activeTab === 'insights' && page.isAdmin && insights && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Page Insights</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { value: insights.totalFollowers, label: 'Followers', color: 'text-purple-600' },
                  { value: insights.totalPosts, label: 'Posts', color: 'text-blue-600' },
                  { value: insights.totalReactions, label: 'Reactions', color: 'text-green-600' },
                  { value: insights.totalComments, label: 'Comments', color: 'text-orange-600' },
                  { value: insights.avgReactionsPerPost, label: 'Avg Reactions/Post', color: 'text-gray-800' },
                  { value: insights.avgCommentsPerPost, label: 'Avg Comments/Post', color: 'text-gray-800' },
                ].map((stat, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && page.isAdmin && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Page Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page Name</label>
                  <input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button onClick={handleSaveSettings} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Changes</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Toast />
    </div>
  );
};

export default PagePage;

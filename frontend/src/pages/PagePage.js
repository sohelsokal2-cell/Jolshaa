import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import PostCard from '../components/PostCard';
import CreatePostBox from '../components/CreatePostBox';
import ReviewSection from '../components/ReviewSection';
import Layout from '../components/layout/Layout';
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

  if (!page) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;

  return (
    <Layout>
      <div className="h-64 bg-gradient-to-r from-jolshaa-indigo to-jolshaa-teal relative rounded-t-xl overflow-hidden -mx-4 -mt-4 sm:mx-0 sm:mt-0">
        {page.coverPhoto && <img src={page.coverPhoto} alt={`${page.name} cover photo`} className="w-full h-full object-cover" />}
        {page.isAdmin && (<>
          <input type="file" ref={coverInputRef} accept="image/*" onChange={(e) => handlePhotoUpload(e, 'coverPhoto')} className="hidden" />
          <button onClick={() => coverInputRef.current.click()} className="absolute bottom-2 right-2 bg-jolshaa-surface-container-lowest text-sm px-3 py-1 rounded-lg shadow-ambient text-jolshaa-on-surface">Change Cover</button>
        </>)}
      </div>

      <div>
        <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-6 -mt-16 relative z-10">
          <div className="flex items-start gap-4">
            <div className="relative">
              {page.profilePhoto ? (
                <img src={page.profilePhoto} alt={`${page.name} profile photo`} className="w-24 h-24 rounded-full object-cover border-4 border-jolshaa-surface-container-lowest shadow-ambient" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-jolshaa-teal/10 flex items-center justify-center border-4 border-jolshaa-surface-container-lowest shadow-ambient">
                  <span className="text-jolshaa-teal font-bold text-2xl">{page.name.charAt(0)}</span>
                </div>
              )}
              {page.isAdmin && (<>
                <input type="file" ref={profileInputRef} accept="image/*" onChange={(e) => handlePhotoUpload(e, 'profilePhoto')} className="hidden" />
                <button onClick={() => profileInputRef.current.click()} className="absolute bottom-0 right-0 bg-jolshaa-surface-container-lowest text-xs px-2 py-1 rounded-lg shadow-ambient text-jolshaa-on-surface">Edit</button>
              </>)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold font-display flex items-center gap-2 text-jolshaa-on-surface">
                    {page.name}
                    {page.isVerified && (
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-jolshaa-teal text-jolshaa-on-teal rounded-full text-xs">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                      </span>
                    )}
                  </h1>
                  <p className="text-jolshaa-on-surface-variant mt-1">{page.followerCount} followers · {page.category}</p>
                </div>
                <div className="flex gap-2">
                  {!page.isAdmin && (
                    <button onClick={handleFollow} className={`px-4 py-2 rounded-lg font-medium transition-colors ${page.isFollowing ? 'bg-jolshaa-surface-container text-jolshaa-on-surface hover:bg-jolshaa-surface-container-high' : 'bg-jolshaa-indigo text-jolshaa-on-indigo-fixed hover:bg-jolshaa-indigo-container'}`}>
                      {page.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>
              {page.description && <p className="text-jolshaa-on-surface-variant mt-3">{page.description}</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-4 border-b border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest rounded-t-xl px-4">
          {['posts', 'reviews', ...(page.isAdmin ? ['insights', 'settings'] : [])].map(tab => (
            <button key={tab} onClick={() => handleTabChange(tab)} className={`py-3 text-sm font-medium border-b-2 capitalize transition-colors ${activeTab === tab ? 'border-jolshaa-teal text-jolshaa-teal' : 'border-transparent text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-4 pb-8">
          {activeTab === 'posts' && (<>
            {page.featuredPost && (
              <div className="mb-4">
                <div className="flex items-center gap-1 text-sm text-jolshaa-teal font-medium mb-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  Featured Post
                </div>
                <PostCard post={page.featuredPost} onDelete={handleDeletePost} />
              </div>
            )}
            {page.isAdmin && <CreatePostBox onPostCreated={handlePostCreated} postedInType="page" postedInRefId={id} />}
            {loading ? <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div> :
              posts.length === 0 ? <div className="text-center py-8 text-jolshaa-on-surface-variant">No posts yet</div> :
              posts.map(post => (
                <div key={post._id} className="mb-4">
                  <PostCard post={post} onDelete={handleDeletePost} />
                  {page.isAdmin && (
                    <div className="text-right -mt-2 mb-2">
                      <button onClick={() => handleFeaturePost(post._id)} className="text-xs text-jolshaa-teal hover:underline">
                        {page.featuredPost?._id === post._id ? 'Unfeature' : 'Feature Post'}
                      </button>
                    </div>
                  )}
                </div>
              ))
            }
          </>)}

          {activeTab === 'reviews' && (
            <ReviewSection pageId={id} isFollowing={page.isFollowing} isAdmin={page.isAdmin} />
          )}

          {activeTab === 'insights' && page.isAdmin && insights && (
            <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-6">
              <h3 className="font-semibold font-display text-jolshaa-on-surface mb-4">Page Insights</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { value: insights.totalFollowers, label: 'Followers', color: 'text-jolshaa-teal' },
                  { value: insights.totalPosts, label: 'Posts', color: 'text-jolshaa-indigo' },
                  { value: insights.totalReactions, label: 'Reactions', color: 'text-green-500' },
                  { value: insights.totalComments, label: 'Comments', color: 'text-jolshaa-coral' },
                  { value: insights.avgReactionsPerPost, label: 'Avg Reactions/Post', color: 'text-jolshaa-on-surface' },
                  { value: insights.avgCommentsPerPost, label: 'Avg Comments/Post', color: 'text-jolshaa-on-surface' },
                ].map((stat, i) => (
                  <div key={i} className="bg-jolshaa-surface-container-low rounded-lg p-4 text-center">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-sm text-jolshaa-on-surface-variant">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && page.isAdmin && (
            <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-6">
              <h3 className="font-semibold font-display text-jolshaa-on-surface mb-4">Page Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-jolshaa-on-surface mb-1">Page Name</label>
                  <input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-lg text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-jolshaa-on-surface mb-1">Description</label>
                  <textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows={3} className="w-full px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-lg text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-jolshaa-on-surface mb-1">Category</label>
                  <select value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value })} className="w-full px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-lg text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button onClick={handleSaveSettings} className="bg-jolshaa-teal px-4 py-2 text-jolshaa-on-teal rounded-lg text-sm font-medium hover:bg-jolshaa-teal-container transition-colors">Save Changes</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Toast />
    </Layout>
  );
};

export default PagePage;

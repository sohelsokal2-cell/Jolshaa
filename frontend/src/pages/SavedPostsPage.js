import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import PostCard from '../components/PostCard';
import Layout from '../components/layout/Layout';

const SavedPostsPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [folders, setFolders] = useState([]);
  const [unorganizedCount, setUnorganizedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [activeFolder, setActiveFolder] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderIcon, setFolderIcon] = useState('📁');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [postsRes, foldersRes] = await Promise.all([
        API.get(`/posts/saved/${user.id}`),
        API.get('/saved-folders'),
      ]);
      setPosts(postsRes.data.posts);
      setFolders(foldersRes.data.folders);
      setUnorganizedCount(foldersRes.data.unorganizedCount);
    } catch (err) {
      console.error('Failed to fetch saved posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      const res = await API.post('/saved-folders', { name: folderName, icon: folderIcon });
      setFolders(prev => [res.data.folder, ...prev]);
      setFolderName('');
      setFolderIcon('📁');
      setShowCreateFolder(false);
    } catch (err) {
      console.error('Failed to create folder');
    }
  };

  const handleDeleteFolder = async (id) => {
    try {
      await API.delete(`/saved-folders/${id}`);
      setFolders(prev => prev.filter(f => f._id !== id));
      if (activeFolder === id) setActiveFolder(null);
    } catch (err) {
      console.error('Failed to delete folder');
    }
  };

  const handleAddToFolder = async (folderId, postId) => {
    try {
      await API.post(`/saved-folders/${folderId}/add`, { postId });
      setFolders(prev => prev.map(f =>
        f._id === folderId ? { ...f, posts: [...f.posts, { _id: postId }] } : f
      ));
    } catch (err) {
      console.error('Failed to add to folder');
    }
  };

  const handleRemoveFromFolder = async (folderId, postId) => {
    try {
      await API.delete(`/saved-folders/${folderId}/post/${postId}`);
      setFolders(prev => prev.map(f =>
        f._id === folderId ? { ...f, posts: f.posts.filter(p => p._id !== postId) } : f
      ));
    } catch (err) {
      console.error('Failed to remove from folder');
    }
  };

  const filteredPosts = activeFolder
    ? posts.filter(p => folders.find(f => f._id === activeFolder)?.posts?.some(fp => fp._id === p._id))
    : posts;

  const icons = ['📁', '❤️', 'Travel', 'Food', 'Inspiration', 'Recipes', 'Work', 'Ideas', 'Health', 'Books'];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-on-surface">Saved Posts</h1>
          <button
            onClick={() => setShowCreateFolder(true)}
            className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Folder
          </button>
        </div>

        {showCreateFolder && (
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-card p-4 mb-4">
            <h3 className="font-semibold text-sm mb-3 text-neutral-900 dark:text-white">Create Folder</h3>
            <div className="flex gap-2 mb-3 flex-wrap">
              {icons.map(icon => (
                <button
                  key={icon}
                  onClick={() => setFolderIcon(icon)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
                    folderIcon === icon ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500' : 'bg-neutral-100 dark:bg-neutral-700'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Folder name..."
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm mb-3 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCreateFolder(false); setFolderName(''); setFolderIcon('📁'); }}
                className="flex-1 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!folderName.trim()}
                className="flex-1 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {folders.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            <button
              onClick={() => setActiveFolder(null)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium ${
                !activeFolder ? 'bg-primary-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              All ({posts.length})
            </button>
            {folders.map(folder => (
              <div key={folder._id} className="flex-shrink-0 relative group">
                <button
                  onClick={() => setActiveFolder(folder._id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                    activeFolder === folder._id ? 'bg-primary-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  <span>{folder.icon}</span>
                  {folder.name}
                  <span className="text-xs opacity-70">({folder.posts?.length || 0})</span>
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder._id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card rounded-lg shadow-sm p-4 animate-pulse">
                <div className="h-4 bg-on-surface-variant/20 rounded w-1/3 mb-3" />
                <div className="h-20 bg-on-surface-variant/20 rounded" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">💾</p>
            <p className="text-on-surface-variant">
              {activeFolder ? 'No posts in this folder' : 'No saved posts yet'}
            </p>
            <p className="text-sm text-on-surface-variant/60 mt-1">
              {activeFolder ? 'Save posts and add them to this folder' : 'Save posts to read them later'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div key={post._id} className="relative">
                <PostCard post={post} />
                {folders.length > 0 && !activeFolder && (
                  <div className="absolute top-2 right-2 z-10">
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleAddToFolder(e.target.value, post._id);
                        e.target.value = '';
                      }}
                      defaultValue=""
                      className="text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1 text-neutral-600 dark:text-neutral-300 shadow-sm"
                    >
                      <option value="" disabled>Add to...</option>
                      {folders.map(f => (
                        <option key={f._id} value={f._id}>{f.icon} {f.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SavedPostsPage;

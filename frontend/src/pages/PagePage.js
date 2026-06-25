import { useState, useEffect } from 'react';
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
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPage();
    fetchPosts();
  }, [id]);

  const fetchPage = async () => {
    try {
      const res = await API.get(`/pages/${id}`);
      setPage(res.data);
    } catch (err) {
      console.error('Failed to fetch page');
    }
  };

  const fetchPosts = async (p = 1) => {
    try {
      const res = await API.get(`/pages/${id}/feed?page=${p}&limit=10`);
      if (p === 1) {
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

  const handleFollow = async () => {
    try {
      const res = await API.put(`/pages/${id}/follow`);
      setPage(prev => ({
        ...prev,
        isFollowing: res.data.isFollowing,
        followerCount: res.data.isFollowing
          ? (prev.followerCount || 0) + 1
          : (prev.followerCount || 1) - 1
      }));
    } catch (err) {
      console.error('Failed to follow page');
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

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

      {/* Cover Photo */}
      <div className="h-64 bg-gradient-to-r from-purple-400 to-purple-600 relative">
        {page.coverPhoto && (
          <img src={page.coverPhoto} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Page Info */}
        <div className="bg-white rounded-lg shadow-md p-6 -mt-16 relative z-10">
          <div className="flex items-start gap-4">
            {page.profilePhoto && (
              <img
                src={page.profilePhoto}
                alt=""
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
              />
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{page.name}</h1>
                  <p className="text-gray-500 mt-1">
                    {page.followerCount} followers · {page.category}
                  </p>
                </div>
                <button
                  onClick={handleFollow}
                  className={`px-4 py-2 rounded-lg transition ${
                    page.isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {page.isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
              {page.description && (
                <p className="text-gray-600 mt-3">{page.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 pb-8">
          {page.isAdmin && (
            <CreatePostBox
              onPostCreated={handlePostCreated}
              postedInType="page"
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
        </div>
      </div>

      <Toast />
    </div>
  );
};

export default PagePage;

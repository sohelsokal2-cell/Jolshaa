import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import StoriesBar from '../components/StoriesBar';
import CreatePostBox from '../components/CreatePostBox';
import PostCard from '../components/PostCard';
import NotificationBell from '../components/NotificationBell';
import SearchBar from '../components/SearchBar';
import DarkModeToggle from '../components/DarkModeToggle';
import Toast from '../components/Toast';

const NewsFeed = () => {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const fetchPosts = useCallback(async (pageNum) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await API.get(`/posts/feed?page=${pageNum}&limit=10`);
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
      setInitialLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchPosts(1);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && page < totalPages && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [page, totalPages, loading]);

  useEffect(() => {
    if (page > 1) fetchPosts(page);
  }, [page, fetchPosts]);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 shadow-md px-6 py-3 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <Link to="/feed" className="text-xl font-bold text-blue-600">Jolshaa</Link>
          <div className="flex-1 mx-4 max-w-xs">
            <SearchBar />
          </div>
          <div className="flex items-center gap-4">
            <Link to="/groups" className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">Groups</Link>
            <Link to="/pages" className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">Pages</Link>
            <Link to="/messages" className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">Messages</Link>
            <NotificationBell />
            <DarkModeToggle />
            <Link to="/profile" className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
              {user.name?.split(' ')[0]}
            </Link>
            <button onClick={logout} className="text-sm text-red-600 hover:underline">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-xl mx-auto mt-4 px-4">
        <StoriesBar />
        <CreatePostBox onPostCreated={handlePostCreated} />

        {initialLoading ? (
          <div className="text-center py-8 text-gray-500">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No posts yet. Be the first to post!
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard key={post._id} post={post} onDelete={handleDeletePost} />
            ))}

            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} className="h-10" />

            {loading && (
              <div className="text-center py-4 text-gray-500 text-sm">Loading more posts...</div>
            )}

            {page >= totalPages && posts.length > 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">You're all caught up!</div>
            )}
          </>
        )}
      </div>

      <Toast />
    </div>
  );
};

export default NewsFeed;

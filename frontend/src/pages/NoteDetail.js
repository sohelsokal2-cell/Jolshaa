import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';

const NoteDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      const res = await API.get(`/notes/${id}`);
      setNote(res.data.note);
    } catch (err) {
      console.error('Failed to fetch note');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const res = await API.put(`/notes/${id}/like`);
      setNote(prev => ({
        ...prev,
        isLiked: res.data.isLiked,
        likeCount: res.data.likeCount,
      }));
    } catch (err) {}
  };

  const handleBookmark = async () => {
    try {
      const res = await API.put(`/notes/${id}/bookmark`);
      setNote(prev => ({
        ...prev,
        isBookmarked: res.data.isBookmarked,
        bookmarkCount: res.data.bookmarkCount,
      }));
    } catch (err) {}
  };

  const renderMarkdown = (text) => {
    return text
      .replace(/### (.*)/g, '<h3 class="text-lg font-bold mt-6 mb-3 text-neutral-900 dark:text-white">$1</h3>')
      .replace(/## (.*)/g, '<h2 class="text-xl font-bold mt-8 mb-3 text-neutral-900 dark:text-white">$1</h2>')
      .replace(/# (.*)/g, '<h1 class="text-2xl font-bold mt-8 mb-4 text-neutral-900 dark:text-white">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br/>');
  };

  if (loading) {
    return (
      <Layout showSidebar={false}>
        <div className="max-w-2xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
            <div className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!note) {
    return (
      <Layout showSidebar={false}>
        <div className="max-w-2xl mx-auto p-4 text-center py-12">
          <p className="text-4xl mb-4">📝</p>
          <p className="text-neutral-500">Note not found</p>
          <Link to="/notes" className="text-primary-600 hover:underline mt-2 inline-block">Back to Notes</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={false}>
      <div className="max-w-2xl mx-auto p-4">
        <Link to="/notes" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Notes
        </Link>

        <article>
          {note.coverImage && (
            <img src={note.coverImage} alt="" className="w-full h-64 object-cover rounded-xl mb-6" />
          )}

          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">{note.title}</h1>

          <div className="flex items-center gap-4 mb-6">
            <Link to={`/profile/${note.author?._id}`} className="flex items-center gap-2">
              <img src={note.author?.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="font-medium text-sm text-neutral-900 dark:text-white">{note.author?.name}</p>
                <p className="text-xs text-neutral-500">{note.readTime} min read · {new Date(note.createdAt).toLocaleDateString()}</p>
              </div>
            </Link>
          </div>

          {note.tags?.length > 0 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {note.tags.map((tag, i) => (
                <span key={i} className="text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div
            className="prose prose-lg max-w-none text-neutral-700 dark:text-neutral-200 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: `<p class="mb-4">${renderMarkdown(note.content)}</p>` }}
          />

          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                note.isLiked
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600'
              }`}
            >
              <svg className="w-5 h-5" fill={note.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {note.likeCount || 0}
            </button>
            <button
              onClick={handleBookmark}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                note.isBookmarked
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600'
              }`}
            >
              <svg className="w-5 h-5" fill={note.isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {note.bookmarkCount || 0}
            </button>
          </div>
        </article>
      </div>
    </Layout>
  );
};

export default NoteDetail;

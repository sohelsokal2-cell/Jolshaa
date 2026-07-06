import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import ReportModal from '../components/ReportModal';

const NoteDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

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

  if (loading) {
    return (
      <Layout showSidebar={false}>
        <div className="max-w-2xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-jolshaa-surface-container-high rounded w-2/3" />
            <div className="h-4 bg-jolshaa-surface-container-high rounded w-1/3" />
            <div className="h-64 bg-jolshaa-surface-container-high rounded-xl" />
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
          <p className="text-jolshaa-on-surface-variant">Note not found</p>
          <Link to="/notes" className="text-jolshaa-teal hover:underline mt-2 inline-block">Back to Notes</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={false}>
      <div className="max-w-2xl mx-auto p-4">
        <Link to="/notes" className="inline-flex items-center gap-1 text-sm text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Notes
        </Link>

        <article>
          {note.coverImage && (
            <img src={note.coverImage} alt="" className="w-full h-64 object-cover rounded-xl mb-6" />
          )}

          <h1 className="font-display text-3xl font-bold text-jolshaa-on-surface mb-3">{note.title}</h1>

          <div className="flex items-center gap-4 mb-6">
            <Link to={`/profile/${note.author?._id}`} className="flex items-center gap-2">
              <img src={note.author?.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div>
                <p className="font-medium text-sm text-jolshaa-on-surface">{note.author?.name}</p>
                <p className="text-xs text-jolshaa-on-surface-variant">{note.readTime} min read · {new Date(note.createdAt).toLocaleDateString()}</p>
              </div>
            </Link>
          </div>

          {note.tags?.length > 0 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {note.tags.map((tag, i) => (
                <span key={i} className="text-sm bg-jolshaa-surface-container-low text-jolshaa-on-surface-variant px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="prose prose-lg max-w-none text-jolshaa-on-surface leading-relaxed">
            <ReactMarkdown>{note.content}</ReactMarkdown>
          </div>

          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-jolshaa-outline-variant">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                note.isLiked
                  ? 'bg-red-50 text-red-600'
                  : 'bg-jolshaa-surface-container-low text-jolshaa-on-surface-variant hover:bg-red-50 hover:text-red-600'
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
                  ? 'bg-jolshaa-surface-container-low text-jolshaa-teal'
                  : 'bg-jolshaa-surface-container-low text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low hover:text-jolshaa-teal'
              }`}
            >
              <svg className="w-5 h-5" fill={note.isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {note.bookmarkCount || 0}
            </button>
            {note.author?._id !== user?._id && (
              <button
                onClick={() => setShowReport(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low transition-colors ml-auto"
              >
                Report
              </button>
            )}
          </div>
        </article>
      </div>
      {showReport && (
        <ReportModal targetType="note" targetId={note._id} onClose={() => setShowReport(false)} />
      )}
    </Layout>
  );
};

export default NoteDetail;

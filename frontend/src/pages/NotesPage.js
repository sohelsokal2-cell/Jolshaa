import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';

const NotesPage = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await API.get('/notes');
      setNotes(res.data.notes);
    } catch (err) {
      console.error('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('tags', tags);
      formData.append('visibility', visibility);
      if (coverImage) formData.append('coverImage', coverImage);

      if (editingNote) {
        await API.put(`/notes/${editingNote._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await API.post('/notes', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      resetEditor();
      fetchNotes();
    } catch (err) {
      console.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/notes/${id}`);
      setNotes(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Failed to delete note');
    }
  };

  const handleLike = async (id) => {
    try {
      const res = await API.put(`/notes/${id}/like`);
      setNotes(prev => prev.map(n =>
        n._id === id ? { ...n, isLiked: res.data.isLiked, likeCount: res.data.likeCount } : n
      ));
    } catch (err) {}
  };

  const openEditor = (note = null) => {
    if (note) {
      setEditingNote(note);
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags?.join(', ') || '');
      setVisibility(note.visibility);
      setCoverPreview(note.coverImage || '');
    }
    setShowEditor(true);
  };

  const resetEditor = () => {
    setShowEditor(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
    setTags('');
    setVisibility('public');
    setCoverImage(null);
    setCoverPreview('');
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Notes</h1>
          <button
            onClick={() => openEditor()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Write Note
          </button>
        </div>

        {showEditor && (
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-card p-4 mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full text-xl font-bold bg-transparent border-none focus:outline-none mb-3 text-neutral-900 dark:text-white placeholder-neutral-400"
              autoFocus
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note... (Supports Markdown: # Heading, **bold**, *italic*, `code`)"
              className="w-full bg-transparent border-none focus:outline-none resize-none min-h-[200px] text-neutral-700 dark:text-neutral-200 placeholder-neutral-400 leading-relaxed"
            />
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (comma separated)"
                className="px-3 py-1.5 rounded-lg text-xs bg-neutral-100 dark:bg-neutral-700 focus:outline-none text-neutral-700 dark:text-neutral-200 w-40"
              />
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200"
              >
                <option value="public">🌍 Public</option>
                <option value="friends">👥 Friends</option>
                <option value="onlyme">🔒 Only Me</option>
              </select>
              <label className="px-3 py-1.5 rounded-lg text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-600">
                📷 Cover
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    setCoverImage(e.target.files[0]);
                    setCoverPreview(URL.createObjectURL(e.target.files[0]));
                  }}
                  className="hidden"
                />
              </label>
            </div>
            {coverPreview && (
              <div className="mt-3 relative">
                <img src={coverPreview} alt="Cover" className="w-full h-40 object-cover rounded-lg" />
                <button
                  onClick={() => { setCoverImage(null); setCoverPreview(''); }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={resetEditor} className="flex-1 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim() || !content.trim() || saving}
                className="flex-1 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingNote ? 'Update' : 'Publish'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl p-4 animate-pulse">
                <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-3" />
                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2" />
                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">📝</p>
            <p className="text-neutral-500 dark:text-neutral-400">No notes yet</p>
            <p className="text-sm text-neutral-400 mt-1">Write your first long-form note</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <article key={note._id} className="bg-white dark:bg-neutral-800 rounded-xl shadow-card overflow-hidden">
                {note.coverImage && (
                  <img src={note.coverImage} alt="" className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{note.title}</h2>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                        <span>{note.readTime} min read</span>
                        <span>·</span>
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {note.author?._id === user?.id && (
                      <div className="flex gap-1">
                        <button onClick={() => openEditor(note)} className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(note._id)} className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed line-clamp-4">
                    <ReactMarkdown>{note.content.substring(0, 300) + (note.content.length > 300 ? '...' : '')}</ReactMarkdown>
                  </div>
                  {note.tags?.length > 0 && (
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {note.tags.map((tag, i) => (
                        <span key={i} className="text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
                    <button
                      onClick={() => handleLike(note._id)}
                      className={`flex items-center gap-1 text-sm ${note.isLiked ? 'text-red-500' : 'text-neutral-500 hover:text-red-500'}`}
                    >
                      <svg className="w-4 h-4" fill={note.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {note.likeCount || 0}
                    </button>
                    <Link to={`/notes/${note._id}`} className="text-sm text-primary-600 hover:text-primary-700">
                      Read more →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotesPage;

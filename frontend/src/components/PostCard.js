import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import ReactionPicker from './ReactionPicker';
import CommentSection from './CommentSection';
import ReportModal from './ReportModal';
import ShareModal from './ShareModal';
import SaveButton from './SaveButton';
import Poll from './Poll';
import QAPost from './QAPost';
import BoostPostModal from './BoostPostModal';

const PostCard = ({ post, onDelete }) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState(post.reactions || { count: 0, myReaction: null });
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showBoost, setShowBoost] = useState(false);

  const handleReact = async (type) => {
    try {
      const res = await API.post(`/posts/${post._id}/react`, { type });
      if (res.data.myReaction) {
        setReactions({ count: reactions.myReaction ? reactions.count : reactions.count + 1, myReaction: res.data.myReaction });
      } else {
        setReactions({ count: reactions.count - 1, myReaction: null });
      }
    } catch (err) {
      console.error('Failed to react');
    }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    try {
      const res = await API.put(`/posts/${post._id}`, { text: editText });
      post.text = res.data.text;
      post.isEdited = true;
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to edit post');
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/posts/${post._id}`);
      if (onDelete) onDelete(post._id);
    } catch (err) {
      console.error('Failed to delete post');
    }
  };

  const isOwner = user?.id === post.author?._id;
  const sharedPost = post.sharedPost;

  const renderMedia = (media) => {
    if (!media || media.length === 0) return null;
    return (
      <div className={`px-4 pb-2 ${media.length === 1 ? '' : 'grid grid-cols-2 gap-1'}`}>
        {media.map((url, i) => (
          <div key={i} className="relative">
            {url.includes('.mp4') || url.includes('.webm') ? (
              <video src={url} controls className="w-full rounded object-cover max-h-96" />
            ) : (
              <img src={url} alt="" className="w-full rounded object-cover max-h-96" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-4">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={post.author?.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <Link to={`/profile/${post.author?._id}`} className="font-semibold text-sm hover:underline">
                {post.author?.name}
              </Link>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                {post.isEdited && <span>(edited)</span>}
                {sharedPost && <span>&#x21AA; shared a post</span>}
                {post.visibility === 'onlyme' && <span>&#128274; Only Me</span>}
                {post.visibility === 'friends' && <span>&#128101; Friends</span>}
                {post.isBoosted && <span className="text-orange-500 font-medium">⚡ Boosted</span>}
                {post.isSponsored && <span className="text-blue-500">Sponsored</span>}
              </div>
            </div>
          </div>

          {isOwner ? (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="text-gray-400 hover:text-gray-600 text-xl">...</button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white shadow-lg rounded-lg border py-1 z-10 w-32">
                  <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100">Edit</button>
                  <button onClick={() => { setShowBoost(true); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100">Boost</button>
                  <button onClick={() => { handleDelete(); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100">Delete</button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="text-gray-400 hover:text-gray-600 text-xl">...</button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white shadow-lg rounded-lg border py-1 z-10 w-32">
                  <button onClick={() => { setShowReport(true); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100">Report</button>
                </div>
              )}
            </div>
          )}
        </div>

        {post.feeling && (
          <p className="text-sm text-gray-500 mt-1 ml-13">
            is feeling <span className="font-medium">{post.feeling}</span>
          </p>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        {isEditing ? (
          <div>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button onClick={handleEdit} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Save</button>
              <button onClick={() => { setIsEditing(false); setEditText(post.text); }} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {post.text && <p className="text-gray-800 whitespace-pre-wrap">{post.text}</p>}

            {/* Shared post embed */}
            {sharedPost && (
              <div className="mt-2 border rounded-lg overflow-hidden bg-gray-50">
                <div className="p-3 pb-1">
                  <div className="flex items-center gap-2 mb-1">
                    <img
                      src={sharedPost.author?.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <Link to={`/profile/${sharedPost.author?._id}`} className="font-semibold text-xs hover:underline">
                      {sharedPost.author?.name}
                    </Link>
                    <span className="text-xs text-gray-400">{new Date(sharedPost.createdAt).toLocaleDateString()}</span>
                  </div>
                  {sharedPost.text && <p className="text-sm text-gray-700">{sharedPost.text}</p>}
                </div>
                {sharedPost.media && sharedPost.media.length > 0 && (
                  <div className={`${sharedPost.media.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}`}>
                    {sharedPost.media.map((url, i) => (
                      <div key={i}>
                        {url.includes('.mp4') || url.includes('.webm') ? (
                          <video src={url} controls className="w-full max-h-64 object-cover" />
                        ) : (
                          <img src={url} alt="" className="w-full max-h-64 object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Media (for non-shared posts) */}
      {!sharedPost && renderMedia(post.media)}

      {/* Poll */}
      <div className="px-4">
        <Poll postId={post._id} isOwner={isOwner} />
      </div>

      {/* Q&A */}
      <div className="px-4">
        <QAPost postId={post._id} isOwner={isOwner} />
      </div>

      {/* Reaction & Comment counts */}
      <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-500 border-b">
        <div className="flex items-center gap-1">
          {reactions.count > 0 && (
            <>
              <span className="text-base">
                {reactions.myReaction === 'love' ? '❤️' : reactions.myReaction === 'haha' ? '😂' : reactions.myReaction === 'wow' ? '😮' : reactions.myReaction === 'sad' ? '😢' : reactions.myReaction === 'angry' ? '😠' : '👍'}
              </span>
              <span>{reactions.count}</span>
            </>
          )}
        </div>
        <div className="flex gap-3">
          {commentCount > 0 && (
            <button onClick={() => setShowComments(!showComments)} className="hover:underline">
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-1 flex items-center justify-between border-b">
        <ReactionPicker currentReaction={reactions.myReaction} onReact={handleReact} />
        {post.commentPrivacy === 'none' && !isOwner ? (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-sm text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            Comments disabled
          </span>
        ) : (
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-sm text-gray-500 hover:bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Comment
          </button>
        )}
        <button
          onClick={() => setShowShare(true)}
          className="flex items-center gap-1 px-3 py-1 rounded-full text-sm text-gray-500 hover:bg-gray-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>
        <SaveButton postId={post._id} initialSaved={post.isSaved} />
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="p-4">
          <CommentSection postId={post._id} commentCount={commentCount} />
        </div>
      )}

      {showReport && (
        <ReportModal targetType="post" targetId={post._id} onClose={() => setShowReport(false)} />
      )}

      {showShare && (
        <ShareModal post={post} onClose={() => setShowShare(false)} />
      )}

      {showBoost && (
        <BoostPostModal postId={post._id} onClose={() => setShowBoost(false)} />
      )}
    </div>
  );
};

export default PostCard;

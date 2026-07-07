import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import Avatar from './ui/Avatar';
import WriteReviewModal from './WriteReviewModal';

const StarDisplay = ({ rating, size = 'w-4 h-4' }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        className={`${size} ${rating >= star ? 'text-yellow-400' : 'text-jolshaa-outline-variant'}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </div>
);

const ReviewSection = ({ pageId, isFollowing, isAdmin }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  useEffect(() => { fetchReviews(); }, [pageId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/pages/${pageId}/reviews`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return;
    try {
      await API.delete(`/reviews/${reviewId}`);
      fetchReviews();
    } catch (err) {
      console.error('Failed to delete review');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading reviews...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-jolshaa-on-surface">{data.averageRating || '—'}</span>
              <div>
                <StarDisplay rating={Math.round(data.averageRating)} />
                <p className="text-xs text-jolshaa-on-surface-variant mt-1">{data.total} review{data.total !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
          {!isAdmin && (
            isFollowing ? (
              <button
                onClick={() => { setEditingReview(data.myReview); setShowWriteModal(true); }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-jolshaa-teal text-jolshaa-on-teal hover:bg-jolshaa-teal-container transition-colors"
              >
                {data.myReview ? 'Edit Your Review' : 'Write a Review'}
              </button>
            ) : (
              <p className="text-xs text-jolshaa-on-surface-variant max-w-[160px] text-right">Follow this page to write a review</p>
            )
          )}
        </div>
      </div>

      {data.reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-jolshaa-on-surface-variant">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.reviews.map((review) => (
            <div key={review._id} className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
              <div className="flex items-start gap-3">
                <Link to={`/profile/${review.reviewer._id}`}>
                  <Avatar src={review.reviewer.profilePhoto} alt={review.reviewer.name} size="md" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Link to={`/profile/${review.reviewer._id}`} className="font-medium text-sm text-jolshaa-on-surface hover:underline">
                      {review.reviewer.name}
                    </Link>
                    {review.reviewer._id === (data.myReview?.reviewer?._id || data.myReview?.reviewer) && (
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingReview(review); setShowWriteModal(true); }} className="text-xs text-jolshaa-teal hover:underline">Edit</button>
                        <button onClick={() => handleDelete(review._id)} className="text-xs text-red-500 hover:underline">Delete</button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StarDisplay rating={review.rating} size="w-3.5 h-3.5" />
                    <span className="text-xs text-jolshaa-on-surface-variant">
                      {review.recommends ? '👍 Recommends' : '👎 Doesn\'t recommend'}
                    </span>
                  </div>
                  {review.reviewText && <p className="text-sm text-jolshaa-on-surface mt-2">{review.reviewText}</p>}
                  <p className="text-xs text-jolshaa-on-surface-variant mt-1">
                    {new Date(review.createdAt).toLocaleDateString()}
                    {review.editedAt && ' (edited)'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showWriteModal && (
        <WriteReviewModal
          isOpen={showWriteModal}
          onClose={() => { setShowWriteModal(false); setEditingReview(null); }}
          pageId={pageId}
          existingReview={editingReview}
          onSaved={fetchReviews}
        />
      )}
    </div>
  );
};

export default ReviewSection;

import { useState } from 'react';
import Modal, { ModalBody, ModalFooter } from './ui/Modal';
import API from '../api/axios';

const WriteReviewModal = ({ isOpen, onClose, pageId, existingReview, onSaved }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState(existingReview?.reviewText || '');
  const [recommends, setRecommends] = useState(existingReview?.recommends !== undefined ? existingReview.recommends : true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!rating) {
      setError('Please select a rating');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let res;
      if (existingReview) {
        res = await API.put(`/reviews/${existingReview._id}`, { rating, reviewText, recommends });
      } else {
        res = await API.post(`/pages/${pageId}/reviews`, { rating, reviewText, recommends });
      }
      onSaved?.(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existingReview ? 'Edit Review' : 'Write a Review'} size="sm">
      <ModalBody>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-jolshaa-on-surface-variant mb-2 block">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5"
                >
                  <svg
                    className={`w-7 h-7 ${(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-jolshaa-outline-variant'}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-jolshaa-on-surface-variant mb-2 block">Would you recommend this page?</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRecommends(true)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  recommends ? 'bg-jolshaa-teal text-jolshaa-on-teal' : 'bg-jolshaa-surface-container text-jolshaa-on-surface-variant'
                }`}
              >
                👍 Yes
              </button>
              <button
                type="button"
                onClick={() => setRecommends(false)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !recommends ? 'bg-jolshaa-coral text-white' : 'bg-jolshaa-surface-container text-jolshaa-on-surface-variant'
                }`}
              >
                👎 No
              </button>
            </div>
          </div>

          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share details about your experience (optional)"
            rows={4}
            maxLength={1000}
            className="w-full px-4 py-2.5 rounded-xl bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant text-sm text-jolshaa-on-surface placeholder:text-jolshaa-on-surface-variant focus:outline-none focus:border-jolshaa-teal transition-colors resize-none"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-jolshaa-surface-container text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !rating}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-jolshaa-teal text-jolshaa-on-teal hover:bg-jolshaa-teal-container transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : existingReview ? 'Save Changes' : 'Post Review'}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default WriteReviewModal;

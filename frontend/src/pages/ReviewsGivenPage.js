import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import Avatar from '../components/ui/Avatar';

const StarDisplay = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        className={`w-3.5 h-3.5 ${rating >= star ? 'text-yellow-400' : 'text-jolshaa-outline-variant'}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </div>
);

const ReviewsGivenPage = () => {
  const { id } = useParams();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchReviews(); }, [id]);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/users/${id}/reviews-given`);
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.error('Failed to fetch reviews given');
      setError('Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-4">
        <h1 className="text-xl font-bold font-display text-jolshaa-on-surface mb-4">Reviews Given</h1>

        {loading ? (
          <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-jolshaa-on-surface-variant mb-3">{error}</p>
            <button onClick={fetchReviews} className="px-4 py-2 rounded-lg text-sm font-medium bg-jolshaa-surface-container-low text-jolshaa-on-surface hover:bg-jolshaa-surface-container transition-colors">
              Retry
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-sm text-jolshaa-on-surface-variant">No reviews written yet</div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review._id} className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
                <div className="flex items-start gap-3">
                  <Link to={`/pages/${review.page._id}`}>
                    <Avatar src={review.page.profilePhoto} alt={review.page.name} size="md" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/pages/${review.page._id}`} className="font-medium text-sm text-jolshaa-on-surface hover:underline">
                      {review.page.name}
                    </Link>
                    <p className="text-xs text-jolshaa-on-surface-variant">{review.page.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StarDisplay rating={review.rating} />
                      <span className="text-xs text-jolshaa-on-surface-variant">
                        {review.recommends ? '👍 Recommends' : "👎 Doesn't recommend"}
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
      </div>
    </Layout>
  );
};

export default ReviewsGivenPage;

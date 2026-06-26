import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const ListingDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const res = await API.get(`/marketplace/${id}`);
      setListing(res.data.listing);
    } catch (err) {
      console.error('Failed to fetch listing');
    } finally {
      setLoading(false);
    }
  };

  const handleInterested = async () => {
    try {
      const res = await API.put(`/marketplace/${id}/interested`);
      setListing((prev) => ({
        ...prev,
        interested: res.data.isInterested
          ? [...prev.interested, user.id]
          : prev.interested.filter((uid) => uid !== user.id),
      }));
    } catch (err) {}
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 animate-pulse">
        <div className="h-80 bg-gray-200 rounded-lg mb-4" />
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center py-12 text-gray-500">
        Listing not found
      </div>
    );
  }

  const isOwner = listing.seller?._id === user.id;
  const isInterested = listing.interested?.includes(user.id);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <button onClick={() => navigate(-1)} className="text-blue-600 text-sm mb-4">&larr; Back</button>

      {listing.images?.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4 rounded-lg overflow-hidden">
          {listing.images.map((img, i) => (
            <img key={i} src={img} alt="" className="w-full aspect-square object-cover" />
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4">
        <h1 className="text-xl font-bold mb-2">{listing.title}</h1>
        <p className="text-2xl font-bold text-blue-600 mb-3">${listing.price}</p>

        <div className="flex gap-3 text-sm text-gray-500 mb-4">
          <span className="capitalize">{listing.category}</span>
          <span>•</span>
          <span className="capitalize">{listing.condition?.replace('_', ' ')}</span>
          <span>•</span>
          <span>{listing.views} views</span>
        </div>

        {listing.description && (
          <p className="text-gray-700 mb-4 whitespace-pre-wrap">{listing.description}</p>
        )}

        <div className="border-t pt-4 mt-4">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={listing.seller?.profilePhoto}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-medium text-sm">{listing.seller?.name}</p>
              <p className="text-xs text-gray-500">{listing.location || 'Location not set'}</p>
            </div>
          </div>

          {!isOwner && (
            <div className="flex gap-3">
              <button
                onClick={handleInterested}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  isInterested
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isInterested ? '✓ Interested' : 'I\'m Interested'}
              </button>
              <button className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">
                Message
              </button>
            </div>
          )}

          {isOwner && (
            <div className="flex gap-3">
              <button className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                Edit Listing
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                Mark as Sold
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;

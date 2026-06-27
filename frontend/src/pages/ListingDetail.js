import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';

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
      <Layout>
        <div className="max-w-2xl mx-auto p-4 animate-pulse">
          <div className="h-80 bg-surface-high rounded-lg mb-4" />
          <div className="h-6 bg-surface-high rounded w-1/2 mb-2" />
          <div className="h-4 bg-surface-high rounded w-1/3" />
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-4 text-center py-12 text-on-surface-variant">
          Listing not found
        </div>
      </Layout>
    );
  }

  const isOwner = listing.seller?._id === user.id;
  const isInterested = listing.interested?.includes(user.id);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4">
        <button onClick={() => navigate(-1)} className="text-primary-400 text-sm mb-4">&larr; Back</button>

        {listing.images?.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4 rounded-lg overflow-hidden">
            {listing.images.map((img, i) => (
              <img key={i} src={img} alt={listing.title || 'Listing image'} className="w-full aspect-square object-cover" />
            ))}
          </div>
        )}

        <div className="card rounded-lg p-4">
          <h1 className="text-xl font-bold mb-2">{listing.title}</h1>
          <p className="text-2xl font-bold text-primary-400 mb-3">${listing.price}</p>

          <div className="flex gap-3 text-sm text-on-surface-variant mb-4">
            <span className="capitalize">{listing.category}</span>
            <span>•</span>
            <span className="capitalize">{listing.condition?.replace('_', ' ')}</span>
            <span>•</span>
            <span>{listing.views} views</span>
          </div>

          {listing.description && (
            <p className="text-on-surface mb-4 whitespace-pre-wrap">{listing.description}</p>
          )}

          <div className="border-t border-white/10 pt-4 mt-4">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={listing.seller?.profilePhoto}
                alt={listing.seller?.name || 'Seller profile'}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-sm">{listing.seller?.name}</p>
                <p className="text-xs text-on-surface-variant">{listing.location || 'Location not set'}</p>
              </div>
            </div>

            {!isOwner && (
              <div className="flex gap-3">
                <button
                  onClick={handleInterested}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    isInterested
                      ? 'bg-accent-500/15 text-accent-400 border border-accent-500/30'
                      : 'btn-primary text-white hover:bg-primary-700'
                  }`}
                >
                  {isInterested ? '✓ Interested' : 'I\'m Interested'}
                </button>
                <button className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-white/5">
                  Message
                </button>
              </div>
            )}

            {isOwner && (
              <div className="flex gap-3">
                <button className="flex-1 py-2 bg-white/5 text-on-surface-variant rounded-lg text-sm font-medium hover:bg-white/5">
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
    </Layout>
  );
};

export default ListingDetail;

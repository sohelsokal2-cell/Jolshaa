import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import Layout from '../components/layout/Layout';

const MarketplacePage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', category: 'other', condition: 'good', location: '',
  });
  const [images, setImages] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [category]);

  const fetchListings = async () => {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);

      const res = await API.get(`/marketplace?${params}`);
      setListings(res.data.listings);
    } catch (err) {
      console.error('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.price) return;
    setCreating(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      images.forEach((img) => fd.append('images', img));

      await API.post('/marketplace', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowCreate(false);
      setFormData({ title: '', description: '', price: '', category: 'other', condition: 'good', location: '' });
      setImages([]);
      fetchListings();
    } catch (err) {
      console.error('Failed to create listing');
    } finally {
      setCreating(false);
    }
  };

  const categories = [
    { value: '', label: 'All' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'home', label: 'Home' },
    { value: 'vehicles', label: 'Vehicles' },
    { value: 'services', label: 'Services' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Layout>
      <div className="mt-2 pb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold font-display text-jolshaa-on-surface">Marketplace</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-jolshaa-teal text-jolshaa-on-teal px-4 py-2 rounded-lg text-sm font-medium hover:bg-jolshaa-teal-container transition-colors shadow-ambient"
        >
          {showCreate ? 'Cancel' : '+ Sell Item'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
          placeholder="Search..."
          className="flex-1 px-4 py-2 bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-lg text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-lg text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4 mb-4 space-y-3">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Item title"
            className="w-full px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-lg text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
          />
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description"
            className="w-full px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-lg text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal resize-none"
            rows={3}
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Price"
              className="px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-lg text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-lg text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
            >
              {categories.slice(1).map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-lg text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
            >
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Location"
            className="w-full px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant rounded-lg text-jolshaa-on-surface focus:outline-none focus:ring-2 focus:ring-jolshaa-teal"
          />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files))}
            className="text-sm text-jolshaa-on-surface-variant"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !formData.title || !formData.price}
            className="w-full bg-jolshaa-teal text-jolshaa-on-teal py-2 rounded-lg text-sm font-medium hover:bg-jolshaa-teal-container transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'List Item'}
          </button>
        </div>
      )}

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient overflow-hidden animate-pulse">
              <div className="aspect-square bg-jolshaa-surface-container-low" />
              <div className="p-3">
                <div className="h-4 bg-jolshaa-surface-container-low rounded w-2/3 mb-2" />
                <div className="h-4 bg-jolshaa-surface-container-low rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 text-jolshaa-on-surface-variant">
          <p className="text-4xl mb-4">🛒</p>
          <p>No listings found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <Link
              key={listing._id}
              to={`/marketplace/${listing._id}`}
              className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient overflow-hidden hover:shadow-ambient-hover transition-shadow"
            >
              <div className="aspect-square bg-jolshaa-surface-container-low">
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-jolshaa-on-surface-variant">📷</div>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-jolshaa-on-surface text-sm truncate">{listing.title}</p>
                <p className="text-jolshaa-teal font-bold text-sm">${listing.price}</p>
                <p className="text-xs text-jolshaa-on-surface-variant">{listing.location || 'Location not set'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </Layout>
  );
};

export default MarketplacePage;

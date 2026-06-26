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
      <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
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
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 space-y-3">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Item title"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Price"
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {categories.slice(1).map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
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
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files))}
            className="text-sm"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !formData.title || !formData.price}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'List Item'}
          </button>
        </div>
      )}

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-3">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-4">🛒</p>
          <p>No listings found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <Link
              key={listing._id}
              to={`/marketplace/${listing._id}`}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition"
            >
              <div className="aspect-square bg-gray-100">
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">📷</div>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-gray-800 text-sm truncate">{listing.title}</p>
                <p className="text-blue-600 font-bold text-sm">${listing.price}</p>
                <p className="text-xs text-gray-500">{listing.location || 'Location not set'}</p>
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

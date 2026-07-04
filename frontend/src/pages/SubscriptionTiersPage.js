import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import Modal from '../components/ui/Modal';

const CreateTierModal = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [perks, setPerks] = useState(['']);
  const [badge, setBadge] = useState('');
  const [saving, setSaving] = useState(false);

  const addPerk = () => setPerks([...perks, '']);
  const updatePerk = (i, val) => {
    const updated = [...perks];
    updated[i] = val;
    setPerks(updated);
  };
  const removePerk = (i) => setPerks(perks.filter((_, idx) => idx !== i));

  const handleCreate = async () => {
    if (!name || !price) return;
    setSaving(true);
    try {
      await API.post('/subscriptions/tiers', {
        name,
        price: parseFloat(price),
        perks: perks.filter(p => p.trim()),
        badge,
      });
      onCreated();
      onClose();
      setName('');
      setPrice('');
      setPerks(['']);
      setBadge('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create tier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Subscription Tier" size="md">
      <div className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Tier Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Basic Supporter, Super Fan"
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Price (BDT/month)</label>
          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 199"
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Badge Emoji</label>
          <input
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="e.g. ⭐ 🎉 💎"
            maxLength={4}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Perks</label>
          <div className="space-y-2">
            {perks.map((perk, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={perk}
                  onChange={(e) => updatePerk(i, e.target.value)}
                  placeholder="e.g. Early access to content"
                  className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {perks.length > 1 && (
                  <button onClick={() => removePerk(i)} className="px-2 text-neutral-400 hover:text-red-500">✕</button>
                )}
              </div>
            ))}
            <button onClick={addPerk} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              + Add Perk
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !name || !price}
            className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating...' : 'Create Tier'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const SubscriptionTiersPage = ({ creatorId: propCreatorId, isOwner = false }) => {
  const { creatorId: routeCreatorId } = useParams();
  const creatorId = propCreatorId || routeCreatorId;
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [subscribing, setSubscribing] = useState(null);

  const fetchTiers = () => {
    setLoading(true);
    API.get(`/subscriptions/tiers/${creatorId}`)
      .then(res => setTiers(res.data.tiers))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTiers(); }, [creatorId]);

  const handleSubscribe = async (tierId) => {
    setSubscribing(tierId);
    try {
      await API.post('/subscriptions/subscribe', { creatorId, tierId });
      alert('Subscription successful!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to subscribe');
    } finally {
      setSubscribing(null);
    }
  };

  const handleDelete = async (tierId) => {
    if (!window.confirm('Delete this tier? Active subscriptions will be expired.')) return;
    try {
      await API.delete(`/subscriptions/tiers/${tierId}`);
      fetchTiers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete tier');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => <div key={i} className="h-32 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
          Subscription Tiers ({tiers.length})
        </h3>
        {isOwner && tiers.length < 3 && (
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            + Create Tier
          </button>
        )}
      </div>

      {tiers.length === 0 ? (
        <p className="text-neutral-500 text-center py-8">No subscription tiers yet</p>
      ) : (
        <div className="space-y-3">
          {tiers.map(tier => (
            <div key={tier._id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {tier.badge && <span className="text-lg">{tier.badge}</span>}
                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">{tier.name}</h4>
                  </div>
                  <p className="text-xl font-bold text-primary-600 mt-1">৳{tier.price}/mo</p>
                  {tier.perks?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {tier.perks.map((perk, i) => (
                        <li key={i} className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                          <span className="text-green-500">✓</span> {perk}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-neutral-400 mt-2">{tier.subscriberCount} subscribers</p>
                </div>

                <div className="flex items-center gap-2">
                  {!isOwner && (
                    <button
                      onClick={() => handleSubscribe(tier._id)}
                      disabled={subscribing === tier._id}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      {subscribing === tier._id ? '...' : 'Subscribe'}
                    </button>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(tier._id)}
                      className="px-3 py-2 text-sm text-red-600 hover:text-red-700 border border-red-200 dark:border-red-800 rounded-lg"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateTierModal isOpen={showCreate} onClose={() => setShowCreate(false)} onCreated={fetchTiers} />
    </div>
  );
};

export default SubscriptionTiersPage;

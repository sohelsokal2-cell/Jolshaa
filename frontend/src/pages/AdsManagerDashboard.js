import { useState, useEffect } from 'react';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import CreateAdCampaignModal from '../components/CreateAdCampaignModal';

const AdsManagerDashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const fetchCampaigns = () => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : '';
    API.get(`/ads/my-campaigns${params}`)
      .then(res => setCampaigns(res.data.campaigns || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCampaigns(); }, [filter]);

  const handlePause = async (id) => {
    try {
      await API.post(`/ads/${id}/pause`);
      fetchCampaigns();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to pause');
    }
  };

  const handleResume = async (id) => {
    try {
      await API.post(`/ads/${id}/resume`);
      fetchCampaigns();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resume');
    }
  };

  const statusColors = {
    draft: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400',
    pending_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    paused: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    completed: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Ads Manager</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Create Campaign
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {['', 'active', 'paused', 'pending_review', 'completed', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {f || 'All'}
            </button>
          ))}
        </div>

        {/* Campaigns List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />)}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500 mb-4">No campaigns yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              Create Your First Campaign
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map(campaign => (
              <div
                key={campaign._id}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[campaign.status] || ''}`}>
                        {campaign.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-900 dark:text-neutral-100 truncate">
                      {campaign.post?.text || 'Post content'}
                    </p>
                    <div className="flex gap-4 text-xs text-neutral-500 mt-1">
                      <span>Budget: ৳{campaign.budget}</span>
                      <span>Spent: ৳{campaign.spentAmount?.toFixed(0) || 0}</span>
                      <span>Impressions: {campaign.metrics?.impressions || 0}</span>
                      <span>Clicks: {campaign.metrics?.clicks || 0}</span>
                      <span>CTR: {campaign.metrics?.ctr?.toFixed(1) || 0}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {campaign.status === 'active' && (
                      <button
                        onClick={() => handlePause(campaign._id)}
                        className="px-3 py-1.5 text-xs font-medium border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      >
                        Pause
                      </button>
                    )}
                    {campaign.status === 'paused' && (
                      <button
                        onClick={() => handleResume(campaign._id)}
                        className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedCampaign(campaign)}
                      className="px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-200 dark:border-primary-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    >
                      Details
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (campaign.spentAmount / campaign.budget) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Campaign Detail Modal */}
        {selectedCampaign && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCampaign(null)}>
            <div className="bg-white dark:bg-neutral-900 rounded-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
              <h3 className="font-semibold text-lg mb-4 text-neutral-900 dark:text-neutral-100">Campaign Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Status</span>
                  <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${statusColors[selectedCampaign.status]}`}>
                    {selectedCampaign.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Total Budget</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">৳{selectedCampaign.budget}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Amount Spent</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">৳{selectedCampaign.spentAmount?.toFixed(2) || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Impressions</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{selectedCampaign.metrics?.impressions?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Clicks</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{selectedCampaign.metrics?.clicks?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">CTR</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{selectedCampaign.metrics?.ctr?.toFixed(2) || 0}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Duration</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {new Date(selectedCampaign.duration?.startDate).toLocaleDateString()} - {new Date(selectedCampaign.duration?.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="w-full mt-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <CreateAdCampaignModal isOpen={showCreate} onClose={() => setShowCreate(false)} onCreated={fetchCampaigns} />
      </div>
    </Layout>
  );
};

export default AdsManagerDashboard;

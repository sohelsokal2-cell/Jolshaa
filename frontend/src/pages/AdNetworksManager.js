import { useState, useEffect } from 'react';
import API from '../api/axios';

const NETWORK_INFO = {
  monetag: {
    name: 'Monetag',
    color: 'blue',
    features: [
      { label: 'Popunder', key: 'popunder' },
      { label: 'Social Bar', key: 'socialBar' },
      { label: 'Native Banner', key: 'nativeBanner' },
      { label: 'Video', key: 'video' },
      { label: 'Direct Link', key: 'directLink' },
    ],
    site: 'monetag.com',
  },
  propellerads: {
    name: 'PropellerAds',
    color: 'purple',
    features: [
      { label: 'Popunder', key: 'popunder' },
      { label: 'OnClick', key: 'onClick' },
      { label: 'Push', key: 'push' },
      { label: 'Native', key: 'nativeBanner' },
      { label: 'Interstitial', key: 'interstitial' },
    ],
    site: 'propellerads.com',
  },
  admaven: {
    name: 'AdMaven',
    color: 'orange',
    features: [
      { label: 'Popunder', key: 'popunder' },
      { label: 'Push', key: 'push' },
      { label: 'Native', key: 'nativeBanner' },
      { label: 'Banner', key: 'banner' },
      { label: 'Interstitial', key: 'interstitial' },
    ],
    site: 'ad-maven.com',
  },
  adsterra: {
    name: 'Adsterra',
    color: 'green',
    features: [
      { label: 'Popunder', key: 'popunder' },
      { label: 'Social Bar', key: 'socialBar' },
      { label: 'Native Banner', key: 'nativeBanner' },
      { label: 'Video', key: 'video' },
    ],
    site: 'adsterra.com',
  },
  googleadsense: {
    name: 'Google AdSense',
    color: 'red',
    features: [
      { label: 'Display', key: 'banner' },
      { label: 'In-feed', key: 'nativeBanner' },
      { label: 'In-article', key: 'nativeBanner' },
      { label: 'Matched Content', key: 'nativeBanner' },
    ],
    site: 'adsense.google.com',
  },
};

const AdNetworksManager = () => {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [stats, setStats] = useState([]);
  const [activeTab, setActiveTab] = useState('networks');

  useEffect(() => {
    fetchNetworks();
    fetchStats();
  }, []);

  const fetchNetworks = async () => {
    try {
      const res = await API.get('/ad-networks');
      setNetworks(res.data);
    } catch (error) {
      console.error('Failed to fetch networks');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await API.get('/ad-networks/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const toggleNetwork = async (name, enabled) => {
    try {
      await API.put(`/ad-networks/${name}/toggle`, { enabled });
      fetchNetworks();
    } catch (error) {
      alert('Failed to toggle network');
    }
  };

  const toggleFormat = async (name, format, enabled) => {
    try {
      await API.put(`/ad-networks/${name}/format/${format}/toggle`, { enabled });
      fetchNetworks();
    } catch (error) {
      alert('Failed to toggle format');
    }
  };

  const saveNetwork = async () => {
    try {
      await API.put(`/ad-networks/${editForm.name}`, editForm);
      setEditMode(false);
      setSelectedNetwork(null);
      fetchNetworks();
    } catch (error) {
      alert('Failed to save network');
    }
  };

  const openEdit = (network) => {
    setSelectedNetwork(network);
    setEditForm({ ...network });
    setEditMode(true);
  };

  const getColorClass = (color) => {
    const colors = {
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
    };
    return colors[color] || 'bg-jolshaa-on-surface-variant';
  };

  const totalRevenue = stats.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
  const totalImpressions = stats.reduce((sum, s) => sum + (s.totalImpressions || 0), 0);
  const totalClicks = stats.reduce((sum, s) => sum + (s.totalClicks || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jolshaa-surface p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-jolshaa-on-surface">
            Ad Networks Manager
          </h1>
          <p className="text-jolshaa-on-surface-variant mt-2">
            Manage multiple ad networks from one place
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-jolshaa-surface-container-lowest rounded-lg p-6 shadow">
            <p className="text-sm text-jolshaa-on-surface-variant">Total Networks</p>
            <p className="text-2xl font-bold text-jolshaa-on-surface">
              {networks.length}
            </p>
            <p className="text-sm text-green-500">
              {networks.filter(n => n.enabled).length} active
            </p>
          </div>
          <div className="bg-jolshaa-surface-container-lowest rounded-lg p-6 shadow">
            <p className="text-sm text-jolshaa-on-surface-variant">Total Impressions</p>
            <p className="text-2xl font-bold text-jolshaa-on-surface">
              {totalImpressions.toLocaleString()}
            </p>
          </div>
          <div className="bg-jolshaa-surface-container-lowest rounded-lg p-6 shadow">
            <p className="text-sm text-jolshaa-on-surface-variant">Total Clicks</p>
            <p className="text-2xl font-bold text-jolshaa-on-surface">
              {totalClicks.toLocaleString()}
            </p>
          </div>
          <div className="bg-jolshaa-surface-container-lowest rounded-lg p-6 shadow">
            <p className="text-sm text-jolshaa-on-surface-variant">Total Revenue</p>
            <p className="text-2xl font-bold text-jolshaa-on-surface">
              ${totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-jolshaa-outline-variant pb-2">
          <button
            onClick={() => setActiveTab('networks')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'networks'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface'
            }`}
          >
            Networks
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'stats'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface'
            }`}
          >
            Statistics
          </button>
        </div>

        {/* Networks Tab */}
        {activeTab === 'networks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {networks.map((network) => {
              const info = NETWORK_INFO[network.name] || {};
              return (
                <div
                  key={network.name}
                  className="bg-jolshaa-surface-container-lowest rounded-lg shadow-lg overflow-hidden"
                >
                  {/* Header */}
                  <div className={`${getColorClass(info.color)} p-4`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-white font-bold text-lg">{info.name}</h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={network.enabled}
                          onChange={(e) => toggleNetwork(network.name, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-jolshaa-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-jolshaa-outline after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
                      </label>
                    </div>
                    <p className="text-white/80 text-sm mt-1">{info.site}</p>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="mb-4">
                      <p className="text-sm text-jolshaa-on-surface-variant mb-2">
                        Publisher ID
                      </p>
                      <p className="text-jolshaa-on-surface font-mono text-sm truncate">
                        {network.publisherId || 'Not set'}
                      </p>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-jolshaa-on-surface-variant mb-2">
                        Ad Formats
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {info.features?.map((feature) => {
                          const isEnabled = network.adFormats?.[feature.key]?.enabled;
                          return (
                            <button
                              key={feature.key}
                              onClick={() => toggleFormat(network.name, feature.key, !isEnabled)}
                              className={`px-2 py-1 text-xs rounded-full ${
                                isEnabled
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-jolshaa-surface-container-high text-jolshaa-on-surface-variant'
                              }`}
                            >
                              {feature.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-jolshaa-on-surface-variant mb-2">
                        Priority
                      </p>
                      <p className="text-jolshaa-on-surface">{network.priority}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(network)}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                      >
                        Configure
                      </button>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-jolshaa-on-surface-variant">
                          {network.totalImpressions || 0} imp
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="bg-jolshaa-surface-container-lowest rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-jolshaa-surface-container-high">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-jolshaa-on-surface-variant uppercase">
                    Network
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-jolshaa-on-surface-variant uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-jolshaa-on-surface-variant uppercase">
                    Impressions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-jolshaa-on-surface-variant uppercase">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-jolshaa-on-surface-variant uppercase">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-jolshaa-on-surface-variant uppercase">
                    CTR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-jolshaa-outline-variant/50">
                {stats.map((stat) => {
                  const info = NETWORK_INFO[stat._id] || {};
                  const ctr = stat.totalImpressions > 0
                    ? ((stat.totalClicks / stat.totalImpressions) * 100).toFixed(2)
                    : '0.00';
                  return (
                    <tr key={stat._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${getColorClass(info.color)} mr-3`}></div>
                          <span className="text-jolshaa-on-surface font-medium">
                            {info.name || stat._id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          stat.enabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-jolshaa-surface-container-high text-jolshaa-on-surface-variant'
                        }`}>
                          {stat.enabled ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-jolshaa-on-surface">
                        {(stat.totalImpressions || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-jolshaa-on-surface">
                        {(stat.totalClicks || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-jolshaa-on-surface">
                        ${(stat.totalRevenue || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-jolshaa-on-surface">
                        {ctr}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Modal */}
        {editMode && selectedNetwork && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-jolshaa-surface-container-lowest rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-bold text-jolshaa-on-surface">
                    Configure {NETWORK_INFO[editForm.name]?.name}
                  </h2>
                  <button
                    onClick={() => setEditMode(false)}
                    className="text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-jolshaa-on-surface mb-1">
                      Publisher ID
                    </label>
                    <input
                      type="text"
                      value={editForm.publisherId || ''}
                      onChange={(e) => setEditForm({ ...editForm, publisherId: e.target.value })}
                      className="w-full px-4 py-2 border border-jolshaa-outline rounded-lg focus:ring-2 focus:ring-blue-500 bg-jolshaa-surface-container-highest text-jolshaa-on-surface"
                      placeholder="Enter Publisher ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-jolshaa-on-surface mb-1">
                      API Key (optional)
                    </label>
                    <input
                      type="password"
                      value={editForm.apiKey || ''}
                      onChange={(e) => setEditForm({ ...editForm, apiKey: e.target.value })}
                      className="w-full px-4 py-2 border border-jolshaa-outline rounded-lg focus:ring-2 focus:ring-blue-500 bg-jolshaa-surface-container-highest text-jolshaa-on-surface"
                      placeholder="Enter API Key"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-jolshaa-on-surface mb-1">
                      Priority (higher = shown first)
                    </label>
                    <input
                      type="number"
                      value={editForm.priority || 0}
                      onChange={(e) => setEditForm({ ...editForm, priority: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-jolshaa-outline rounded-lg focus:ring-2 focus:ring-blue-500 bg-jolshaa-surface-container-highest text-jolshaa-on-surface"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-jolshaa-on-surface mb-1">
                      Ad Frequency (show ad every N posts)
                    </label>
                    <input
                      type="number"
                      value={editForm.adFrequency || 3}
                      onChange={(e) => setEditForm({ ...editForm, adFrequency: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-jolshaa-outline rounded-lg focus:ring-2 focus:ring-blue-500 bg-jolshaa-surface-container-highest text-jolshaa-on-surface"
                    />
                  </div>

                  {/* Ad Formats */}
                  <div>
                    <label className="block text-sm font-medium text-jolshaa-on-surface mb-2">
                      Ad Format Scripts
                    </label>
                    {Object.entries(editForm.adFormats || {}).map(([format, data]) => (
                      <div key={format} className="mb-3 p-3 bg-jolshaa-surface-container-high rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-jolshaa-on-surface capitalize">
                            {format}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={data.enabled}
                              onChange={(e) => {
                                const newFormats = { ...editForm.adFormats };
                                newFormats[format] = { ...data, enabled: e.target.checked };
                                setEditForm({ ...editForm, adFormats: newFormats });
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-jolshaa-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-jolshaa-outline after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <textarea
                          value={data.script || ''}
                          onChange={(e) => {
                            const newFormats = { ...editForm.adFormats };
                            newFormats[format] = { ...data, script: e.target.value };
                            setEditForm({ ...editForm, adFormats: newFormats });
                          }}
                          className="w-full px-3 py-2 text-sm border border-jolshaa-outline rounded-lg focus:ring-2 focus:ring-blue-500 bg-jolshaa-surface-container-highest text-jolshaa-on-surface font-mono"
                          placeholder={`Paste ${format} ad script here...`}
                          rows={3}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-jolshaa-on-surface mb-1">
                      Blocked Pages (comma separated)
                    </label>
                    <input
                      type="text"
                      value={(editForm.blockedPages || []).join(', ')}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        blockedPages: e.target.value.split(',').map(p => p.trim()).filter(Boolean)
                      })}
                      className="w-full px-4 py-2 border border-jolshaa-outline rounded-lg focus:ring-2 focus:ring-blue-500 bg-jolshaa-surface-container-highest text-jolshaa-on-surface"
                      placeholder="/admin, /messages"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={saveNetwork}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 bg-jolshaa-surface-container-high text-jolshaa-on-surface rounded-lg hover:bg-jolshaa-surface-container-highest"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdNetworksManager;

import { useState, useEffect } from 'react';
import API from '../../api/axios';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Tabs from '../ui/Tabs';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import AdNetworksManager from '../../pages/AdNetworksManager';

const MonetizationTab = () => {
  const [subTab, setSubTab] = useState('creator-apps');

  const subTabs = [
    { key: 'creator-apps', label: 'Creator Apps' },
    { key: 'ad-review', label: 'Ad Review' },
    { key: 'payout-requests', label: 'Payouts' },
    { key: 'platform-revenue', label: 'Revenue' },
    { key: 'ads', label: 'Ads' },
    { key: 'boosts', label: 'Boosts' },
    { key: 'ad-networks', label: 'Ad Networks' },
    { key: 'subscriptions', label: 'Subscriptions' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'fraud', label: 'Fraud' },
  ];

  return (
    <div className="space-y-4">
      <Tabs tabs={subTabs} activeTab={subTab} onChange={setSubTab} className="mb-4" />
      {subTab === 'creator-apps' && <CreatorApplicationsPanel />}
      {subTab === 'ad-review' && <AdReviewQueuePanel />}
      {subTab === 'payout-requests' && <PayoutRequestsPanel />}
      {subTab === 'platform-revenue' && <PlatformRevenuePanel />}
      {subTab === 'ads' && <AdsManagementPanel />}
      {subTab === 'boosts' && <BoostedPostsPanel />}
      {subTab === 'ad-networks' && <AdNetworksManager />}
      {subTab === 'subscriptions' && <SubscriptionsPanel />}
      {subTab === 'transactions' && <TransactionsPanel />}
      {subTab === 'fraud' && <FraudDetectionPanel />}
    </div>
  );
};

const AdsManagementPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchData = () => {
    setLoading(true);
    API.get('/admin/monetization/ads/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  const cards = [
    { label: 'Total Ads', value: data.totalAds, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Ads', value: data.activeAds, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Revenue', value: `$${data.totalRevenue.toFixed(2)}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Impressions', value: data.totalImpressions.toLocaleString(), color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Clicks', value: data.totalClicks.toLocaleString(), color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Avg CTR', value: `${data.avgCTR}%`, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(c => (
          <Card key={c.label} className={c.bg}>
            <p className="text-xs font-medium text-jolshaa-on-surface-variant">{c.label}</p>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">All Ads</h3>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="text-sm border rounded px-2 py-1">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-jolshaa-on-surface-variant">
                <th className="pb-2">Title</th>
                <th className="pb-2">Advertiser</th>
                <th className="pb-2">Budget</th>
                <th className="pb-2">Spent</th>
                <th className="pb-2">Impressions</th>
                <th className="pb-2">Clicks</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(filter ? data.recentAds.filter(a => a.status === filter) : data.recentAds).map(ad => (
                <tr key={ad._id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{ad.title}</td>
                  <td className="py-2">{ad.advertiser?.name}</td>
                  <td className="py-2">${ad.budget}</td>
                  <td className="py-2">${ad.spent.toFixed(2)}</td>
                  <td className="py-2">{ad.impressions.toLocaleString()}</td>
                  <td className="py-2">{ad.clicks.toLocaleString()}</td>
                  <td className="py-2">
                    <Badge variant={ad.status === 'active' ? 'success' : ad.status === 'rejected' ? 'danger' : 'neutral'}>
                      {ad.status}
                    </Badge>
                  </td>
                  <td className="py-2">
                    <select
                      value={ad.status}
                      onChange={async (e) => {
                        await API.put(`/admin/monetization/ads/${ad._id}/status`, { status: e.target.value });
                        fetchData();
                      }}
                      className="text-xs border rounded px-1 py-0.5"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const BoostedPostsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchData = () => {
    setLoading(true);
    API.get('/admin/monetization/boosts?limit=50').then(res => setData(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  const active = data.posts.filter(p => new Date(p.boostEndsAt) > new Date());
  const expired = data.posts.filter(p => new Date(p.boostEndsAt) <= new Date());
  const shown = filter === 'active' ? active : filter === 'expired' ? expired : data.posts;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-blue-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Total Boosted</p>
          <p className="text-2xl font-bold text-blue-600">{data.posts.length}</p>
        </Card>
        <Card className="bg-green-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Active</p>
          <p className="text-2xl font-bold text-green-600">{active.length}</p>
        </Card>
        <Card className="bg-red-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Expired</p>
          <p className="text-2xl font-bold text-red-600">{expired.length}</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Boosted Posts</h3>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="text-sm border rounded px-2 py-1">
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div className="space-y-3">
          {shown.map(post => (
            <div key={post._id} className="flex items-center justify-between p-3 bg-jolshaa-surface-container-low rounded-lg">
              <div className="flex items-center gap-3">
                {post.author?.profilePhoto && <img src={post.author.profilePhoto} className="w-8 h-8 rounded-full" alt="" />}
                <div>
                  <p className="text-sm font-medium">{post.author?.name}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant truncate max-w-md">{post.text || 'No text'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={new Date(post.boostEndsAt) > new Date() ? 'success' : 'danger'}>
                  {new Date(post.boostEndsAt) > new Date() ? 'Active' : 'Expired'}
                </Badge>
                <Button size="sm" onClick={async () => {
                  await API.put(`/admin/monetization/boosts/${post._id}/reject`);
                  fetchData();
                }} variant="danger">Remove</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const CreatorPayoutsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    API.get('/admin/monetization/payouts/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-blue-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Total Creators</p>
          <p className="text-2xl font-bold text-blue-600">{data.totalCreators}</p>
        </Card>
        <Card className="bg-amber-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Pending Payouts</p>
          <p className="text-2xl font-bold text-amber-600">{data.pendingPayouts}</p>
        </Card>
        <Card className="bg-green-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Completed</p>
          <p className="text-2xl font-bold text-green-600">{data.completedPayouts}</p>
        </Card>
        <Card className="bg-emerald-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Total Paid Out</p>
          <p className="text-2xl font-bold text-emerald-600">${data.totalPaidOut.toFixed(2)}</p>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-4">Recent Payouts</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-jolshaa-on-surface-variant">
                <th className="pb-2">Creator</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Period</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.recentPayouts.map(payout => (
                <tr key={payout._id} className="border-b last:border-0">
                  <td className="py-2">{payout.creator?.name}</td>
                  <td className="py-2 font-medium">${payout.amount.toFixed(2)}</td>
                  <td className="py-2 text-xs">{new Date(payout.period.from).toLocaleDateString()} - {new Date(payout.period.to).toLocaleDateString()}</td>
                  <td className="py-2">
                    <Badge variant={payout.status === 'completed' ? 'success' : payout.status === 'pending' ? 'warning' : 'danger'}>
                      {payout.status}
                    </Badge>
                  </td>
                  <td className="py-2">
                    {payout.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={async () => {
                          await API.put(`/admin/monetization/payouts/${payout._id}`, { status: 'completed' });
                          fetchData();
                        }} variant="success">Approve</Button>
                        <Button size="sm" onClick={async () => {
                          await API.put(`/admin/monetization/payouts/${payout._id}`, { status: 'failed' });
                          fetchData();
                        }} variant="danger">Reject</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const SubscriptionsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/monetization/subscriptions/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-blue-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Active Plans</p>
          <p className="text-2xl font-bold text-blue-600">{data.totalPlans}</p>
        </Card>
        <Card className="bg-green-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Total Subscribers</p>
          <p className="text-2xl font-bold text-green-600">{data.totalSubscribers}</p>
        </Card>
        <Card className="bg-emerald-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Monthly Revenue</p>
          <p className="text-2xl font-bold text-emerald-600">${data.monthlyRevenue.toFixed(2)}</p>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-4">Top Subscription Plans</h3>
        <div className="space-y-3">
          {data.topPlans.map(plan => (
            <div key={plan._id} className="flex items-center justify-between p-3 bg-jolshaa-surface-container-low rounded-lg">
              <div>
                <p className="font-medium">{plan.name} - {plan.creator?.name}</p>
                <p className="text-xs text-jolshaa-on-surface-variant">${plan.price}/{plan.interval} &middot; {plan.subscriberCount} subscribers</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">${plan.totalRevenue.toFixed(2)}</p>
                <Badge variant={plan.isActive ? 'success' : 'danger'}>{plan.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const TipsDonationsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/monetization/tips/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-blue-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Total Tips</p>
          <p className="text-2xl font-bold text-blue-600">{data.totalTips}</p>
        </Card>
        <Card className="bg-emerald-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Total Amount</p>
          <p className="text-2xl font-bold text-emerald-600">${data.totalAmount.toFixed(2)}</p>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-4">Top Recipients</h3>
        <div className="space-y-2">
          {data.topRecipients.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-jolshaa-surface-container-low rounded-lg">
              <div className="flex items-center gap-3">
                {r._id?.profilePhoto && <img src={r._id.profilePhoto} className="w-8 h-8 rounded-full" alt="" />}
                <div>
                  <p className="font-medium text-sm">{r._id?.name}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant">{r.count} tips received</p>
                </div>
              </div>
              <p className="font-bold text-green-600">${r.totalTips.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const TransactionsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 50 });
    if (typeFilter) params.append('type', typeFilter);
    API.get(`/admin/monetization/transactions?${params}`).then(res => setData(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [page, typeFilter]);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  const typeColors = {
    ad_payment: 'info', boost_payment: 'warning', subscription: 'success',
    tip: 'success', payout: 'primary', refund: 'danger', withdrawal: 'neutral',
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">All Transactions ({data.total})</h3>
          <div className="flex gap-2">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="text-sm border rounded px-2 py-1">
              <option value="">All Types</option>
              <option value="ad_payment">Ad Payment</option>
              <option value="boost_payment">Boost Payment</option>
              <option value="subscription">Subscription</option>
              <option value="tip">Tip</option>
              <option value="payout">Payout</option>
              <option value="refund">Refund</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
            <Button size="sm" onClick={() => API.get('/admin/monetization/transactions/export').then(r => {
              const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'transactions.json'; a.click();
            })}>Export</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-jolshaa-on-surface-variant">
                <th className="pb-2">ID</th>
                <th className="pb-2">User</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map(tx => (
                <tr key={tx._id} className="border-b last:border-0">
                  <td className="py-2 font-mono text-xs">{tx.transactionId || tx._id.slice(-8)}</td>
                  <td className="py-2">{tx.user?.name}</td>
                  <td className="py-2"><Badge variant={typeColors[tx.type] || 'neutral'}>{tx.type}</Badge></td>
                  <td className="py-2 font-medium">${tx.amount.toFixed(2)}</td>
                  <td className="py-2">
                    <Badge variant={tx.status === 'completed' ? 'success' : tx.status === 'failed' ? 'danger' : 'warning'}>
                      {tx.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-xs text-jolshaa-on-surface-variant">{new Date(tx.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.pages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <span className="text-sm text-jolshaa-on-surface-variant py-1">Page {page} of {data.pages}</span>
            <Button size="sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </Card>
    </div>
  );
};

const RefundsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [formData, setFormData] = useState({ transactionId: '', amount: '', reason: 'fraud', description: '' });

  const fetchData = () => {
    setLoading(true);
    API.get('/admin/monetization/refunds/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefundAction = async (id, status) => {
    await API.put(`/admin/monetization/refunds/${id}`, { status });
    setConfirmModal(null);
    fetchData();
  };

  const handleCreate = async () => {
    if (!formData.transactionId || !formData.amount) return alert('Fill in all required fields');
    await API.post('/admin/monetization/refunds', { transactionId: formData.transactionId, amount: parseFloat(formData.amount), reason: formData.reason, description: formData.description });
    setShowCreate(false);
    setFormData({ transactionId: '', amount: '', reason: 'fraud', description: '' });
    fetchData();
  };

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <Card className="border-amber-200 bg-amber-50">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="text-xs font-medium text-amber-700">Refund actions are irreversible. Always verify before approving.</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-amber-200">
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Pending Refunds</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{data.pendingRefunds}</p>
        </Card>
        <Card className="border-red-200">
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Total Refunded</p>
          <p className="text-2xl font-bold text-red-600 mt-1">${data.totalRefunded?.toFixed(2)}</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Recent Refunds</h3>
          <Button size="sm" variant={showCreate ? 'ghost' : 'primary'} onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : 'Create Refund'}</Button>
        </div>

        {showCreate && (
          <div className="p-4 bg-jolshaa-surface-container-low rounded-lg mb-4 space-y-3 border border-jolshaa-outline-variant">
            <Input placeholder="Transaction ID" value={formData.transactionId} onChange={e => setFormData(p => ({ ...p, transactionId: e.target.value }))} />
            <Input placeholder="Amount" type="number" value={formData.amount} onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))} />
            <select value={formData.reason} onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))} className="w-full text-sm border border-jolshaa-outline-variant rounded-lg px-3 py-2 bg-jolshaa-surface-container-lowest">
              <option value="fraud">Fraud</option>
              <option value="dispute">Dispute</option>
              <option value="technical">Technical</option>
              <option value="duplicate">Duplicate</option>
              <option value="other">Other</option>
            </select>
            <Input placeholder="Description (optional)" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
            <Button onClick={() => setConfirmModal({ type: 'create', data: formData })} variant="danger">Submit Refund</Button>
          </div>
        )}

        <div className="space-y-2">
          {data.recentRefunds?.map(refund => (
            <div key={refund._id} className={`flex items-center justify-between p-3 rounded-lg ${refund.status === 'pending' ? 'bg-amber-50 border border-amber-200' : 'bg-jolshaa-surface-container-low'}`}>
              <div>
                <p className="font-medium text-sm text-jolshaa-on-surface">{refund.user?.name} - ${refund.amount?.toFixed(2)}</p>
                <p className="text-xs text-jolshaa-on-surface-variant">Reason: {refund.reason}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={refund.status === 'processed' ? 'success' : refund.status === 'approved' ? 'info' : refund.status === 'rejected' ? 'danger' : 'warning'} size="xs">{refund.status}</Badge>
                {refund.status === 'pending' && (
                  <div className="flex gap-1">
                    <Button size="xs" variant="success" onClick={() => setConfirmModal({ type: 'approve', id: refund._id })}>Approve</Button>
                    <Button size="xs" variant="danger" onClick={() => setConfirmModal({ type: 'reject', id: refund._id })}>Reject</Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)} title={
        confirmModal?.type === 'create' ? 'Confirm Refund Creation' :
        confirmModal?.type === 'approve' ? 'Approve Refund' : 'Reject Refund'
      }>
        <div className="p-5 space-y-4">
          {confirmModal?.type === 'create' && (
            <p className="text-sm text-jolshaa-on-surface-variant">Are you sure you want to create a refund of <span className="font-bold text-red-600">${parseFloat(confirmModal.data.amount)?.toFixed(2)}</span> for transaction {confirmModal.data.transactionId}? This action cannot be undone.</p>
          )}
          {confirmModal?.type === 'approve' && (
            <p className="text-sm text-jolshaa-on-surface-variant">Are you sure you want to approve this refund? The amount will be returned to the user.</p>
          )}
          {confirmModal?.type === 'reject' && (
            <p className="text-sm text-jolshaa-on-surface-variant">Are you sure you want to reject this refund? The user will not receive a refund.</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button variant={confirmModal?.type === 'approve' ? 'success' : 'danger'} onClick={() => {
              if (confirmModal?.type === 'create') handleCreate();
              else if (confirmModal?.type === 'approve') handleRefundAction(confirmModal.id, 'processed');
              else handleRefundAction(confirmModal.id, 'rejected');
            }}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const CreatorApplicationsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [reviewModal, setReviewModal] = useState(null);
  const [note, setNote] = useState('');

  const fetchData = () => {
    setLoading(true);
    API.get('/creator/admin/pending-applications').then(res => setData(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (userId) => {
    await API.put(`/creator/admin/approve/${userId}`, { note });
    setReviewModal(null);
    setNote('');
    fetchData();
  };

  const handleReject = async (userId) => {
    await API.put(`/creator/admin/reject/${userId}`, { note });
    setReviewModal(null);
    setNote('');
    fetchData();
  };

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  const apps = data.applications || [];
  const shown = filter ? apps.filter(a => a.monetization?.verificationStatus === filter) : apps;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-blue-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Total Applications</p>
          <p className="text-2xl font-bold text-blue-600">{apps.length}</p>
        </Card>
        <Card className="bg-amber-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Pending Review</p>
          <p className="text-2xl font-bold text-amber-600">{apps.filter(a => a.monetization?.verificationStatus === 'pending').length}</p>
        </Card>
        <Card className="bg-green-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Approved</p>
          <p className="text-2xl font-bold text-green-600">{apps.filter(a => a.monetization?.verificationStatus === 'approved').length}</p>
        </Card>
        <Card className="bg-red-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{apps.filter(a => a.monetization?.verificationStatus === 'rejected').length}</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Creator Applications</h3>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="text-sm border rounded px-2 py-1">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        {shown.length === 0 ? (
          <p className="text-center py-8 text-jolshaa-on-surface-variant text-sm">No applications found</p>
        ) : (
          <div className="space-y-3">
            {shown.map(app => (
              <div key={app._id} className="p-4 bg-jolshaa-surface-container-low rounded-lg border border-jolshaa-outline-variant">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {app.profilePhoto && <img src={app.profilePhoto} className="w-10 h-10 rounded-full" alt="" />}
                    <div>
                      <p className="font-medium text-jolshaa-on-surface">{app.name}</p>
                      <p className="text-xs text-jolshaa-on-surface-variant">{app.email}</p>
                      <div className="flex gap-3 mt-1 text-xs text-jolshaa-on-surface-variant">
                        <span>{app.followers?.length || 0} followers</span>
                        <span>Applied {app.monetization?.appliedAt ? new Date(app.monetization.appliedAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={app.monetization?.verificationStatus === 'pending' ? 'warning' : app.monetization?.verificationStatus === 'approved' ? 'success' : 'danger'}>
                      {app.monetization?.verificationStatus}
                    </Badge>
                    {app.monetization?.verificationStatus === 'pending' && (
                      <Button size="sm" onClick={() => setReviewModal(app)}>Review</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={!!reviewModal} onClose={() => { setReviewModal(null); setNote(''); }} title="Review Application">
        <div className="p-5 space-y-4">
          {reviewModal && (
            <>
              <div className="flex items-center gap-3">
                {reviewModal.profilePhoto && <img src={reviewModal.profilePhoto} className="w-12 h-12 rounded-full" alt="" />}
                <div>
                  <p className="font-medium">{reviewModal.name}</p>
                  <p className="text-sm text-jolshaa-on-surface-variant">{reviewModal.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-jolshaa-surface-container-low rounded-lg p-3">
                  <p className="text-lg font-bold text-blue-600">{reviewModal.followers?.length || 0}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant">Followers</p>
                </div>
                <div className="bg-jolshaa-surface-container-low rounded-lg p-3">
                  <p className="text-lg font-bold text-purple-600">{reviewModal.monetization?.appliedAt ? Math.floor((Date.now() - new Date(reviewModal.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant">Account Age (days)</p>
                </div>
              </div>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border-jolshaa-outline-variant"
                rows={3}
                placeholder="Add a note (optional)"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="danger" onClick={() => handleReject(reviewModal._id)}>Reject</Button>
                <Button variant="success" onClick={() => handleApprove(reviewModal._id)}>Approve</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

const AdReviewQueuePanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    API.get('/ads/admin/review-queue?limit=50').then(res => setData(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (campaignId) => {
    await API.put(`/ads/admin/${campaignId}/approve`);
    fetchData();
  };

  const handleReject = async (campaignId) => {
    await API.put(`/ads/admin/${campaignId}/reject`);
    fetchData();
  };

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  const campaigns = data.campaigns || [];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Ad Campaign Review Queue</h3>
          <span className="text-sm text-jolshaa-on-surface-variant">{campaigns.length} pending review</span>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-center py-8 text-jolshaa-on-surface-variant text-sm">No campaigns pending review</p>
        ) : (
          <div className="space-y-3">
            {campaigns.map(campaign => (
              <div key={campaign._id} className="p-4 bg-jolshaa-surface-container-low rounded-lg border border-jolshaa-outline-variant">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-jolshaa-on-surface">{campaign.title || 'Untitled Campaign'}</p>
                    <p className="text-xs text-jolshaa-on-surface-variant">by {campaign.advertiser?.name} &middot; {campaign.postType === 'video' ? 'Video' : 'Photo'} Post</p>
                    <div className="flex gap-3 mt-1 text-xs text-jolshaa-on-surface-variant">
                      <span>Budget: {campaign.budget} BDT</span>
                      <span>Spent: {campaign.spent?.toFixed(2) || '0.00'} BDT</span>
                      <span>Impressions: {(campaign.impressions || 0).toLocaleString()}</span>
                      <span>Clicks: {(campaign.clicks || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">pending review</Badge>
                    <div className="flex gap-1">
                      <Button size="sm" variant="success" onClick={() => handleApprove(campaign._id)}>Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => handleReject(campaign._id)}>Reject</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

const PayoutRequestsPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [processModal, setProcessModal] = useState(null);
  const [adminNote, setAdminNote] = useState('');

  const fetchData = () => {
    setLoading(true);
    API.get('/payouts/admin/pending').then(res => setData(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleProcess = async (requestId, status) => {
    await API.put(`/payouts/admin/${requestId}/process`, { status, adminNote });
    setProcessModal(null);
    setAdminNote('');
    fetchData();
  };

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  const payouts = data.payouts || [];
  const statusColors = { pending: 'warning', processing: 'info', completed: 'success', rejected: 'danger', failed: 'danger' };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-amber-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{data.total || 0}</p>
        </Card>
        <Card className="bg-blue-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Total Requests</p>
          <p className="text-2xl font-bold text-blue-600">{data.total || 0}</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Payout Requests</h3>
        </div>
        {payouts.length === 0 ? (
          <p className="text-center py-8 text-jolshaa-on-surface-variant text-sm">No pending payout requests</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-jolshaa-on-surface-variant">
                  <th className="pb-2">Creator</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Method</th>
                  <th className="pb-2">Account</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map(req => (
                  <tr key={req._id} className="border-b last:border-0">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        {req.user?.profilePhoto && <img src={req.user.profilePhoto} className="w-6 h-6 rounded-full" alt="" />}
                        <span>{req.user?.name}</span>
                      </div>
                    </td>
                    <td className="py-2 font-medium">{req.amount} BDT</td>
                    <td className="py-2 capitalize">{req.paymentMethod}</td>
                    <td className="py-2 font-mono text-xs">{req.accountDetails}</td>
                    <td className="py-2"><Badge variant={statusColors[req.status]}>{req.status}</Badge></td>
                    <td className="py-2 text-xs text-jolshaa-on-surface-variant">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="py-2">
                      {req.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="success" onClick={() => setProcessModal({ ...req, action: 'completed' })}>Approve</Button>
                          <Button size="sm" variant="danger" onClick={() => setProcessModal({ ...req, action: 'rejected' })}>Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={!!processModal} onClose={() => { setProcessModal(null); setAdminNote(''); }} title={`Process Payout: ${processModal?.action === 'completed' ? 'Approve' : 'Reject'}`}>
        <div className="p-5 space-y-4">
          {processModal && (
            <>
              <p className="text-sm text-jolshaa-on-surface-variant">
                {processModal.action === 'completed'
                  ? `Confirm payout of ${processModal.amount} BDT to ${processModal.user?.name} via ${processModal.paymentMethod}?`
                  : `Reject payout request of ${processModal.amount} BDT from ${processModal.user?.name}?`
                }
              </p>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm bg-jolshaa-surface-container-lowest border-jolshaa-outline-variant"
                rows={2}
                placeholder="Admin note (optional)"
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => { setProcessModal(null); setAdminNote(''); }}>Cancel</Button>
                <Button variant={processModal.action === 'completed' ? 'success' : 'danger'} onClick={() => handleProcess(processModal._id, processModal.action)}>
                  {processModal.action === 'completed' ? 'Confirm Payment' : 'Reject Request'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

const PlatformRevenuePanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    API.get('/payouts/admin/platform-revenue').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="bg-emerald-50">
          <p className="text-xs text-jolshaa-on-surface-variant">This Month Revenue</p>
          <p className="text-2xl font-bold text-emerald-600">{data.thisMonthRevenue?.toFixed(2) || '0.00'} BDT</p>
        </Card>
        <Card className="bg-blue-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Last Month Revenue</p>
          <p className="text-2xl font-bold text-blue-600">{data.lastMonthRevenue?.toFixed(2) || '0.00'} BDT</p>
        </Card>
        <Card className="bg-purple-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Revenue Change</p>
          <p className="text-2xl font-bold text-purple-600">{data.revenueChange || 0}%</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-amber-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Total Paid Out</p>
          <p className="text-2xl font-bold text-amber-600">{data.totalPaidOut?.toFixed(2) || '0.00'} BDT</p>
        </Card>
        <Card className="bg-red-50">
          <p className="text-xs text-jolshaa-on-surface-variant">Pending Payout Liability</p>
          <p className="text-2xl font-bold text-red-600">{data.pendingPayoutLiability?.toFixed(2) || '0.00'} BDT</p>
        </Card>
      </div>

      <Card>
        <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface mb-4">Top Earning Creators</h3>
        <div className="space-y-3">
          {(data.topCreators || []).map((creator, i) => (
            <div key={creator._id} className="flex items-center justify-between p-3 bg-jolshaa-surface-container-low rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-jolshaa-on-surface-variant w-6">#{i + 1}</span>
                {creator.profilePhoto && <img src={creator.profilePhoto} className="w-8 h-8 rounded-full" alt="" />}
                <div>
                  <p className="font-medium text-sm">{creator.name}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant">Balance: {creator.monetization?.availableBalance?.toFixed(2) || '0.00'} BDT</p>
                </div>
              </div>
              <p className="font-bold text-emerald-600">{creator.monetization?.totalEarnings?.toFixed(2) || '0.00'} BDT</p>
            </div>
          ))}
          {(!data.topCreators || data.topCreators.length === 0) && (
            <p className="text-center py-4 text-jolshaa-on-surface-variant text-sm">No creator data yet</p>
          )}
        </div>
      </Card>
    </div>
  );
};

const FraudDetectionPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(null);
  const [scanning, setScanning] = useState(false);

  const fetchData = () => {
    setLoading(true);
    API.get('/admin/monetization/fraud/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id, status) => {
    await API.put(`/admin/monetization/fraud/${id}`, { status });
    setConfirmModal(null);
    fetchData();
  };

  const handleScan = async () => {
    setScanning(true);
    await API.post('/admin/monetization/fraud/scan');
    fetchData();
    setScanning(false);
  };

  if (loading) return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  if (!data) return null;

  const severityColors = { low: 'info', medium: 'warning', high: 'danger', critical: 'danger' };
  const severityBg = { low: 'bg-blue-50', medium: 'bg-amber-50', high: 'bg-red-50', critical: 'bg-red-100' };
  const statusColors = { open: 'warning', investigating: 'info', resolved: 'success', dismissed: 'neutral' };

  return (
    <div className="space-y-4">
      <Card className="border-red-200 bg-red-50">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="text-xs font-medium text-red-700">Fraud detection requires careful review. Verify evidence before taking action.</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-amber-200">
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Open Alerts</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{data.openAlerts}</p>
        </Card>
        <Card className="border-red-200">
          <p className="text-[10px] font-medium text-jolshaa-on-surface-variant uppercase tracking-wider">Critical Alerts</p>
          <p className={`text-2xl font-bold mt-1 ${data.criticalAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>{data.criticalAlerts}</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold font-display text-jolshaa-on-surface">Fraud Alerts</h3>
          <Button size="sm" variant="ghost" onClick={handleScan} disabled={scanning}>{scanning ? 'Scanning...' : 'Run Auto-Scan'}</Button>
        </div>
        <div className="space-y-2">
          {data.recentAlerts?.length === 0 ? (
            <div className="text-center py-8 text-jolshaa-on-surface-variant text-sm">No fraud alerts</div>
          ) : data.recentAlerts?.map(alert => (
            <div key={alert._id} className={`p-3 rounded-lg border ${severityBg[alert.severity] || 'bg-jolshaa-surface-container-low'} ${alert.severity === 'critical' ? 'border-red-300' : 'border-jolshaa-outline-variant'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-jolshaa-on-surface">{alert.user?.name}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant">{alert.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={severityColors[alert.severity]} size="xs">{alert.severity}</Badge>
                  <Badge variant={statusColors[alert.status]} size="xs">{alert.status}</Badge>
                </div>
              </div>
              {alert.status === 'open' && (
                <div className="flex gap-1.5 mt-2">
                  <Button size="xs" onClick={() => setConfirmModal({ type: 'investigate', id: alert._id })}>Investigate</Button>
                  <Button size="xs" variant="success" onClick={() => setConfirmModal({ type: 'resolve', id: alert._id })}>Resolve</Button>
                  <Button size="xs" variant="danger" onClick={() => setConfirmModal({ type: 'dismiss', id: alert._id })}>Dismiss</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)} title={
        confirmModal?.type === 'investigate' ? 'Investigate Alert' :
        confirmModal?.type === 'resolve' ? 'Resolve Alert' : 'Dismiss Alert'
      }>
        <div className="p-5 space-y-4">
          {confirmModal?.type === 'investigate' && <p className="text-sm text-jolshaa-on-surface-variant">Mark this fraud alert as under investigation?</p>}
          {confirmModal?.type === 'resolve' && <p className="text-sm text-jolshaa-on-surface-variant">Mark this fraud alert as resolved? This indicates the issue has been addressed.</p>}
          {confirmModal?.type === 'dismiss' && <p className="text-sm text-red-600 font-medium">Dismiss this fraud alert? This action indicates the alert was a false positive.</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button variant={confirmModal?.type === 'resolve' ? 'success' : confirmModal?.type === 'dismiss' ? 'danger' : 'primary'} onClick={() => {
              const statusMap = { investigate: 'investigating', resolve: 'resolved', dismiss: 'dismissed' };
              handleAction(confirmModal.id, statusMap[confirmModal.type]);
            }}>Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MonetizationTab;

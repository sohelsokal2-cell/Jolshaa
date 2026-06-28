import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';

const CreatorEarnings = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank_transfer');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [earningsRes, payoutsRes] = await Promise.all([
        API.get('/creator/earnings'),
        API.get('/creator/payouts'),
      ]);
      setEarnings(earningsRes.data);
      setPayouts(payoutsRes.data.payouts || []);
    } catch (err) {
      console.error('Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return alert('Enter a valid amount');
    if (amount > (earnings?.availableBalance || 0)) return alert('Insufficient balance');

    setSubmitting(true);
    try {
      await API.post('/creator/withdraw', {
        amount,
        paymentMethod: withdrawMethod,
        paymentDetails: withdrawDetails ? JSON.parse(withdrawDetails) : undefined,
      });
      alert('Withdrawal request submitted!');
      setWithdrawAmount('');
      setWithdrawDetails('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded" />)}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!earnings) return null;

  const statusColors = {
    pending: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    processing: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    completed: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    failed: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    held: 'text-neutral-600 bg-neutral-50 dark:bg-neutral-800',
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">Creator Earnings</h1>

        <div className="flex gap-4 border-b border-neutral-200 dark:border-neutral-700 mb-6">
          {['overview', 'withdraw', 'payouts'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 px-1 font-medium text-sm border-b-2 capitalize transition-colors ${
                tab === t
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Earned', value: `$${earnings.totalEarned.toFixed(2)}`, color: 'text-neutral-900 dark:text-neutral-100' },
                { label: 'Available Balance', value: `$${earnings.availableBalance.toFixed(2)}`, color: 'text-green-600' },
                { label: 'Total Paid Out', value: `$${earnings.totalPaidOut.toFixed(2)}`, color: 'text-blue-600' },
                { label: 'Pending Payout', value: `$${earnings.pendingPayout.toFixed(2)}`, color: 'text-amber-600' },
              ].map(s => (
                <div key={s.label} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-sm text-neutral-500">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-neutral-100">Tips</h3>
                <p className="text-2xl font-bold text-emerald-600">${earnings.tipRevenue.toFixed(2)}</p>
                <p className="text-sm text-neutral-500">{earnings.tipCount} tips received</p>
              </div>
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
                <h3 className="font-semibold mb-3 text-neutral-900 dark:text-neutral-100">Subscriptions</h3>
                <p className="text-2xl font-bold text-purple-600">${earnings.subscriptionRevenue.toFixed(2)}</p>
                <p className="text-sm text-neutral-500">{earnings.subscriptionCount} subscriptions</p>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
              <h3 className="font-semibold mb-3 text-neutral-900 dark:text-neutral-100">Recent Transactions</h3>
              {earnings.recentTransactions.length === 0 ? (
                <p className="text-neutral-500 text-center py-4">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {earnings.recentTransactions.map(tx => (
                    <div key={tx._id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {tx.type === 'tip' ? 'Tip' : tx.type === 'subscription' ? 'Subscription' : tx.type}
                        </p>
                        <p className="text-xs text-neutral-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <p className="font-bold text-green-600">+${tx.amount.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'withdraw' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
              <h3 className="font-semibold mb-4 text-neutral-900 dark:text-neutral-100">Request Withdrawal</h3>
              <p className="text-sm text-neutral-500 mb-4">
                Available balance: <span className="font-bold text-green-600">${earnings.availableBalance.toFixed(2)}</span>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Payment Method</label>
                  <select
                    value={withdrawMethod}
                    onChange={e => setWithdrawMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Payment Details (JSON, optional)
                  </label>
                  <textarea
                    value={withdrawDetails}
                    onChange={e => setWithdrawDetails(e.target.value)}
                    placeholder='{"accountName": "...", "accountNumber": "...", "bank": "..."}'
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-sm"
                  />
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={submitting || !withdrawAmount}
                  className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Request Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'payouts' && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
            <h3 className="font-semibold mb-4 text-neutral-900 dark:text-neutral-100">Payout History</h3>
            {payouts.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No payouts yet</p>
            ) : (
              <div className="space-y-3">
                {payouts.map(p => (
                  <div key={p._id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">${p.amount.toFixed(2)}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(p.period.from).toLocaleDateString()} - {new Date(p.period.to).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColors[p.status] || ''}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CreatorEarnings;

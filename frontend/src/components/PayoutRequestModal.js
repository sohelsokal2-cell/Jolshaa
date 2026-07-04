import { useState, useEffect } from 'react';
import API from '../api/axios';
import Modal from './ui/Modal';

const PayoutRequestModal = ({ isOpen, onClose }) => {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bkash');
  const [accountDetails, setAccountDetails] = useState({
    accountNumber: '',
    accountName: '',
    bankName: '',
    branchName: '',
    routingNumber: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      API.get('/creator/earnings-dashboard')
        .then(res => setBalance(res.data.availableBalance || 0))
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 1000) {
      setMessage('Minimum payout is 1,000 BDT');
      return;
    }
    if (amt > balance) {
      setMessage('Amount exceeds available balance');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      await API.post('/payouts/request', {
        amount: amt,
        method,
        accountDetails,
      });
      setMessage('Payout request submitted! Processing takes 3-5 business days.');
      setTimeout(() => {
        onClose();
        setAmount('');
        setMessage('');
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const methods = [
    { id: 'bkash', label: 'bKash', icon: '📱' },
    { id: 'nagad', label: 'Nagad', icon: '💳' },
    { id: 'rocket', label: 'Rocket', icon: '🚀' },
    { id: 'bank', label: 'Bank Transfer', icon: '🏦' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Payout" size="md">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <span className="text-sm text-neutral-500">Available Balance</span>
          <span className="font-bold text-green-600 text-lg">৳{balance.toLocaleString()}</span>
        </div>

        {balance < 1000 ? (
          <div className="text-center py-6">
            <p className="text-neutral-500 text-sm">
              You need at least ৳1,000 to request a payout.
            </p>
            <p className="text-neutral-400 text-xs mt-1">
              Current balance: ৳{balance.toLocaleString()}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Amount (BDT)</label>
              <input
                type="number"
                min="1000"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Minimum 1,000 BDT"
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {methods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                      method === m.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                    }`}
                  >
                    <span>{m.icon}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountDetails.accountNumber}
                  onChange={(e) => setAccountDetails({ ...accountDetails, accountNumber: e.target.value })}
                  placeholder={method === 'bank' ? 'Account number' : 'Mobile number'}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={accountDetails.accountName}
                  onChange={(e) => setAccountDetails({ ...accountDetails, accountName: e.target.value })}
                  placeholder="Name on account"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              {method === 'bank' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={accountDetails.bankName}
                      onChange={(e) => setAccountDetails({ ...accountDetails, bankName: e.target.value })}
                      placeholder="e.g. Dutch-Bangla Bank"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Branch</label>
                    <input
                      type="text"
                      value={accountDetails.branchName}
                      onChange={(e) => setAccountDetails({ ...accountDetails, branchName: e.target.value })}
                      placeholder="Branch name"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Routing Number</label>
                    <input
                      type="text"
                      value={accountDetails.routingNumber}
                      onChange={(e) => setAccountDetails({ ...accountDetails, routingNumber: e.target.value })}
                      placeholder="9-digit routing number"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>

            {message && (
              <p className={`text-sm mb-4 ${message.includes('success') || message.includes('submitted') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !amount || parseFloat(amount) < 1000}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PayoutRequestModal;

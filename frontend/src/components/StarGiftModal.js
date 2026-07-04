import { useState, useEffect } from 'react';
import API from '../api/axios';
import Modal from './ui/Modal';
import StarPurchaseModal from './StarPurchaseModal';

const StarGiftModal = ({ isOpen, onClose, toUserId, postId = null, creatorName = '' }) => {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState(10);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showBuyStars, setShowBuyStars] = useState(false);

  const quickAmounts = [10, 50, 100, 500];

  useEffect(() => {
    if (isOpen) {
      API.get('/payments/stars/balance')
        .then(res => setBalance(res.data.starsBalance))
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (amount > balance) {
      setShowBuyStars(true);
      return;
    }
    setSending(true);
    try {
      await API.post('/payments/stars/gift', {
        toUserId,
        postId,
        starsAmount: amount,
        message: message || undefined,
      });
      setSent(true);
      setTimeout(() => {
        onClose();
        setSent(false);
        setAmount(10);
        setMessage('');
      }, 2000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send gift');
    } finally {
      setSending(false);
    }
  };

  const insufficientBalance = amount > balance;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Send Stars" size="sm">
        <div className="p-5">
          {sent ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">⭐</div>
              <p className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">Gift Sent!</p>
              <p className="text-sm text-neutral-500 mt-1">
                {amount} stars sent to {creatorName || 'creator'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <span className="text-sm text-neutral-500">Your Balance</span>
                <span className="font-bold text-amber-600">⭐ {balance.toLocaleString()}</span>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Select Amount
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {quickAmounts.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAmount(a)}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                        amount === a
                          ? 'bg-amber-500 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Custom amount"
                />
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message (optional)"
                  maxLength={200}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {insufficientBalance && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Insufficient balance. You need {amount - balance} more stars.
                  </p>
                  <button
                    onClick={() => setShowBuyStars(true)}
                    className="text-sm font-medium text-amber-800 dark:text-amber-200 underline mt-1"
                  >
                    Buy More Stars
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || amount <= 0 || insufficientBalance}
                  className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? 'Sending...' : `Send ${amount} Stars`}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <StarPurchaseModal isOpen={showBuyStars} onClose={() => setShowBuyStars(false)} />
    </>
  );
};

export default StarGiftModal;

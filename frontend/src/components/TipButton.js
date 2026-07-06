import { useState } from 'react';
import API from '../api/axios';

const TipButton = ({ userId, tipsEnabled }) => {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (!tipsEnabled) return null;

  const amounts = [
    { value: 10, label: '☕ চা', sub: '৳10' },
    { value: 20, label: '🍵 চিনিগুড়া', sub: '৳20' },
    { value: 50, label: '🍛 ভাত', sub: '৳50' },
    { value: 100, label: '🎬 মুভি', sub: '৳100' },
    { value: 500, label: '🎉 বড় ধামাকা', sub: '৳500' },
  ];

  const handleSendTip = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    try {
      await API.post(`/tips/send/${userId}`, { amount: parseFloat(amount), message });
      setSent(true);
      setTimeout(() => {
        setShowModal(false);
        setSent(false);
        setAmount('');
        setMessage('');
      }, 1500);
    } catch (err) {
      console.error('Failed to send tip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-sm text-green-600 hover:text-green-700 font-medium"
      >
        💰 চা-পানি দিন
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <h3 className="font-display font-semibold">চা-পানির খরচ দিন 🫖</h3>
            </div>

            {sent ? (
              <div className="p-8 text-center">
                <p className="text-4xl mb-2">🎉</p>
                <p className="font-medium text-green-600">Tip sent!</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-5 gap-1.5">
                  {amounts.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setAmount(a.value.toString())}
                      title={a.label}
                      className={`flex flex-col items-center py-2 px-0.5 rounded-lg text-2xs font-medium leading-tight ${
                        amount === a.value.toString()
                          ? 'bg-green-600 text-white'
                          : 'bg-jolshaa-surface-container-low hover:bg-jolshaa-surface-container'
                      }`}
                    >
                      <span className="text-base">{a.label.split(' ')[0]}</span>
                      <span>{a.sub}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="নিজের টাকার পরিমাণ (৳)"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-2xs text-jolshaa-on-surface-variant">Pay with bKash, Nagad or Rocket</p>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message (optional)"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2 border rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendTip}
                    disabled={!amount || loading}
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'পাঠানো হচ্ছে...' : `৳${amount || 0} পাঠান`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default TipButton;

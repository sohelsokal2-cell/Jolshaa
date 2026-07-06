import { useState } from 'react';
import API from '../api/axios';

const TipButton = ({ userId, tipsEnabled }) => {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (!tipsEnabled) return null;

  const amounts = [1, 2, 5, 10, 25];

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
        💰 Send Tip
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <h3 className="font-display font-semibold">Send a Tip</h3>
            </div>

            {sent ? (
              <div className="p-8 text-center">
                <p className="text-4xl mb-2">🎉</p>
                <p className="font-medium text-green-600">Tip sent!</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-5 gap-2">
                  {amounts.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAmount(a.toString())}
                      className={`py-2 rounded-lg text-sm font-medium ${
                        amount === a.toString()
                          ? 'bg-green-600 text-white'
                          : 'bg-jolshaa-surface-container-low hover:bg-jolshaa-surface-container'
                      }`}
                    >
                      ${a}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Custom amount"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
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
                    {loading ? 'Sending...' : 'Send Tip'}
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

import { useState, useEffect } from 'react';
import API from '../api/axios';
import Modal from './ui/Modal';

const StarPurchaseModal = ({ isOpen, onClose }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      API.get('/payments/stars/packages')
        .then(res => setPackages(res.data.packages))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handlePurchase = async (pkg) => {
    setSelectedPkg(pkg);
    setPurchasing(true);
    try {
      const res = await API.post('/payments/stars/purchase', {
        packageId: pkg.id,
        paymentMethod: 'sslcommerz',
      });
      if (res.data.gatewayUrl) {
        window.location.href = res.data.gatewayUrl;
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate purchase');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Buy Stars" size="md">
      <div className="p-5">
        <p className="text-sm text-neutral-500 mb-4">
          Purchase Stars to send gifts to your favorite creators.
          Stars can be used to send virtual gifts on posts and videos.
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handlePurchase(pkg)}
                disabled={purchasing}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  selectedPkg?.id === pkg.id && purchasing
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⭐</span>
                  <div className="text-left">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {pkg.stars.toLocaleString()} Stars
                    </p>
                    {pkg.popular && (
                      <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Most Popular</span>
                    )}
                    {pkg.bestValue && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Best Value</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-neutral-900 dark:text-neutral-100">
                    {pkg.priceBDT} BDT
                  </p>
                  {pkg.stars > 100 && (
                    <p className="text-xs text-neutral-500">
                      {((pkg.priceBDT / pkg.stars) * 100).toFixed(0)}% of face value
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-neutral-400 mt-4 text-center">
          Payments processed securely via SSLCommerz. Star purchases are non-refundable.
        </p>
      </div>
    </Modal>
  );
};

export default StarPurchaseModal;

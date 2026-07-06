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
        <p className="text-sm text-jolshaa-on-surface-variant mb-4">
          Purchase Stars to send gifts to your favorite creators.
          Stars can be used to send virtual gifts on posts and videos.
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-jolshaa-surface-container rounded-xl animate-pulse" />
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
                    ? 'border-jolshaa-teal bg-jolshaa-teal/10'
                    : 'border-jolshaa-outline-variant hover:border-jolshaa-teal'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⭐</span>
                  <div className="text-left">
                    <p className="font-semibold text-jolshaa-on-surface">
                      {pkg.stars.toLocaleString()} Stars
                    </p>
                    {pkg.popular && (
                      <span className="text-xs text-jolshaa-teal font-medium">Most Popular</span>
                    )}
                    {pkg.bestValue && (
                      <span className="text-xs text-green-600 font-medium">Best Value</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-jolshaa-on-surface">
                    {pkg.priceBDT} BDT
                  </p>
                  {pkg.stars > 100 && (
                    <p className="text-xs text-jolshaa-on-surface-variant">
                      {((pkg.priceBDT / pkg.stars) * 100).toFixed(0)}% of face value
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-jolshaa-on-surface-variant/60 mt-4 text-center">
          Payments processed securely via SSLCommerz. Star purchases are non-refundable.
        </p>
      </div>
    </Modal>
  );
};

export default StarPurchaseModal;

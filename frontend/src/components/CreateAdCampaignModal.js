import { useState } from 'react';
import API from '../api/axios';
import Modal from '../components/ui/Modal';

const BANGLADESH_DIVISIONS = [
  'Barisal', 'Chittagong', 'Dhaka', 'Khulna', 'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet'
];

const CreateAdCampaignModal = ({ isOpen, onClose, onCreated }) => {
  const [step, setStep] = useState(1);
  const [postId, setPostId] = useState('');
  const [myPosts, setMyPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [budget, setBudget] = useState('');
  const [dailyBudget, setDailyBudget] = useState('');
  const [duration, setDuration] = useState(7);
  const [targetAudience, setTargetAudience] = useState({
    ageMin: 18,
    ageMax: 45,
    gender: 'all',
    division: '',
    interests: [],
  });
  const [creating, setCreating] = useState(false);

  const fetchMyPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await API.get('/posts/my-posts?limit=20');
      setMyPosts(res.data.posts || []);
    } catch (err) {
      console.error('Failed to load posts');
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleCreate = async () => {
    if (!postId || !budget || !dailyBudget) return;
    setCreating(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(duration));

      const res = await API.post('/ads/create', {
        postId,
        budget: parseFloat(budget),
        dailyBudget: parseFloat(dailyBudget),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        targetAudience,
      });

      // Redirect to payment
      const payRes = await API.post(`/ads/${res.data.campaign._id}/pay`, {
        paymentMethod: 'sslcommerz',
      });

      if (payRes.data.gatewayUrl) {
        window.location.href = payRes.data.gatewayUrl;
      } else {
        onCreated();
        onClose();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const estimatedReach = budget ? Math.round(parseFloat(budget) * 50) : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Ad Campaign" size="lg">
      <div className="p-5">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s ? 'bg-primary-600 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500'
              }`}>
                {s}
              </div>
              {s < 4 && <div className={`w-8 h-0.5 ${step > s ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Select Post */}
        {step === 1 && (
          <div>
            <h3 className="font-semibold mb-3 text-neutral-900 dark:text-neutral-100">Select Post to Boost</h3>
            <button onClick={fetchMyPosts} className="text-sm text-primary-600 hover:text-primary-700 mb-3">
              Load My Posts
            </button>
            {loadingPosts ? (
              <div className="text-center py-4 text-neutral-500">Loading posts...</div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {myPosts.map(post => (
                  <button
                    key={post._id}
                    onClick={() => { setPostId(post._id); setStep(2); }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      postId === post._id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <p className="text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2">{post.text || 'No text'}</p>
                    <p className="text-xs text-neutral-500 mt-1">{new Date(post.createdAt).toLocaleDateString()}</p>
                  </button>
                ))}
                {myPosts.length === 0 && (
                  <p className="text-neutral-500 text-center py-4">No posts found</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Set Budget */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Set Budget</h3>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Total Budget (BDT)</label>
              <input
                type="number"
                min="100"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Minimum 100 BDT"
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Daily Budget (BDT)</label>
              <input
                type="number"
                min="10"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
                placeholder="Daily spending limit"
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Duration (days)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
              >
                {[1, 3, 7, 14, 30].map(d => (
                  <option key={d} value={d}>{d} days</option>
                ))}
              </select>
            </div>
            {budget && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Estimated reach: <strong>{estimatedReach.toLocaleString()}</strong> people
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium">
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!budget || !dailyBudget || parseFloat(budget) < 100}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Target Audience */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Target Audience</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Min Age</label>
                <input
                  type="number"
                  min="13"
                  max="65"
                  value={targetAudience.ageMin}
                  onChange={(e) => setTargetAudience({ ...targetAudience, ageMin: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Max Age</label>
                <input
                  type="number"
                  min="13"
                  max="65"
                  value={targetAudience.ageMax}
                  onChange={(e) => setTargetAudience({ ...targetAudience, ageMax: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Gender</label>
              <select
                value={targetAudience.gender}
                onChange={(e) => setTargetAudience({ ...targetAudience, gender: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
              >
                <option value="all">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Division</label>
              <select
                value={targetAudience.division}
                onChange={(e) => setTargetAudience({ ...targetAudience, division: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
              >
                <option value="">All Bangladesh</option>
                {BANGLADESH_DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium">
                Back
              </button>
              <button onClick={() => setStep(4)} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review + Payment */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Review Campaign</h3>
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Budget</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">৳{budget}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Daily Budget</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">৳{dailyBudget}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Duration</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{duration} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Target</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {targetAudience.gender === 'all' ? 'All' : targetAudience.gender}, ages {targetAudience.ageMin}-{targetAudience.ageMax}
                  {targetAudience.division ? `, ${targetAudience.division}` : ''}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-neutral-200 dark:border-neutral-700 pt-2">
                <span className="text-neutral-500">Estimated Reach</span>
                <span className="font-bold text-primary-600">~{estimatedReach.toLocaleString()} people</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium">
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {creating ? 'Processing...' : `Pay ৳${budget} & Launch`}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CreateAdCampaignModal;

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import HelpCoordinationChat from '../components/HelpCoordinationChat';

const HELP_TYPE_ICONS = {
  medical: '🏥', flood: '🌊', fire: '🔥', lost_person: '🔍',
  food: '🍲', shelter: '🏠', financial: '💰', other: '🆘',
};

const HelpRequestDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offerMessage, setOfferMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const [showResolve, setShowResolve] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [myConversation, setMyConversation] = useState(null);

  useEffect(() => { fetchRequest(); }, [id]);

  const fetchRequest = async () => {
    try {
      const res = await API.get(`/help/${id}`);
      setRequest(res.data);
    } catch (err) {
      console.error('Failed to fetch help request');
    } finally {
      setLoading(false);
    }
  };

  const handleOffer = async () => {
    if (!offerMessage.trim() || submitting) return;
    setSubmitting(true);
    try {
      await API.post(`/help/${id}/offer`, { message: offerMessage });
      setOfferMessage('');
      fetchRequest();
    } catch (err) {
      console.error('Failed to offer help');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (helperId) => {
    try {
      const res = await API.put(`/help/${id}/accept/${helperId}`);
      if (res.data.conversation?._id) {
        setMyConversation(res.data.conversation);
        setShowChat(true);
      }
      fetchRequest();
    } catch (err) {
      console.error('Failed to accept helper');
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await API.put(`/help/${id}/resolve`, { resolvedNote: resolveNote });
      setShowResolve(false);
      fetchRequest();
    } catch (err) {
      console.error('Failed to resolve');
    } finally {
      setResolving(false);
    }
  };

  if (loading) return <Layout><div className="text-center py-12 text-neutral-500">Loading...</div></Layout>;
  if (!request) return <Layout><div className="text-center py-12 text-neutral-500">Not found</div></Layout>;

  const isOwner = user?.id === request.requester?._id;
  const myOffer = request.helpers?.find(h => h.user?._id === user?.id || h.user === user?.id);
  const timeLeft = () => {
    const diff = new Date(request.expiresAt) - new Date();
    if (diff <= 0) return 'মেয়াদ শেষ';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}দ ${hours % 24}ঘ`;
    return `${hours}ঘ বাকি`;
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <Link to="/help" className="text-sm text-primary-600 hover:underline mb-4 inline-flex items-center gap-1">
          ← সাহায্য ফিড
        </Link>

        {/* Status banner */}
        {request.status === 'resolved' && (
          <div className="mt-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4">
            <p className="text-sm font-bold text-green-700 dark:text-green-300">✅ সমাধান হয়েছে</p>
            {request.resolvedNote && (
              <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">{request.resolvedNote}</p>
            )}
          </div>
        )}

        {/* Main card */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-card overflow-hidden">
          {/* Urgency bar */}
          <div className={`px-4 py-2 ${
            request.urgency === 'immediate' ? 'bg-red-500' :
            request.urgency === 'within_hours' ? 'bg-yellow-500' : 'bg-green-500'
          } text-white`}>
            <div className="flex items-center justify-between text-xs font-medium">
              <span>{HELP_TYPE_ICONS[request.helpType]} {request.helpType.replace('_', ' ').toUpperCase()}</span>
              <span>⏳ {timeLeft()}</span>
            </div>
          </div>

          <div className="p-5">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">{request.title}</h1>

            <div className="flex items-center gap-3 mb-4">
              <Link to={`/profile/${request.requester?._id}`} className="flex items-center gap-2 hover:underline">
                <Avatar src={request.requester?.profilePhoto} alt={request.requester?.name} size="md" />
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{request.requester?.name}</p>
                  <p className="text-xs text-neutral-500">
                    {request.location?.upazila && `${request.location.upazila}, `}
                    {request.location?.district}, {request.location?.division}
                  </p>
                </div>
              </Link>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
              <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{request.description}</p>
            </div>

            <div className="flex items-center gap-4 text-xs text-neutral-500 mb-4">
              <span>👁 {request.viewCount || 0} দেখেছেন</span>
              <span>🤝 {request.helpers?.length || 0} জন সাহায্য করতে চেয়েছেন</span>
            </div>

            {/* Resolve button for owner */}
            {isOwner && request.status === 'active' && (
              <div className="border-t border-neutral-100 dark:border-neutral-700 pt-4 mt-4">
                {showResolve ? (
                  <div className="space-y-3">
                    <textarea
                      value={resolveNote}
                      onChange={(e) => setResolveNote(e.target.value)}
                      placeholder="কীভাবে সমাধান হয়েছে লিখুন (ঐচ্ছিক)..."
                      className="w-full border border-neutral-300 dark:border-neutral-600 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 bg-white dark:bg-neutral-700 resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button variant="success" onClick={handleResolve} disabled={resolving}>
                        {resolving ? '...' : '✅ সমাধান হয়েছে'}
                      </Button>
                      <Button variant="secondary" onClick={() => setShowResolve(false)}>বাতিল</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="success" onClick={() => setShowResolve(true)}>
                    ✅ সমস্যা সমাধান হয়েছে
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Helpers list */}
        {request.helpers?.length > 0 && (
          <div className="mt-4 bg-white dark:bg-neutral-800 rounded-xl shadow-card p-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              🤝 সাহায্য করতে চেয়েছেন ({request.helpers.length})
            </h3>
            <div className="space-y-3">
              {request.helpers.map((h) => (
                <div key={h._id} className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                  <Avatar src={h.user?.profilePhoto} alt={h.user?.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${h.user?._id}`} className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:underline">
                        {h.user?.name}
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        h.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
                      }`}>
                        {h.status === 'accepted' ? 'গ্রহণ করা হয়েছে' : 'অফার করেছেন'}
                      </span>
                    </div>
                    {h.message && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">{h.message}</p>
                    )}
                    {isOwner && h.status === 'offered' && request.status === 'active' && (
                      <Button
                        size="xs"
                        variant="success"
                        className="mt-2"
                        onClick={() => handleAccept(h._id)}
                      >
                        গ্রহণ করুন 🤝
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offer form (for non-owners) */}
        {!isOwner && request.status === 'active' && !myOffer && (
          <div className="mt-4 bg-white dark:bg-neutral-800 rounded-xl shadow-card p-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-3">
              সাহায্য করতে চান?
            </h3>
            <textarea
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
              placeholder="কীভাবে সাহায্য করতে পারবেন লিখুন..."
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 bg-white dark:bg-neutral-700 resize-none mb-3"
              rows={3}
            />
            <Button
              variant="success"
              onClick={handleOffer}
              disabled={!offerMessage.trim() || submitting}
              className="w-full"
            >
              {submitting ? 'পাঠানো হচ্ছে...' : '🤝 আমি সাহায্য করতে পারি'}
            </Button>
          </div>
        )}

        {myOffer && (
          <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              ✅ আপনি সাহায্যের অফার পাঠিয়েছেন
            </p>
          </div>
        )}

        {/* Coordination Chat */}
        {showChat && myConversation && (
          <div className="mt-4" style={{ height: '450px' }}>
            <HelpCoordinationChat
              helpRequest={request}
              conversation={myConversation}
              onClose={() => setShowChat(false)}
            />
          </div>
        )}

        {/* Chat button for accepted helpers */}
        {!showChat && request.helpers?.some(h =>
          (h.user?._id === user?.id || h.user === user?.id) && h.status === 'accepted'
        ) && (
          <div className="mt-4">
            <Button
              variant="danger"
              onClick={async () => {
                try {
                  const res = await API.get(`/conversations?helpRequestId=${request._id}`);
                  const conv = res.data.find(c => c.conversationType === 'help_coordination' && c.helpRequest === request._id);
                  if (conv) {
                    setMyConversation(conv);
                    setShowChat(true);
                  }
                } catch (err) {
                  console.error('Failed to find conversation');
                }
              }}
              className="w-full"
            >
              💬 সাহায্য সমন্বয় চ্যাট
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HelpRequestDetail;

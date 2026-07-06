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

  if (loading) return <Layout><div className="text-center py-12 text-jolshaa-on-surface-variant">Loading...</div></Layout>;
  if (!request) return <Layout><div className="text-center py-12 text-jolshaa-on-surface-variant">Not found</div></Layout>;

  const isOwner = user?.id === request.requester?._id;
  const myOffer = request.helpers?.find(h => h.user?._id === user?.id || h.user === user?.id);
  const timeLeft = () => {
    const diff = new Date(request.expiresAt) - new Date();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    return `${hours}h left`;
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <Link to="/help" className="text-sm text-jolshaa-teal hover:underline mb-4 inline-flex items-center gap-1">
          ← Help Feed
        </Link>

        {/* Status banner */}
        {request.status === 'resolved' && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-bold text-green-700">✅ Resolved</p>
            {request.resolvedNote && (
              <p className="text-xs text-green-600/70 mt-1">{request.resolvedNote}</p>
            )}
          </div>
        )}

        {/* Main card */}
        <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
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
            <h1 className="font-display text-xl font-bold text-jolshaa-on-surface mb-3">{request.title}</h1>

            <div className="flex items-center gap-3 mb-4">
              <Link to={`/profile/${request.requester?._id}`} className="flex items-center gap-2 hover:underline">
                <Avatar src={request.requester?.profilePhoto} alt={request.requester?.name} size="md" />
                <div>
                  <p className="text-sm font-semibold text-jolshaa-on-surface">{request.requester?.name}</p>
                  <p className="text-xs text-jolshaa-on-surface-variant">
                    {request.location?.upazila && `${request.location.upazila}, `}
                    {request.location?.district}, {request.location?.division}
                  </p>
                </div>
              </Link>
            </div>

            <div className="prose prose-sm max-w-none mb-4">
              <p className="text-jolshaa-on-surface whitespace-pre-wrap">{request.description}</p>
            </div>

            <div className="flex items-center gap-4 text-xs text-jolshaa-on-surface-variant mb-4">
              <span>👁 {request.viewCount || 0} views</span>
              <span>🤝 {request.helpers?.length || 0} people want to help</span>
            </div>

            {/* Resolve button for owner */}
            {isOwner && request.status === 'active' && (
              <div className="border-t border-jolshaa-outline-variant/50 pt-4 mt-4">
                {showResolve ? (
                  <div className="space-y-3">
                    <textarea
                      value={resolveNote}
                      onChange={(e) => setResolveNote(e.target.value)}
                      placeholder="Describe how it was resolved (optional)..."
                      className="w-full border border-jolshaa-outline rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 bg-jolshaa-surface-container-highest resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button variant="success" onClick={handleResolve} disabled={resolving}>
                        {resolving ? '...' : '✅ Resolved'}
                      </Button>
                      <Button variant="secondary" onClick={() => setShowResolve(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="success" onClick={() => setShowResolve(true)}>
                    ✅ Issue Resolved
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Helpers list */}
        {request.helpers?.length > 0 && (
          <div className="mt-4 bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
            <h3 className="font-display text-sm font-bold text-jolshaa-on-surface mb-3">
              🤝 People wanting to help ({request.helpers.length})
            </h3>
            <div className="space-y-3">
              {request.helpers.map((h) => (
                <div key={h._id} className="flex items-start gap-3 p-3 bg-jolshaa-surface-container-high rounded-xl">
                  <Avatar src={h.user?.profilePhoto} alt={h.user?.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${h.user?._id}`} className="text-sm font-semibold text-jolshaa-on-surface hover:underline">
                        {h.user?.name}
                      </Link>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        h.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        'bg-jolshaa-surface-container-high text-jolshaa-on-surface-variant'
                      }`}>
                        {h.status === 'accepted' ? 'Accepted' : 'Offered'}
                      </span>
                    </div>
                    {h.message && (
                      <p className="text-xs text-jolshaa-on-surface-variant mt-1">{h.message}</p>
                    )}
                    {isOwner && h.status === 'offered' && request.status === 'active' && (
                      <Button
                        size="xs"
                        variant="success"
                        className="mt-2"
                        onClick={() => handleAccept(h._id)}
                      >
                        Accept 🤝
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
          <div className="mt-4 bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
            <h3 className="font-display text-sm font-bold text-jolshaa-on-surface mb-3">
              Want to help?
            </h3>
            <textarea
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
              placeholder="Describe how you can help..."
              className="w-full border border-jolshaa-outline rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 bg-jolshaa-surface-container-highest resize-none mb-3"
              rows={3}
            />
            <Button
              variant="success"
              onClick={handleOffer}
              disabled={!offerMessage.trim() || submitting}
              className="w-full"
            >
              {submitting ? 'Sending...' : '🤝 I can help'}
            </Button>
          </div>
        )}

        {myOffer && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-sm font-medium text-green-700">
              ✅ You have sent a help offer
            </p>
          </div>
        )}

        {/* Coordination Chat */}
        {showChat && myConversation && (
          <div className="mt-4 h-[50vh] sm:h-[450px]">
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
              💬 Help Coordination Chat
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HelpRequestDetail;

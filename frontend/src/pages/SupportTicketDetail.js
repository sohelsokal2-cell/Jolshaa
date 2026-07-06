import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';

const STATUS_STYLES = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  waiting_user: 'bg-purple-100 text-purple-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-jolshaa-surface-container-high text-jolshaa-on-surface-variant',
};

const SupportTicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadTicket();
  }, [id]);

  const loadTicket = async () => {
    try {
      const res = await API.get(`/support/tickets/${id}`);
      setTicket(res.data.ticket);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await API.post(`/support/tickets/${id}/reply`, { message: reply.trim() });
      setTicket(res.data.ticket);
      setReply('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const closeTicket = async () => {
    setClosing(true);
    try {
      const res = await API.put(`/support/tickets/${id}/close`);
      setTicket(res.data.ticket);
    } catch (err) {
      console.error(err);
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin w-8 h-8 border-2 border-jolshaa-teal border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="text-center py-24 text-sm text-jolshaa-on-surface-variant">Ticket not found.</div>
      </Layout>
    );
  }

  const isClosed = ticket.status === 'closed';

  return (
    <Layout>
      <div className="max-w-lg mx-auto py-6 px-4 flex flex-col h-[calc(100vh-2rem)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate('/support/tickets')} className="p-2 rounded-lg hover:bg-jolshaa-surface-container-low transition-colors shrink-0">
              <svg className="w-5 h-5 text-jolshaa-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold text-jolshaa-on-surface truncate">{ticket.subject}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[ticket.status] || ''}`}>
                {ticket.status?.replace('_', ' ')}
              </span>
            </div>
          </div>
          {!isClosed && (
            <Button size="sm" variant="outline" onClick={closeTicket} loading={closing}>Close</Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest p-4 space-y-3 mb-4">
          {ticket.messages?.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                msg.senderType === 'user'
                  ? 'bg-jolshaa-teal text-jolshaa-on-teal'
                  : 'bg-jolshaa-surface-container-low text-jolshaa-on-surface'
              }`}>
                <p>{msg.message}</p>
                <p className="text-[10px] opacity-70 mt-1">{new Date(msg.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {!isClosed ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendReply()}
              placeholder="Type a reply..."
              className="flex-1 px-3 py-2 rounded-lg text-sm bg-jolshaa-surface-container-low border border-jolshaa-outline-variant text-jolshaa-on-surface outline-none focus:border-jolshaa-teal focus:ring-2 focus:ring-jolshaa-teal/20"
            />
            <Button onClick={sendReply} loading={sending}>Send</Button>
          </div>
        ) : (
          <p className="text-center text-xs text-jolshaa-on-surface-variant py-2">This ticket is closed.</p>
        )}
      </div>
    </Layout>
  );
};

export default SupportTicketDetail;

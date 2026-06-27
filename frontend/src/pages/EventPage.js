import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import InviteFriendsModal from '../components/InviteFriendsModal';

const EventPage = () => {
  const { user, logout } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await API.get(`/events/${id}`);
      setEvent(res.data.event);
    } catch (err) {
      console.error('Failed to fetch event');
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async (status) => {
    try {
      await API.post(`/events/${id}/rsvp`, { status });
      setEvent(prev => ({
        ...prev,
        myStatus: status,
        attendees: prev.attendees.map(a =>
          a.user._id === user.id ? { ...a, status } : a
        ).filter(a => status !== 'not_going' || a.user._id === user.id)
      }));
    } catch (err) {
      console.error('Failed to RSVP');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await API.delete(`/events/${id}`);
      navigate('/events');
    } catch (err) {
      console.error('Failed to delete');
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">Loading...</div>;
  if (!event) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">Event not found</div>;

  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const isPast = startDate < new Date();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md px-6 py-3 flex justify-between items-center">
        <Link to="/feed" className="text-xl font-bold text-blue-600">Jolshaa</Link>
        <div className="flex items-center gap-4">
          <Link to="/events" className="text-sm text-gray-600 hover:text-blue-600">Events</Link>
          <button onClick={logout} className="text-sm text-red-600 hover:underline">Logout</button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto mt-4 px-4 pb-8">
        {/* Cover */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
          {event.coverPhoto ? (
            <img src={event.coverPhoto} alt="" className="w-full h-64 object-cover" />
          ) : (
            <div className="w-full h-64 bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center">
              <svg className="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{event.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  event.visibility === 'public' ? 'bg-green-100 text-green-700' :
                  event.visibility === 'friends' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {event.visibility === 'invite_only' ? 'Invite Only' : event.visibility}
                </span>
                {isPast && <span className="text-xs text-gray-400">Past Event</span>}
              </div>
            </div>
            {event.isCreator && (
              <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">Delete</button>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                {' · '}
                {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                {endDate && (
                  <span> - {endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                )}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Created by {event.creator?.name}</span>
            </div>
          </div>

          {/* RSVP Buttons */}
          {!isPast && !event.isCreator && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleRsvp('going')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  event.myStatus === 'going'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Going
              </button>
              <button
                onClick={() => handleRsvp('maybe')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  event.myStatus === 'maybe'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                Maybe
              </button>
              <button
                onClick={() => handleRsvp('not_going')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  event.myStatus === 'not_going'
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Not Going
              </button>
            </div>
          )}

          {event.isCreator && (
            <button
              onClick={() => setShowInvite(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Invite Friends
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex border-b">
            {['details', 'attendees'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-center font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'details' && (
              <div>
                {event.description ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                ) : (
                  <p className="text-gray-400">No description</p>
                )}
              </div>
            )}

            {activeTab === 'attendees' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Going ({event.attendeeCount || 0})</h4>
                  <div className="flex flex-wrap gap-2">
                    {event.attendees?.filter(a => a.status === 'going').map(a => (
                      <Link key={a.user._id} to={`/profile/${a.user._id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                        <img src={a.user.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <span className="text-sm">{a.user.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                {event.maybeCount > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Maybe ({event.maybeCount})</h4>
                    <div className="flex flex-wrap gap-2">
                      {event.attendees?.filter(a => a.status === 'maybe').map(a => (
                        <Link key={a.user._id} to={`/profile/${a.user._id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                          <img src={a.user.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'} alt="" className="w-8 h-8 rounded-full object-cover" />
                          <span className="text-sm">{a.user.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showInvite && <InviteFriendsModal eventId={id} onClose={() => setShowInvite(false)} />}
    </div>
  );
};

export default EventPage;

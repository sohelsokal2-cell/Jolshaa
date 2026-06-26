import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import EventCard from '../components/EventCard';

const Events = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [activeTab]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      if (activeTab === 'my') {
        const res = await API.get('/events/my');
        setEvents(res.data.events);
      } else {
        const past = activeTab === 'past' ? 'true' : '';
        const res = await API.get(`/events?limit=20${past ? '&past=true' : ''}`);
        setEvents(res.data.events);
      }
    } catch (err) {
      console.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'my', label: 'My Events' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md px-6 py-3 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <Link to="/feed" className="text-xl font-bold text-blue-600">Jolshaa</Link>
          <div className="flex items-center gap-4">
            <Link to="/groups" className="text-sm text-gray-600 hover:text-blue-600">Groups</Link>
            <Link to="/pages" className="text-sm text-gray-600 hover:text-blue-600">Pages</Link>
            <Link to="/friends" className="text-sm text-gray-600 hover:text-blue-600">Friends</Link>
            <Link to="/messages" className="text-sm text-gray-600 hover:text-blue-600">Messages</Link>
            <Link to="/profile" className="text-sm text-gray-600 hover:text-blue-600">
              {user.name?.split(' ')[0]}
            </Link>
            <button onClick={logout} className="text-sm text-red-600 hover:underline">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto mt-4 px-4 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">Events</h1>
          <Link
            to="/events/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Create Event
          </Link>
        </div>

        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {activeTab === 'my' ? 'You have no events' : `No ${activeTab} events`}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;

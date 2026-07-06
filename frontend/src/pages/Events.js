import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import EventCard from '../components/EventCard';
import Layout from '../components/layout/Layout';

const Events = () => {
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
    <Layout>
      <div className="mt-2 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold font-display text-jolshaa-on-surface">Events</h1>
          <Link
            to="/events/create"
            className="px-4 py-2 bg-jolshaa-coral text-jolshaa-on-teal rounded-lg text-sm font-medium hover:bg-jolshaa-coral-container transition-colors shadow-ambient"
          >
            Create Event
          </Link>
        </div>

        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-jolshaa-coral text-jolshaa-on-teal'
                  : 'bg-jolshaa-surface-container-low text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-jolshaa-on-surface-variant">
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
    </Layout>
  );
};

export default Events;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import EventCard from '../components/EventCard';
import GroupCard from '../components/GroupCard';
import HelpRequestCard from '../components/HelpRequestCard';
import { PostSkeleton } from '../components/ui/Skeleton';

const Para = () => {
  const { user } = useAuth();
  const district = user?.location?.district;
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [events, setEvents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);

  useEffect(() => {
    if (!district) {
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [listingsRes, eventsRes, groupsRes, helpRes] = await Promise.all([
          API.get(`/marketplace?district=${encodeURIComponent(district)}&limit=6`),
          API.get(`/events?district=${encodeURIComponent(district)}&limit=4`),
          API.get(`/groups?district=${encodeURIComponent(district)}&limit=4`),
          API.get(`/help/nearby?district=${encodeURIComponent(district)}&limit=4&sort=urgent`),
        ]);
        setListings(listingsRes.data.listings || []);
        setEvents(eventsRes.data.events || []);
        setGroups(groupsRes.data.groups || []);
        setHelpRequests(helpRes.data.requests || []);
      } catch (err) {
        console.error('Failed to load Para feed');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [district]);

  if (!district) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">🏘️</div>
          <h2 className="font-display text-xl font-bold text-jolshaa-on-surface mb-2">
            Set your location to see your পাড়া
          </h2>
          <p className="text-sm text-jolshaa-on-surface-variant mb-4">
            Your Para brings together local marketplace, events, groups and help requests in your area.
          </p>
          <a href="/profile/edit" className="text-sm text-jolshaa-teal hover:underline">
            Edit profile →
          </a>
        </div>
      </Layout>
    );
  }

  const Section = ({ title, emoji, seeAllLink, isEmpty, emptyText, children }) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-base font-bold text-jolshaa-on-surface">
          {emoji} {title}
        </h2>
        <Link to={seeAllLink} className="text-xs text-jolshaa-teal hover:underline">See all →</Link>
      </div>
      {isEmpty ? (
        <p className="text-sm text-jolshaa-on-surface-variant py-4 text-center">{emptyText}</p>
      ) : children}
    </div>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="mb-5">
          <h1 className="font-display text-lg sm:text-xl font-bold text-jolshaa-on-surface">
            🏘️ পাড়া (Para)
          </h1>
          <p className="text-xs text-jolshaa-on-surface-variant mt-0.5">{district} — your neighborhood, in one place</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
          </div>
        ) : (
          <>
            <Section
              title="Help nearby" emoji="🆘"
              seeAllLink="/help"
              isEmpty={helpRequests.length === 0}
              emptyText="No active help requests in your area"
            >
              <div className="space-y-3">
                {helpRequests.map(req => <HelpRequestCard key={req._id} request={req} />)}
              </div>
            </Section>

            <Section
              title="Local marketplace" emoji="🛍️"
              seeAllLink="/marketplace"
              isEmpty={listings.length === 0}
              emptyText="No listings from your area yet"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {listings.map(listing => (
                  <Link key={listing._id} to={`/marketplace/${listing._id}`} className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient overflow-hidden hover:shadow-ambient-hover transition-shadow">
                    <div className="aspect-square bg-jolshaa-surface-container-high">
                      {listing.images?.[0] ? (
                        <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="p-2">
                      <p className="font-semibold text-jolshaa-on-surface text-xs truncate">{listing.title}</p>
                      <p className="text-jolshaa-teal font-bold text-xs">${listing.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>

            <Section
              title="Events near you" emoji="📅"
              seeAllLink="/events"
              isEmpty={events.length === 0}
              emptyText="No upcoming events in your area"
            >
              <div className="grid grid-cols-2 gap-3">
                {events.map(event => <EventCard key={event._id} event={event} />)}
              </div>
            </Section>

            <Section
              title="Local groups" emoji="👥"
              seeAllLink="/groups"
              isEmpty={groups.length === 0}
              emptyText="No groups found for your area yet"
            >
              <div className="grid grid-cols-2 gap-3">
                {groups.map(group => <GroupCard key={group._id} group={group} />)}
              </div>
            </Section>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Para;

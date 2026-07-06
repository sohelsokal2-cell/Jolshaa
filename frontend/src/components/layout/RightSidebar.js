import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import Avatar from '../ui/Avatar';

const RightSidebar = () => {
  const [trending, setTrending] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendingRes, suggestionsRes] = await Promise.allSettled([
          API.get('/posts/trending-hashtags?limit=5'),
          API.get('/suggestions?limit=3'),
        ]);

        if (trendingRes.status === 'fulfilled') setTrending(trendingRes.value.data.hashtags || []);
        if (suggestionsRes.status === 'fulfilled') {
          const data = suggestionsRes.value.data;
          setSuggestions(data.people || data.suggestedPeople || []);
        }
      } catch (err) {
        console.error('Failed to load sidebar', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const GlassCard = ({ children, className = '' }) => (
    <div
      className={`rounded-2xl p-4 mb-4 relative overflow-hidden bg-jolshaa-surface-container-lowest border border-jolshaa-outline-variant shadow-ambient ${className}`}
    >
      {children}
    </div>
  );

  const sectionTitle = (text, linkTo, linkLabel) => (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-[0.7rem] font-semibold tracking-[0.08em] uppercase text-jolshaa-on-surface-variant">
        {text}
      </h3>
      {linkTo && (
        <Link
          to={linkTo}
          className="text-xs font-medium transition-colors text-jolshaa-teal hover:text-jolshaa-teal-container"
          aria-label={linkLabel}
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );

  return (
    <aside className="hidden lg:block w-[320px] flex-shrink-0" aria-label="Right sidebar">
      <div
        className="fixed top-14 right-0 w-[320px] h-[calc(100vh-56px)] overflow-y-auto py-4 pl-2 pr-4 scrollbar-hide bg-jolshaa-surface"
      >

        {/* ── Trending ─────────────────────────── */}
        <GlassCard>
          {sectionTitle('Trending', '/trending', 'See all')}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg skeleton" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-2/3 skeleton rounded" />
                    <div className="h-2.5 w-1/3 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : trending.length > 0 ? (
            <div className="space-y-1">
              {trending.map((tag, i) => (
                <Link
                  key={tag._id || i}
                  to={`/hashtag/${tag._id || tag.name}`}
                  className="flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-150 group hover:bg-jolshaa-teal/10"
                  aria-label={`View hashtag ${tag._id || tag.name}`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 bg-jolshaa-teal/10 text-jolshaa-teal border border-jolshaa-teal/20"
                  >
                    #
                  </div>
                  <div>
                    <p className="text-sm font-medium text-jolshaa-on-surface">
                      #{tag._id || tag.name}
                    </p>
                    <p className="text-[0.7rem] text-jolshaa-on-surface-variant">{tag.count || 0} posts</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-2 text-jolshaa-on-surface-variant">No trending topics yet</p>
          )}
        </GlassCard>

        {/* ── People you may know ──────────────── */}
        <GlassCard>
          {sectionTitle('People You May Know')}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full skeleton" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-1/2 skeleton rounded" />
                    <div className="h-2.5 w-1/3 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-1">
              {suggestions.map((person) => (
                <div
                  key={person._id}
                  className="flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-150 hover:bg-jolshaa-surface-container-low"
                >
                  <Link to={`/profile/${person._id}`} className="flex-shrink-0">
                    <div className="ring-2 ring-jolshaa-teal/30 ring-offset-2 ring-offset-transparent rounded-full">
                      <Avatar src={person.profilePhoto} alt={person.name} size="md" />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/profile/${person._id}`}
                      className="text-sm font-medium hover:underline truncate block text-jolshaa-on-surface"
                      aria-label={`View profile of ${person.name}`}
                    >
                      {person.name}
                    </Link>
                    {person.mutualFriends > 0 && (
                      <p className="text-[0.7rem] text-jolshaa-on-surface-variant">
                        {person.mutualFriends} mutual friends
                      </p>
                    )}
                  </div>
                  {/* Follow button */}
                  <button
                    className="text-xs font-semibold px-3 py-1 rounded-full transition-all duration-200 flex-shrink-0 bg-jolshaa-teal/10 text-jolshaa-teal border border-jolshaa-teal/25 hover:bg-jolshaa-teal/20"
                    aria-label={`Follow ${person.name}`}
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-2 text-jolshaa-on-surface-variant">No suggestions yet</p>
          )}
        </GlassCard>

        {/* ── Quick Shortcuts ──────────────────── */}
        <GlassCard>
          {sectionTitle('Shortcuts')}
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                to: '/creator', label: 'Creator Hub',
                tailwindClass: 'bg-jolshaa-teal/10 text-jolshaa-teal border border-jolshaa-teal/20',
                icon: '⭐',
              },
              {
                to: '/marketplace', label: 'Marketplace',
                tailwindClass: 'bg-green-500/10 text-green-700 border border-green-500/20',
                icon: '🛍️',
              },
              {
                to: '/groups', label: 'Groups',
                tailwindClass: 'bg-blue-500/10 text-blue-700 border border-blue-500/20',
                icon: '👥',
              },
              {
                to: '/events', label: 'Events',
                tailwindClass: 'bg-yellow-500/10 text-yellow-700 border border-yellow-500/20',
                icon: '📅',
              },
              {
                to: '/reels', label: 'Reels',
                tailwindClass: 'bg-pink-500/10 text-pink-700 border border-pink-500/20',
                icon: '🎬',
              },
              {
                to: '/trending', label: 'Trending',
                tailwindClass: 'bg-orange-500/10 text-orange-700 border border-orange-500/20',
                icon: '🔥',
              },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5 ${item.tailwindClass}`}
                aria-label={item.label}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </GlassCard>

        {/* Footer */}
        <p className="text-center mt-2 text-[0.6rem] text-jolshaa-on-surface-variant/60">
          Privacy · Terms · © 2026 Jolshaa
        </p>
      </div>
    </aside>
  );
};

export default RightSidebar;

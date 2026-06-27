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
      className={`rounded-2xl p-4 mb-4 relative overflow-hidden ${className}`}
      style={{
        background: 'rgba(23, 31, 51, 0.6)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Top edge highlight */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
      />
      {children}
    </div>
  );

  const sectionTitle = (text, linkTo, linkLabel) => (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold tracking-wide uppercase" style={{ color: '#958ea0', letterSpacing: '0.08em', fontSize: '0.7rem' }}>
        {text}
      </h3>
      {linkTo && (
        <Link
          to={linkTo}
          className="text-xs font-medium transition-colors"
          style={{ color: '#8b5cf6' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#a78bfa'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#8b5cf6'}
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );

  return (
    <aside className="hidden xl:block w-[320px] flex-shrink-0">
      <div
        className="fixed top-14 right-0 w-[320px] h-[calc(100vh-56px)] overflow-y-auto py-4 pl-2 pr-4 scrollbar-hide"
        style={{
          background: 'rgba(11, 19, 38, 0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
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
                  className="flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-150 group"
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139,92,246,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                      background: 'rgba(139,92,246,0.15)',
                      color: '#c4b5fd',
                      border: '1px solid rgba(139,92,246,0.2)',
                    }}
                  >
                    #
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#dae2fd' }}>
                      #{tag._id || tag.name}
                    </p>
                    <p style={{ color: '#958ea0', fontSize: '0.7rem' }}>{tag.count || 0} posts</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-2" style={{ color: '#958ea0' }}>No trending topics yet</p>
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
                  className="flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-150"
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Link to={`/profile/${person._id}`} className="flex-shrink-0">
                    <div
                      style={{
                        outline: '2px solid rgba(139,92,246,0.3)',
                        outlineOffset: '2px',
                        borderRadius: '9999px',
                      }}
                    >
                      <Avatar src={person.profilePhoto} alt={person.name} size="md" />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/profile/${person._id}`}
                      className="text-sm font-medium hover:underline truncate block"
                      style={{ color: '#dae2fd' }}
                    >
                      {person.name}
                    </Link>
                    {person.mutualFriends > 0 && (
                      <p style={{ color: '#958ea0', fontSize: '0.7rem' }}>
                        {person.mutualFriends} mutual friends
                      </p>
                    )}
                  </div>
                  {/* Follow button */}
                  <button
                    className="text-xs font-semibold px-3 py-1 rounded-full transition-all duration-200 flex-shrink-0"
                    style={{
                      background: 'rgba(139,92,246,0.15)',
                      color: '#c4b5fd',
                      border: '1px solid rgba(139,92,246,0.25)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139,92,246,0.25)';
                      e.currentTarget.style.boxShadow = '0 0 10px rgba(139,92,246,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(139,92,246,0.15)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    Follow
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-2" style={{ color: '#958ea0' }}>No suggestions yet</p>
          )}
        </GlassCard>

        {/* ── Quick Shortcuts ──────────────────── */}
        <GlassCard>
          {sectionTitle('Shortcuts')}
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                to: '/creator', label: 'Creator Hub',
                bg: 'rgba(139,92,246,0.12)', color: '#c4b5fd', border: 'rgba(139,92,246,0.2)',
                icon: '⭐',
              },
              {
                to: '/marketplace', label: 'Marketplace',
                bg: 'rgba(34,197,94,0.1)', color: '#86efac', border: 'rgba(34,197,94,0.2)',
                icon: '🛍️',
              },
              {
                to: '/groups', label: 'Groups',
                bg: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: 'rgba(59,130,246,0.2)',
                icon: '👥',
              },
              {
                to: '/events', label: 'Events',
                bg: 'rgba(251,191,36,0.1)', color: '#fde68a', border: 'rgba(251,191,36,0.2)',
                icon: '📅',
              },
              {
                to: '/reels', label: 'Reels',
                bg: 'rgba(236,72,153,0.1)', color: '#f9a8d4', border: 'rgba(236,72,153,0.2)',
                icon: '🎬',
              },
              {
                to: '/trending', label: 'Trending',
                bg: 'rgba(249,115,22,0.1)', color: '#fdba74', border: 'rgba(249,115,22,0.2)',
                icon: '🔥',
              },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200"
                style={{ background: item.bg, color: item.color, border: `1px solid ${item.border}` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(1.15)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'brightness(1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </GlassCard>

        {/* Footer */}
        <p className="text-center mt-2" style={{ color: '#494454', fontSize: '0.6rem' }}>
          Privacy · Terms · © 2026 Jolshaa
        </p>
      </div>
    </aside>
  );
};

export default RightSidebar;

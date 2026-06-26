import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import Avatar from '../ui/Avatar';
import Card from '../ui/Card';

const RightSidebar = () => {
  const [trending, setTrending] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
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

  return (
    <aside className="hidden xl:block w-[320px] flex-shrink-0">
      <div className="fixed top-14 right-0 w-[320px] h-[calc(100vh-56px)] overflow-y-auto py-4 pl-2 pr-4 scrollbar-hide">
        {/* Trending */}
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Trending</h3>
            <Link to="/trending" className="text-xs text-primary-600 hover:text-primary-700 font-medium">See all</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg skeleton" />
                  <div className="flex-1 space-y-1">
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
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-bold">
                    #
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">#{tag._id || tag.name}</p>
                    <p className="text-2xs text-neutral-500">{tag.count || 0} posts</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 text-center py-2">No trending topics yet</p>
          )}
        </Card>

        {/* Suggestions */}
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">People you may know</h3>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full skeleton" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3.5 w-1/2 skeleton rounded" />
                    <div className="h-2.5 w-1/3 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-1">
              {suggestions.map((person) => (
                <div key={person._id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                  <Link to={`/profile/${person._id}`}>
                    <Avatar src={person.profilePhoto} alt={person.name} size="md" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${person._id}`} className="text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:underline truncate block">
                      {person.name}
                    </Link>
                    {person.mutualFriends > 0 && (
                      <p className="text-2xs text-neutral-500">{person.mutualFriends} mutual friends</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500 text-center py-2">No suggestions yet</p>
          )}
        </Card>

        {/* Quick links */}
        <Card>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Shortcuts</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { to: '/creator', label: 'Creator Hub', color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
              { to: '/marketplace', label: 'Shop', color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' },
              { to: '/groups', label: 'Groups', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
              { to: '/events', label: 'Events', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${item.color}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </Card>

        <p className="text-center text-2xs text-neutral-400 dark:text-neutral-600 mt-4">
          Privacy · Terms · © 2026 Jolshaa
        </p>
      </div>
    </aside>
  );
};

export default RightSidebar;

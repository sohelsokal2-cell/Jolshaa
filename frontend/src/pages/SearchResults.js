import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import FriendButton from '../components/FriendButton';
import Layout from '../components/layout/Layout';

const SearchResults = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      fetchSearch();
    }
  }, [query]);

  const fetchSearch = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/search?q=${encodeURIComponent(query)}&type=all`);
      setResults(res.data.results);
    } catch (err) {
      console.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'users', label: 'Users' },
    { key: 'posts', label: 'Posts' },
    { key: 'groups', label: 'Groups' },
    { key: 'pages', label: 'Pages' },
  ];

  const filteredResults = activeTab === 'all'
    ? results
    : { [activeTab]: results[activeTab] || [] };

  const totalResults = Object.values(results).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-4 px-4">
        <div className="card rounded-lg shadow-sm p-4 mb-4">
          <h2 className="text-lg font-semibold text-on-surface mb-1">
            Search results for "{query}"
          </h2>
          <p className="text-on-surface-variant text-sm">{totalResults} results found</p>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface text-on-surface-variant hover:bg-white/5'
              }`}
            >
              {tab.label}
              {tab.key !== 'all' && results[tab.key] && (
                <span className="ml-1 text-xs opacity-75">
                  ({results[tab.key].length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8 text-on-surface-variant">Searching...</div>
        ) : totalResults === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">No results found</div>
        ) : (
          <div className="space-y-4">
            {/* Users */}
            {filteredResults.users && filteredResults.users.length > 0 && (
              <div className="bg-surface rounded-lg shadow-sm p-4">
                <h3 className="font-semibold text-on-surface mb-3">Users</h3>
                <div className="space-y-3">
                  {filteredResults.users.map((u) => (
                    <div key={u._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                      <Link to={`/profile/${u._id}`}>
                        <img
                          src={u.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                          alt={`${u.name}'s avatar`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${u._id}`} className="font-medium text-on-surface hover:underline">
                          {u.name}
                        </Link>
                        {u.bio && (
                          <p className="text-on-surface-variant text-sm truncate">{u.bio}</p>
                        )}
                      </div>
                      {u._id !== user.id && (
                        <FriendButton
                          userId={u._id}
                          initialStatus={u.friendStatus || 'none'}
                          initialRequestId={u.friendRequestId}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posts */}
            {filteredResults.posts && filteredResults.posts.length > 0 && (
              <div className="bg-surface rounded-lg shadow-sm p-4">
                <h3 className="font-semibold text-on-surface mb-3">Posts</h3>
                <div className="space-y-3">
                  {filteredResults.posts.map((post) => (
                    <div key={post._id} className="p-3 bg-surface-high/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={post.author?.profilePhoto || 'https://ui-avatars.com/api/?name=U&background=494454&color=dae2fd&size=128'}
                          alt={`${post.author?.name}'s avatar`}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="font-medium text-sm text-on-surface">{post.author?.name}</span>
                        <span className="text-on-surface-variant/60 text-xs">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-on-surface text-sm line-clamp-3">{post.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Groups */}
            {filteredResults.groups && filteredResults.groups.length > 0 && (
              <div className="bg-surface rounded-lg shadow-sm p-4">
                <h3 className="font-semibold text-on-surface mb-3">Groups</h3>
                <div className="space-y-3">
                  {filteredResults.groups.map((group) => (
                    <Link
                      key={group._id}
                      to={`/groups/${group._id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary-600/20 flex items-center justify-center">
                        <span className="text-primary-400 font-bold text-lg">
                          {group.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-on-surface">{group.name}</p>
                        <p className="text-on-surface-variant text-sm">
                          {group.privacy} · {group.members?.length || 0} members
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Pages */}
            {filteredResults.pages && filteredResults.pages.length > 0 && (
              <div className="bg-surface rounded-lg shadow-sm p-4">
                <h3 className="font-semibold text-on-surface mb-3">Pages</h3>
                <div className="space-y-3">
                  {filteredResults.pages.map((page) => (
                    <Link
                      key={page._id}
                      to={`/pages/${page._id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
                    >
                      <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
                        <span className="text-purple-400 font-bold text-lg">
                          {page.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-on-surface flex items-center gap-1">
                          {page.name}
                          {page.isVerified && (
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-primary-500 text-white rounded-full text-[10px]">
                              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                            </span>
                          )}
                        </p>
                        <p className="text-on-surface-variant text-sm">
                          {page.category} · {page.followers?.length || 0} followers
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchResults;

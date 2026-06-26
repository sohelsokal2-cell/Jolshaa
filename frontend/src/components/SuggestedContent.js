import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

const SuggestedContent = () => {
  const [groups, setGroups] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const [groupsRes, pagesRes] = await Promise.all([
        API.get('/suggestions/groups'),
        API.get('/suggestions/pages'),
      ]);
      setGroups(groupsRes.data.groups.slice(0, 3));
      setPages(pagesRes.data.pages.slice(0, 3));
    } catch (err) {
      console.error('Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-4">
      {groups.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Suggested Groups</h3>
          <div className="space-y-3">
            {groups.map((group) => (
              <Link
                key={group._id}
                to={`/groups/${group._id}`}
                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition"
              >
                <img
                  src={group.coverPhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{group.name}</p>
                  <p className="text-xs text-gray-500">{group.memberCount} members</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {pages.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Suggested Pages</h3>
          <div className="space-y-3">
            {pages.map((page) => (
              <Link
                key={page._id}
                to={`/pages/${page._id}`}
                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition"
              >
                <img
                  src={page.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{page.name}</p>
                  <p className="text-xs text-gray-500">{page.followerCount} followers</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestedContent;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

const StoryHighlights = ({ userId }) => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHighlights();
  }, [userId]);

  const fetchHighlights = async () => {
    try {
      const res = await API.get(`/albums/highlights/${userId}`);
      setHighlights(res.data.albums);
    } catch (err) {
      console.error('Failed to fetch highlights');
    } finally {
      setLoading(false);
    }
  };

  if (loading || highlights.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
      <h3 className="font-display font-semibold text-jolshaa-on-surface mb-3 text-sm">Story Highlights</h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {highlights.map((album) => (
          <Link
            key={album._id}
            to={`/profile/${userId}`}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-400 p-0.5">
              <img
                src={album.photos[0]}
                alt={album.title}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <span className="text-xs text-jolshaa-on-surface-variant font-medium text-center w-20 truncate">
              {album.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default StoryHighlights;

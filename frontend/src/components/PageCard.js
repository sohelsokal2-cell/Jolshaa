import { Link } from 'react-router-dom';

const PageCard = ({ page }) => {
  return (
    <Link to={`/pages/${page._id}`} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <div className="h-32 bg-gradient-to-r from-purple-400 to-purple-600 relative">
        {page.coverPhoto && (
          <img src={page.coverPhoto} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3">
          {page.profilePhoto && (
            <img src={page.profilePhoto} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white -mt-8 relative" />
          )}
          <div>
            <h3 className="font-semibold text-lg truncate">{page.name}</h3>
            <p className="text-xs text-gray-500">{page.category}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {page.followerCount} {page.followerCount === 1 ? 'follower' : 'followers'}
        </p>
      </div>
    </Link>
  );
};

export default PageCard;

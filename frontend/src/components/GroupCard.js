import { Link } from 'react-router-dom';

const GroupCard = ({ group }) => {
  return (
    <Link to={`/groups/${group._id}`} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <div className="h-32 bg-gradient-to-r from-blue-400 to-blue-600 relative">
        {group.coverPhoto && (
          <img src={group.coverPhoto} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg truncate">{group.name}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs px-2 py-1 rounded-full ${
            group.privacy === 'public' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {group.privacy === 'public' ? 'Public' : 'Private'}
          </span>
          {group.isMember && (
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
              Member
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default GroupCard;

import { Link } from 'react-router-dom';
import Avatar from './ui/Avatar';

const FriendsPreviewGrid = ({ friends, friendCount, onSeeAll }) => {
  if (!friendCount || friendCount === 0) return null;

  const preview = friends.slice(0, 9);

  return (
    <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-jolshaa-on-surface text-sm">
          Friends <span className="text-jolshaa-on-surface-variant font-normal">· {friendCount}</span>
        </h3>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-xs font-medium text-jolshaa-teal hover:underline"
          >
            See All Friends
          </button>
        )}
      </div>
      {preview.length === 0 ? (
        <p className="text-xs text-jolshaa-on-surface-variant">No friends to show</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {preview.map((friend) => (
            <Link
              key={friend._id}
              to={`/profile/${friend._id}`}
              className="flex flex-col items-center gap-1 group"
            >
              <Avatar src={friend.profilePhoto} alt={friend.name} size="2xl" className="group-hover:opacity-90 transition-opacity" />
              <span className="text-2xs text-jolshaa-on-surface truncate w-full text-center">{friend.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsPreviewGrid;

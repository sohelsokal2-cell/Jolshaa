import { Link } from 'react-router-dom';

const GroupCard = ({ group }) => {
  return (
    <Link to={`/groups/${group._id}`} className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient overflow-hidden hover:shadow-ambient-hover transition-shadow">
      <div className="h-28 bg-gradient-to-r from-jolshaa-teal to-jolshaa-indigo relative">
        {group.coverPhoto && (
          <img src={group.coverPhoto} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold font-display text-jolshaa-on-surface truncate">{group.name}</h3>
        {group.description && (
          <p className="text-sm text-jolshaa-on-surface-variant mt-1 line-clamp-2">{group.description}</p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-jolshaa-on-surface-variant">
            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            group.privacy === 'public' ? 'bg-jolshaa-teal/10 text-jolshaa-teal' : 'bg-jolshaa-coral/10 text-jolshaa-coral'
          }`}>
            {group.privacy === 'public' ? 'Public' : 'Private'}
          </span>
          {group.isMember && (
            <span className="text-xs px-2 py-1 rounded-full bg-jolshaa-indigo/10 text-jolshaa-indigo">
              Member
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default GroupCard;

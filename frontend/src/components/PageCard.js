import { Link } from 'react-router-dom';

const PageCard = ({ page }) => {
  return (
    <Link to={`/pages/${page._id}`} className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient overflow-hidden hover:shadow-ambient-hover transition-shadow">
      <div className="h-28 bg-gradient-to-r from-jolshaa-indigo to-jolshaa-teal relative">
        {page.coverPhoto && (
          <img src={page.coverPhoto} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3">
          {page.profilePhoto && (
            <img src={page.profilePhoto} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-jolshaa-surface-container-lowest -mt-8 relative" />
          )}
          <div>
            <h3 className="font-semibold font-display text-jolshaa-on-surface truncate flex items-center gap-1">
              {page.name}
              {page.isVerified && (
                <span className="inline-flex items-center justify-center w-4 h-4 bg-jolshaa-teal text-jolshaa-on-teal rounded-full text-[10px] flex-shrink-0">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                </span>
              )}
            </h3>
            <p className="text-xs text-jolshaa-on-surface-variant">{page.category}</p>
          </div>
        </div>
        <p className="text-sm text-jolshaa-on-surface-variant mt-2">
          {page.followerCount} {page.followerCount === 1 ? 'follower' : 'followers'}
        </p>
      </div>
    </Link>
  );
};

export default PageCard;

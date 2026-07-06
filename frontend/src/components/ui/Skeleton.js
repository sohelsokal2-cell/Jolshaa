const Skeleton = ({ className = '', variant = 'rect', ...props }) => {
  const variants = {
    rect: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded h-4',
    heading: 'rounded h-6',
    avatar: 'rounded-full',
    card: 'rounded-xl',
  };

  return (
    <div
      className={`animate-pulse bg-jolshaa-surface-container-high ${variants[variant]} ${className}`}
      {...props}
    />
  );
};

export const PostSkeleton = () => (
  <div className="bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient p-4 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton variant="avatar" className="w-10 h-10" />
      <div className="space-y-2 flex-1">
        <Skeleton variant="text" className="w-1/3 h-4" />
        <Skeleton variant="text" className="w-1/5 h-3" />
      </div>
    </div>
    <Skeleton variant="text" className="w-full h-4" />
    <Skeleton variant="text" className="w-3/4 h-4" />
    <Skeleton variant="rect" className="w-full h-48" />
    <div className="flex gap-4 pt-2">
      <Skeleton variant="text" className="w-16 h-8" />
      <Skeleton variant="text" className="w-16 h-8" />
      <Skeleton variant="text" className="w-16 h-8" />
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="space-y-4">
    <Skeleton variant="rect" className="w-full h-48 rounded-xl" />
    <div className="flex items-end gap-4 -mt-10 px-4">
      <Skeleton variant="avatar" className="w-24 h-24 border-4 border-white" />
      <div className="space-y-2 pb-2">
        <Skeleton variant="heading" className="w-48 h-6" />
        <Skeleton variant="text" className="w-32 h-4" />
      </div>
    </div>
  </div>
);

export const SidebarSkeleton = () => (
  <div className="space-y-3 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton variant="avatar" className="w-8 h-8" />
        <Skeleton variant="text" className="w-2/3 h-4" />
      </div>
    ))}
  </div>
);

export default Skeleton;

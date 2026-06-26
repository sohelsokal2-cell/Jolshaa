const Avatar = ({ src, alt, size = 'md', className = '' }) => {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
    '3xl': 'w-24 h-24',
  };

  const fallbackInitial = alt ? alt.charAt(0).toUpperCase() : '?';

  if (!src) {
    return (
      <div className={`${sizes[size]} rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold flex-shrink-0 ${className}`}>
        {size === 'xs' || size === 'sm' ? (
          <span className="text-xs">{fallbackInitial}</span>
        ) : (
          <span>{fallbackInitial}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      className={`${sizes[size]} rounded-full object-cover bg-neutral-200 dark:bg-neutral-700 flex-shrink-0 ${className}`}
      loading="lazy"
    />
  );
};

export default Avatar;

const Badge = ({ children, variant = 'neutral', size = 'sm', dot, className = '' }) => {
  const variants = {
    primary: 'bg-jolshaa-teal/10 text-jolshaa-teal',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    neutral: 'bg-jolshaa-surface-container-low text-jolshaa-on-surface-variant',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-2xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium gap-1 ${variants[variant]} ${sizes[size]} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' ? 'bg-green-500' :
          variant === 'danger' ? 'bg-red-500' :
          variant === 'warning' ? 'bg-amber-500' :
          variant === 'primary' ? 'bg-jolshaa-teal' :
          'bg-jolshaa-outline'
        }`} />
      )}
      {children}
    </span>
  );
};

export default Badge;

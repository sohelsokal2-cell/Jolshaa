const Badge = ({ children, variant = 'neutral', size = 'sm', dot, className = '' }) => {
  const variants = {
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    success: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300',
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
          variant === 'success' ? 'bg-accent-500' :
          variant === 'danger' ? 'bg-red-500' :
          variant === 'warning' ? 'bg-amber-500' :
          variant === 'primary' ? 'bg-primary-500' :
          'bg-neutral-500'
        }`} />
      )}
      {children}
    </span>
  );
};

export default Badge;

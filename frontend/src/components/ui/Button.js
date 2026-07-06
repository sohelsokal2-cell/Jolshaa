import { forwardRef } from 'react';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  loading, 
  fullWidth,
  className = '', 
  ...props 
}, ref) => {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-jolshaa-teal text-jolshaa-on-teal hover:bg-jolshaa-teal-container active:bg-jolshaa-teal-container focus:ring-jolshaa-teal',
    secondary: 'bg-jolshaa-surface-container-low text-jolshaa-on-surface hover:bg-jolshaa-surface-container active:bg-jolshaa-surface-container-high focus:ring-jolshaa-outline',
    ghost: 'bg-transparent text-jolshaa-on-surface-variant hover:bg-jolshaa-surface-container-low active:bg-jolshaa-surface-container focus:ring-jolshaa-outline',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 focus:ring-amber-400',
    success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus:ring-green-500',
    outline: 'border border-jolshaa-outline-variant bg-jolshaa-surface-container-lowest text-jolshaa-on-surface hover:bg-jolshaa-surface-container-low active:bg-jolshaa-surface-container focus:ring-jolshaa-outline',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
    xl: 'px-8 py-3 text-base',
  };

  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!loading && icon && icon}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;

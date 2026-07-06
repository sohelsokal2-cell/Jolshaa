import { forwardRef } from 'react';

const Input = forwardRef(({ 
  label, 
  error, 
  helperText,
  icon,
  className = '', 
  containerClassName = '',
  ...props 
}, ref) => {
  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-jolshaa-on-surface-variant">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-jolshaa-on-surface-variant">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full rounded-lg border bg-jolshaa-surface-container-lowest px-3 py-2 text-sm text-jolshaa-on-surface placeholder-jolshaa-on-surface-variant transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-jolshaa-teal/20 focus:border-jolshaa-teal ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-jolshaa-outline-variant'
          } ${icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {(error || helperText) && (
        <p className={`text-xs ${error ? 'text-red-500' : 'text-jolshaa-on-surface-variant'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;

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
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 transition-colors duration-150 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-neutral-300 dark:border-neutral-600'
          } ${icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
      {(error || helperText) && (
        <p className={`text-xs ${error ? 'text-red-500' : 'text-neutral-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;

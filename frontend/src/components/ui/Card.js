const Card = ({ children, className = '', hover, padding = true, ...props }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-card dark:bg-neutral-800 transition-shadow duration-200 ${
        hover ? 'hover:shadow-card-hover cursor-pointer' : ''
      } ${padding ? 'p-4' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`flex items-center justify-between mb-3 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-base font-semibold text-neutral-900 dark:text-neutral-100 ${className}`}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export default Card;

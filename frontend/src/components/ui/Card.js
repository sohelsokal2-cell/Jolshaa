const Card = ({ children, className = '', hover, padding = true, ...props }) => {
  return (
    <div
      className={`bg-jolshaa-surface-container-lowest rounded-xl shadow-ambient transition-shadow duration-200 ${
        hover ? 'hover:shadow-ambient-hover cursor-pointer' : ''
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
  <h3 className={`text-base font-semibold font-display text-jolshaa-on-surface ${className}`}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export default Card;

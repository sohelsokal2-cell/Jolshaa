const SubscriberBadge = ({ tier, size = 'sm' }) => {
  if (!tier) return null;

  const sizes = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  const tierColors = {
    basic: 'bg-amber-100 text-amber-700',
    premium: 'bg-purple-100 text-purple-700',
    vip: 'bg-red-100 text-red-700',
  };

  const tierName = tier.name || tier;
  const badge = tier.badge || '';
  const colorClass = tierColors[tierName?.toLowerCase()] || 'bg-blue-100 text-blue-700';

  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full font-medium ${sizes[size]} ${colorClass}`}>
      {badge && <span>{badge}</span>}
      {tierName}
    </span>
  );
};

export default SubscriberBadge;

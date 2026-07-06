import Button from '../ui/Button';

const BulkActionBar = ({ selectedCount, onClearSelection, actions }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-jolshaa-surface-container-lowest border-t border-jolshaa-outline-variant shadow-ambient-hover z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-jolshaa-on-surface">
            {selectedCount} selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-sm text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface"
          >
            Clear
          </button>
        </div>

        <div className="flex items-center gap-2">
          {actions.map((action, idx) => (
            <Button
              key={idx}
              size="sm"
              variant={action.variant || 'primary'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BulkActionBar;

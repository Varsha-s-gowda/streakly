import { cn } from '../../lib/cn.js';

export function SegmentedControl({ value, onChange, options, size = 'md', className }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-forest-900/[0.07] bg-cream-100/80 p-1',
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-lg font-medium transition',
            size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
            value === option.value
              ? 'bg-white text-forest-800 shadow-sm'
              : 'text-ink-muted hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

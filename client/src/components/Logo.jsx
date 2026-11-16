import { Leaf } from 'lucide-react';
import { cn } from '../lib/cn.js';

export function Logo({ compact = false, dark = false, className }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl shadow-sm',
          dark ? 'bg-cream-100 text-forest-700' : 'bg-forest-700 text-cream-100',
        )}
      >
        <Leaf size={18} strokeWidth={2} />
      </span>
      {!compact ? (
        <div className="leading-none">
          <p className={cn('font-display text-[22px] tracking-tight', dark ? 'text-cream-50' : 'text-forest-800')}>
            Streakly
          </p>
          <p className={cn('mt-1 text-[9px] font-medium uppercase tracking-[0.22em]', dark ? 'text-cream-200/50' : 'text-ink-muted')}>
            Daily discipline
          </p>
        </div>
      ) : null}
    </div>
  );
}

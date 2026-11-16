import { cn } from '../../lib/cn.js';

const TONES = {
  sage: 'bg-sage-100 text-sage-700',
  forest: 'bg-forest-100 text-forest-700',
  gold: 'bg-[#F4EAD3] text-[#7C6433]',
  clay: 'bg-[#F5E3DB] text-[#8A513A]',
  cream: 'bg-cream-200 text-ink-muted',
  white: 'bg-white/70 text-ink-soft',
};

export function Badge({ children, tone = 'sage', className, dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
        TONES[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> : null}
      {children}
    </span>
  );
}

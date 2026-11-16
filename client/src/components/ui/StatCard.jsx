import { cn } from '../../lib/cn.js';

const TONES = {
  sage: { icon: 'bg-sage-100 text-sage-600', value: 'text-forest-800' },
  gold: { icon: 'bg-[#F6EDDA] text-[#9B7C3A]', value: 'text-forest-800' },
  clay: { icon: 'bg-[#F6E6DE] text-clay', value: 'text-forest-800' },
  forest: { icon: 'bg-forest-100 text-forest-600', value: 'text-forest-800' },
  cream: { icon: 'bg-cream-200 text-ink-soft', value: 'text-forest-800' },
};

export function StatCard({ icon: Icon, label, value, hint, tone = 'sage', className }) {
  const palette = TONES[tone] || TONES.sage;
  return (
    <div className={cn('card px-4 py-4 sm:px-5 sm:py-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-muted">{label}</p>
        {Icon ? (
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', palette.icon)}>
            <Icon size={15} strokeWidth={1.8} />
          </span>
        ) : null}
      </div>
      <p className={cn('mt-3 font-display text-[28px] leading-none', palette.value)}>{value}</p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-ink-muted">{hint}</p> : null}
    </div>
  );
}

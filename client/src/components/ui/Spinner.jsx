import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function Spinner({ size = 18, className }) {
  return <Loader2 size={size} className={cn('animate-spin text-sage-600', className)} />;
}

export function LoadingBlock({ label = 'Loading…', className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-sm text-ink-muted', className)}>
      <Spinner size={22} />
      <span>{label}</span>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-cream-300" />
        <div className="h-9 w-72 max-w-full rounded-2xl bg-cream-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-28 rounded-3xl bg-white/60" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-[420px] rounded-3xl bg-white/60 lg:col-span-2" />
        <div className="h-[420px] rounded-3xl bg-white/60" />
      </div>
    </div>
  );
}

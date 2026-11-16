import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, formatDateLong, relativeDay } from '../lib/dates.js';
import { Button } from './ui/Button.jsx';

export function DateNavigator({ date, today, onChange, allowFuture = false, className = '' }) {
  const isToday = date === today;
  const nextDisabled = !allowFuture && date >= today;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 rounded-xl border border-forest-900/[0.08] bg-white/70 p-1 shadow-sm">
        <button
          type="button"
          onClick={() => onChange(addDays(date, -1))}
          className="rounded-lg p-1.5 text-ink-muted transition hover:bg-cream-100 hover:text-ink"
          aria-label="Previous day"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="relative flex items-center justify-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-cream-100/70">
          <CalendarDays size={14} className="shrink-0 text-sage-600" />
          <span className="min-w-[112px] text-center text-xs font-medium text-ink sm:min-w-[140px]">
            {relativeDay(date, today)}
          </span>
          <input
            type="date"
            value={date}
            max={allowFuture ? undefined : today}
            onChange={(event) => event.target.value && onChange(event.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Choose date"
          />
          <button
            type="button"
            onClick={() => onChange(addDays(date, 1))}
            disabled={nextDisabled}
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-cream-100 hover:text-ink disabled:opacity-30"
            aria-label="Next day"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      {!isToday ? (
        <Button variant="ghost" size="sm" onClick={() => onChange(today)}>
          Back to today
        </Button>
      ) : (
        <span className="hidden text-xs text-ink-muted md:inline">{formatDateLong(today)}</span>
      )}
    </div>
  );
}

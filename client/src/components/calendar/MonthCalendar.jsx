import { useMemo } from 'react';
import { formatDayNumber, monthMatrix } from '../../lib/dates.js';
import { STATUS_STYLES } from '../../lib/constants.js';
import { cn } from '../../lib/cn.js';

const WEEKDAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

export function MonthCalendar({ month, days, selectedDate, today, onSelect }) {
  const weeks = useMemo(() => monthMatrix(month), [month]);
  const dayMap = useMemo(() => new Map((days || []).map((day) => [day.date, day])), [days]);

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((day) => (
          <div
            key={day.value}
            className="py-1 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-muted"
          >
            {day.label}
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {weeks.map((week) => (
          <div key={week[0]} className="grid grid-cols-7 gap-1.5">
            {week.map((date) => {
              const inMonth = date.slice(0, 7) === month;
              const day = dayMap.get(date);
              const status = day?.status || (date > today ? 'future' : 'untracked');
              const isToday = date === today;
              const isSelected = date === selectedDate;
              const clickable = inMonth && date <= today;

              return (
                <button
                  key={date}
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onSelect?.(date)}
                  title={`${date} · ${STATUS_STYLES[status]?.label || status}${
                    day ? ` · ${day.completionPercent}%` : ''
                  }`}
                  className={cn(
                    'group relative flex aspect-[1/0.92] min-h-[44px] flex-col items-center justify-center rounded-xl border text-center transition sm:aspect-square sm:min-h-[54px]',
                    inMonth ? STATUS_STYLES[status]?.cell : 'border-transparent bg-transparent text-ink-muted/25',
                    status === 'complete' && inMonth && 'border-sage-600/20',
                    status === 'partial' && inMonth && 'border-gold/40',
                    status === 'missed' && inMonth && 'border-clay/20',
                    isToday && inMonth && 'ring-2 ring-forest-700 ring-offset-1',
                    isSelected && inMonth && 'outline outline-2 outline-offset-2 outline-sage-700',
                    clickable ? 'hover:-translate-y-0.5 hover:shadow-soft' : 'cursor-default',
                  )}
                >
                  <span className={cn('text-[12px] font-medium leading-none', !inMonth && 'opacity-60')}>
                    {formatDayNumber(date)}
                  </span>
                  {inMonth && day && day.status !== 'future' && day.status !== 'untracked' ? (
                    <span className="mt-1 text-[8px] font-medium leading-none opacity-75 sm:text-[9px]">
                      {day.completionPercent}%
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-ink-muted">
      {[
        ['complete', 'All complete'],
        ['partial', 'Partial'],
        ['missed', 'Missed'],
        ['untracked', 'Untracked'],
      ].map(([status, label]) => (
        <span key={status} className="flex items-center gap-1.5">
          <span className={cn('h-2.5 w-2.5 rounded-[3px]', STATUS_STYLES[status].cell)} />
          {label}
        </span>
      ))}
    </div>
  );
}

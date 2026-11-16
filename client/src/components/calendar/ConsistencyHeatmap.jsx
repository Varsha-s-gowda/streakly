import { useMemo } from 'react';
import { addDays, formatDateMedium, formatDateShort, formatWeekday, startOfWeek, weekday } from '../../lib/dates.js';
import { STATUS_STYLES } from '../../lib/constants.js';
import { cn } from '../../lib/cn.js';

const CELL_COLORS = {
  complete: 'bg-sage-500 hover:bg-sage-600',
  partial: 'bg-gold/80 hover:bg-gold',
  missed: 'bg-clay/70 hover:bg-clay',
  future: 'bg-cream-300/60',
  untracked: 'bg-cream-300/80',
};

export function ConsistencyHeatmap({ days = [], onSelect, weeks: weekCount = 12 }) {
  const weeks = useMemo(() => {
    if (!days.length) return [];
    const map = new Map(days.map((day) => [day.date, day]));
    const first = startOfWeek(days[0].date);
    const last = days[days.length - 1].date;
    const result = [];
    let cursor = first;
    while (cursor <= last) {
      const week = [];
      for (let offset = 0; offset < 7; offset += 1) {
        const date = addDays(cursor, offset);
        week.push({ date, day: map.get(date) || null });
      }
      result.push(week);
      cursor = addDays(cursor, 7);
    }
    return result.slice(-weekCount);
  }, [days, weekCount]);

  if (!weeks.length) {
    return <p className="py-6 text-center text-xs text-ink-muted">No tracked days yet.</p>;
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="grid grid-rows-7 gap-[3px] pt-[1px] text-[9px] leading-none text-ink-muted/70">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => (
            <span key={day} className="flex h-[13px] items-center sm:h-[15px]">
              {day === 1 ? 'M' : day === 3 ? 'W' : day === 5 ? 'F' : ''}
            </span>
          ))}
        </div>
        <div className="scrollbar-none flex gap-[3px] overflow-x-auto pb-1">
          {weeks.map((week) => (
            <div key={week[0].date} className="grid grid-rows-7 gap-[3px]">
              {week.map(({ date, day }) => {
                const status = day?.status || 'untracked';
                const label = `${formatDateMedium(date)} · ${
                  day ? `${day.completionPercent}% · ${STATUS_STYLES[status]?.label || status}` : 'Not tracked'
                }`;
                const Component = onSelect && day ? 'button' : 'div';
                return (
                  <Component
                    key={date}
                    type={onSelect && day ? 'button' : undefined}
                    onClick={onSelect && day ? () => onSelect(date) : undefined}
                    title={label}
                    aria-label={label}
                    className={cn(
                      'h-[13px] w-[13px] rounded-[3px] transition sm:h-[15px] sm:w-[15px]',
                      CELL_COLORS[status] || CELL_COLORS.untracked,
                      day?.isToday && 'ring-1 ring-forest-700 ring-offset-1',
                      onSelect && day && 'cursor-pointer',
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9px] uppercase tracking-wide text-ink-muted">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-[2px] bg-sage-500" /> Complete
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-[2px] bg-gold/80" /> Partial
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-[2px] bg-clay/70" /> Missed
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-[2px] bg-cream-300" /> Untracked
        </span>
        <span className="ml-auto normal-case tracking-normal">
          {formatDateShort(days[0].date)} – {formatDateShort(days[days.length - 1].date)}
        </span>
      </div>
    </div>
  );
}

import { Check, Circle, CircleCheckBig, Clock3 } from 'lucide-react';
import { ProgressBar } from '../ui/Progress.jsx';
import { Badge } from '../ui/Badge.jsx';
import { formatTime } from '../../lib/dates.js';
import { cn } from '../../lib/cn.js';

export function CompletionReview({ day, onToggle, disabled = false, title = 'Daily completion review' }) {
  const activities = day?.activities || [];
  const stats = day?.stats || {};
  const completed = activities.filter((activity) => activity.completed);
  const remaining = activities.filter((activity) => !activity.completed);

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-forest-900/[0.05] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-semibold text-forest-800">{title}</h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Look honestly at what moved today — and what still wants your attention.
            </p>
          </div>
          <Badge tone={stats.isComplete ? 'sage' : 'gold'} dot>
            {stats.isComplete ? 'Streak day complete' : 'In progress'}
          </Badge>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <span className="font-display text-[30px] leading-none text-forest-800">
            {stats.completionPercent || 0}%
          </span>
          <div className="flex-1">
            <ProgressBar value={stats.completionPercent} tone={stats.isComplete ? 'sage' : 'gold'} />
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted">
              <span>
                {stats.completedActivities || 0} of {stats.totalActivities || 0} activities
              </span>
              <span>
                Required: {stats.requiredCompleted || 0}/{stats.requiredTotal || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 px-5 py-5 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <CircleCheckBig size={14} className="text-sage-600" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">
              Completed · {completed.length}
            </h3>
          </div>
          {completed.length ? (
            <ul className="space-y-1">
              {completed.map((activity) => (
                <li key={activity.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle?.(activity, false)}
                    className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] text-ink-soft transition hover:bg-sage-50 disabled:opacity-60"
                    title="Mark incomplete"
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sage-600 text-white">
                      <Check size={10} strokeWidth={3} />
                    </span>
                    <span className="flex-1 leading-snug">{activity.title}</span>
                    <span className="text-[10px] text-ink-muted">{formatTime(activity.scheduledTime)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-cream-100/60 px-3 py-4 text-xs text-ink-muted">
              Nothing checked off yet. Small starts count.
            </p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <Clock3 size={14} className="text-clay" />
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">
              Still open · {remaining.length}
            </h3>
          </div>
          {remaining.length ? (
            <ul className="space-y-1">
              {remaining.map((activity) => (
                <li key={activity.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle?.(activity, true)}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] text-ink-soft transition hover:bg-cream-100 disabled:opacity-60',
                    )}
                    title="Mark complete"
                  >
                    <Circle size={15} className="mt-0.5 shrink-0 text-ink-muted/50" />
                    <span className="flex-1 leading-snug">{activity.title}</span>
                    <span className="text-[10px] text-ink-muted">{formatTime(activity.scheduledTime)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-sage-50 px-3 py-4 text-xs font-medium text-sage-700">
              Every activity is complete. A full day, beautifully kept.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

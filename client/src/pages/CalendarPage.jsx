import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Flame,
  MoonStar,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useApi, useToday } from '../hooks/useApi.js';
import { api } from '../lib/api.js';
import {
  addDays,
  formatDateLong,
  formatMinutes,
  formatMonthYear,
  monthOf,
  relativeDay,
  shiftMonth,
} from '../lib/dates.js';
import {
  GRATITUDE_FIELDS,
  MANIFESTATION_FIELDS,
  REFLECTION_FIELDS,
  STATUS_STYLES,
} from '../lib/constants.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { Button } from '../components/ui/Button.jsx';
import { PageSkeleton, LoadingBlock } from '../components/ui/Spinner.jsx';
import { MonthCalendar, CalendarLegend } from '../components/calendar/MonthCalendar.jsx';
import { ConsistencyHeatmap } from '../components/calendar/ConsistencyHeatmap.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ProgressBar } from '../components/ui/Progress.jsx';
import { cn } from '../lib/cn.js';

function JournalGroup({ title, icon: Icon, fields, values }) {
  const entries = fields.filter((field) => values?.[field.key]?.trim());
  if (!entries.length) return null;
  return (
    <details className="group rounded-xl border border-forest-900/[0.06] bg-cream-50/60">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
        <Icon size={13} className="text-sage-600" />
        {title}
        <span className="ml-auto text-[9px] font-normal normal-case tracking-normal text-ink-muted/60">
          {entries.length} notes
        </span>
      </summary>
      <div className="space-y-2.5 border-t border-forest-900/[0.04] px-3 py-2.5">
        {entries.map((field) => (
          <div key={field.key}>
            <p className="text-[10px] font-medium text-ink-muted">{field.label}</p>
            <p className="mt-0.5 whitespace-pre-wrap text-[11.5px] leading-relaxed text-ink-soft">
              {values[field.key]}
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}

export function CalendarPage() {
  const today = useToday();
  const [month, setMonth] = useState(monthOf(today));
  const [selectedDate, setSelectedDate] = useState(today);

  const calendarState = useApi(() => api.get(`/stats/calendar?month=${month}`), [month]);
  const overviewState = useApi(() => api.get('/stats/overview'), [today]);
  const heatmapState = useApi(
    () => api.get(`/stats/trends?from=${addDays(today, -83)}&to=${today}`),
    [today],
  );
  const dayState = useApi(
    () => api.get(`/day?date=${selectedDate}`),
    [selectedDate],
    { enabled: Boolean(selectedDate) && selectedDate <= today },
  );

  useEffect(() => {
    if (selectedDate.slice(0, 7) !== month) {
      setSelectedDate(month === monthOf(today) ? today : `${month}-01`);
    }
  }, [month, today, selectedDate]);

  const data = calendarState.data;
  const overview = overviewState.data;
  const selectedDay = data?.days?.find((day) => day.date === selectedDate);
  const status = selectedDay?.status || 'untracked';
  const day = dayState.data;
  const isCurrentMonth = month === monthOf(today);

  const completed = useMemo(
    () => (day?.activities || []).filter((activity) => activity.completed),
    [day],
  );
  const incomplete = useMemo(
    () => (day?.activities || []).filter((activity) => !activity.completed),
    [day],
  );

  if (calendarState.loading && !data) return <PageSkeleton />;

  if (calendarState.error && !data) {
    return (
      <div className="card mx-auto mt-10 max-w-lg px-6 py-10 text-center">
        <p className="font-display text-xl text-forest-800">Calendar could not load</p>
        <p className="mt-2 text-sm text-ink-muted">{calendarState.error.message}</p>
        <Button className="mt-5" onClick={() => calendarState.refresh()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const summary = data.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calendar & streaks"
        title="See the shape of your consistency."
        description="Every coloured day is an honest record. Open any date to revisit activities, study time, and reflections."
        actions={
          <div className="flex items-center gap-1 rounded-xl border border-forest-900/[0.08] bg-white/70 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, -1))}
              className="rounded-lg p-2 text-ink-muted transition hover:bg-cream-100 hover:text-ink"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[136px] px-2 text-center text-xs font-medium text-ink">
              {formatMonthYear(month)}
            </span>
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, 1))}
              disabled={isCurrentMonth}
              className="rounded-lg p-2 text-ink-muted transition hover:bg-cream-100 hover:text-ink disabled:opacity-30"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Flame}
          label="Current streak"
          value={`${overview?.streaks?.current || 0}d`}
          hint="Consecutive fully completed days"
          tone="clay"
        />
        <StatCard
          icon={Trophy}
          label="Longest streak"
          value={`${overview?.streaks?.longest || 0}d`}
          hint={`${overview?.streaks?.completedDays || 0} fully completed days`}
          tone="gold"
        />
        <StatCard
          icon={CalendarDays}
          label="Active days"
          value={overview?.streaks?.activeDays || 0}
          hint={`${overview?.streaks?.totalTrackedDays || 0} days tracked`}
          tone="forest"
        />
        <StatCard
          icon={Check}
          label="Tasks completed"
          value={overview?.streaks?.totalCompletedTasks || 0}
          hint="Every tick, all time"
          tone="sage"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.9fr)]">
        <section className="card px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
            <div>
              <p className="eyebrow">Monthly view</p>
              <h2 className="mt-1 text-[20px] font-semibold text-forest-800">{formatMonthYear(month)}</h2>
            </div>
            {!isCurrentMonth ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setMonth(monthOf(today));
                  setSelectedDate(today);
                }}
              >
                Back to this month
              </Button>
            ) : null}
          </div>
          <MonthCalendar
            month={month}
            days={data.days}
            selectedDate={selectedDate}
            today={today}
            onSelect={setSelectedDate}
          />
          <div className="mt-4 border-t border-forest-900/[0.05] pt-3">
            <CalendarLegend />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              {
                label: 'Completed',
                value: summary.completedDays,
                tone: 'text-sage-700',
              },
              { label: 'Partial', value: summary.partialDays, tone: 'text-[#8B6E30]' },
              { label: 'Missed', value: summary.missedDays, tone: 'text-[#94543B]' },
              { label: 'Consistency', value: `${summary.consistency}%`, tone: 'text-forest-800' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-cream-100/60 px-3 py-2.5">
                <p className="text-[9px] uppercase tracking-wide text-ink-muted">{item.label}</p>
                <p className={cn('mt-0.5 font-display text-lg leading-none', item.tone)}>{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-ink-muted">
            <span>{formatMinutes(summary.studyMinutes)} studied this month</span>
            <span>{summary.journalDays} journal days</span>
            <span>{summary.averagePercent}% average completion</span>
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-forest-900/[0.05] px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">{relativeDay(selectedDate, today)}</p>
                <h2 className="mt-1 text-[17px] font-semibold leading-snug text-forest-800">
                  {formatDateLong(selectedDate)}
                </h2>
              </div>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-[10px] font-medium',
                  STATUS_STYLES[status]?.soft,
                )}
              >
                {STATUS_STYLES[status]?.label || status}
              </span>
            </div>
            {selectedDay ? (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-ink-muted">
                  <span>
                    {selectedDay.completedActivities}/{selectedDay.totalActivities} activities
                  </span>
                  <span className="font-medium text-forest-800">{selectedDay.completionPercent}%</span>
                </div>
                <ProgressBar
                  value={selectedDay.completionPercent}
                  tone={status === 'complete' ? 'sage' : status === 'partial' ? 'gold' : 'clay'}
                  className="mt-1.5"
                />
                <div className="mt-2.5 flex flex-wrap gap-3 text-[10px] text-ink-muted">
                  <span>{formatMinutes(selectedDay.studyMinutes)} studied</span>
                  <span>{selectedDay.problemsSolved} problems</span>
                  {selectedDay.hasJournal ? <span>Journal saved</span> : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="max-h-[640px] overflow-y-auto px-5 py-4">
            {dayState.loading && !day ? (
              <LoadingBlock label="Opening this day…" />
            ) : dayState.error ? (
              <p className="rounded-xl bg-[#FAEFEA] px-3 py-3 text-xs text-[#834932]">
                {dayState.error.message}
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Check size={13} className="text-sage-600" />
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                      Completed · {completed.length}
                    </h3>
                  </div>
                  {completed.length ? (
                    <ul className="space-y-0.5">
                      {completed.map((activity) => (
                        <li key={activity.id} className="flex items-start gap-1.5 text-[11px] leading-snug text-ink-soft">
                          <Check size={11} className="mt-0.5 shrink-0 text-sage-600" />
                          {activity.title}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-ink-muted">Nothing completed on this day.</p>
                  )}
                </div>

                <div>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Circle size={12} className="text-clay" />
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                      {selectedDate === today ? 'Still open' : 'Missed'} · {incomplete.length}
                    </h3>
                  </div>
                  {incomplete.length ? (
                    <ul className="space-y-0.5">
                      {incomplete.map((activity) => (
                        <li key={activity.id} className="flex items-start gap-1.5 text-[11px] leading-snug text-ink-muted">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-clay/60" />
                          {activity.title}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-sage-700">Everything was complete.</p>
                  )}
                </div>

                {day?.sessions?.length ? (
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <BookOpenCheck size={13} className="text-sage-600" />
                      <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                        Study sessions
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {day.sessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between rounded-lg bg-cream-100/60 px-2.5 py-1.5 text-[10.5px]">
                          <span className="truncate text-ink-soft">{session.subject}</span>
                          <span className="ml-2 shrink-0 text-ink-muted">{formatMinutes(session.minutes)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {day?.journal ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <MoonStar size={13} className="text-[#8B7442]" />
                      <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                        Reflection
                      </h3>
                    </div>
                    {day.journal.achievements ? (
                      <div className="rounded-xl bg-sage-50/70 px-3 py-2.5">
                        <p className="text-[10px] font-medium text-ink-muted">What I achieved</p>
                        <p className="mt-0.5 whitespace-pre-wrap text-[11.5px] leading-relaxed text-ink-soft">
                          {day.journal.achievements}
                        </p>
                      </div>
                    ) : null}
                    <JournalGroup
                      title="Gratitude"
                      icon={Sparkles}
                      fields={GRATITUDE_FIELDS}
                      values={day.journal.gratitude}
                    />
                    <JournalGroup
                      title="Daily journal"
                      icon={BookOpenCheck}
                      fields={REFLECTION_FIELDS}
                      values={day.journal.reflection}
                    />
                    <JournalGroup
                      title="Manifestation"
                      icon={Sparkles}
                      fields={MANIFESTATION_FIELDS}
                      values={day.journal.manifestation}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-forest-900/10 px-3 py-4 text-center">
                    <p className="text-[11px] text-ink-muted">No journal entry for this date.</p>
                    <Link
                      to={`/journal?date=${selectedDate}`}
                      className="mt-1 inline-block text-[11px] font-medium text-sage-700 hover:underline"
                    >
                      Write a reflection
                    </Link>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 border-t border-forest-900/[0.05] pt-3">
                  <Link to={`/routine?date=${selectedDate}`}>
                    <Button size="sm" variant="soft">
                      Open day
                    </Button>
                  </Link>
                  <Link to={`/journal?date=${selectedDate}`}>
                    <Button size="sm" variant="ghost">
                      Journal
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="card px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Consistency heatmap</p>
            <h2 className="mt-1 text-[19px] font-semibold text-forest-800">The last twelve weeks</h2>
            <p className="mt-1 text-xs text-ink-muted">
              Bright green means a fully completed day. Gaps are information, not judgement.
            </p>
          </div>
          <Badge tone="sage">{overview?.week?.consistency || 0}% this week</Badge>
        </div>
        <div className="mt-4">
          {heatmapState.data ? (
            <ConsistencyHeatmap
              days={heatmapState.data.days}
              onSelect={(date) => {
                setMonth(monthOf(date));
                setSelectedDate(date);
              }}
            />
          ) : (
            <LoadingBlock label="Building your heatmap…" className="py-8" />
          )}
        </div>
      </section>
    </div>
  );
}

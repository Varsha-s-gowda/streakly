import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Circle,
  Flame,
  Leaf,
  MoonStar,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useApi, useToday } from '../hooks/useApi.js';
import { api } from '../lib/api.js';
import { formatDateLong, formatMinutes, formatWeekday, formatDayNumber, greetingFor } from '../lib/dates.js';
import { STATUS_STYLES } from '../lib/constants.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { ProgressBar, ProgressRing } from '../components/ui/Progress.jsx';
import { RoutineChecklist } from '../components/routine/RoutineChecklist.jsx';
import { PageSkeleton } from '../components/ui/Spinner.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { cn } from '../lib/cn.js';

export function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const today = useToday();
  const { data, setData, loading, error, refresh } = useApi(
    () => api.get('/stats/overview'),
    [today],
  );

  const firstName = user?.name?.split(' ')[0] || 'friend';
  const greeting = greetingFor(user?.timezone);

  const remaining = useMemo(() => {
    if (!data) return 0;
    return Math.max(0, data.today.totalActivities - data.today.completedActivities);
  }, [data]);

  const handleToggle = async (activity, completed) => {
    if (!data) return;
    const snapshot = data;
    setData((current) => ({
      ...current,
      schedule: current.schedule.map((item) =>
        item.id === activity.id ? { ...item, completed } : item,
      ),
    }));
    try {
      const result = await api.patch(`/day/${today}/activities/${activity.id}`, { completed });
      setData((current) => ({
        ...current,
        schedule: result.day.activities,
        today: {
          ...current.today,
          ...result.day.stats,
          studyMinutes: result.day.studyMinutes,
          problemsSolved: result.day.problemsSolved,
        },
        streaks: result.streaks,
      }));
      refresh({ silent: true }).catch(() => {});
    } catch (err) {
      setData(snapshot);
      toast.error(err.message || 'Could not update that activity.');
    }
  };

  const handleNotes = async (activityId, notes) => {
    try {
      const result = await api.patch(`/day/${today}/activities/${activityId}`, { notes });
      setData((current) => ({ ...current, schedule: result.day.activities }));
      toast.success('Note saved.');
    } catch (err) {
      toast.error(err.message || 'Could not save that note.');
    }
  };

  if (loading && !data) return <PageSkeleton />;

  if (error && !data) {
    return (
      <div className="card mx-auto mt-10 max-w-lg px-6 py-10 text-center">
        <p className="font-display text-xl text-forest-800">Your day could not load</p>
        <p className="mt-2 text-sm text-ink-muted">{error.message}</p>
        <Button className="mt-5" onClick={() => refresh()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const { today: dayStats, streaks, week, month, habits, interview, schedule } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          eyebrow={formatDateLong(today)}
          title={`${greeting}, ${firstName}.`}
          description="One deliberate day at a time. Your routine is ready whenever you are."
        />
        <div className="flex items-center gap-2">
          <Badge tone="sage" dot>
            {week.elapsedDays ? `${week.completedDays} full days this week` : 'Fresh start'}
          </Badge>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-[28px] bg-forest-800 bg-grain px-5 py-6 text-cream-100 shadow-lift sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-sage-300/10" />
        <div className="pointer-events-none absolute -bottom-32 right-24 h-64 w-64 rounded-full bg-sage-400/[0.08] blur-2xl" />
        <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-200/60">
              <Leaf size={13} />
              Today’s rhythm
            </div>
            <h2 className="mt-2.5 font-display text-[28px] leading-tight text-cream-50 sm:text-[34px]">
              {dayStats.isComplete
                ? 'A complete day. This is how it’s built.'
                : `You’re ${dayStats.completionPercent}% through today.`}
            </h2>
            <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-cream-200/55">
              {dayStats.isComplete
                ? 'Every required activity is checked. Keep the evening gentle and let the streak rest.'
                : `${dayStats.completedActivities} activities complete · ${remaining} still open. Keep the promise to yourself.`}
            </p>

            <div className="mt-5 max-w-lg">
              <ProgressBar
                value={dayStats.completionPercent}
                tone="sage"
                height="h-1.5"
                className="bg-white/10"
              />
              <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-cream-200/50">
                <span className="flex items-center gap-1.5">
                  <Flame size={13} className="text-[#D8B77A]" />
                  {streaks.current}-day streak
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-sage-300" />
                  {dayStats.requiredCompleted}/{dayStats.requiredTotal} required
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpenCheck size={13} className="text-sage-300" />
                  {formatMinutes(dayStats.studyMinutes)} studied
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/routine">
                <Button size="sm" className="bg-cream-100 text-forest-800 hover:bg-white">
                  Open daily routine <ArrowRight size={13} />
                </Button>
              </Link>
              <Link to="/journal">
                <Button
                  size="sm"
                  variant="ghost"
                  className="border border-white/10 text-cream-100 hover:bg-white/10 hover:text-white"
                >
                  <MoonStar size={13} /> Night reflection
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-5 sm:gap-7">
            <ProgressRing value={dayStats.completionPercent} size={126} stroke={8} tone="sage">
              <span className="font-display text-[30px] leading-none text-cream-50">
                {dayStats.completionPercent}%
              </span>
              <span className="mt-1 text-[9px] uppercase tracking-[0.16em] text-cream-200/40">
                complete
              </span>
            </ProgressRing>
            <div className="hidden space-y-3 sm:block">
              <div>
                <p className="text-[9px] uppercase tracking-[0.16em] text-cream-200/40">Current streak</p>
                <p className="mt-0.5 font-display text-2xl text-cream-50">{streaks.current} days</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.16em] text-cream-200/40">Longest</p>
                <p className="mt-0.5 font-display text-2xl text-cream-50">{streaks.longest} days</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Flame}
          label="Current streak"
          value={`${streaks.current}d`}
          hint={`Longest ${streaks.longest} days · ${streaks.activeDays} active days`}
          tone="clay"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed today"
          value={dayStats.completedActivities}
          hint={`of ${dayStats.totalActivities} scheduled activities`}
          tone="sage"
        />
        <StatCard
          icon={Circle}
          label="Remaining today"
          value={remaining}
          hint={remaining === 0 ? 'Everything is complete.' : 'Small steps still count.'}
          tone="gold"
        />
        <StatCard
          icon={Trophy}
          label="Total tasks done"
          value={streaks.totalCompletedTasks}
          hint={`Across ${streaks.completedDays} fully completed days`}
          tone="forest"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
        <section className="card p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <p className="eyebrow">Main focus</p>
              <h2 className="mt-1 text-[20px] font-semibold text-forest-800">Today’s complete schedule</h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Tick each activity as you move through the day. Notes are saved automatically.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-medium text-sage-700">
                {dayStats.completedActivities}/{dayStats.totalActivities}
              </span>
              <Link to="/routine" className="text-xs font-medium text-sage-700 hover:underline">
                Full view
              </Link>
            </div>
          </div>
          <RoutineChecklist activities={schedule} onToggle={handleToggle} onNotes={handleNotes} />
        </section>

        <div className="space-y-4">
          <section className="card px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">This week</p>
                <p className="mt-1 font-display text-[26px] leading-none text-forest-800">{week.percent}%</p>
              </div>
              <Badge tone={week.consistency >= 60 ? 'sage' : 'gold'}>
                {week.consistency}% consistency
              </Badge>
            </div>
            <div className="mt-4 flex h-24 items-end gap-1.5">
              {week.days.map((day) => {
                const tone = STATUS_STYLES[day.status] || STATUS_STYLES.untracked;
                const height = day.status === 'future' ? 10 : Math.max(8, day.completionPercent);
                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex h-[70px] w-full items-end rounded-md bg-cream-100/70">
                      <div
                        className={cn(
                          'w-full rounded-md transition-all duration-500',
                          day.status === 'complete'
                            ? 'bg-sage-500'
                            : day.status === 'partial'
                              ? 'bg-gold/80'
                              : day.status === 'missed'
                                ? 'bg-clay/55'
                                : 'bg-cream-300',
                        )}
                        style={{ height: `${height}%` }}
                        title={`${day.date}: ${day.completionPercent}%`}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-[9px] font-medium uppercase',
                        day.isToday ? 'text-forest-800' : 'text-ink-muted/70',
                      )}
                    >
                      {formatWeekday(day.date, 'narrow')}
                    </span>
                    <span className="text-[8px] text-ink-muted/50">{formatDayNumber(day.date)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-forest-900/[0.05] pt-3 text-[11px] text-ink-muted">
              <span>{week.completedDays} complete days</span>
              <Link to="/analytics" className="font-medium text-sage-700 hover:underline">
                See trends
              </Link>
            </div>
          </section>

          <section className="card px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">This month</p>
                <p className="mt-1 font-display text-[26px] leading-none text-forest-800">{month.percent}%</p>
              </div>
              <CalendarDays size={17} className="text-sage-500" />
            </div>
            <ProgressBar value={month.percent} tone="forest" className="mt-4" />
            <div className="mt-2.5 grid grid-cols-2 gap-3 text-[11px] text-ink-muted">
              <span>{month.completedDays} full days</span>
              <span className="text-right">{month.elapsedDays} tracked</span>
              <span>{month.consistency}% consistency</span>
              <span className="text-right">{month.tasksCompleted} tasks</span>
            </div>
          </section>

          <section className="card px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
                  <Flame size={15} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-forest-800">Habits today</p>
                  <p className="text-[10px] text-ink-muted">
                    {habits.completedToday} of {habits.total} checked in
                  </p>
                </div>
              </div>
              <Link to="/habits" className="text-[11px] font-medium text-sage-700 hover:underline">
                Open
              </Link>
            </div>
            <ProgressBar
              value={habits.total ? (habits.completedToday / habits.total) * 100 : 0}
              tone="sage"
              className="mt-3"
            />
          </section>

          <section className="card px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-forest-100 text-forest-600">
                  <BriefcaseBusiness size={15} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-forest-800">Interview preparation</p>
                  <p className="text-[10px] text-ink-muted">
                    {interview.topicsCompleted}/{interview.topicsTotal} topics complete
                  </p>
                </div>
              </div>
              <Link to="/interview" className="text-[11px] font-medium text-sage-700 hover:underline">
                Open
              </Link>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar value={interview.progress} tone="sage" />
              <span className="text-[11px] font-medium text-forest-700">{interview.progress}%</span>
            </div>
            <p className="mt-2 text-[10px] text-ink-muted">
              {formatMinutes(interview.weekMinutes)} studied this week
            </p>
          </section>

          <section
            className={cn(
              'rounded-3xl border px-4 py-4 sm:px-5',
              dayStats.hasJournal
                ? 'border-sage-200 bg-sage-50/80'
                : 'border-forest-900/[0.06] bg-white/80 shadow-soft',
            )}
          >
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cream-200 text-[#8B7442]">
                <MoonStar size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-forest-800">
                  {dayStats.hasJournal ? 'Tonight’s reflection is written' : 'Close the day gently'}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                  {dayStats.hasJournal
                    ? 'You showed up for yourself in words too. You can still add to it.'
                    : 'Gratitude, journaling, affirmations, and tomorrow’s intentions.'}
                </p>
                <Link
                  to="/journal"
                  className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-sage-700 hover:underline"
                >
                  {dayStats.hasJournal ? 'Review entry' : 'Begin reflection'} <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          </section>

          <div className="flex items-start gap-2 rounded-2xl bg-cream-200/50 px-4 py-3 text-[10px] leading-relaxed text-ink-muted">
            <Sparkles size={13} className="mt-0.5 shrink-0 text-gold" />
            <p>
              A day counts toward your streak only when every required activity is complete. Missed
              days break the streak — but your history is never erased.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

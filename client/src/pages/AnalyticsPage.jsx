import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarRange,
  Flame,
  NotebookPen,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { useApi, useToday } from '../hooks/useApi.js';
import { api } from '../lib/api.js';
import {
  addDays,
  formatDateMedium,
  formatDateShort,
  formatMinutes,
  formatMonthShort,
  formatWeekday,
} from '../lib/dates.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { PageSkeleton } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SegmentedControl } from '../components/ui/SegmentedControl.jsx';
import { ProgressBar } from '../components/ui/Progress.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ChartTooltip } from '../components/charts/ChartTooltip.jsx';
import { cn } from '../lib/cn.js';

const PRESETS = [
  { value: 'week', label: '7 days', days: 7 },
  { value: 'month', label: '30 days', days: 30 },
  { value: 'quarter', label: '90 days', days: 90 },
  { value: 'custom', label: 'Custom', days: 30 },
];

const SAGE = '#728D67';
const FOREST = '#3D5B47';
const GOLD = '#BFA36A';
const CLAY = '#B8775C';

function Section({ icon: Icon, title, description, badge, children, className }) {
  return (
    <section className={cn('card px-4 py-4 sm:px-5 sm:py-5', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {Icon ? (
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
              <Icon size={16} strokeWidth={1.8} />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold leading-snug text-forest-800">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-ink-muted">{description}</p> : null}
          </div>
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
      {children}
    </section>
  );
}

function ChartFrame({ children, height = 220 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function AnalyticsPage() {
  const today = useToday();
  const [preset, setPreset] = useState('month');
  const [customFrom, setCustomFrom] = useState(addDays(today, -29));
  const [customTo, setCustomTo] = useState(today);

  const range = useMemo(() => {
    if (preset === 'custom') {
      const from = customFrom <= customTo ? customFrom : customTo;
      const to = customFrom <= customTo ? customTo : customFrom;
      return { from: from > today ? today : from, to: to > today ? today : to };
    }
    const days = PRESETS.find((item) => item.value === preset)?.days || 30;
    return { from: addDays(today, -(days - 1)), to: today };
  }, [preset, customFrom, customTo, today]);

  const state = useApi(
    () => api.get(`/stats/trends?from=${range.from}&to=${range.to}`),
    [range.from, range.to],
  );

  const data = state.data;
  const days = data?.days || [];
  const weeks = data?.weeks || [];
  const months = data?.months || [];
  const habits = data?.habits || [];
  const interview = data?.interview;
  const totals = data?.totals;
  const streak = data?.streak;

  const dailySeries = useMemo(
    () =>
      days.map((day) => ({
        date: day.date,
        label: formatDateShort(day.date),
        weekday: formatWeekday(day.date, 'narrow'),
        completion: day.completionPercent,
        tasks: day.completedActivities,
        study: Math.round((day.studyMinutes / 60) * 10) / 10,
        habits: day.habitsCompleted,
      })),
    [days],
  );

  const weeklySeries = useMemo(
    () =>
      weeks.map((week) => ({
        key: week.key,
        label: formatDateShort(week.start),
        completion: week.averagePercent,
        tasks: week.tasksCompleted,
        study: Math.round((week.studyMinutes / 60) * 10) / 10,
        completeDays: week.completedDays,
      })),
    [weeks],
  );

  const monthlySeries = useMemo(
    () =>
      months.map((month) => ({
        key: month.key,
        label: formatMonthShort(month.key),
        completion: month.averagePercent,
        consistency: month.days ? Math.round((month.completedDays / month.days) * 100) : 0,
        tasks: month.tasksCompleted,
      })),
    [months],
  );

  const wellbeingSeries = useMemo(
    () => [
      { label: 'Journal', value: totals?.journalEntries || 0, fill: SAGE },
      { label: 'Gratitude', value: totals?.gratitudeEntries || 0, fill: GOLD },
      { label: 'Manifestation', value: totals?.manifestationEntries || 0, fill: FOREST },
    ],
    [totals],
  );

  const subjectSeries = useMemo(() => {
    if (!interview?.subjects) return [];
    return [...interview.subjects]
      .filter((subject) => subject.topicsTotal > 0 || subject.rangeMinutes > 0)
      .sort((a, b) => b.progress - a.progress || b.rangeMinutes - a.rangeMinutes);
  }, [interview]);

  const habitSeries = useMemo(
    () =>
      [...habits]
        .sort((a, b) => b.completionRate - a.completionRate)
        .map((habit) => ({
          name: habit.name,
          rate: habit.completionRate,
          streak: habit.currentStreak,
          longest: habit.longestStreak,
        })),
    [habits],
  );

  const topHabits = habitSeries.slice(0, 8);

  const rangeLabel =
    range.from === range.to
      ? formatDateMedium(range.from)
      : `${formatDateMedium(range.from)} – ${formatDateMedium(range.to)}`;

  if (state.loading && !data) return <PageSkeleton />;

  if (state.error && !data) {
    return (
      <div className="card mx-auto mt-10 max-w-lg px-6 py-10 text-center">
        <p className="font-display text-xl text-forest-800">Analytics could not load</p>
        <p className="mt-2 text-sm text-ink-muted">{state.error.message}</p>
        <button
          type="button"
          onClick={() => state.refresh()}
          className="mt-5 h-10 rounded-xl bg-forest-700 px-4 text-sm font-medium text-cream-50 transition hover:bg-forest-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const hasData = days.some((day) => day.tracked && (day.completedActivities > 0 || day.studyMinutes > 0));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Read the story your days are telling."
        description="Real numbers from your real records — completion, consistency, study depth, habit strength, and reflection. Choose a range and look honestly."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              value={preset}
              onChange={setPreset}
              options={PRESETS.map((item) => ({ value: item.value, label: item.label }))}
            />
            {preset === 'custom' ? (
              <div className="flex items-center gap-1.5 rounded-xl border border-forest-900/[0.08] bg-white/70 px-2 py-1.5">
                <input
                  type="date"
                  value={customFrom}
                  max={today}
                  onChange={(event) => event.target.value && setCustomFrom(event.target.value)}
                  className="bg-transparent text-[11px] text-ink outline-none"
                  aria-label="From date"
                />
                <span className="text-[10px] text-ink-muted">to</span>
                <input
                  type="date"
                  value={customTo}
                  max={today}
                  min={customFrom}
                  onChange={(event) => event.target.value && setCustomTo(event.target.value)}
                  className="bg-transparent text-[11px] text-ink outline-none"
                  aria-label="To date"
                />
              </div>
            ) : null}
            <Badge tone="cream">{rangeLabel}</Badge>
          </div>
        }
      />

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No tracked activity in this range"
          description="Complete a few activities, log study time, or check in a habit, then return. Analytics only reflects real records."
          className="py-16"
        />
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Flame}
          label="Current streak"
          value={`${streak?.current || 0}d`}
          hint={`Longest ${streak?.longest || 0} days · ${streak?.completedDays || 0} complete days`}
          tone="clay"
        />
        <StatCard
          icon={Trophy}
          label="Consistency"
          value={`${totals?.consistency || 0}%`}
          hint={`${totals?.completeDays || 0} of ${totals?.days || 0} tracked days fully complete`}
          tone="sage"
        />
        <StatCard
          icon={Activity}
          label="Average completion"
          value={`${totals?.averageCompletion || 0}%`}
          hint={`${totals?.totalCompletedTasks || 0} activities completed in range`}
          tone="gold"
        />
        <StatCard
          icon={BookOpenCheck}
          label="Study time"
          value={formatMinutes(totals?.studyMinutes || 0)}
          hint={`${totals?.problemsSolved || 0} problems solved · ${formatMinutes(Math.round((totals?.studyMinutes || 0) / Math.max(1, totals?.days || 1)))} per day`}
          tone="forest"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section
          icon={Activity}
          title="Daily completion"
          description="How much of the required routine was completed each day."
          badge={<Badge tone="sage">{dailySeries.length} days</Badge>}
        >
          {dailySeries.length ? (
            <ChartFrame>
              <AreaChart data={dailySeries} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="completionFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SAGE} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={SAGE} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={44} tickFormatter={(value) => `${value}%`} />
                <Tooltip
                  content={
                    <ChartTooltip
                      formatter={(value) => `${value}%`}
                      labelFormatter={(_, payload) => formatDateMedium(payload?.[0]?.payload?.date || '')}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="completion"
                  name="Completion"
                  stroke={SAGE}
                  strokeWidth={2}
                  fill="url(#completionFill)"
                />
              </AreaChart>
            </ChartFrame>
          ) : (
            <p className="py-10 text-center text-xs text-ink-muted">No daily records in this range.</p>
          )}
        </Section>

        <Section
          icon={BarChart3}
          title="Weekly productivity"
          description="Activities completed and study hours, grouped by week."
        >
          {weeklySeries.length ? (
            <ChartFrame>
              <BarChart data={weeklySeries} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={12} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} width={40} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  width={34}
                  tickFormatter={(value) => `${value}h`}
                />
                <Tooltip
                  content={
                    <ChartTooltip formatter={(value, entry) => (entry?.dataKey === 'study' ? `${value}h` : value)} />
                  }
                />
                <Bar yAxisId="left" dataKey="tasks" name="Activities" fill={SAGE} radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Bar yAxisId="right" dataKey="study" name="Study hours" fill={GOLD} radius={[4, 4, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ChartFrame>
          ) : (
            <p className="py-10 text-center text-xs text-ink-muted">Weekly data appears once you track a few days.</p>
          )}
        </Section>

        <Section
          icon={CalendarRange}
          title="Monthly consistency"
          description="Average completion and fully completed days per month."
        >
          {monthlySeries.length ? (
            <ChartFrame>
              <LineChart data={monthlySeries} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={10} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={40} tickFormatter={(value) => `${value}%`} />
                <Tooltip content={<ChartTooltip formatter={(value) => `${value}%`} />} />
                <Line
                  type="monotone"
                  dataKey="completion"
                  name="Average completion"
                  stroke={FOREST}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: FOREST }}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="consistency"
                  name="Complete-day rate"
                  stroke={CLAY}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={{ r: 2.5, fill: CLAY }}
                />
              </LineChart>
            </ChartFrame>
          ) : (
            <p className="py-10 text-center text-xs text-ink-muted">Monthly data will appear as time passes.</p>
          )}
        </Section>

        <Section
          icon={BookOpenCheck}
          title="Study hours"
          description="Focused interview preparation time, day by day."
          badge={<Badge tone="gold">{formatMinutes(totals?.studyMinutes || 0)}</Badge>}
        >
          {dailySeries.length ? (
            <ChartFrame>
              <BarChart data={dailySeries} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={(value) => `${value}h`} />
                <Tooltip content={<ChartTooltip formatter={(value) => `${value}h`} />} />
                <Bar dataKey="study" name="Study hours" fill={FOREST} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartFrame>
          ) : (
            <p className="py-10 text-center text-xs text-ink-muted">Log a study session to see this chart.</p>
          )}
        </Section>
      </div>

      <Section
        icon={Flame}
        title="Habit strength"
        description="Completion rate inside this range, with live and longest streaks."
        badge={<Badge tone="cream">{habits.length} habits</Badge>}
      >
        {topHabits.length ? (
          <div className="space-y-2.5">
            {topHabits.map((habit) => (
              <div key={habit.name} className="rounded-xl border border-forest-900/[0.05] bg-cream-50/50 px-3.5 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12.5px] font-medium text-ink">{habit.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Flame size={10} className="text-clay" /> {habit.streak} current
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy size={10} className="text-gold" /> {habit.longest} best
                    </span>
                    <span className="w-9 text-right font-semibold text-forest-800">{habit.rate}%</span>
                  </div>
                </div>
                <ProgressBar
                  value={habit.rate}
                  height="h-1.5"
                  tone={habit.rate >= 75 ? 'sage' : habit.rate >= 40 ? 'gold' : 'clay'}
                  className="mt-2"
                />
              </div>
            ))}
            {habitSeries.length > topHabits.length ? (
              <p className="pt-1 text-center text-[10px] text-ink-muted">
                Showing your {topHabits.length} strongest habits. {habitSeries.length - topHabits.length} more tracked.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="py-8 text-center text-xs text-ink-muted">No active habits in this range.</p>
        )}
      </Section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Section
          icon={BriefcaseBusiness}
          title="Interview subject progress"
          description="Preparation progress and focused time by subject."
          badge={
            <Badge tone={interview?.progress >= 50 ? 'sage' : 'gold'}>
              {interview?.progress || 0}% overall
            </Badge>
          }
        >
          {subjectSeries.length ? (
            <div className="space-y-2.5">
              {subjectSeries.map((subject) => (
                <div key={subject.subject}>
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="truncate text-ink-soft">{subject.subject}</span>
                    <span className="shrink-0 text-ink-muted">
                      {formatMinutes(subject.rangeMinutes)} · {subject.progress}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <ProgressBar
                      value={subject.progress}
                      height="h-1.5"
                      tone={subject.progress === 100 ? 'sage' : 'forest'}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-ink-muted">
              Add interview topics or log a session to build this view.
            </p>
          )}
        </Section>

        <Section
          icon={Sparkles}
          title="Reflection frequency"
          description="Days with a saved journal, gratitude, or manifestation entry."
        >
          <div className="space-y-3">
            {wellbeingSeries.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-ink-soft">{item.label}</span>
                  <span className="text-ink-muted">
                    {item.value} day{item.value === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-forest-900/[0.07]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (item.value / Math.max(1, totals?.days || 1)) * 100)}%`,
                      backgroundColor: item.fill,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-forest-900/[0.05] pt-3">
            <div className="text-center">
              <p className="font-display text-lg leading-none text-forest-800">{totals?.journalEntries || 0}</p>
              <p className="mt-1 text-[8px] uppercase tracking-wide text-ink-muted">journal</p>
            </div>
            <div className="text-center">
              <p className="font-display text-lg leading-none text-forest-800">{totals?.gratitudeEntries || 0}</p>
              <p className="mt-1 text-[8px] uppercase tracking-wide text-ink-muted">gratitude</p>
            </div>
            <div className="text-center">
              <p className="font-display text-lg leading-none text-forest-800">{totals?.manifestationEntries || 0}</p>
              <p className="mt-1 text-[8px] uppercase tracking-wide text-ink-muted">manifest</p>
            </div>
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-ink-muted">
            <NotebookPen size={11} className="mt-0.5 shrink-0" />
            Reflections count when at least one field is written — not when a blank entry exists.
          </p>
        </Section>
      </div>

      <Section
        icon={Target}
        title="Range summary"
        description="The plain truth of this period, without decoration."
        badge={
          <Badge tone={totals?.consistency >= 60 ? 'sage' : 'gold'} dot>
            {totals?.consistency || 0}% consistent
          </Badge>
        }
      >
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Tracked days', value: totals?.days || 0 },
            { label: 'Complete days', value: totals?.completeDays || 0 },
            { label: 'Active days', value: totals?.activeDays || 0 },
            { label: 'Activities done', value: totals?.totalCompletedTasks || 0 },
            { label: 'Habit check-ins', value: totals?.habitsCompleted || 0 },
            { label: 'Problems solved', value: totals?.problemsSolved || 0 },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-cream-100/60 px-3 py-2.5">
              <p className="text-[9px] uppercase tracking-wide text-ink-muted">{item.label}</p>
              <p className="mt-0.5 font-display text-lg leading-none text-forest-800">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] leading-relaxed text-ink-muted">
          Every number here is calculated from your saved daily logs, habit entries, study sessions,
          and journal entries. Historical edits are reflected immediately. Custom tasks are included
          in completion only when marked required.
        </p>
      </Section>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Flame,
  Pencil,
  Plus,
  Repeat2,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { useApi, useToday } from '../hooks/useApi.js';
import { api } from '../lib/api.js';
import { formatDateMedium, formatDayNumber, formatWeekday, lastNDays } from '../lib/dates.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { Button } from '../components/ui/Button.jsx';
import { PageSkeleton } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Modal, ConfirmDialog } from '../components/ui/Modal.jsx';
import { Input, Textarea } from '../components/ui/Field.jsx';
import { SegmentedControl } from '../components/ui/SegmentedControl.jsx';
import { ProgressBar } from '../components/ui/Progress.jsx';
import { cn } from '../lib/cn.js';

function HabitModal({ open, onClose, habit, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ name: habit?.name || '', description: habit?.description || '' });
    setError('');
  }, [open, habit]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.name.trim().length < 2) {
      setError('Give the habit a short, clear name.');
      return;
    }
    setSaving(true);
    try {
      if (habit) {
        await api.patch(`/habits/${habit.id}`, {
          name: form.name.trim(),
          description: form.description,
        });
        toast.success('Habit updated.');
      } else {
        await api.post('/habits', {
          name: form.name.trim(),
          description: form.description,
        });
        toast.success('Habit created. Today is day one.');
      }
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Could not save this habit.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={habit ? 'Edit habit' : 'Create a new habit'}
      description="Habits are tracked separately from your routine, with their own streak and consistency."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="habit-form" loading={saving}>
            {habit ? 'Save habit' : 'Create habit'}
          </Button>
        </>
      }
    >
      <form id="habit-form" onSubmit={submit} className="space-y-4">
        <Input
          label="Habit name"
          placeholder="e.g. Read 20 minutes"
          maxLength={120}
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          autoFocus
        />
        <Textarea
          label="Why it matters (optional)"
          rows={3}
          maxLength={500}
          placeholder="A short reminder of why you are building this…"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        {error ? (
          <p className="rounded-xl border border-[#E9CDC1] bg-[#FAEFEA] px-3 py-2.5 text-xs text-[#834932]">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

function HabitRow({ habit, dates, today, onToggle, onEdit, onDelete }) {
  const completed = useMemo(() => new Set(habit.datesInRange), [habit.datesInRange]);
  const isWeek = dates.length <= 7;

  return (
    <div className="rounded-2xl border border-forest-900/[0.055] bg-white/55 px-3.5 py-3.5 transition hover:border-forest-900/10 hover:bg-white/75 sm:px-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
            <Repeat2 size={14} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-[13.5px] font-semibold text-forest-800">{habit.name}</h3>
              {habit.isDefault ? (
                <span className="rounded-full bg-cream-200/80 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wide text-ink-muted">
                  Core
                </span>
              ) : (
                <span className="rounded-full bg-sage-100 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wide text-sage-700">
                  Custom
                </span>
              )}
            </div>
            {habit.description ? (
              <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-muted">{habit.description}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-4 pl-[42px] lg:gap-6 lg:pl-0">
          <div className="min-w-[64px]">
            <p className="flex items-center gap-1 text-[12px] font-semibold text-forest-800">
              <Flame size={12} className="text-clay" /> {habit.currentStreak}
            </p>
            <p className="text-[9px] uppercase tracking-wide text-ink-muted">streak</p>
          </div>
          <div className="min-w-[92px]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium text-ink">{habit.consistency}%</p>
              <p className="text-[9px] text-ink-muted">{habit.rangeDays}d</p>
            </div>
            <ProgressBar value={habit.consistency} height="h-1" tone="sage" className="mt-1" />
          </div>
          <div className="ml-auto flex items-center gap-0.5 lg:ml-0">
            <button
              type="button"
              onClick={() => onEdit(habit)}
              className="rounded-lg p-1.5 text-ink-muted/60 transition hover:bg-cream-100 hover:text-ink"
              aria-label={`Edit ${habit.name}`}
            >
              <Pencil size={12} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(habit)}
              className="rounded-lg p-1.5 text-ink-muted/60 transition hover:bg-[#FAEFEA] hover:text-clay"
              aria-label={`Delete ${habit.name}`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto pb-0.5">
        {isWeek ? (
          <div className="grid min-w-[300px] grid-cols-7 gap-1.5">
            {dates.map((date) => {
              const done = completed.has(date);
              const disabled = date < habit.startDate || date > today;
              return (
                <button
                  key={date}
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggle(habit, date, !done)}
                  title={`${formatDateMedium(date)} · ${done ? 'complete' : 'not checked'}`}
                  className={cn(
                    'flex h-10 flex-col items-center justify-center rounded-lg border text-center transition',
                    done
                      ? 'border-sage-500 bg-sage-500 text-white'
                      : 'border-forest-900/[0.07] bg-cream-50/60 text-ink-muted hover:border-sage-300 hover:bg-sage-50',
                    date === today && !done && 'border-sage-300 ring-1 ring-sage-300',
                    disabled && 'cursor-default opacity-35',
                  )}
                >
                  <span className="text-[8px] font-medium uppercase tracking-wide opacity-80">
                    {formatWeekday(date, 'narrow')}
                  </span>
                  <span className="text-[11px] font-semibold leading-tight">{formatDayNumber(date)}</span>
                  {done ? <Check size={9} strokeWidth={3} /> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex min-w-[520px] gap-1">
            {dates.map((date) => {
              const done = completed.has(date);
              const disabled = date < habit.startDate || date > today;
              return (
                <button
                  key={date}
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggle(habit, date, !done)}
                  title={`${formatDateMedium(date)} · ${done ? 'complete' : 'not checked'}`}
                  className={cn(
                    'h-5 flex-1 rounded-[4px] transition',
                    done ? 'bg-sage-500 hover:bg-sage-600' : 'bg-cream-300/80 hover:bg-sage-200',
                    date === today && 'ring-1 ring-forest-700 ring-offset-1',
                    disabled && 'cursor-default opacity-30',
                  )}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function HabitsPage() {
  const toast = useToast();
  const today = useToday();
  const [view, setView] = useState('week');
  const dates = useMemo(() => lastNDays(today, view === 'week' ? 7 : 30), [today, view]);
  const from = dates[0];
  const to = dates[dates.length - 1];

  const state = useApi(() => api.get(`/habits?from=${from}&to=${to}`), [from, to]);
  const [modal, setModal] = useState({ open: false, habit: null });
  const [deleteHabit, setDeleteHabit] = useState(null);
  const [working, setWorking] = useState(false);

  const data = state.data;
  const habits = data?.habits || [];

  const toggle = async (habit, date, completed) => {
    if (!data) return;
    const snapshot = data;
    state.setData((current) => ({
      ...current,
      habits: current.habits.map((item) => {
        if (item.id !== habit.id) return item;
        const nextDates = completed
          ? [...new Set([...item.datesInRange, date])].sort()
          : item.datesInRange.filter((entry) => entry !== date);
        return {
          ...item,
          datesInRange: nextDates,
          completedToday: date === today ? completed : item.completedToday,
        };
      }),
      summary: {
        ...current.summary,
        completedToday:
          date === today
            ? completed
              ? current.summary.completedToday + 1
              : Math.max(0, current.summary.completedToday - 1)
            : current.summary.completedToday,
      },
    }));
    try {
      await api.patch(`/habits/${habit.id}/entries/${date}`, { completed });
      state.refresh({ silent: true }).catch(() => {});
    } catch (err) {
      state.setData(snapshot);
      toast.error(err.message || 'Could not update this habit.');
    }
  };

  const remove = async () => {
    if (!deleteHabit) return;
    setWorking(true);
    try {
      await api.delete(`/habits/${deleteHabit.id}`);
      toast.success('Habit removed. Its history is preserved.');
      setDeleteHabit(null);
      state.refresh({ silent: true }).catch(() => {});
    } catch (err) {
      toast.error(err.message || 'Could not remove this habit.');
    } finally {
      setWorking(false);
    }
  };

  if (state.loading && !data) return <PageSkeleton />;

  if (state.error && !data) {
    return (
      <div className="card mx-auto mt-10 max-w-lg px-6 py-10 text-center">
        <p className="font-display text-xl text-forest-800">Habits could not load</p>
        <p className="mt-2 text-sm text-ink-muted">{state.error.message}</p>
        <Button className="mt-5" onClick={() => state.refresh()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Habit tracker"
        title="Small promises, kept daily."
        description="Habits build separately from your routine. Each one carries its own streak and consistency."
        actions={
          <>
            <SegmentedControl
              value={view}
              onChange={setView}
              options={[
                { value: 'week', label: 'Last 7 days' },
                { value: 'month', label: 'Last 30 days' },
              ]}
            />
            <Button onClick={() => setModal({ open: true, habit: null })}>
              <Plus size={15} /> New habit
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Repeat2}
          label="Active habits"
          value={data.summary.total}
          hint="Tracked every day"
          tone="forest"
        />
        <StatCard
          icon={Check}
          label="Checked in today"
          value={`${data.summary.completedToday}/${data.summary.total}`}
          hint={
            data.summary.total
              ? `${Math.round((data.summary.completedToday / data.summary.total) * 100)}% of today's habits`
              : 'Create your first habit'
          }
          tone="sage"
        />
        <StatCard
          icon={Flame}
          label="Best live streak"
          value={`${data.summary.bestStreak}d`}
          hint="Longest current habit streak"
          tone="clay"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg consistency"
          value={`${data.summary.averageConsistency}%`}
          hint={`Across the last ${dates.length} days`}
          tone="gold"
        />
      </div>

      <section className="card px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-forest-900/[0.05] pb-3">
          <div>
            <p className="eyebrow">Consistency grid</p>
            <p className="mt-1 text-xs text-ink-muted">
              {view === 'week' ? 'Tap any day to check or uncheck it.' : 'Each square is a day. Hover for the date.'}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-ink-muted">
            <span>{formatDateMedium(dates[0])}</span>
            <span className="h-px w-4 bg-sand" />
            <span>{formatDateMedium(dates[dates.length - 1])}</span>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {habits.length ? (
            habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                dates={dates}
                today={today}
                onToggle={toggle}
                onEdit={(item) => setModal({ open: true, habit: item })}
                onDelete={setDeleteHabit}
              />
            ))
          ) : (
            <EmptyState
              icon={Sparkles}
              title="Your habit garden is empty"
              description="Start with one small habit you can keep tomorrow. Consistency grows from there."
              action={
                <Button size="sm" onClick={() => setModal({ open: true, habit: null })}>
                  <Plus size={13} /> Add your first habit
                </Button>
              }
            />
          )}
        </div>
      </section>

      <div className="rounded-2xl border border-forest-900/[0.06] bg-cream-200/40 px-4 py-3 text-[11px] leading-relaxed text-ink-muted">
        Habit streaks stay alive while today is still open: if you completed yesterday, your streak
        is shown until the day ends. One missed day breaks it. The longest streak is always preserved.
      </div>

      <HabitModal
        open={modal.open}
        habit={modal.habit}
        onClose={() => setModal({ open: false, habit: null })}
        onSaved={() => state.refresh({ silent: true }).catch(() => {})}
      />

      <ConfirmDialog
        open={Boolean(deleteHabit)}
        onClose={() => setDeleteHabit(null)}
        onConfirm={remove}
        loading={working}
        title="Remove this habit?"
        description={
          deleteHabit
            ? `“${deleteHabit.name}” will disappear from future tracking. Its completed history remains in your database.`
            : ''
        }
        confirmLabel="Remove habit"
      />
    </div>
  );
}

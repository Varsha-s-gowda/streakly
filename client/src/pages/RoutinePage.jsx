import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  CalendarDays,
  CheckCheck,
  ClipboardList,
  Clock3,
  ListChecks,
  MoonStar,
  Pencil,
  Plus,
  Repeat2,
  StickyNote,
  Target,
  Trash2,
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { useApi, useToday } from '../hooks/useApi.js';
import { api } from '../lib/api.js';
import {
  formatDateLong,
  formatMinutes,
  formatTime,
  relativeDay,
} from '../lib/dates.js';
import { PRIORITIES } from '../lib/constants.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { DateNavigator } from '../components/DateNavigator.jsx';
import { RoutineChecklist } from '../components/routine/RoutineChecklist.jsx';
import { ProgressBar, ProgressRing } from '../components/ui/Progress.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { PageSkeleton } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { TaskFormModal } from '../components/tasks/TaskFormModal.jsx';
import { SessionForm } from '../components/interview/SessionForm.jsx';
import { cn } from '../lib/cn.js';

export function RoutinePage() {
  const toast = useToast();
  const today = useToday();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDate = searchParams.get('date');
  const initialDate = requestedDate && requestedDate <= today ? requestedDate : today;
  const [date, setDate] = useState(initialDate);

  useEffect(() => {
    if (date > today) setDate(today);
  }, [today, date]);

  useEffect(() => {
    if (date === today) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ date }, { replace: true });
    }
  }, [date, today, setSearchParams]);

  const dayState = useApi(() => api.get(`/day?date=${date}`), [date]);
  const taskState = useApi(() => api.get('/tasks'), [today]);
  const [taskModal, setTaskModal] = useState({ open: false, task: null });
  const [deleteTask, setDeleteTask] = useState(null);
  const [deleteSession, setDeleteSession] = useState(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [working, setWorking] = useState(false);

  const data = dayState.data;
  const tasks = taskState.data?.tasks || [];
  const isToday = date === today;

  const handleToggle = async (activity, completed) => {
    if (!data) return;
    const snapshot = data;
    dayState.setData({
      ...data,
      activities: data.activities.map((item) =>
        item.id === activity.id ? { ...item, completed } : item,
      ),
    });
    try {
      const result = await api.patch(`/day/${date}/activities/${activity.id}`, { completed });
      dayState.setData({ ...result.day, streaks: result.streaks });
      if (!isToday) toast.info('Historical record updated and streaks recalculated.');
    } catch (err) {
      dayState.setData(snapshot);
      toast.error(err.message || 'Could not update that activity.');
    }
  };

  const handleNotes = async (activityId, notes) => {
    try {
      const result = await api.patch(`/day/${date}/activities/${activityId}`, { notes });
      dayState.setData({ ...result.day, streaks: result.streaks });
      toast.success('Note saved.');
    } catch (err) {
      toast.error(err.message || 'Could not save that note.');
    }
  };

  const markAll = async () => {
    setWorking(true);
    try {
      const result = await api.post(`/day/${date}/complete-all`, { completed: true });
      dayState.setData({ ...result.day, streaks: result.streaks });
      toast.success('Every activity has been marked complete.');
      setConfirmAll(false);
    } catch (err) {
      toast.error(err.message || 'Could not complete the day.');
    } finally {
      setWorking(false);
    }
  };

  const refreshAfterTaskChange = () => {
    taskState.refresh({ silent: true }).catch(() => {});
    dayState.refresh({ silent: true }).catch(() => {});
  };

  const removeTask = async () => {
    if (!deleteTask) return;
    setWorking(true);
    try {
      await api.delete(`/tasks/${deleteTask.id}`);
      toast.success('Custom task removed. Past records are preserved.');
      setDeleteTask(null);
      refreshAfterTaskChange();
    } catch (err) {
      toast.error(err.message || 'Could not delete this task.');
    } finally {
      setWorking(false);
    }
  };

  const reschedule = async (task) => {
    try {
      const result = await api.post(`/tasks/${task.id}/reschedule`, {});
      toast.success(
        result.created
          ? 'A one-time copy has been scheduled for tomorrow.'
          : 'Task moved to tomorrow.',
      );
      refreshAfterTaskChange();
    } catch (err) {
      toast.error(err.message || 'Could not reschedule this task.');
    }
  };

  const removeSession = async () => {
    if (!deleteSession) return;
    setWorking(true);
    try {
      await api.delete(`/interview/sessions/${deleteSession.id}`);
      toast.success('Study session removed.');
      setDeleteSession(null);
      dayState.refresh({ silent: true }).catch(() => {});
    } catch (err) {
      toast.error(err.message || 'Could not remove this session.');
    } finally {
      setWorking(false);
    }
  };

  const priorityMap = useMemo(
    () => Object.fromEntries(PRIORITIES.map((item) => [item.value, item])),
    [],
  );

  if (dayState.loading && !data) return <PageSkeleton />;

  if (dayState.error && !data) {
    return (
      <div className="card mx-auto mt-10 max-w-lg px-6 py-10 text-center">
        <p className="font-display text-xl text-forest-800">This day could not load</p>
        <p className="mt-2 text-sm text-ink-muted">{dayState.error.message}</p>
        <Button className="mt-5" onClick={() => dayState.refresh()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!data) return null;
  const stats = data.stats;
  const allComplete = stats.isComplete;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily routine"
        title={isToday ? 'Today, one activity at a time.' : relativeDay(date, today)}
        description={
          isToday
            ? 'Your complete 8 AM to midnight rhythm. Tick what is done, add a note, and keep the day honest.'
            : `${formatDateLong(date)} — reviewing and editing the historical record.`
        }
        actions={<DateNavigator date={date} today={today} onChange={setDate} />}
      />

      {!isToday ? (
        <div className="flex items-start gap-2.5 rounded-2xl border border-sand bg-cream-200/50 px-4 py-3 text-xs leading-relaxed text-ink-soft">
          <Clock3 size={15} className="mt-0.5 shrink-0 text-gold" />
          <p>
            You are editing a past day. Every change is saved and streak calculations are updated
            immediately. Historical records are never deleted.
          </p>
        </div>
      ) : null}

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-4">
            <ProgressRing value={stats.completionPercent} size={92} stroke={7} tone={allComplete ? 'sage' : 'forest'}>
              <span className="font-display text-[22px] leading-none text-forest-800">
                {stats.completionPercent}%
              </span>
              <span className="text-[8px] uppercase tracking-[0.14em] text-ink-muted">complete</span>
            </ProgressRing>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[19px] font-semibold text-forest-800">
                  {allComplete ? 'A fully kept day' : `${stats.completedActivities} of ${stats.totalActivities} complete`}
                </h2>
                <Badge tone={allComplete ? 'sage' : 'gold'} dot>
                  {allComplete ? 'Streak alive' : `${stats.totalActivities - stats.completedActivities} left`}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {stats.requiredCompleted}/{stats.requiredTotal} required activities · {formatMinutes(data.studyMinutes)} studied today
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {!allComplete ? (
                  <Button size="sm" variant="soft" onClick={() => setConfirmAll(true)}>
                    <CheckCheck size={13} /> Mark all complete
                  </Button>
                ) : (
                  <Link to={`/journal?date=${date}`}>
                    <Button size="sm" variant="soft">
                      <MoonStar size={13} /> Reflect on this day
                    </Button>
                  </Link>
                )}
                <Link
                  to={`/journal?date=${date}`}
                  className="text-[11px] font-medium text-sage-700 hover:underline"
                >
                  Open journal
                </Link>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl bg-cream-100/70 px-3 py-2.5 text-center">
              <Target size={14} className="mx-auto text-sage-600" />
              <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-muted">Required</p>
              <p className="text-sm font-semibold text-forest-800">
                {stats.requiredCompleted}/{stats.requiredTotal}
              </p>
            </div>
            <div className="rounded-xl bg-cream-100/70 px-3 py-2.5 text-center">
              <Clock3 size={14} className="mx-auto text-gold" />
              <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-muted">Study</p>
              <p className="text-sm font-semibold text-forest-800">{formatMinutes(data.studyMinutes)}</p>
            </div>
            <div className="rounded-xl bg-cream-100/70 px-3 py-2.5 text-center">
              <ListChecks size={14} className="mx-auto text-forest-500" />
              <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-muted">Problems</p>
              <p className="text-sm font-semibold text-forest-800">{data.problemsSolved}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-forest-900/[0.05] px-5 py-3 sm:px-6">
          <ProgressBar value={stats.completionPercent} tone={allComplete ? 'sage' : 'forest'} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]">
        <section className="card p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2 px-1">
            <div>
              <p className="eyebrow">The full schedule</p>
              <h2 className="mt-1 text-[20px] font-semibold text-forest-800">Activities for {relativeDay(date, today).toLowerCase()}</h2>
            </div>
            <p className="text-[11px] text-ink-muted">
              {stats.completedActivities}/{stats.totalActivities} complete
            </p>
          </div>
          <RoutineChecklist
            activities={data.activities}
            onToggle={handleToggle}
            onNotes={handleNotes}
          />
        </section>

        <div className="space-y-5">
          <section className="card px-4 py-4 sm:px-5">
            <div className="mb-1 flex items-center justify-between">
              <div>
                <p className="eyebrow">Study log</p>
                <h2 className="mt-1 text-[17px] font-semibold text-forest-800">Record study time</h2>
              </div>
              <span className="rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-medium text-sage-700">
                {formatMinutes(data.studyMinutes)}
              </span>
            </div>
            <p className="mb-4 mt-1 text-[11px] leading-relaxed text-ink-muted">
              Study minutes power your analytics, interview targets, and calendar.
            </p>
            <SessionForm
              today={date <= today ? date : today}
              onSaved={() => dayState.refresh({ silent: true }).catch(() => {})}
              showTopic={false}
            />
            {data.sessions?.length ? (
              <div className="mt-4 space-y-2 border-t border-forest-900/[0.05] pt-4">
                <p className="eyebrow">Logged sessions</p>
                {data.sessions.map((session) => (
                  <div key={session.id} className="rounded-xl bg-cream-100/60 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-ink">{session.subject}</p>
                        <p className="mt-0.5 text-[10px] text-ink-muted">
                          {formatMinutes(session.minutes)} · {session.problemsSolved} problems
                        </p>
                        {session.difficultQuestions ? (
                          <p className="mt-1 line-clamp-2 text-[10px] italic text-ink-muted">
                            “{session.difficultQuestions}”
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setDeleteSession(session)}
                        className="rounded p-1 text-ink-muted/60 transition hover:bg-white hover:text-clay"
                        aria-label="Delete study session"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section className="card px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Task management</p>
                <h2 className="mt-1 text-[17px] font-semibold text-forest-800">Custom tasks</h2>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                  Add focus tasks alongside your default routine. Default activities always remain.
                </p>
              </div>
              <Button size="sm" variant="soft" onClick={() => setTaskModal({ open: true, task: null })}>
                <Plus size={13} /> Add
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {tasks.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="No custom tasks yet"
                  description="Your standard routine is already here. Add anything extra you want to keep an eye on."
                />
              ) : (
                tasks.map((task) => {
                  const priority = priorityMap[task.priority] || priorityMap.medium;
                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-forest-900/[0.05] bg-cream-50/50 px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-medium leading-snug text-ink">
                            {task.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-ink-muted">
                            <span className="flex items-center gap-1">
                              <Clock3 size={10} /> {formatTime(task.scheduledTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Repeat2 size={10} />
                              {task.recurrence === 'once'
                                ? task.date
                                : task.recurrence === 'weekdays'
                                  ? 'Weekdays'
                                  : 'Daily'}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className={cn('h-1.5 w-1.5 rounded-full', priority.dot)} />
                              {priority.label}
                            </span>
                            {task.required ? (
                              <span className="font-medium text-sage-700">Streak</span>
                            ) : (
                              <span>Optional</span>
                            )}
                          </div>
                          {task.description ? (
                            <p className="mt-1 line-clamp-1 text-[10px] text-ink-muted">
                              {task.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => setTaskModal({ open: true, task })}
                            className="rounded p-1.5 text-ink-muted transition hover:bg-white hover:text-ink"
                            title="Edit task"
                            aria-label={`Edit ${task.title}`}
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => reschedule(task)}
                            className="rounded p-1.5 text-ink-muted transition hover:bg-white hover:text-sage-700"
                            title="Move to tomorrow"
                            aria-label={`Reschedule ${task.title}`}
                          >
                            <CalendarClock size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTask(task)}
                            className="rounded p-1.5 text-ink-muted transition hover:bg-white hover:text-clay"
                            title="Delete task"
                            aria-label={`Delete ${task.title}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-ink-muted">
              <StickyNote size={11} className="mt-0.5 shrink-0" />
              Rescheduling an incomplete recurring task creates a one-time copy for tomorrow.
            </p>
          </section>

          <section className="rounded-2xl border border-forest-900/[0.06] bg-cream-200/40 px-4 py-3.5">
            <div className="flex items-start gap-2.5">
              <CalendarDays size={15} className="mt-0.5 shrink-0 text-sage-600" />
              <div>
                <p className="text-xs font-medium text-forest-800">Looking for your history?</p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                  Past days, streaks, and study hours live in Calendar & Streaks.
                </p>
                <Link to="/calendar" className="mt-1.5 inline-block text-[11px] font-medium text-sage-700 hover:underline">
                  Open calendar
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>

      <TaskFormModal
        open={taskModal.open}
        task={taskModal.task}
        today={today}
        onClose={() => setTaskModal({ open: false, task: null })}
        onSaved={refreshAfterTaskChange}
      />

      <ConfirmDialog
        open={Boolean(deleteTask)}
        onClose={() => setDeleteTask(null)}
        onConfirm={removeTask}
        loading={working}
        title="Delete this custom task?"
        description={deleteTask ? `“${deleteTask.title}” will no longer appear in future routines.` : ''}
        confirmLabel="Delete task"
      />

      <ConfirmDialog
        open={Boolean(deleteSession)}
        onClose={() => setDeleteSession(null)}
        onConfirm={removeSession}
        loading={working}
        title="Remove study session?"
        description={
          deleteSession
            ? `${deleteSession.minutes} minutes of ${deleteSession.subject} will be removed from your records.`
            : ''
        }
        confirmLabel="Remove session"
      />

      <ConfirmDialog
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        onConfirm={markAll}
        loading={working}
        danger={false}
        title="Mark every activity complete?"
        description={`This will check all ${stats.totalActivities} activities for ${formatDateLong(date)}.`}
        confirmLabel="Complete the day"
      />
    </div>
  );
}

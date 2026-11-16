import { useMemo, useState } from 'react';
import {
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Plus,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { useApi, useToday } from '../hooks/useApi.js';
import { api } from '../lib/api.js';
import { formatDateMedium, formatMinutes } from '../lib/dates.js';
import { INTERVIEW_SUBJECTS, TOPIC_STATUSES } from '../lib/constants.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { Button } from '../components/ui/Button.jsx';
import { PageSkeleton } from '../components/ui/Spinner.jsx';
import { ProgressBar, ProgressRing } from '../components/ui/Progress.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ConfirmDialog } from '../components/ui/Modal.jsx';
import { TopicModal, TopicTree, TargetEditor } from '../components/interview/TopicTree.jsx';
import { SessionForm } from '../components/interview/SessionForm.jsx';
import { cn } from '../lib/cn.js';

export function InterviewPage() {
  const toast = useToast();
  const today = useToday();
  const state = useApi(() => api.get('/interview'), [today]);
  const [selectedSubject, setSelectedSubject] = useState(INTERVIEW_SUBJECTS[0]);
  const [topicModal, setTopicModal] = useState({ open: false, topic: null, parent: null });
  const [deleteTopic, setDeleteTopic] = useState(null);
  const [deleteSession, setDeleteSession] = useState(null);
  const [working, setWorking] = useState(false);

  const data = state.data;
  const subjects = data?.subjects || [];
  const selected = subjects.find((subject) => subject.subject === selectedSubject) || subjects[0];
  const subjectTopics = useMemo(
    () => (data?.topics || []).filter((topic) => topic.subject === selected?.subject),
    [data?.topics, selected?.subject],
  );

  const refresh = () => state.refresh({ silent: true }).catch(() => {});

  const toggleTopic = async (topic) => {
    const status = topic.status === 'completed' ? 'not-started' : 'completed';
    try {
      await api.patch(`/interview/topics/${topic.id}`, { status });
      refresh();
    } catch (err) {
      toast.error(err.message || 'Could not update this topic.');
    }
  };

  const removeTopic = async () => {
    if (!deleteTopic) return;
    setWorking(true);
    try {
      await api.delete(`/interview/topics/${deleteTopic.id}`);
      toast.success('Topic removed.');
      setDeleteTopic(null);
      refresh();
    } catch (err) {
      toast.error(err.message || 'Could not remove this topic.');
    } finally {
      setWorking(false);
    }
  };

  const removeSession = async () => {
    if (!deleteSession) return;
    setWorking(true);
    try {
      await api.delete(`/interview/sessions/${deleteSession.id}`);
      toast.success('Study session removed.');
      setDeleteSession(null);
      refresh();
    } catch (err) {
      toast.error(err.message || 'Could not remove this session.');
    } finally {
      setWorking(false);
    }
  };

  if (state.loading && !data) return <PageSkeleton />;

  if (state.error && !data) {
    return (
      <div className="card mx-auto mt-10 max-w-lg px-6 py-10 text-center">
        <p className="font-display text-xl text-forest-800">Interview preparation could not load</p>
        <p className="mt-2 text-sm text-ink-muted">{state.error.message}</p>
        <Button className="mt-5" onClick={() => state.refresh()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!data || !selected) return null;
  const summary = data.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Interview preparation"
        title="Prepare with intention, not panic."
        description="Build subject depth one topic at a time. Record every focused hour, every solved problem, and every difficult question."
        actions={
          <Button
            onClick={() =>
              setTopicModal({ open: true, topic: null, parent: null })
            }
          >
            <Plus size={15} /> Add topic
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          label="Topics completed"
          value={`${summary.topicsCompleted}/${summary.topicsTotal}`}
          hint={`${summary.progress}% of your topic map`}
          tone="sage"
        />
        <StatCard
          icon={TrendingUp}
          label="Preparation progress"
          value={`${summary.progress}%`}
          hint={`${summary.topicsInProgress} topics in progress`}
          tone="forest"
        />
        <StatCard
          icon={BookOpenCheck}
          label="Study this week"
          value={formatMinutes(summary.weekMinutes)}
          hint={`${formatMinutes(summary.todayMinutes)} logged today`}
          tone="gold"
        />
        <StatCard
          icon={Target}
          label="Problems solved"
          value={summary.totalProblems}
          hint={`${summary.totalSessions} study sessions recorded`}
          tone="clay"
        />
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="eyebrow">Subject map</p>
            <h2 className="mt-1 text-[20px] font-semibold text-forest-800">Fourteen subjects. One clear view.</h2>
          </div>
          <p className="text-[11px] text-ink-muted">Select a subject to work on its topics and targets.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {subjects.map((subject) => {
            const isSelected = selected.subject === subject.subject;
            return (
              <button
                key={subject.subject}
                type="button"
                onClick={() => setSelectedSubject(subject.subject)}
                className={cn(
                  'group rounded-2xl border px-4 py-3.5 text-left transition',
                  isSelected
                    ? 'border-sage-400 bg-sage-50/80 shadow-soft'
                    : 'border-forest-900/[0.06] bg-white/70 hover:border-sage-300 hover:bg-white',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12.5px] font-semibold leading-snug text-forest-800">
                    {subject.subject}
                  </p>
                  <span className="shrink-0 text-[11px] font-semibold text-sage-700">
                    {subject.progress}%
                  </span>
                </div>
                <ProgressBar
                  value={subject.progress}
                  height="h-1.5"
                  tone={subject.progress === 100 ? 'sage' : 'forest'}
                  className="mt-2.5"
                />
                <div className="mt-2 flex items-center justify-between text-[10px] text-ink-muted">
                  <span>
                    {subject.topicsCompleted}/{subject.topicsTotal} topics
                  </span>
                  <span>{formatMinutes(subject.studyMinutesWeek)} this week</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <div className="h-1 flex-1 rounded-full bg-forest-900/[0.06]">
                    <div
                      className="h-1 rounded-full bg-sage-400/80"
                      style={{ width: `${subject.dailyProgress}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-ink-muted">
                    {subject.studyMinutesToday}/{subject.targetDailyMinutes}m today
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.85fr)]">
        <section className="card p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-forest-900/[0.05] pb-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-100 text-forest-600">
                <BriefcaseBusiness size={18} />
              </span>
              <div>
                <p className="eyebrow">Current subject</p>
                <h2 className="mt-0.5 text-[19px] font-semibold text-forest-800">{selected.subject}</h2>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  {selected.topicsTotal} topics · {selected.topicsCompleted} completed · {selected.progress}% prepared
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="soft"
              onClick={() => setTopicModal({ open: true, topic: null, parent: null })}
            >
              <Plus size={13} /> Topic
            </Button>
          </div>

          <div className="mt-3">
            <TopicTree
              topics={subjectTopics}
              onToggle={toggleTopic}
              onEdit={(topic) => setTopicModal({ open: true, topic, parent: null })}
              onDelete={setDeleteTopic}
              onAddSubtopic={(topic) =>
                setTopicModal({ open: true, topic: null, parent: topic })
              }
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-forest-900/[0.05] pt-3">
            {TOPIC_STATUSES.map((status) => {
              const count = subjectTopics.filter((topic) => topic.status === status.value).length;
              return (
                <span
                  key={status.value}
                  className="rounded-full bg-cream-100 px-2.5 py-1 text-[10px] text-ink-muted"
                >
                  {status.label}: <strong className="text-ink">{count}</strong>
                </span>
              );
            })}
          </div>
        </section>

        <div className="space-y-5">
          <section className="card px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="eyebrow">Targets</p>
                <h2 className="mt-1 text-[17px] font-semibold text-forest-800">Study targets</h2>
              </div>
              <ProgressRing value={selected.weeklyProgress} size={54} stroke={5} tone="sage">
                <span className="text-[10px] font-semibold text-forest-800">{selected.weeklyProgress}%</span>
              </ProgressRing>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-muted">
              <span>{formatMinutes(selected.studyMinutesToday)} today</span>
              <span className="h-1 w-1 rounded-full bg-sand" />
              <span>{formatMinutes(selected.studyMinutesWeek)} this week</span>
            </div>
            <div className="mt-3">
              <TargetEditor
                subject={selected.subject}
                target={{
                  dailyMinutes: selected.targetDailyMinutes,
                  weeklyMinutes: selected.targetWeeklyMinutes,
                }}
                onSaved={refresh}
              />
            </div>
          </section>

          <section className="card px-4 py-4 sm:px-5">
            <div>
              <p className="eyebrow">Record a session</p>
              <h2 className="mt-1 text-[17px] font-semibold text-forest-800">Log study time</h2>
            </div>
            <div className="mt-4">
              <SessionForm
                topics={data.topics}
                defaultSubject={selected.subject}
                today={today}
                onSaved={refresh}
              />
            </div>
          </section>
        </div>
      </div>

      <section className="card px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="eyebrow">Recent work</p>
            <h2 className="mt-1 text-[18px] font-semibold text-forest-800">Study sessions</h2>
          </div>
          <Badge tone="cream">{data.recentSessions.length} latest</Badge>
        </div>
        {data.recentSessions.length ? (
          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            {data.recentSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-xl border border-forest-900/[0.05] bg-cream-50/50 px-3.5 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-[12.5px] font-medium text-ink">{session.subject}</p>
                      <span className="rounded-full bg-sage-100 px-1.5 py-0.5 text-[9px] font-medium text-sage-700">
                        {formatMinutes(session.minutes)}
                      </span>
                      {session.problemsSolved ? (
                        <span className="text-[9px] text-ink-muted">
                          {session.problemsSolved} problems
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[10px] text-ink-muted">
                      {formatDateMedium(session.date)}
                      {session.topicTitle ? ` · ${session.topicTitle}` : ''}
                    </p>
                    {session.difficultQuestions ? (
                      <p className="mt-1 line-clamp-2 text-[10px] italic leading-relaxed text-ink-muted">
                        Difficult: “{session.difficultQuestions}”
                      </p>
                    ) : null}
                    {session.notes ? (
                      <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-ink-muted">
                        {session.notes}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteSession(session)}
                    className="rounded p-1 text-ink-muted/50 transition hover:bg-white hover:text-clay"
                    aria-label="Delete study session"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-cream-100/60 px-4 py-6 text-center text-xs text-ink-muted">
            No study sessions yet. Log your first focused hour above — it will appear here, in
            analytics, and on your calendar.
          </p>
        )}
      </section>

      <TopicModal
        open={topicModal.open}
        onClose={() => setTopicModal({ open: false, topic: null, parent: null })}
        subject={selected.subject}
        topic={topicModal.topic}
        parent={topicModal.parent}
        onSaved={refresh}
      />

      <ConfirmDialog
        open={Boolean(deleteTopic)}
        onClose={() => setDeleteTopic(null)}
        onConfirm={removeTopic}
        loading={working}
        title="Remove this topic?"
        description={
          deleteTopic
            ? `“${deleteTopic.title}” and any subtopics will be removed from your topic map. Logged study sessions stay intact.`
            : ''
        }
        confirmLabel="Remove topic"
      />

      <ConfirmDialog
        open={Boolean(deleteSession)}
        onClose={() => setDeleteSession(null)}
        onConfirm={removeSession}
        loading={working}
        title="Remove study session?"
        description={
          deleteSession
            ? `${deleteSession.minutes} minutes from ${formatDateMedium(deleteSession.date)} will be removed from your study history.`
            : ''
        }
        confirmLabel="Remove session"
      />
    </div>
  );
}

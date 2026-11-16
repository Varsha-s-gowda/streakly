import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpenCheck,
  CheckCircle2,
  NotebookPen,
  Save,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { useApi, useToday } from '../hooks/useApi.js';
import { useJournalDraft } from '../hooks/useJournalDraft.js';
import { api } from '../lib/api.js';
import {
  formatDateLong,
  formatDateMedium,
  relativeDay,
} from '../lib/dates.js';
import {
  GRATITUDE_FIELDS,
  MANIFESTATION_FIELDS,
  REFLECTION_FIELDS,
} from '../lib/constants.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { DateNavigator } from '../components/DateNavigator.jsx';
import { SaveStatus, JournalFieldGroup, JournalNavButton } from '../components/journal/JournalFields.jsx';
import { CompletionReview } from '../components/journal/CompletionReview.jsx';
import { Button } from '../components/ui/Button.jsx';
import { PageSkeleton, LoadingBlock } from '../components/ui/Spinner.jsx';
import { Textarea } from '../components/ui/Field.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

function entrySnippet(entry) {
  const candidates = [
    entry.achievements,
    entry.gratitude?.gratefulFor,
    entry.reflection?.accomplished,
    entry.reflection?.learned,
    entry.manifestation?.affirmations,
  ];
  return candidates.find((value) => value?.trim())?.trim() || 'A quiet entry.';
}

export function JournalPage() {
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
    if (date === today) setSearchParams({}, { replace: true });
    else setSearchParams({ date }, { replace: true });
  }, [date, today, setSearchParams]);

  const entriesState = useApi(() => api.get('/journal/entries?limit=40'), []);
  const dayState = useApi(() => api.get(`/day?date=${date}`), [date]);
  const draft = useJournalDraft(date, {
    onSaved: () => entriesState.refresh({ silent: true }).catch(() => {}),
  });

  useEffect(() => {
    if (draft.saveState === 'error') {
      toast.error('Your reflection could not be saved. Please use “Save now”.');
    }
  }, [draft.saveState, toast]);

  const entries = entriesState.data?.entries || [];
  const day = dayState.data;
  const isToday = date === today;

  const stats = useMemo(() => {
    return {
      total: entries.length,
      gratitude: entries.filter((entry) => entry.hasGratitude).length,
      manifestation: entries.filter((entry) => entry.hasManifestation).length,
    };
  }, [entries]);

  const changeDate = async (nextDate) => {
    if (nextDate === date) return;
    if (draft.dirty) {
      try {
        await draft.saveNow();
      } catch {
        toast.error('The current entry could not be saved. Please try again before moving on.');
        return;
      }
    }
    setDate(nextDate);
  };

  const handleToggle = async (activity, completed) => {
    if (!day) return;
    const snapshot = day;
    dayState.setData({
      ...day,
      activities: day.activities.map((item) =>
        item.id === activity.id ? { ...item, completed } : item,
      ),
    });
    try {
      const result = await api.patch(`/day/${date}/activities/${activity.id}`, { completed });
      dayState.setData(result.day);
    } catch (err) {
      dayState.setData(snapshot);
      toast.error(err.message || 'Could not update that activity.');
    }
  };

  const saveNow = async () => {
    try {
      await draft.saveNow({ force: true });
      toast.success('Reflection saved.');
    } catch {
      /* The inline save status already communicates the error. */
    }
  };

  if (draft.loading && !entriesState.data) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Journal & gratitude"
        title={isToday ? 'Close the day with honesty.' : `${relativeDay(date, today)}’s reflection.`}
        description="Completion review, gratitude, lessons, and the quiet work of becoming. Everything saves by date."
        actions={<DateNavigator date={date} today={today} onChange={changeDate} />}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-forest-900/[0.06] bg-white/70 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <SaveStatus state={draft.saveState} savedAt={draft.savedAt} />
          <span className="hidden h-3 w-px bg-sand sm:block" />
          <span className="text-[11px] text-ink-muted">
            {formatDateLong(date)} · {isToday ? 'tonight' : 'past entry'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {draft.dirty ? <Badge tone="gold">Unsaved</Badge> : <Badge tone="sage">In sync</Badge>}
          <Button size="sm" variant="secondary" onClick={saveNow}>
            <Save size={13} /> Save now
          </Button>
        </div>
      </div>

      {draft.error && draft.saveState === 'error' ? (
        <p className="rounded-xl border border-[#E9CDC1] bg-[#FAEFEA] px-3 py-2.5 text-xs text-[#834932]">
          {draft.error.message}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-forest-700 text-[10px] font-semibold text-cream-50">
                A
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                Daily completion review
              </p>
            </div>
            {dayState.loading && !day ? (
              <div className="card">
                <LoadingBlock label="Reviewing today’s activities…" />
              </div>
            ) : day ? (
              <CompletionReview
                day={day}
                onToggle={handleToggle}
                disabled={dayState.loading}
                title="Tick off the day — honestly."
              />
            ) : (
              <p className="card px-5 py-5 text-sm text-ink-muted">This day could not be loaded.</p>
            )}
          </div>

          <section className="card overflow-hidden">
            <div className="flex items-start gap-3 border-b border-forest-900/[0.05] px-5 py-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4EAD3] text-[#8B6E30]">
                <CheckCircle2 size={17} />
              </span>
              <div>
                <h2 className="text-[17px] font-semibold text-forest-800">What I achieved today</h2>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Record the real wins — completed work, brave moments, tiny progress.
                </p>
              </div>
            </div>
            <div className="px-5 py-4">
              <Textarea
                rows={3}
                value={draft.form.achievements}
                onChange={(event) => draft.updateAchievements(event.target.value)}
                placeholder="Today I showed up by…"
                maxLength={5000}
              />
            </div>
          </section>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-forest-700 text-[10px] font-semibold text-cream-50">
                B
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                Gratitude journal
              </p>
            </div>
            <JournalFieldGroup
              icon={Sun}
              title="B · Gratitude journal"
              description="Notice what was good. Gratitude makes a full day feel fuller."
              fields={GRATITUDE_FIELDS}
              values={draft.form.gratitude}
              onChange={(key, value) => draft.updateGroup('gratitude', key, value)}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-forest-700 text-[10px] font-semibold text-cream-50">
                C
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                Daily journaling
              </p>
            </div>
            <JournalFieldGroup
              icon={BookOpenCheck}
              title="C · Daily journaling"
              description="Learn from the day without turning reflection into punishment."
              fields={REFLECTION_FIELDS}
              values={draft.form.reflection}
              onChange={(key, value) => draft.updateGroup('reflection', key, value)}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-forest-700 text-[10px] font-semibold text-cream-50">
                D
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                Manifestation & affirmations
              </p>
            </div>
            <JournalFieldGroup
              icon={Sparkles}
              title="D · Manifestation & affirmations"
              description="Speak about your future as if you are already becoming that person."
              fields={MANIFESTATION_FIELDS}
              values={draft.form.manifestation}
              onChange={(key, value) => draft.updateGroup('manifestation', key, value)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-forest-800 px-5 py-4 text-cream-100">
            <div>
              <p className="font-display text-[17px] text-cream-50">Seal the day.</p>
              <p className="mt-0.5 text-[11px] text-cream-200/50">
                Auto-saved by date. You can return and edit any past entry.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="bg-cream-100 text-forest-800"
              onClick={saveNow}
            >
              <Save size={13} /> Save now
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="card px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Your archive</p>
                <h2 className="mt-1 text-[17px] font-semibold text-forest-800">Previous reflections</h2>
              </div>
              <NotebookPen size={16} className="text-sage-600" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-cream-100/70 px-2 py-2 text-center">
                <p className="font-display text-lg leading-none text-forest-800">{stats.total}</p>
                <p className="mt-0.5 text-[8px] uppercase tracking-wide text-ink-muted">entries</p>
              </div>
              <div className="rounded-lg bg-cream-100/70 px-2 py-2 text-center">
                <p className="font-display text-lg leading-none text-forest-800">{stats.gratitude}</p>
                <p className="mt-0.5 text-[8px] uppercase tracking-wide text-ink-muted">gratitude</p>
              </div>
              <div className="rounded-lg bg-cream-100/70 px-2 py-2 text-center">
                <p className="font-display text-lg leading-none text-forest-800">{stats.manifestation}</p>
                <p className="mt-0.5 text-[8px] uppercase tracking-wide text-ink-muted">manifest</p>
              </div>
            </div>
            <div className="mt-3 max-h-[460px] space-y-1 overflow-y-auto pr-1">
              {entries.length ? (
                entries.map((entry) => (
                  <JournalNavButton
                    key={entry.id}
                    active={entry.date === date}
                    date={formatDateMedium(entry.date)}
                    title={entry.hasContent ? 'Reflection saved' : 'Empty entry'}
                    snippet={entrySnippet(entry)}
                    onClick={() => changeDate(entry.date)}
                  />
                ))
              ) : (
                <EmptyState
                  icon={NotebookPen}
                  title="No entries yet"
                  description="Tonight can be the first page."
                  className="py-8"
                />
              )}
            </div>
          </section>

          <section className="card px-4 py-4">
            <p className="eyebrow">Related</p>
            <div className="mt-2 space-y-2">
              <Link
                to="/manifestation"
                className="flex items-center gap-2 rounded-xl bg-cream-100/60 px-3 py-2.5 text-xs font-medium text-ink-soft transition hover:bg-sage-50 hover:text-sage-700"
              >
                <Sparkles size={14} /> Manifestation space
              </Link>
              <Link
                to="/calendar"
                className="flex items-center gap-2 rounded-xl bg-cream-100/60 px-3 py-2.5 text-xs font-medium text-ink-soft transition hover:bg-sage-50 hover:text-sage-700"
              >
                <BookOpenCheck size={14} /> Calendar & history
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

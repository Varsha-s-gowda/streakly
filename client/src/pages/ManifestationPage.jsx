import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BookOpen, Quote, Save, Sparkles, Star } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { useApi, useToday } from '../hooks/useApi.js';
import { useJournalDraft } from '../hooks/useJournalDraft.js';
import { api } from '../lib/api.js';
import { formatDateLong, formatDateMedium, relativeDay } from '../lib/dates.js';
import { MANIFESTATION_FIELDS } from '../lib/constants.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { DateNavigator } from '../components/DateNavigator.jsx';
import { JournalFieldGroup, SaveStatus } from '../components/journal/JournalFields.jsx';
import { PageSkeleton } from '../components/ui/Spinner.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export function ManifestationPage() {
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

  const entriesState = useApi(
    () => api.get('/journal/entries?limit=30&manifestation=true'),
    [],
  );
  const draft = useJournalDraft(date, {
    onSaved: () => entriesState.refresh({ silent: true }).catch(() => {}),
  });

  useEffect(() => {
    if (draft.saveState === 'error') {
      toast.error('Your manifestation notes could not be saved. Please try again.');
    }
  }, [draft.saveState, toast]);

  const entries = entriesState.data?.entries || [];
  const manifestation = draft.form.manifestation;
  const hasManifestation = useMemo(
    () => Object.values(manifestation).some((value) => value.trim()),
    [manifestation],
  );

  const changeDate = async (nextDate) => {
    if (nextDate === date) return;
    if (draft.dirty) {
      try {
        await draft.saveNow();
      } catch {
        toast.error('Save the current page before moving to another date.');
        return;
      }
    }
    setDate(nextDate);
  };

  const saveNow = async () => {
    try {
      await draft.saveNow({ force: true });
      toast.success('Manifestation notes saved.');
    } catch {
      /* shown inline */
    }
  };

  if (draft.loading && !entriesState.data) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Manifestation & affirmations"
        title="Become the person you are practising to be."
        description="A private space for your vision, daily affirmations, and tomorrow’s intentions. Saved with the same daily reflection."
        actions={<DateNavigator date={date} today={today} onChange={changeDate} />}
      />

      <section className="relative overflow-hidden rounded-[28px] bg-forest-800 bg-grain px-5 py-6 text-cream-100 shadow-lift sm:px-8 sm:py-7">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-sage-300/10" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-sage-400/[0.08] blur-2xl" />
        <div className="relative grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-200/60">
              <Sparkles size={13} /> {relativeDay(date, today)}’s vision
            </div>
            <h2 className="mt-2.5 max-w-xl font-display text-[27px] leading-tight text-cream-50 sm:text-[32px]">
              {hasManifestation
                ? 'You are already becoming it.'
                : 'What are you calling into your life?'}
            </h2>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-cream-200/55">
              Write in the present tense. Let the words feel true enough to act on tomorrow.
            </p>
            <blockquote className="mt-4 max-w-xl border-l border-sage-300/30 pl-4 font-display text-[17px] leading-snug text-cream-100/90">
              <Quote size={14} className="mb-1 text-sage-300/50" />
              {manifestation.affirmations?.trim() ||
                manifestation.manifesting?.trim() ||
                '“I am building a life I do not need to escape from.”'}
            </blockquote>
          </div>
          <div className="hidden justify-self-end md:block">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-5 backdrop-blur-sm">
              <Star size={20} className="text-[#D8B77A]" />
              <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-cream-200/45">
                Tomorrow’s intention
              </p>
              <p className="mt-2 max-w-[220px] font-display text-[16px] leading-snug text-cream-50">
                {manifestation.tomorrowIntentions?.trim() || 'Choose one deliberate action.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-forest-900/[0.06] bg-white/70 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <SaveStatus state={draft.saveState} savedAt={draft.savedAt} />
          <span className="hidden h-3 w-px bg-sand sm:block" />
          <span className="text-[11px] text-ink-muted">{formatDateLong(date)}</span>
        </div>
        <div className="flex items-center gap-2">
          {draft.dirty ? <Badge tone="gold">Unsaved</Badge> : <Badge tone="sage">In sync</Badge>}
          <Button size="sm" variant="secondary" onClick={saveNow}>
            <Save size={13} /> Save now
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <div className="space-y-5">
          <JournalFieldGroup
            icon={Sparkles}
            title="Manifestation & affirmations"
            description="Your vision, your future self, and the words you will carry into tomorrow."
            fields={MANIFESTATION_FIELDS}
            values={manifestation}
            onChange={(key, value) => draft.updateGroup('manifestation', key, value)}
          />

          <div className="card px-5 py-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4EAD3] text-[#8B6E30]">
                <BookOpen size={17} />
              </span>
              <div>
                <h2 className="text-[17px] font-semibold text-forest-800">Then take one small action.</h2>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  Manifestation is clearest when it becomes a promise you can keep today. Finish
                  the reflection or return to your routine with one concrete next step.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to={`/journal?date=${date}`}>
                    <Button size="sm" variant="soft">
                      Open full journal <ArrowRight size={12} />
                    </Button>
                  </Link>
                  <Link to="/routine">
                    <Button size="sm" variant="ghost">
                      Today’s routine
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="card px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">Your becoming</p>
                <h2 className="mt-1 text-[17px] font-semibold text-forest-800">Manifestation history</h2>
              </div>
              <Badge tone="cream">{entries.length} entries</Badge>
            </div>
            <div className="mt-3 max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {entries.length ? (
                entries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => changeDate(entry.date)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      entry.date === date
                        ? 'border-sage-300 bg-sage-50'
                        : 'border-forest-900/[0.05] bg-cream-50/40 hover:border-sage-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-sage-700">
                        {formatDateMedium(entry.date)}
                      </span>
                      <Sparkles size={11} className="text-gold" />
                    </div>
                    {entry.manifestation?.manifesting ? (
                      <p className="mt-1.5 line-clamp-2 text-[11.5px] font-medium leading-snug text-ink">
                        {entry.manifestation.manifesting}
                      </p>
                    ) : null}
                    {entry.manifestation?.affirmations ? (
                      <p className="mt-1 line-clamp-2 text-[10.5px] italic leading-snug text-ink-muted">
                        {entry.manifestation.affirmations}
                      </p>
                    ) : null}
                    {entry.manifestation?.becomingPerson ? (
                      <p className="mt-1 line-clamp-1 text-[10px] text-ink-muted">
                        {entry.manifestation.becomingPerson}
                      </p>
                    ) : null}
                  </button>
                ))
              ) : (
                <EmptyState
                  icon={Sparkles}
                  title="Your vision starts here"
                  description="Write what you are manifesting tonight. It will join the timeline."
                  className="py-8"
                />
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-forest-900/[0.06] bg-cream-200/40 px-4 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
              A gentle reminder
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
              Visualisation supports action; it does not replace it. Keep the vision close and the
              next step smaller than your resistance.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

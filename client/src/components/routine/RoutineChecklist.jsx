import { useMemo, useState } from 'react';
import {
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CloudSun,
  Coffee,
  GraduationCap,
  MessagesSquare,
  MoonStar,
  Sparkles,
  StickyNote,
  Sunrise,
  Utensils,
} from 'lucide-react';
import { SECTION_META, SECTION_ORDER } from '../../lib/constants.js';
import { formatTime } from '../../lib/dates.js';
import { cn } from '../../lib/cn.js';
import { ProgressBar } from '../ui/Progress.jsx';

const SECTION_ICONS = {
  morning: Sunrise,
  'interview-1': BriefcaseBusiness,
  'break-1': Coffee,
  'interview-2': GraduationCap,
  'break-2': CloudSun,
  'interview-3': MessagesSquare,
  dinner: Utensils,
  revision: BookOpenCheck,
  night: MoonStar,
  custom: Sparkles,
};

function ActivityRow({ activity, onToggle, onNotes, disabled }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(activity.notes || '');
  const [lastSavedNote, setLastSavedNote] = useState(activity.notes || '');

  const completed = activity.completed;
  const hasNotes = Boolean(activity.notes);
  const meta = SECTION_META[activity.section] || SECTION_META.custom;

  const handleNoteBlur = () => {
    if (noteDraft !== lastSavedNote) {
      onNotes?.(activity.id, noteDraft);
      setLastSavedNote(noteDraft);
    }
  };

  return (
    <div
      className={cn(
        'group rounded-xl transition-colors',
        completed ? 'bg-sage-50/70' : 'hover:bg-cream-100/70',
      )}
    >
      <div className="flex items-start gap-2.5 px-2 py-2 sm:gap-3 sm:px-2.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onToggle?.(activity, !completed)}
          aria-label={completed ? `Mark ${activity.title} incomplete` : `Complete ${activity.title}`}
          aria-pressed={completed}
          className={cn(
            'mt-0.5 flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400/60 disabled:opacity-50',
            completed
              ? 'border-sage-600 bg-sage-600 text-white'
              : 'border-forest-900/15 bg-white text-transparent hover:border-sage-500 hover:bg-sage-50',
          )}
        >
          <Check size={13} strokeWidth={2.6} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onToggle?.(activity, !completed)}
              className={cn(
                'text-left text-[13.5px] font-medium leading-snug transition',
                completed ? 'text-ink-muted line-through decoration-sage-400/60' : 'text-ink',
              )}
            >
              {activity.title}
            </button>
            {activity.priority === 'high' && !completed ? (
              <span className="h-1.5 w-1.5 rounded-full bg-clay/70" title="High priority" />
            ) : null}
            {activity.isCustom ? (
              <span className="rounded-full bg-cream-200/80 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-ink-muted">
                {activity.required ? 'Streak' : 'Optional'}
              </span>
            ) : null}
          </div>
          {activity.description ? (
            <p
              className={cn(
                'mt-0.5 truncate text-[11px] leading-snug',
                completed ? 'text-ink-muted/60' : 'text-ink-muted',
              )}
              title={activity.description}
            >
              {activity.description}
            </p>
          ) : null}
          {hasNotes && !notesOpen ? (
            <p className="mt-1 flex items-start gap-1 rounded-lg bg-cream-200/40 px-2 py-1 text-[11px] italic leading-snug text-ink-muted">
              <StickyNote size={11} className="mt-0.5 shrink-0" />
              <span className="line-clamp-1">{activity.notes}</span>
            </p>
          ) : null}
          {notesOpen ? (
            <div className="mt-2">
              <textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                onBlur={handleNoteBlur}
                rows={2}
                maxLength={2000}
                placeholder={`Notes for ${activity.title.toLowerCase()}…`}
                className="field-textarea min-h-[62px] py-2 text-xs"
                autoFocus
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-ink-muted">Saves when you click away</span>
                <button
                  type="button"
                  onClick={() => setNotesOpen(false)}
                  className="text-[10px] font-medium text-sage-700 hover:underline"
                >
                  Done
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1 pt-0.5">
          <span className="hidden text-[10px] font-medium tabular-nums tracking-wide text-ink-muted sm:block">
            {formatTime(activity.scheduledTime)}
          </span>
          <span className="text-[10px] text-ink-muted sm:hidden">
            {formatTime(activity.scheduledTime).replace(':00', '')}
          </span>
          <button
            type="button"
            onClick={() => setNotesOpen((open) => !open)}
            className={cn(
              'rounded-md p-1 transition',
              notesOpen || hasNotes
                ? 'text-sage-700 hover:bg-sage-100'
                : 'text-ink-muted/50 hover:bg-cream-200/60 hover:text-ink-soft',
            )}
            aria-label={hasNotes ? `Edit notes for ${activity.title}` : `Add notes for ${activity.title}`}
            title={hasNotes ? 'Edit notes' : 'Add notes'}
          >
            <StickyNote size={13} />
          </button>
        </div>
      </div>
      <div className="mx-2.5 h-px bg-forest-900/[0.045] sm:mx-3" />
    </div>
  );
}

function SectionBlock({ section, activities, onToggle, onNotes, disabled }) {
  const [open, setOpen] = useState(true);
  const meta = SECTION_META[section] || { title: section, time: '', note: '' };
  const Icon = SECTION_ICONS[section] || Sparkles;
  const completed = activities.filter((activity) => activity.completed).length;
  const percent = activities.length ? Math.round((completed / activities.length) * 100) : 0;
  const allDone = completed === activities.length && activities.length > 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-forest-900/[0.05] bg-white/50">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-cream-100/50"
      >
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
            allDone ? 'bg-sage-600 text-white' : 'bg-sage-100 text-sage-600',
          )}
        >
          <Icon size={14} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2">
            <h3 className="text-[13px] font-semibold text-forest-800">{meta.title}</h3>
            <span className="text-[10px] text-ink-muted">{meta.time}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <ProgressBar value={percent} height="h-1" className="max-w-[150px]" />
            <span className="text-[10px] tabular-nums text-ink-muted">
              {completed}/{activities.length}
            </span>
          </div>
        </div>
        <ChevronDown
          size={14}
          className={cn('shrink-0 text-ink-muted transition-transform', !open && '-rotate-90')}
        />
      </button>
      {open ? (
        <div className="border-t border-forest-900/[0.04] px-1 py-1">
          {activities.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              onToggle={onToggle}
              onNotes={onNotes}
              disabled={disabled}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function RoutineChecklist({ activities, onToggle, onNotes, disabled = false }) {
  const groups = useMemo(() => {
    const map = new Map();
    for (const activity of activities || []) {
      if (!map.has(activity.section)) map.set(activity.section, []);
      map.get(activity.section).push(activity);
    }
    return [...map.entries()].sort(
      ([a], [b]) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b),
    );
  }, [activities]);

  return (
    <div className="space-y-2.5">
      {groups.map(([section, items]) => (
        <SectionBlock
          key={section}
          section={section}
          activities={items}
          onToggle={onToggle}
          onNotes={onNotes}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

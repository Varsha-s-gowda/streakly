import { useEffect, useState } from 'react';
import { Check, CornerDownRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { DIFFICULTIES, TOPIC_STATUSES } from '../../lib/constants.js';
import { cn } from '../../lib/cn.js';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { Input, Select, Textarea } from '../ui/Field.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';

export function TopicModal({ open, onClose, subject, topic, parent, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    title: '',
    difficulty: 'medium',
    status: 'not-started',
    targetMinutes: 0,
    notes: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm({
      title: topic?.title || '',
      difficulty: topic?.difficulty || 'medium',
      status: topic?.status || 'not-started',
      targetMinutes: topic?.targetMinutes || 0,
      notes: topic?.notes || '',
    });
  }, [open, topic]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.title.trim().length < 2) {
      setError('Give this topic a clear title.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        subject,
        title: form.title.trim(),
        difficulty: form.difficulty,
        status: form.status,
        targetMinutes: Number(form.targetMinutes) || 0,
        notes: form.notes,
      };
      if (parent?.id) payload.parent = parent.id;
      if (topic) {
        await api.patch(`/interview/topics/${topic.id}`, payload);
        toast.success('Topic updated.');
      } else {
        await api.post('/interview/topics', payload);
        toast.success(parent ? 'Subtopic added.' : 'Topic added.');
      }
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Could not save this topic.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={topic ? 'Edit topic' : parent ? 'Add a subtopic' : 'Add a topic'}
      description={parent ? `Adding inside “${parent.title}” · ${subject}` : subject}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="topic-form" loading={saving}>
            {topic ? 'Save topic' : 'Add topic'}
          </Button>
        </>
      }
    >
      <form id="topic-form" onSubmit={submit} className="space-y-4">
        <Input
          label="Topic title"
          placeholder="e.g. HashMap internals"
          maxLength={200}
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          autoFocus
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Status"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          >
            {TOPIC_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          <Select
            label="Difficulty"
            value={form.difficulty}
            onChange={(event) => setForm({ ...form, difficulty: event.target.value })}
          >
            {DIFFICULTIES.map((difficulty) => (
              <option key={difficulty.value} value={difficulty.value}>
                {difficulty.label}
              </option>
            ))}
          </Select>
          <Input
            label="Target minutes"
            type="number"
            min="0"
            max="10000"
            value={form.targetMinutes}
            onChange={(event) => setForm({ ...form, targetMinutes: event.target.value })}
            hint="Optional"
          />
        </div>
        <Textarea
          label="Notes (optional)"
          rows={3}
          maxLength={5000}
          placeholder="Key ideas, questions to revisit, or resources…"
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
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

const DIFFICULTY_STYLES = {
  easy: 'bg-sage-100 text-sage-700',
  medium: 'bg-[#F4EAD3] text-[#7C6433]',
  hard: 'bg-[#F5E3DB] text-[#8A513A]',
};

function TopicRow({ topic, children, onToggle, onEdit, onDelete, onAddSubtopic, isChild = false }) {
  return (
    <div className={cn('rounded-xl transition hover:bg-cream-100/60', isChild && 'ml-5 border-l border-sage-200/70 pl-2 sm:ml-7')}>
      <div className="flex items-start gap-2.5 px-2 py-2">
        <button
          type="button"
          onClick={() => onToggle(topic)}
          aria-pressed={topic.status === 'completed'}
          className={cn(
            'mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border transition',
            topic.status === 'completed'
              ? 'border-sage-600 bg-sage-600 text-white'
              : topic.status === 'in-progress'
                ? 'border-gold bg-[#FBF4E4] text-gold'
                : 'border-forest-900/15 bg-white text-transparent hover:border-sage-500',
          )}
          title={topic.status === 'completed' ? 'Mark not started' : 'Mark completed'}
        >
          {topic.status === 'completed' ? (
            <Check size={11} strokeWidth={3} />
          ) : topic.status === 'in-progress' ? (
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          ) : null}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {isChild ? <CornerDownRight size={11} className="text-ink-muted/50" /> : null}
            <p
              className={cn(
                'text-[13px] font-medium leading-snug',
                topic.status === 'completed' ? 'text-ink-muted line-through' : 'text-ink',
              )}
            >
              {topic.title}
            </p>
            <span className={cn('rounded-full px-1.5 py-0.5 text-[8px] font-medium capitalize', DIFFICULTY_STYLES[topic.difficulty])}>
              {topic.difficulty}
            </span>
            {topic.status === 'in-progress' ? (
              <span className="text-[8px] font-medium uppercase tracking-wide text-[#8B6E30]">in progress</span>
            ) : null}
          </div>
          {topic.notes ? (
            <p className="mt-0.5 line-clamp-1 text-[10px] text-ink-muted">{topic.notes}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {!isChild ? (
            <button
              type="button"
              onClick={() => onAddSubtopic(topic)}
              className="rounded p-1.5 text-ink-muted/50 transition hover:bg-white hover:text-sage-700"
              title="Add subtopic"
              aria-label={`Add subtopic to ${topic.title}`}
            >
              <Plus size={12} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onEdit(topic)}
            className="rounded p-1.5 text-ink-muted/50 transition hover:bg-white hover:text-ink"
            title="Edit topic"
            aria-label={`Edit ${topic.title}`}
          >
            <Pencil size={12} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(topic)}
            className="rounded p-1.5 text-ink-muted/50 transition hover:bg-white hover:text-clay"
            title="Delete topic"
            aria-label={`Delete ${topic.title}`}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {children?.length ? (
        <div className="pb-1">
          {children.map((child) => (
            <TopicRow
              key={child.id}
              topic={child}
              isChild
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubtopic={onAddSubtopic}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TopicTree({ topics, onToggle, onEdit, onDelete, onAddSubtopic }) {
  const parents = topics.filter((topic) => !topic.parent);
  const childrenOf = (id) => topics.filter((topic) => topic.parent === id);
  const orphans = topics.filter(
    (topic) => topic.parent && !topics.some((candidate) => candidate.id === topic.parent),
  );

  return (
    <div className="space-y-1">
      {parents.map((topic) => (
        <TopicRow
          key={topic.id}
          topic={topic}
          children={childrenOf(topic.id)}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubtopic={onAddSubtopic}
        />
      ))}
      {orphans.map((topic) => (
        <TopicRow
          key={topic.id}
          topic={topic}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubtopic={onAddSubtopic}
        />
      ))}
      {!topics.length ? (
        <div className="rounded-xl border border-dashed border-forest-900/10 px-4 py-8 text-center">
          <p className="text-sm font-medium text-forest-800">No topics in this subject yet</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-muted">
            Break the subject into topics and subtopics. Mark them complete as you prepare.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function TargetEditor({ subject, target, onSaved }) {
  const toast = useToast();
  const [daily, setDaily] = useState(target?.dailyMinutes ?? 60);
  const [weekly, setWeekly] = useState(target?.weeklyMinutes ?? 300);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDaily(target?.dailyMinutes ?? 60);
    setWeekly(target?.weeklyMinutes ?? 300);
  }, [target?.dailyMinutes, target?.weeklyMinutes, subject]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.put('/interview/targets', {
        subject,
        dailyMinutes: Number(daily) || 0,
        weeklyMinutes: Number(weekly) || 0,
      });
      toast.success('Study targets updated.');
      onSaved?.();
    } catch (err) {
      toast.error(err.message || 'Could not save targets.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Daily target (min)"
          type="number"
          min="0"
          max="1440"
          value={daily}
          onChange={(event) => setDaily(event.target.value)}
        />
        <Input
          label="Weekly target (min)"
          type="number"
          min="0"
          max="10080"
          value={weekly}
          onChange={(event) => setWeekly(event.target.value)}
        />
      </div>
      <Button type="submit" size="sm" variant="soft" loading={saving} className="w-full">
        Save targets
      </Button>
    </form>
  );
}

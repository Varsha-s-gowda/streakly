import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, Plus } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';
import { INTERVIEW_SUBJECTS } from '../../lib/constants.js';
import { Input, Select, Textarea } from '../ui/Field.jsx';
import { Button } from '../ui/Button.jsx';

export function SessionForm({ topics = [], defaultSubject, onSaved, today, showTopic = true }) {
  const toast = useToast();
  const [form, setForm] = useState({
    date: today,
    subject: defaultSubject || INTERVIEW_SUBJECTS[0],
    topic: '',
    minutes: 45,
    problemsSolved: 0,
    difficultQuestions: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (defaultSubject) {
      setForm((current) => ({ ...current, subject: defaultSubject, topic: '' }));
    }
  }, [defaultSubject]);

  useEffect(() => {
    setForm((current) => ({ ...current, date: today }));
  }, [today]);

  const availableTopics = useMemo(
    () => topics.filter((topic) => topic.subject === form.subject),
    [topics, form.subject],
  );

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const minutes = Number(form.minutes);
    if (!Number.isFinite(minutes) || minutes < 1) {
      setError('Enter at least 1 minute of study.');
      return;
    }

    setSaving(true);
    try {
      const data = await api.post('/interview/sessions', {
        date: form.date,
        subject: form.subject,
        topic: form.topic || undefined,
        minutes,
        problemsSolved: Number(form.problemsSolved) || 0,
        difficultQuestions: form.difficultQuestions,
        notes: form.notes,
      });
      toast.success(`Logged ${minutes} minutes of ${form.subject}.`);
      onSaved?.(data.session);
      setForm((current) => ({
        ...current,
        minutes: 45,
        problemsSolved: 0,
        difficultQuestions: '',
        notes: '',
      }));
    } catch (err) {
      setError(err.message || 'Could not log this study session.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Date"
          type="date"
          max={today}
          value={form.date}
          onChange={(event) => setForm({ ...form, date: event.target.value })}
        />
        <Select
          label="Subject"
          value={form.subject}
          onChange={(event) =>
            setForm({ ...form, subject: event.target.value, topic: '' })
          }
        >
          {INTERVIEW_SUBJECTS.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </Select>
        {showTopic ? (
          <Select
            label="Topic (optional)"
            value={form.topic}
            onChange={(event) => setForm({ ...form, topic: event.target.value })}
            className="sm:col-span-2"
          >
            <option value="">General study — no specific topic</option>
            {availableTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.parent ? '↳ ' : ''}
                {topic.title}
              </option>
            ))}
          </Select>
        ) : null}
        <Input
          label="Minutes studied"
          type="number"
          min="1"
          max="1440"
          value={form.minutes}
          onChange={(event) => setForm({ ...form, minutes: event.target.value })}
        />
        <Input
          label="Coding problems solved"
          type="number"
          min="0"
          max="500"
          value={form.problemsSolved}
          onChange={(event) => setForm({ ...form, problemsSolved: event.target.value })}
        />
      </div>
      <Textarea
        label="Difficult questions or mistakes (optional)"
        rows={2}
        placeholder="A question you could not answer, a bug you want to revisit…"
        value={form.difficultQuestions}
        onChange={(event) => setForm({ ...form, difficultQuestions: event.target.value })}
      />
      <Textarea
        label="Session notes (optional)"
        rows={2}
        placeholder="What did you cover? What is the next step?"
        value={form.notes}
        onChange={(event) => setForm({ ...form, notes: event.target.value })}
      />
      {error ? (
        <p className="rounded-lg bg-[#FAEFEA] px-3 py-2 text-xs text-[#834932]">{error}</p>
      ) : null}
      <Button type="submit" loading={saving} className="w-full">
        {!saving ? <Plus size={14} /> : null}
        Log study session
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-[10px] text-ink-muted">
        <BookOpenCheck size={11} /> Minutes feed your study hours, targets, and calendar.
      </p>
    </form>
  );
}

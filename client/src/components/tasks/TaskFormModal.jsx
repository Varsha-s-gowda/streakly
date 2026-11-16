import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { api } from '../../lib/api.js';
import { PRIORITIES, RECURRENCES } from '../../lib/constants.js';
import { Input, Select, Textarea } from '../ui/Field.jsx';
import { Button } from '../ui/Button.jsx';
import { Modal } from '../ui/Modal.jsx';
import { Toggle } from '../ui/Toggle.jsx';

const EMPTY = {
  title: '',
  description: '',
  scheduledTime: '09:00',
  priority: 'medium',
  recurrence: 'daily',
  date: '',
  required: false,
};

export function TaskFormModal({ open, onClose, onSaved, task, today }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        scheduledTime: task.scheduledTime || '09:00',
        priority: task.priority || 'medium',
        recurrence: task.recurrence || 'daily',
        date: task.date || '',
        required: Boolean(task.required),
      });
    } else {
      setForm({ ...EMPTY, date: today });
    }
  }, [open, task, today]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.title.trim().length < 2) {
      setError('Give your task a short, clear title.');
      return;
    }
    if (form.recurrence === 'once' && !form.date) {
      setError('Choose the date for this one-time task.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description,
        scheduledTime: form.scheduledTime,
        priority: form.priority,
        recurrence: form.recurrence,
        date: form.recurrence === 'once' ? form.date : undefined,
        required: form.required,
      };
      const data = task
        ? await api.patch(`/tasks/${task.id}`, payload)
        : await api.post('/tasks', payload);
      toast.success(task ? 'Task updated.' : 'Task added to your routine.');
      onSaved?.(data.task);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Could not save this task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Edit custom task' : 'Add a custom task'}
      description="Default routine activities stay untouched — this sits alongside them."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" loading={saving}>
            {task ? 'Save changes' : 'Add task'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} className="space-y-4">
        <Input
          label="Task title"
          placeholder="e.g. Review system design notes"
          value={form.title}
          maxLength={200}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          autoFocus
        />
        <Textarea
          label="Description (optional)"
          rows={2}
          placeholder="Any detail that makes this task clear when you see it later…"
          value={form.description}
          maxLength={2000}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Scheduled time"
            type="time"
            value={form.scheduledTime}
            onChange={(event) => setForm({ ...form, scheduledTime: event.target.value })}
          />
          <Select
            label="Priority"
            value={form.priority}
            onChange={(event) => setForm({ ...form, priority: event.target.value })}
          >
            {PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </Select>
          <Select
            label="Recurrence"
            value={form.recurrence}
            onChange={(event) => setForm({ ...form, recurrence: event.target.value })}
          >
            {RECURRENCES.map((recurrence) => (
              <option key={recurrence.value} value={recurrence.value}>
                {recurrence.label}
              </option>
            ))}
          </Select>
          {form.recurrence === 'once' ? (
            <Input
              label="Date"
              type="date"
              min={task?.id ? undefined : today}
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
          ) : null}
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-forest-900/[0.07] bg-cream-100/60 px-3.5 py-3">
          <div>
            <p className="text-[13px] font-medium text-ink">Counts toward the daily streak</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
              Leave this off for optional tasks. Only required activities affect a fully completed day.
            </p>
          </div>
          <Toggle
            checked={form.required}
            onChange={(value) => setForm({ ...form, required: value })}
            label="Counts toward streak"
          />
        </div>

        {error ? (
          <p className="rounded-xl border border-[#E9CDC1] bg-[#FAEFEA] px-3 py-2.5 text-xs leading-relaxed text-[#834932]">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

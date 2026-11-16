import { AlertCircle, Check, Cloud, Loader2, PenLine } from 'lucide-react';
import { Textarea } from '../ui/Field.jsx';
import { cn } from '../../lib/cn.js';

export function JournalFieldGroup({ icon: Icon, title, description, fields, values, onChange }) {
  return (
    <section className="card overflow-hidden">
      <div className="flex items-start gap-3 border-b border-forest-900/[0.05] px-5 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
          {Icon ? <Icon size={17} strokeWidth={1.8} /> : <PenLine size={17} />}
        </span>
        <div>
          <h2 className="text-[17px] font-semibold text-forest-800">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-ink-muted">{description}</p> : null}
        </div>
      </div>
      <div className="grid gap-4 px-5 py-5 lg:grid-cols-2">
        {fields.map((field) => (
          <Textarea
            key={field.key}
            label={field.label}
            rows={field.rows || 3}
            placeholder={field.placeholder}
            value={values?.[field.key] || ''}
            onChange={(event) => onChange(field.key, event.target.value)}
            className={fields.length % 2 === 1 && field === fields[fields.length - 1] ? 'lg:col-span-2' : ''}
          />
        ))}
      </div>
    </section>
  );
}

export function SaveStatus({ state, savedAt }) {
  const time = savedAt
    ? new Date(savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  const config = {
    idle: { icon: Cloud, label: 'Saved automatically', className: 'text-ink-muted' },
    pending: { icon: PenLine, label: 'Unsaved changes', className: 'text-[#8A6F36]' },
    saving: { icon: Loader2, label: 'Saving…', className: 'text-sage-700', spin: true },
    saved: {
      icon: Check,
      label: time ? `Saved at ${time}` : 'Saved',
      className: 'text-sage-700',
    },
    error: { icon: AlertCircle, label: 'Could not save — try again', className: 'text-[#94543B]' },
  }[state] || {};

  const Icon = config.icon || Cloud;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium', config.className)}>
      <Icon size={13} className={config.spin ? 'animate-spin' : ''} />
      {config.label}
    </span>
  );
}

export function JournalNavButton({ active, date, title, snippet, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border px-3 py-2.5 text-left transition',
        active
          ? 'border-sage-300 bg-sage-50 shadow-sm'
          : 'border-transparent hover:border-forest-900/5 hover:bg-cream-100/70',
      )}
    >
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-sage-700">
        {date}
      </span>
      {title ? <span className="mt-0.5 block truncate text-xs text-ink-soft">{title}</span> : null}
      {snippet ? (
        <span className="mt-1 block line-clamp-2 text-[11px] leading-snug text-ink-muted">
          {snippet}
        </span>
      ) : null}
    </button>
  );
}

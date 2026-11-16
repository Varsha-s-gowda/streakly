import { useId } from 'react';
import { cn } from '../../lib/cn.js';

export function Input({ label, error, hint, className, id, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn('field-input', error && 'border-clay/60 focus:border-clay focus:ring-[#F4E1D9]')}
        {...props}
      />
      {error ? <p className="mt-1 text-xs text-[#9A563C]">{error}</p> : null}
      {!error && hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function Textarea({ label, error, hint, className, id, rows = 3, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
      ) : null}
      <textarea
        id={inputId}
        rows={rows}
        className={cn(
          'field-textarea',
          error && 'border-clay/60 focus:border-clay focus:ring-[#F4E1D9]',
        )}
        {...props}
      />
      {error ? <p className="mt-1 text-xs text-[#9A563C]">{error}</p> : null}
      {!error && hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function Select({ label, error, hint, className, id, children, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
      ) : null}
      <select
        id={inputId}
        className={cn(
          'field-input appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2716%27%20height%3D%2716%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%237A867C%27%20stroke-width%3D%272%27%3E%3Cpath%20d%3D%27m6%209%206%206%206-6%27/%3E%3C/svg%3E")] bg-[right_0.85rem_center] bg-no-repeat pr-9',
          error && 'border-clay/60',
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="mt-1 text-xs text-[#9A563C]">{error}</p> : null}
      {!error && hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-forest-900/10 bg-cream-50/50 px-6 py-10 text-center ${className}`}>
      {Icon ? (
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-100 text-sage-600">
          <Icon size={20} strokeWidth={1.8} />
        </span>
      ) : null}
      <h3 className="text-base font-semibold text-forest-800">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

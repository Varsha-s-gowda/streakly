export function ChartTooltip({ active, payload, label, formatter, labelFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[130px] rounded-xl border border-forest-900/10 bg-cream-50/95 px-3 py-2 shadow-lift backdrop-blur">
      <p className="mb-1.5 text-[11px] font-medium text-ink-muted">
        {labelFormatter ? labelFormatter(label, payload) : label}
      </p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey ?? entry.name} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-ink-soft">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: entry.color || entry.fill || entry.stroke }}
              />
              {entry.name}
            </span>
            <span className="font-medium text-forest-800">
              {formatter ? formatter(entry.value, entry) : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

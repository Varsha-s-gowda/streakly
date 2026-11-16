import { cn } from '../../lib/cn.js';

const TONES = {
  sage: 'bg-sage-500',
  forest: 'bg-forest-600',
  gold: 'bg-gold',
  clay: 'bg-clay',
  cream: 'bg-sand',
};

export function ProgressBar({ value = 0, tone = 'sage', className, height = 'h-2' }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-forest-900/[0.07]', height, className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500 ease-out', TONES[tone])}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value = 0,
  size = 132,
  stroke = 9,
  tone = 'sage',
  children,
  className,
}) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;
  const colors = {
    sage: '#728D67',
    forest: '#3D5B47',
    gold: '#BFA36A',
    clay: '#B8775C',
    cream: '#E6DDCB',
  };
  const color = colors[tone] || colors.sage;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(36,56,44,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

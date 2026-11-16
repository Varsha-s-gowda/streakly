import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const VARIANTS = {
  primary:
    'bg-forest-700 text-cream-50 shadow-soft hover:bg-forest-800 active:bg-forest-900 disabled:bg-forest-700/50',
  secondary:
    'border border-forest-900/10 bg-white/80 text-ink shadow-sm hover:border-forest-900/20 hover:bg-white',
  soft: 'bg-sage-100 text-forest-700 hover:bg-sage-200/80',
  ghost: 'text-ink-soft hover:bg-forest-900/5 hover:text-ink',
  danger: 'bg-[#F5E2DA] text-[#844832] hover:bg-[#EFD4C8]',
  accent: 'bg-clay text-white hover:bg-[#A66B52]',
};

const SIZES = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-11 gap-2 rounded-xl px-5 text-sm',
  icon: 'h-9 w-9 rounded-lg',
  'icon-sm': 'h-7 w-7 rounded-md',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-400/60 disabled:cursor-not-allowed disabled:opacity-70',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

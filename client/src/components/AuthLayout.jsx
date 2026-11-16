import { Logo } from './Logo.jsx';
import { Flame, MoonStar, Sparkles } from 'lucide-react';

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-cream-100 lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <aside className="relative hidden overflow-hidden bg-forest-800 bg-grain p-10 text-cream-100 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full border border-sage-300/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-14 -top-14 h-[260px] w-[260px] rounded-full border border-sage-300/10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-24 h-[380px] w-[380px] rounded-full bg-sage-500/[0.08] blur-2xl"
          aria-hidden="true"
        />

        <Logo dark />

        <div className="relative max-w-md">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-sage-300/70">
            The quiet architecture of a good life
          </p>
          <h1 className="font-display text-[42px] leading-[1.12] text-cream-50 xl:text-[50px]">
            A day kept is a life built.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-cream-200/60">
            Your routine, interview preparation, habits, and honest reflections — gathered into one
            calm place. Show up, tick the boxes, and watch consistency become character.
          </p>

          <div className="mt-9 space-y-3">
            {[
              { icon: Sparkles, title: 'One clear daily rhythm', text: 'From 8 AM discipline to midnight reflection.' },
              { icon: Flame, title: 'Streaks that mean something', text: 'Only a fully completed day keeps the flame alive.' },
              { icon: MoonStar, title: 'Close the day gently', text: 'Gratitude, journaling, and tomorrow’s intentions.' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cream-100/10 text-sage-200">
                    <Icon size={15} />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-cream-100">{item.title}</p>
                    <p className="mt-0.5 text-[11px] text-cream-200/45">{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative text-[10px] uppercase tracking-[0.18em] text-cream-200/30">
          Built for one person · kept for a lifetime
        </p>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[420px] animate-fade-up">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>
          <div className="card px-6 py-7 shadow-lift sm:px-8 sm:py-9">
            <p className="eyebrow mb-2">Welcome inward</p>
            <h2 className="text-[27px] leading-tight text-forest-800">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
          {footer ? <div className="mt-5 text-center text-xs text-ink-muted">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}

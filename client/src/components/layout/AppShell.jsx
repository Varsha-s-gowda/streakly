import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Flame,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  NotebookPen,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi, useToday } from '../../hooks/useApi.js';
import { useReminderNotifications } from '../../hooks/useReminderNotifications.js';
import { api } from '../../lib/api.js';
import { formatDateLong } from '../../lib/dates.js';
import { Logo } from '../Logo.jsx';
import { cn } from '../../lib/cn.js';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/routine', label: 'Daily Routine', icon: ListChecks },
  { to: '/habits', label: 'Habit Tracker', icon: Flame },
  { to: '/interview', label: 'Interview Preparation', icon: BriefcaseBusiness },
  { to: '/calendar', label: 'Calendar & Streaks', icon: CalendarDays },
  { to: '/journal', label: 'Journal & Gratitude', icon: NotebookPen },
  { to: '/manifestation', label: 'Manifestation', icon: Sparkles },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'S';
}

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      toast.error('Could not sign out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-forest-800 bg-grain text-cream-100">
      <div className="px-5 pb-6 pt-6">
        <Logo dark />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cream-200/35">
          Your rhythm
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} strokeWidth={1.9} />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight
                    size={13}
                    className={cn('transition-opacity duration-200', isActive ? 'opacity-70' : 'opacity-0')}
                  />
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mx-3 mb-3 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-3.5">
        <p className="font-display text-[15px] leading-snug text-cream-100">
          “Small steps, repeated, become a life.”
        </p>
        <p className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-cream-200/35">
          Keep the promise
        </p>
      </div>

      <div className="border-t border-white/[0.07] px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-300/25 text-[11px] font-semibold text-cream-50">
            {initials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-cream-50">{user?.name}</p>
            <p className="truncate text-[10px] text-cream-200/40">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg p-1.5 text-cream-200/45 transition hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const today = useToday();
  const { user } = useAuth();
  const { data: reminderData } = useApi(() => api.get('/reminders'), [], { enabled: Boolean(user) });
  useReminderNotifications(reminderData?.reminders || []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[252px] lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-forest-900/40 backdrop-blur-[2px] animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative h-full w-[278px] max-w-[85vw] animate-fade-up shadow-lift">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-cream-200/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-30 border-b border-forest-900/[0.06] bg-cream-100/85 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-forest-900/[0.08] bg-white/70 p-2 text-ink-soft shadow-sm"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <Logo compact />
            <div className="w-9 text-right">
              <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                {formatDateLong(today).split(',')[0]}
              </p>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

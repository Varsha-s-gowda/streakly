import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useToday } from './useApi.js';
import { currentTimeInTimezone, weekday } from '../lib/dates.js';

/**
 * Checks enabled reminders once every 20 seconds while Streakly is open.
 * A reminder fires only once per day; browser notifications are optional.
 */
export function useReminderNotifications(reminders) {
  const { user } = useAuth();
  const toast = useToast();
  const today = useToday();
  const timezone = user?.timezone || 'Asia/Kolkata';

  useEffect(() => {
    if (!reminders?.length) return undefined;

    const check = () => {
      const { hour, minute } = currentTimeInTimezone(timezone);
      const clock = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      const day = weekday(today);

      for (const reminder of reminders) {
        if (!reminder.enabled || reminder.time !== clock) continue;
        if (Array.isArray(reminder.days) && !reminder.days.includes(day)) continue;

        const key = `streakly-reminder-${today}-${reminder.id}-${clock}`;
        if (window.localStorage.getItem(key)) continue;
        window.localStorage.setItem(key, '1');

        toast.info(`Reminder · ${reminder.title}`);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            new Notification(`Streakly · ${reminder.title}`, {
              body: reminder.message || 'Time for your scheduled routine.',
              tag: key,
            });
          } catch {
            /* Browsers can reject notifications without a user gesture. */
          }
        }
      }
    };

    check();
    const interval = window.setInterval(check, 20_000);
    return () => window.clearInterval(interval);
  }, [reminders, timezone, today, toast]);
}

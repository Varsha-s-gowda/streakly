import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  Check,
  Download,
  KeyRound,
  LogOut,
  Pencil,
  Plus,
  ShieldCheck,
  Timer,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useApi, useToday } from '../hooks/useApi.js';
import { api, downloadBackup } from '../lib/api.js';
import { formatDateLong, formatTime, nowLabel } from '../lib/dates.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Input, Select, Textarea } from '../components/ui/Field.jsx';
import { Modal, ConfirmDialog } from '../components/ui/Modal.jsx';
import { Toggle } from '../components/ui/Toggle.jsx';
import { LoadingBlock } from '../components/ui/Spinner.jsx';
import { cn } from '../lib/cn.js';

const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const FALLBACK_ZONES = [
  'Asia/Kolkata',
  'UTC',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Australia/Sydney',
  'Pacific/Auckland',
];

function timezoneOptions() {
  try {
    const zones = Intl.supportedValuesOf?.('timeZone');
    if (Array.isArray(zones) && zones.length) return zones;
  } catch {
    /* Older browsers do not support this API. */
  }
  return FALLBACK_ZONES;
}

function Card({ icon: Icon, title, description, children, badge, className }) {
  return (
    <section className={cn('card px-4 py-4 sm:px-5 sm:py-5', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {Icon ? (
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
              <Icon size={16} strokeWidth={1.8} />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold leading-snug text-forest-800">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-ink-muted">{description}</p> : null}
          </div>
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
      {children}
    </section>
  );
}

function ReminderModal({ open, onClose, reminder, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    title: '',
    message: '',
    time: '09:00',
    days: [0, 1, 2, 3, 4, 5, 6],
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm({
      title: reminder?.title || '',
      message: reminder?.message || '',
      time: reminder?.time || '09:00',
      days: reminder?.days?.length ? reminder.days : [0, 1, 2, 3, 4, 5, 6],
    });
  }, [open, reminder]);

  const toggleDay = (day) => {
    setForm((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((value) => value !== day)
        : [...current.days, day].sort(),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.title.trim().length < 2) {
      setError('Give this reminder a short title.');
      return;
    }
    if (!form.days.length) {
      setError('Choose at least one day.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message,
        time: form.time,
        days: form.days,
      };
      if (reminder) {
        await api.patch(`/reminders/${reminder.id}`, payload);
        toast.success('Reminder updated.');
      } else {
        await api.post('/reminders', payload);
        toast.success('Reminder created.');
      }
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Could not save this reminder.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={reminder ? 'Edit reminder' : 'Create a reminder'}
      description="Reminders appear while Streakly is open. Browser notifications are optional."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="reminder-form" loading={saving}>
            {reminder ? 'Save reminder' : 'Create reminder'}
          </Button>
        </>
      }
    >
      <form id="reminder-form" onSubmit={submit} className="space-y-4">
        <Input
          label="Title"
          maxLength={160}
          placeholder="e.g. Evening revision"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          autoFocus
        />
        <Textarea
          label="Message (optional)"
          rows={2}
          maxLength={500}
          placeholder="A short nudge that will appear with the reminder…"
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
        />
        <Input
          label="Time (your local timezone)"
          type="time"
          value={form.time}
          onChange={(event) => setForm({ ...form, time: event.target.value })}
        />
        <div>
          <p className="field-label">Days</p>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((day) => {
              const active = form.days.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                    active
                      ? 'border-sage-500 bg-sage-500 text-white'
                      : 'border-forest-900/10 bg-white/70 text-ink-muted hover:border-sage-300 hover:text-ink',
                  )}
                  aria-pressed={active}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
        {error ? (
          <p className="rounded-xl border border-[#E9CDC1] bg-[#FAEFEA] px-3 py-2.5 text-xs text-[#834932]">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

export function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const today = useToday();

  const zones = useMemo(timezoneOptions, []);
  const remindersState = useApi(() => api.get('/reminders'), []);
  const reminders = remindersState.data?.reminders || [];

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    timezone: user?.timezone || 'Asia/Kolkata',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [reminderModal, setReminderModal] = useState({ open: false, reminder: null });
  const [deleteReminder, setDeleteReminder] = useState(null);
  const [working, setWorking] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  );

  useEffect(() => {
    setProfile({
      name: user?.name || '',
      email: user?.email || '',
      timezone: user?.timezone || 'Asia/Kolkata',
    });
  }, [user?.name, user?.email, user?.timezone]);

  const saveProfile = async (event) => {
    event.preventDefault();
    if (profile.name.trim().length < 2) {
      toast.error('Please enter your name.');
      return;
    }
    setProfileSaving(true);
    try {
      const data = await api.patch('/auth/profile', {
        name: profile.name.trim(),
        email: profile.email.trim(),
        timezone: profile.timezone,
      });
      updateUser(data.user);
      toast.success('Profile updated. Dates now follow your selected timezone.');
    } catch (err) {
      toast.error(err.message || 'Could not update your profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    if (password.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (password.newPassword !== password.confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setPasswordSaving(true);
    try {
      await api.post('/auth/password', {
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });
      setPassword({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password updated. You stay signed in on this device.');
    } catch (err) {
      setPasswordError(err.message || 'Could not change your password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') {
      toast.error('This browser does not support notifications.');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        toast.success('Browser notifications enabled.');
        new Notification('Streakly', {
          body: 'Notifications are on. Gentle reminders will appear while Streakly is open.',
        });
      } else {
        toast.info('Browser notifications were not enabled. In-app reminders still work.');
      }
    } catch {
      toast.error('Could not ask for notification permission.');
    }
  };

  const testNotification = () => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      toast.info('Enable browser notifications first.');
      return;
    }
    try {
      new Notification('Streakly · Test reminder', {
        body: 'This is how your reminders will look. Keep going gently.',
      });
      toast.success('Test notification sent.');
    } catch {
      toast.error('The browser blocked the test notification.');
    }
  };

  const toggleReminder = async (reminder, enabled) => {
    const snapshot = remindersState.data;
    remindersState.setData({
      reminders: reminders.map((item) => (item.id === reminder.id ? { ...item, enabled } : item)),
    });
    try {
      await api.patch(`/reminders/${reminder.id}`, { enabled });
    } catch (err) {
      remindersState.setData(snapshot);
      toast.error(err.message || 'Could not update this reminder.');
    }
  };

  const removeReminder = async () => {
    if (!deleteReminder) return;
    setWorking(true);
    try {
      await api.delete(`/reminders/${deleteReminder.id}`);
      toast.success('Reminder deleted.');
      setDeleteReminder(null);
      remindersState.refresh({ silent: true }).catch(() => {});
    } catch (err) {
      toast.error(err.message || 'Could not delete this reminder.');
    } finally {
      setWorking(false);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      await downloadBackup();
      toast.success('Your backup has been downloaded.');
    } catch (err) {
      toast.error(err.message || 'Could not export your data.');
    } finally {
      setExporting(false);
    }
  };

  const signOut = async () => {
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

  if (!user) return null;

  const permissionLabel = {
    granted: 'Allowed',
    denied: 'Blocked in browser',
    default: 'Not requested yet',
    unsupported: 'Not supported here',
  }[permission];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Make this space yours."
        description="Your identity, timezone, reminders, and data. Nothing here is decorative — each choice changes how your routine behaves."
        actions={<Badge tone="sage" dot>{`Tracking since ${formatDateLong(user.trackingStart)}`}</Badge>}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card icon={UserRound} title="Profile" description="Your name, sign-in email, and the timezone that defines each day.">
          <form onSubmit={saveProfile} className="space-y-3.5">
            <Input
              label="Name"
              value={profile.name}
              maxLength={80}
              onChange={(event) => setProfile({ ...profile, name: event.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={profile.email}
              onChange={(event) => setProfile({ ...profile, email: event.target.value })}
            />
            <Select
              label="Timezone"
              value={profile.timezone}
              onChange={(event) => setProfile({ ...profile, timezone: event.target.value })}
              hint={`Today is ${formatDateLong(today)} · local time ${nowLabel(user.timezone)}`}
            >
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </Select>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-cream-100/60 px-3.5 py-2.5">
              <p className="text-[11px] leading-relaxed text-ink-muted">
                Tracking started {formatDateLong(user.trackingStart)}. This date is permanent so your history stays honest.
              </p>
              <Button type="submit" size="sm" loading={profileSaving}>
                Save
              </Button>
            </div>
          </form>
        </Card>

        <Card icon={KeyRound} title="Password" description="Use at least eight characters. Changing it signs out other devices.">
          <form onSubmit={changePassword} className="space-y-3.5">
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={password.currentPassword}
              onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                value={password.newPassword}
                onChange={(event) => setPassword({ ...password, newPassword: event.target.value })}
              />
              <Input
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                value={password.confirm}
                onChange={(event) => setPassword({ ...password, confirm: event.target.value })}
              />
            </div>
            {passwordError ? (
              <p className="rounded-xl border border-[#E9CDC1] bg-[#FAEFEA] px-3 py-2.5 text-xs text-[#834932]">
                {passwordError}
              </p>
            ) : null}
            <Button type="submit" size="sm" loading={passwordSaving} variant="secondary">
              <ShieldCheck size={13} /> Update password
            </Button>
          </form>
        </Card>
      </div>

      <Card
        icon={BellRing}
        title="Browser notifications"
        description="In-app reminders always work while Streakly is open. Browser notifications additionally require permission."
        badge={<Badge tone={permission === 'granted' ? 'sage' : 'cream'}>{permissionLabel}</Badge>}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={requestPermission} disabled={permission === 'unsupported' || permission === 'granted'}>
            <Bell size={13} /> {permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
          </Button>
          <Button size="sm" variant="secondary" onClick={testNotification}>
            Send a test
          </Button>
          <p className="text-[10px] leading-relaxed text-ink-muted">
            Browsers only show notifications while this site is open, and some block them until a
            click. Reminders never fire twice on the same day.
          </p>
        </div>
      </Card>

      <Card
        icon={Timer}
        title="Reminders"
        description="Reminders follow your local timezone and selected weekdays."
        badge={
          <Button size="sm" variant="soft" onClick={() => setReminderModal({ open: true, reminder: null })}>
            <Plus size={13} /> Add reminder
          </Button>
        }
      >
        {remindersState.loading && !remindersState.data ? (
          <LoadingBlock label="Loading reminders…" className="py-6" />
        ) : reminders.length ? (
          <div className="space-y-2">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-forest-900/[0.05] bg-cream-50/50 px-3.5 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className={cn('text-[13px] font-medium', reminder.enabled ? 'text-ink' : 'text-ink-muted')}>
                      {reminder.title}
                    </p>
                    {reminder.isDefault ? (
                      <span className="rounded-full bg-cream-200/80 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wide text-ink-muted">
                        Default
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    {formatTime(reminder.time)} ·{' '}
                    {reminder.days?.length === 7
                      ? 'Every day'
                      : WEEKDAYS.filter((day) => reminder.days?.includes(day.value))
                          .map((day) => day.label)
                          .join(', ')}
                  </p>
                  {reminder.message ? (
                    <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-ink-muted/80">
                      {reminder.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Toggle
                    checked={reminder.enabled}
                    onChange={(value) => toggleReminder(reminder, value)}
                    label={`${reminder.enabled ? 'Disable' : 'Enable'} ${reminder.title}`}
                  />
                  <button
                    type="button"
                    onClick={() => setReminderModal({ open: true, reminder })}
                    className="rounded-lg p-1.5 text-ink-muted/60 transition hover:bg-white hover:text-ink"
                    aria-label={`Edit ${reminder.title}`}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteReminder(reminder)}
                    className="rounded-lg p-1.5 text-ink-muted/60 transition hover:bg-[#FAEFEA] hover:text-clay"
                    aria-label={`Delete ${reminder.title}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-cream-100/60 px-4 py-6 text-center text-xs text-ink-muted">
            No reminders yet. Add one for the moment you usually drift.
          </p>
        )}
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card icon={ShieldCheck} title="How streaks work" description="The rules are fixed, so the number always means something.">
          <ul className="space-y-2.5">
            {[
              'A day counts toward your streak only when every required activity is complete.',
              'Custom tasks count only if you mark them as required. Optional tasks never break a streak.',
              'One missed day breaks the current streak. Yesterday’s miss resets today.',
              'Editing a past day recalculates streaks immediately. Your history is never deleted.',
              'Dates follow your local timezone, not the server clock.',
              'Your longest streak is preserved forever, even after a break.',
            ].map((rule) => (
              <li key={rule} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-soft">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sage-700">
                  <Check size={10} strokeWidth={3} />
                </span>
                {rule}
              </li>
            ))}
          </ul>
        </Card>

        <Card icon={Download} title="Your data" description="Export a complete JSON backup, or sign out of this device.">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-cream-100/60 px-3.5 py-3">
              <div>
                <p className="text-[12.5px] font-medium text-ink">Download a full backup</p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-ink-muted">
                  Routine history, habits, interview work, journals, tasks, and reminders.
                </p>
              </div>
              <Button size="sm" variant="secondary" loading={exporting} onClick={exportData}>
                <Download size={13} /> Export
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FAF1EC] px-3.5 py-3">
              <div>
                <p className="text-[12.5px] font-medium text-[#7A4632]">Sign out</p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-[#8C604D]">
                  Your data stays saved. Sign back in to continue the exact same streak.
                </p>
              </div>
              <Button size="sm" variant="danger" loading={loggingOut} onClick={signOut}>
                <LogOut size={13} /> Sign out
              </Button>
            </div>
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-ink-muted">
            Account created for {user.email}. Tracking began {formatDateLong(user.trackingStart)}.
          </p>
        </Card>
      </div>

      <ReminderModal
        open={reminderModal.open}
        reminder={reminderModal.reminder}
        onClose={() => setReminderModal({ open: false, reminder: null })}
        onSaved={() => remindersState.refresh({ silent: true }).catch(() => {})}
      />

      <ConfirmDialog
        open={Boolean(deleteReminder)}
        onClose={() => setDeleteReminder(null)}
        onConfirm={removeReminder}
        loading={working}
        title="Delete this reminder?"
        description={deleteReminder ? `“${deleteReminder.title}” will stop appearing in your daily rhythm.` : ''}
        confirmLabel="Delete reminder"
      />
    </div>
  );
}

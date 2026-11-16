const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDate(date) {
  return new Date(`${date}T12:00:00.000Z`);
}

export function todayInTimezone(timezone = 'Asia/Kolkata') {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${map.year}-${map.month}-${map.day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function currentTimeInTimezone(timezone = 'Asia/Kolkata') {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return {
      hour: Number(map.hour === '24' ? 0 : map.hour),
      minute: Number(map.minute),
    };
  } catch {
    const now = new Date();
    return { hour: now.getUTCHours(), minute: now.getUTCMinutes() };
  }
}

export function addDays(date, amount) {
  if (!DATE_RE.test(date)) return date;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + amount);
  return parsed.toISOString().slice(0, 10);
}

export function diffDays(from, to) {
  return Math.round(
    (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / 86_400_000,
  );
}

export function weekday(date) {
  return parseDate(date).getUTCDay();
}

export function startOfWeek(date) {
  return addDays(date, -((weekday(date) + 6) % 7));
}

export function endOfWeek(date) {
  return addDays(startOfWeek(date), 6);
}

export function startOfMonth(date) {
  return `${date.slice(0, 7)}-01`;
}

export function endOfMonth(date) {
  const [year, month] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

export function eachDate(from, to) {
  const dates = [];
  let cursor = from;
  let guard = 0;
  while (cursor <= to && guard < 500) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return dates;
}

export function formatDateLong(date) {
  if (!date) return '';
  return parseDate(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDateMedium(date) {
  if (!date) return '';
  return parseDate(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDateShort(date) {
  if (!date) return '';
  return parseDate(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDayNumber(date) {
  return parseDate(date).getUTCDate();
}

export function formatWeekday(date, style = 'short') {
  return parseDate(date).toLocaleDateString('en-US', { weekday: style, timeZone: 'UTC' });
}

export function formatMonthYear(month) {
  const date = `${month}-01`;
  return parseDate(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatMonthShort(month) {
  return parseDate(`${month}-01`).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function monthOf(date) {
  return date.slice(0, 7);
}

export function shiftMonth(month, amount) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return date.toISOString().slice(0, 7);
}

export function formatTime(time) {
  if (!time || !time.includes(':')) return '';
  const [hourString, minute] = time.split(':');
  let hour = Number(hourString);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${suffix}`;
}

export function formatMinutes(minutes) {
  const total = Number(minutes) || 0;
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function formatHours(minutes) {
  return `${((Number(minutes) || 0) / 60).toFixed(1)}h`;
}

export function greetingFor(timezone) {
  const { hour } = currentTimeInTimezone(timezone);
  if (hour < 5) return 'Still awake';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export function relativeDay(date, today) {
  if (date === today) return 'Today';
  if (date === addDays(today, -1)) return 'Yesterday';
  if (date === addDays(today, 1)) return 'Tomorrow';
  return formatDateMedium(date);
}

export function monthMatrix(month) {
  const first = `${month}-01`;
  const last = endOfMonth(first);
  const start = startOfWeek(first);
  const end = endOfWeek(last);
  const dates = eachDate(start, end);
  const weeks = [];
  for (let index = 0; index < dates.length; index += 7) {
    weeks.push(dates.slice(index, index + 7));
  }
  return weeks;
}

export function lastNDays(today, count) {
  return eachDate(addDays(today, -(count - 1)), today);
}

export function nowLabel(timezone) {
  const { hour, minute } = currentTimeInTimezone(timezone);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

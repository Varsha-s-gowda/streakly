const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function todayInTimezone(timeZone = 'Asia/Kolkata') {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
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

export function timezoneTimeParts(timeZone = 'Asia/Kolkata') {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'short',
    }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return { hour: Number(map.hour === '24' ? 0 : map.hour), minute: Number(map.minute), weekday: map.weekday };
  } catch {
    const now = new Date();
    return { hour: now.getUTCHours(), minute: now.getUTCMinutes(), weekday: 'Mon' };
  }
}

export function addDays(date, amount) {
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
  return new Date(`${date}T00:00:00.000Z`).getUTCDay();
}

export function startOfWeek(date) {
  const offset = (weekday(date) + 6) % 7; // Monday = 0
  return addDays(date, -offset);
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
  while (cursor <= to && guard < 4000) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return dates;
}

export function isWeekend(date) {
  const day = weekday(date);
  return day === 0 || day === 6;
}

export function clampRange(from, to, maxDays = 400) {
  if (diffDays(from, to) < 0) {
    return { from: to, to: from };
  }
  if (diffDays(from, to) > maxDays) {
    return { from: addDays(to, -maxDays), to };
  }
  return { from, to };
}

export function isValidTime(value) {
  return typeof value === 'string' && TIME_RE.test(value);
}

export function timeToMinutes(value) {
  if (!isValidTime(value)) return 0;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function monthOf(date) {
  return date.slice(0, 7);
}

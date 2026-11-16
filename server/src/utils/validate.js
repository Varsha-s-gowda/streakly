import { HttpError } from './httpError.js';
import { isValidDate, isValidTime } from './dates.js';

export function requireString(value, field, { min = 1, max = 500, optional = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (optional) return '';
    throw new HttpError(400, `${field} is required.`);
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} must be text.`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw new HttpError(400, `${field} must be at least ${min} character${min === 1 ? '' : 's'}.`);
  }
  if (trimmed.length > max) {
    throw new HttpError(400, `${field} must be ${max} characters or fewer.`);
  }
  return trimmed;
}

export function optionalText(value, field, max = 5000) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new HttpError(400, `${field} must be text.`);
  if (value.length > max) throw new HttpError(400, `${field} must be ${max} characters or fewer.`);
  return value;
}

export function requireBool(value, field) {
  if (typeof value !== 'boolean') throw new HttpError(400, `${field} must be true or false.`);
  return value;
}

export function requireInt(value, field, { min = 0, max = 100000, optional = false, fallback = 0 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (optional) return fallback;
    throw new HttpError(400, `${field} is required.`);
  }
  const number = Number(value);
  if (!Number.isFinite(number) || !Number.isInteger(number)) {
    throw new HttpError(400, `${field} must be a whole number.`);
  }
  if (number < min || number > max) {
    throw new HttpError(400, `${field} must be between ${min} and ${max}.`);
  }
  return number;
}

export function requireEnum(value, field, allowed, { optional = false, fallback } = {}) {
  if (value === undefined || value === null || value === '') {
    if (optional) return fallback;
    throw new HttpError(400, `${field} is required.`);
  }
  if (!allowed.includes(value)) {
    throw new HttpError(400, `${field} must be one of: ${allowed.join(', ')}.`);
  }
  return value;
}

export function requireDate(value, field, { optional = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (optional) return null;
    throw new HttpError(400, `${field} must be a date in YYYY-MM-DD format.`);
  }
  if (!isValidDate(value)) {
    throw new HttpError(400, `${field} must be a valid date in YYYY-MM-DD format.`);
  }
  return value;
}

export function requireTime(value, field, { optional = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (optional) return null;
    throw new HttpError(400, `${field} must be a time in HH:mm format.`);
  }
  if (!isValidTime(value)) {
    throw new HttpError(400, `${field} must be a valid time in HH:mm format.`);
  }
  return value;
}

export function requireEmail(value) {
  const email = requireString(value, 'Email', { max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'Enter a valid email address.');
  }
  return email;
}

export function requirePassword(value, field = 'Password') {
  if (typeof value !== 'string' || value.length < 8) {
    throw new HttpError(400, `${field} must be at least 8 characters.`);
  }
  if (value.length > 200) {
    throw new HttpError(400, `${field} is too long.`);
  }
  return value;
}

export function requireTimezone(value) {
  const timezone = requireString(value, 'Timezone', { max: 100 });
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    throw new HttpError(400, 'Choose a valid IANA timezone (for example Asia/Kolkata).');
  }
}

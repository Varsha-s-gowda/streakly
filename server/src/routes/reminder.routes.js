import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Reminder } from '../models/Reminder.js';
import { HttpError } from '../utils/httpError.js';
import {
  optionalText,
  requireBool,
  requireString,
  requireTime,
} from '../utils/validate.js';

const router = Router();
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function serialize(reminder) {
  return {
    id: reminder._id.toString(),
    title: reminder.title,
    message: reminder.message || '',
    time: reminder.time,
    enabled: reminder.enabled,
    days: reminder.days,
    isDefault: reminder.isDefault,
  };
}

function parseDays(value) {
  if (value === undefined) return ALL_DAYS;
  if (!Array.isArray(value)) throw new HttpError(400, 'Days must be a list of weekdays.');
  const days = [...new Set(value.map(Number))];
  if (days.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    throw new HttpError(400, 'Days must contain numbers from 0 (Sunday) to 6 (Saturday).');
  }
  return days.sort();
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const reminders = await Reminder.find({ user: req.user._id }).sort({ time: 1, order: 1 }).lean();
    res.json({ reminders: reminders.map(serialize) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const title = requireString(req.body.title, 'Reminder title', { min: 2, max: 160 });
    const message = optionalText(req.body.message, 'Message', 500);
    const time = requireTime(req.body.time, 'Reminder time');
    const enabled = req.body.enabled === undefined ? true : requireBool(req.body.enabled, 'Enabled');
    const days = parseDays(req.body.days);
    const order = await Reminder.countDocuments({ user: req.user._id });

    const reminder = await Reminder.create({
      user: req.user._id,
      title,
      message,
      time,
      enabled,
      days,
      isDefault: false,
      order,
    });

    res.status(201).json({ reminder: serialize(reminder) });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user._id });
    if (!reminder) throw new HttpError(404, 'Reminder not found.');

    if (req.body.title !== undefined) {
      reminder.title = requireString(req.body.title, 'Reminder title', { min: 2, max: 160 });
    }
    if (req.body.message !== undefined) {
      reminder.message = optionalText(req.body.message, 'Message', 500);
    }
    if (req.body.time !== undefined) {
      reminder.time = requireTime(req.body.time, 'Reminder time');
    }
    if (req.body.enabled !== undefined) {
      reminder.enabled = requireBool(req.body.enabled, 'Enabled');
    }
    if (req.body.days !== undefined) {
      reminder.days = parseDays(req.body.days);
    }

    await reminder.save();
    res.json({ reminder: serialize(reminder) });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const reminder = await Reminder.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!reminder) throw new HttpError(404, 'Reminder not found.');
    res.json({ message: 'Reminder deleted.' });
  }),
);

export default router;

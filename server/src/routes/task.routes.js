import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Activity } from '../models/Activity.js';
import { DailyLog } from '../models/DailyLog.js';
import { addDays, todayInTimezone } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';
import {
  optionalText,
  requireBool,
  requireDate,
  requireEnum,
  requireString,
  requireTime,
} from '../utils/validate.js';
import { PRIORITIES, RECURRENCES } from '../constants.js';

const router = Router();

function serialize(task) {
  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description || '',
    section: task.section,
    scheduledTime: task.scheduledTime,
    priority: task.priority,
    required: Boolean(task.required),
    recurrence: task.recurrence,
    date: task.date || null,
    startDate: task.startDate,
    isDefault: Boolean(task.isDefault),
    isCustom: Boolean(task.isCustom),
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const tasks = await Activity.find({
      user: req.user._id,
      archived: false,
      isCustom: true,
    })
      .sort({ scheduledTime: 1, createdAt: 1 })
      .lean();

    const today = todayInTimezone(req.user.timezone);
    const todayLog = await DailyLog.findOne({ user: req.user._id, date: today }).lean();
    const todayStatuses = new Map(
      (todayLog?.statuses || []).map((status) => [String(status.activityId), status.completed]),
    );

    res.json({
      tasks: tasks.map((task) => ({
        ...serialize(task),
        completedToday:
          task.recurrence === 'once'
            ? false
            : Boolean(todayStatuses.get(String(task._id))),
      })),
    });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const today = todayInTimezone(req.user.timezone);
    const title = requireString(req.body.title, 'Task title', { min: 2, max: 200 });
    const description = optionalText(req.body.description, 'Description', 2000);
    const scheduledTime = requireTime(req.body.scheduledTime, 'Scheduled time');
    const priority = requireEnum(req.body.priority, 'Priority', PRIORITIES, {
      optional: true,
      fallback: 'medium',
    });
    const recurrence = requireEnum(req.body.recurrence, 'Recurrence', RECURRENCES, {
      optional: true,
      fallback: 'daily',
    });
    const required = req.body.required === undefined ? false : requireBool(req.body.required, 'Required');

    let date = null;
    if (recurrence === 'once') {
      date = requireDate(req.body.date, 'Date');
      if (date < today) throw new HttpError(400, 'A new one-time task must be scheduled for today or later.');
    }

    const order = await Activity.countDocuments({ user: req.user._id, section: 'custom' });
    const task = await Activity.create({
      user: req.user._id,
      title,
      description,
      section: 'custom',
      scheduledTime,
      priority,
      required,
      recurrence,
      date,
      startDate: today,
      isDefault: false,
      isCustom: true,
      order,
    });

    res.status(201).json({ task: serialize(task) });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const task = await Activity.findOne({
      _id: req.params.id,
      user: req.user._id,
      isCustom: true,
      archived: false,
    });
    if (!task) throw new HttpError(404, 'Custom task not found.');

    if (req.body.title !== undefined) {
      task.title = requireString(req.body.title, 'Task title', { min: 2, max: 200 });
    }
    if (req.body.description !== undefined) {
      task.description = optionalText(req.body.description, 'Description', 2000);
    }
    if (req.body.scheduledTime !== undefined) {
      task.scheduledTime = requireTime(req.body.scheduledTime, 'Scheduled time');
    }
    if (req.body.priority !== undefined) {
      task.priority = requireEnum(req.body.priority, 'Priority', PRIORITIES);
    }
    if (req.body.required !== undefined) {
      task.required = requireBool(req.body.required, 'Required');
    }
    if (req.body.recurrence !== undefined) {
      task.recurrence = requireEnum(req.body.recurrence, 'Recurrence', RECURRENCES);
    }

    if (task.recurrence === 'once') {
      if (req.body.date !== undefined) {
        task.date = requireDate(req.body.date, 'Date');
      }
      if (!task.date) {
        throw new HttpError(400, 'A one-time task needs a date.');
      }
    } else {
      task.date = null;
    }

    await task.save();
    res.json({ task: serialize(task) });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const task = await Activity.findOne({
      _id: req.params.id,
      user: req.user._id,
      isCustom: true,
      archived: false,
    });
    if (!task) throw new HttpError(404, 'Custom task not found.');

    task.archived = true;
    task.archivedOn = todayInTimezone(req.user.timezone);
    await task.save();

    res.json({ message: 'Task deleted. Past daily records have been preserved.' });
  }),
);

router.post(
  '/:id/reschedule',
  asyncHandler(async (req, res) => {
    const today = todayInTimezone(req.user.timezone);
    const task = await Activity.findOne({
      _id: req.params.id,
      user: req.user._id,
      isCustom: true,
      archived: false,
    });
    if (!task) throw new HttpError(404, 'Custom task not found.');

    const date = req.body.date ? requireDate(req.body.date, 'Date') : addDays(today, 1);
    if (date < today) throw new HttpError(400, 'Reschedule to today or a future date.');

    if (task.recurrence === 'once') {
      task.date = date;
      task.startDate = date;
      await task.save();
      return res.json({ task: serialize(task), created: false });
    }

    const order = await Activity.countDocuments({ user: req.user._id, section: 'custom' });
    const copy = await Activity.create({
      user: req.user._id,
      title: task.title,
      description: task.description,
      section: 'custom',
      scheduledTime: task.scheduledTime,
      priority: task.priority,
      required: task.required,
      recurrence: 'once',
      date,
      startDate: today,
      isDefault: false,
      isCustom: true,
      order,
    });

    res.json({ task: serialize(copy), created: true, message: 'A one-time task was scheduled for the new date.' });
  }),
);

export default router;

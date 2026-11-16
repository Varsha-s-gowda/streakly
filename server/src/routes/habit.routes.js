import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Habit } from '../models/Habit.js';
import { HabitEntry } from '../models/HabitEntry.js';
import { getHabitsData } from '../services/habitService.js';
import { todayInTimezone, addDays, diffDays } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';
import {
  optionalText,
  requireBool,
  requireDate,
  requireString,
} from '../utils/validate.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const today = todayInTimezone(req.user.timezone);
    const to = req.query.to ? requireDate(req.query.to, 'To date') : today;
    const from = req.query.from ? requireDate(req.query.from, 'From date') : addDays(to, -6);
    if (from > to) throw new HttpError(400, 'The from date must be before the to date.');
    if (diffDays(from, to) > 366) throw new HttpError(400, 'Habit range cannot exceed one year.');

    const data = await getHabitsData(req.user, { from, to, today });
    res.json(data);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const name = requireString(req.body.name, 'Habit name', { min: 2, max: 120 });
    const description = optionalText(req.body.description, 'Description', 500);
    const today = todayInTimezone(req.user.timezone);
    const order = await Habit.countDocuments({ user: req.user._id });

    const habit = await Habit.create({
      user: req.user._id,
      name,
      description,
      isDefault: false,
      startDate: today,
      order,
    });

    res.status(201).json({
      habit: {
        id: habit._id.toString(),
        name: habit.name,
        description: habit.description,
        isDefault: habit.isDefault,
        startDate: habit.startDate,
      },
    });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
    if (!habit) throw new HttpError(404, 'Habit not found.');

    if (req.body.name !== undefined) {
      habit.name = requireString(req.body.name, 'Habit name', { min: 2, max: 120 });
    }
    if (req.body.description !== undefined) {
      habit.description = optionalText(req.body.description, 'Description', 500);
    }

    await habit.save();
    res.json({
      habit: {
        id: habit._id.toString(),
        name: habit.name,
        description: habit.description,
        isDefault: habit.isDefault,
        startDate: habit.startDate,
      },
    });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });
    if (!habit) throw new HttpError(404, 'Habit not found.');

    habit.archived = true;
    habit.archivedOn = todayInTimezone(req.user.timezone);
    await habit.save();
    res.json({ message: 'Habit removed. Its history has been preserved.' });
  }),
);

router.patch(
  '/:id/entries/:date',
  asyncHandler(async (req, res) => {
    const date = requireDate(req.params.date, 'Date');
    const today = todayInTimezone(req.user.timezone);
    if (date > today) throw new HttpError(400, 'Future habit entries cannot be changed.');

    const habit = await Habit.findOne({
      _id: req.params.id,
      user: req.user._id,
      archived: false,
    });
    if (!habit) throw new HttpError(404, 'Habit not found.');
    if (date < habit.startDate) {
      throw new HttpError(400, 'This habit did not exist on that date.');
    }

    const completed = requireBool(req.body.completed, 'Completed');
    const entry = await HabitEntry.findOneAndUpdate(
      { user: req.user._id, habit: habit._id, date },
      { $set: { completed } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.json({
      habitId: habit._id.toString(),
      date,
      completed: entry.completed,
    });
  }),
);

export default router;

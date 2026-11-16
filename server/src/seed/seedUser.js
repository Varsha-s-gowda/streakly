import { Activity } from '../models/Activity.js';
import { Habit } from '../models/Habit.js';
import { Reminder } from '../models/Reminder.js';
import { InterviewTarget } from '../models/InterviewTarget.js';
import { INTERVIEW_SUBJECTS } from '../constants.js';
import { todayInTimezone } from '../utils/dates.js';
import {
  DEFAULT_ACTIVITIES,
  DEFAULT_HABITS,
  DEFAULT_REMINDERS,
  getTargetDefaults,
} from './defaults.js';

/**
 * Creates the complete default routine for a brand-new account.
 * All routine items count toward the daily streak. Custom tasks default to optional.
 */
export async function seedUserDefaults(user) {
  const startDate = user.trackingStart || todayInTimezone(user.timezone);

  const existing = await Activity.countDocuments({ user: user._id });
  if (existing === 0) {
    await Activity.insertMany(
      DEFAULT_ACTIVITIES.map((activity, index) => ({
        ...activity,
        user: user._id,
        recurrence: 'daily',
        startDate,
        isDefault: true,
        isCustom: false,
        order: index,
      })),
    );
  }

  const habitCount = await Habit.countDocuments({ user: user._id });
  if (habitCount === 0) {
    await Habit.insertMany(
      DEFAULT_HABITS.map((name, index) => ({
        user: user._id,
        name,
        isDefault: true,
        startDate,
        order: index,
      })),
    );
  }

  const reminderCount = await Reminder.countDocuments({ user: user._id });
  if (reminderCount === 0) {
    await Reminder.insertMany(
      DEFAULT_REMINDERS.map((reminder, index) => ({
        ...reminder,
        user: user._id,
        isDefault: true,
        order: index,
        enabled: true,
      })),
    );
  }

  await Promise.all(
    INTERVIEW_SUBJECTS.map((subject) => {
      const defaults = getTargetDefaults(subject);
      return InterviewTarget.updateOne(
        { user: user._id, subject },
        { $setOnInsert: { ...defaults } },
        { upsert: true },
      );
    }),
  );
}

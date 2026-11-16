import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Activity } from '../models/Activity.js';
import { DailyLog } from '../models/DailyLog.js';
import { Habit } from '../models/Habit.js';
import { HabitEntry } from '../models/HabitEntry.js';
import { Journal } from '../models/Journal.js';
import { InterviewTopic } from '../models/InterviewTopic.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { InterviewTarget } from '../models/InterviewTarget.js';
import { Reminder } from '../models/Reminder.js';

const router = Router();

router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const [activities, dailyLogs, habits, habitEntries, journals, topics, sessions, targets, reminders] =
      await Promise.all([
        Activity.find({ user: userId }).lean(),
        DailyLog.find({ user: userId }).sort({ date: 1 }).lean(),
        Habit.find({ user: userId }).lean(),
        HabitEntry.find({ user: userId }).sort({ date: 1 }).lean(),
        Journal.find({ user: userId }).sort({ date: 1 }).lean(),
        InterviewTopic.find({ user: userId }).lean(),
        InterviewSession.find({ user: userId }).sort({ date: 1 }).lean(),
        InterviewTarget.find({ user: userId }).lean(),
        Reminder.find({ user: userId }).lean(),
      ]);

    const exportedAt = new Date().toISOString();
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="streakly-backup-${exportedAt.slice(0, 10)}.json"`,
    );
    res.json({
      app: 'Streakly',
      exportedAt,
      user: req.user.toPublic(),
      activities,
      dailyLogs,
      habits,
      habitEntries,
      journals,
      interviewTopics: topics,
      interviewSessions: sessions,
      interviewTargets: targets,
      reminders,
    });
  }),
);

export default router;

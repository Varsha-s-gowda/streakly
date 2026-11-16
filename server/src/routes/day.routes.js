import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getDayPayload, setActivityStatus, setAllActivityStatuses } from '../services/activityService.js';
import { getStreakSummary } from '../services/statsService.js';
import { todayInTimezone } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';
import {
  optionalText,
  requireBool,
  requireDate,
} from '../utils/validate.js';

const router = Router();

function ensureNotFuture(date, user) {
  const today = todayInTimezone(user.timezone);
  if (date > today) throw new HttpError(400, 'Future dates cannot be edited.');
  return today;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const today = todayInTimezone(req.user.timezone);
    const date = req.query.date ? requireDate(req.query.date, 'Date') : today;
    if (date > today) throw new HttpError(400, 'Future dates cannot be viewed.');

    const day = await getDayPayload(req.user, date, today);
    const streaks = await getStreakSummary(req.user, today);
    res.json({ ...day, streaks });
  }),
);

router.patch(
  '/:date/activities/:activityId',
  asyncHandler(async (req, res) => {
    const date = requireDate(req.params.date, 'Date');
    const today = ensureNotFuture(date, req.user);

    const hasCompleted = req.body.completed !== undefined;
    const hasNotes = req.body.notes !== undefined;
    if (!hasCompleted && !hasNotes) {
      throw new HttpError(400, 'Provide completed status or notes.');
    }

    const completed = hasCompleted ? requireBool(req.body.completed, 'Completed') : undefined;
    const notes = hasNotes ? optionalText(req.body.notes, 'Notes', 2000) : undefined;

    const day = await setActivityStatus(req.user, date, req.params.activityId, {
      completed,
      notes,
    });
    if (!day) throw new HttpError(404, 'That activity is not part of this day.');

    const streaks = await getStreakSummary(req.user, today);
    res.json({ day, streaks });
  }),
);

router.post(
  '/:date/complete-all',
  asyncHandler(async (req, res) => {
    const date = requireDate(req.params.date, 'Date');
    const today = ensureNotFuture(date, req.user);
    const completed = req.body.completed === undefined ? true : requireBool(req.body.completed, 'Completed');
    const day = await setAllActivityStatuses(req.user, date, completed);
    const streaks = await getStreakSummary(req.user, today);
    res.json({ day, streaks });
  }),
);

export default router;

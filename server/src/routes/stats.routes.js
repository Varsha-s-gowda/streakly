import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getCalendar, getOverview, getTrends } from '../services/statsService.js';
import { requireDate } from '../utils/validate.js';
import { HttpError } from '../utils/httpError.js';

const router = Router();

router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const overview = await getOverview(req.user);
    res.json(overview);
  }),
);

router.get(
  '/trends',
  asyncHandler(async (req, res) => {
    const from = requireDate(req.query.from, 'From date');
    const to = requireDate(req.query.to, 'To date');
    if (from > to) throw new HttpError(400, 'The from date must be before the to date.');
    const trends = await getTrends(req.user, from, to);
    res.json(trends);
  }),
);

router.get(
  '/calendar',
  asyncHandler(async (req, res) => {
    const month = String(req.query.month || '');
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new HttpError(400, 'Month must be in YYYY-MM format.');
    }
    const calendar = await getCalendar(req.user, month);
    res.json(calendar);
  }),
);

export default router;

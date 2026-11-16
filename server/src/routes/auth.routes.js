import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import { seedUserDefaults } from '../seed/seedUser.js';
import { todayInTimezone, timezoneTimeParts } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  requireEmail,
  requirePassword,
  requireString,
  requireTimezone,
} from '../utils/validate.js';
import {
  clearAuthCookie,
  requireAuth,
  setAuthCookie,
} from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Please try again in a few minutes.' },
});

function authPayload(user) {
  const today = todayInTimezone(user.timezone);
  return {
    user: user.toPublic(),
    today,
    time: timezoneTimeParts(user.timezone),
    serverTime: new Date().toISOString(),
  };
}

router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const userCount = await User.countDocuments();
    if (userCount > 0 && !env.allowSignup) {
      throw new HttpError(403, 'Registration is closed on this server.');
    }

    const name = requireString(req.body.name, 'Name', { min: 2, max: 80 });
    const email = requireEmail(req.body.email);
    const password = requirePassword(req.body.password);
    const timezone = req.body.timezone
      ? requireTimezone(req.body.timezone)
      : 'Asia/Kolkata';

    const existing = await User.findOne({ email });
    if (existing) throw new HttpError(409, 'An account with this email already exists.');

    const passwordHash = await bcrypt.hash(password, 12);
    const trackingStart = todayInTimezone(timezone);

    const user = await User.create({
      name,
      email,
      passwordHash,
      timezone,
      trackingStart,
    });

    await seedUserDefaults(user);
    user.lastLoginAt = new Date();
    await user.save();

    setAuthCookie(req, res, user);
    res.status(201).json(authPayload(user));
  }),
);

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const email = requireEmail(req.body.email);
    const password = requirePassword(req.body.password);

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) throw new HttpError(401, 'Email or password is incorrect.');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new HttpError(401, 'Email or password is incorrect.');

    user.lastLoginAt = new Date();
    await user.save();

    setAuthCookie(req, res, user);
    res.json(authPayload(user));
  }),
);

router.post('/logout', (req, res) => {
  clearAuthCookie(req, res);
  res.json({ message: 'Signed out.' });
});

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json(authPayload(req.user));
}));

router.patch(
  '/profile',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = req.user;

    if (req.body.name !== undefined) {
      user.name = requireString(req.body.name, 'Name', { min: 2, max: 80 });
    }
    if (req.body.email !== undefined) {
      const email = requireEmail(req.body.email);
      const duplicate = await User.findOne({ email, _id: { $ne: user._id } });
      if (duplicate) throw new HttpError(409, 'That email is already in use.');
      user.email = email;
    }
    if (req.body.timezone !== undefined) {
      user.timezone = requireTimezone(req.body.timezone);
    }
    if (req.body.trackingStart !== undefined) {
      throw new HttpError(400, 'Tracking start date cannot be changed.');
    }

    await user.save();
    res.json(authPayload(user));
  }),
);

router.post(
  '/password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const currentPassword = requireString(req.body.currentPassword, 'Current password', {
      max: 200,
    });
    const newPassword = requirePassword(req.body.newPassword, 'New password');

    const user = await User.findById(req.user._id).select('+passwordHash');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new HttpError(401, 'Current password is incorrect.');

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    setAuthCookie(req, res, user);

    res.json({ message: 'Password updated.' });
  }),
);

export default router;

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const AUTH_COOKIE = 'streakly_session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export function setAuthCookie(req, res, user) {
  const token = signToken(user);
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export function clearAuthCookie(req, res) {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    path: '/',
  });
}

async function userFromRequest(req) {
  let token = req.cookies?.[AUTH_COOKIE];
  if (!token) {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) token = header.slice(7);
  }

  if (!token) return { hasToken: false, user: null };

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub);
    return { hasToken: true, user };
  } catch {
    return { hasToken: true, user: null };
  }
}

export const requireAuth = asyncHandler(async (req, res, next) => {
  const { hasToken, user } = await userFromRequest(req);
  if (!user) {
    throw new HttpError(
      401,
      hasToken ? 'Your session has expired. Please sign in again.' : 'Please sign in to continue.',
    );
  }

  req.user = user;
  next();
});

/**
 * Resolves the session when present, but never rejects the request.
 * Used by the public session endpoint so signed-out visitors load cleanly.
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const { user } = await userFromRequest(req);
  if (user) req.user = user;
  next();
});

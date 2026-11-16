import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Journal } from '../models/Journal.js';
import { todayInTimezone } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';
import { optionalText, requireDate } from '../utils/validate.js';
import {
  gratitudeHasContent,
  journalHasContent,
  manifestationHasContent,
} from '../utils/journalUtils.js';

const router = Router();

const GROUPS = {
  gratitude: ['gratefulFor', 'madeDayBetter', 'smallAppreciation', 'positiveExperience'],
  reflection: ['accomplished', 'learned', 'challenges', 'improveTomorrow', 'proudOf'],
  manifestation: ['manifesting', 'becomingPerson', 'affirmations', 'visualization', 'tomorrowIntentions'],
};

function serialize(journal) {
  if (!journal) return null;
  return {
    id: journal._id.toString(),
    date: journal.date,
    achievements: journal.achievements || '',
    gratitude: journal.gratitude || {},
    reflection: journal.reflection || {},
    manifestation: journal.manifestation || {},
    updatedAt: journal.updatedAt,
    createdAt: journal.createdAt,
  };
}

function blankEntry() {
  return {
    achievements: '',
    gratitude: Object.fromEntries(GROUPS.gratitude.map((key) => [key, ''])),
    reflection: Object.fromEntries(GROUPS.reflection.map((key) => [key, ''])),
    manifestation: Object.fromEntries(GROUPS.manifestation.map((key) => [key, ''])),
  };
}

router.get(
  '/entries',
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 40, 366);
    const filter = { user: req.user._id };
    if (req.query.from) filter.date = { $gte: requireDate(req.query.from, 'From date') };
    if (req.query.to) filter.date = { ...(filter.date || {}), $lte: requireDate(req.query.to, 'To date') };

    let journals = await Journal.find(filter).sort({ date: -1 }).limit(limit).lean();
    if (req.query.manifestation === 'true') {
      journals = journals.filter((journal) => manifestationHasContent(journal));
    }
    if (req.query.gratitude === 'true') {
      journals = journals.filter((journal) => gratitudeHasContent(journal));
    }

    res.json({
      entries: journals.map((journal) => ({
        ...serialize(journal),
        hasContent: journalHasContent(journal),
        hasGratitude: gratitudeHasContent(journal),
        hasManifestation: manifestationHasContent(journal),
      })),
    });
  }),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const today = todayInTimezone(req.user.timezone);
    const date = req.query.date ? requireDate(req.query.date, 'Date') : today;
    if (date > today) throw new HttpError(400, 'Future journal entries cannot be viewed.');

    const journal = await Journal.findOne({ user: req.user._id, date }).lean();
    res.json({
      date,
      entry: serialize(journal),
      blank: blankEntry(),
      hasContent: journalHasContent(journal),
    });
  }),
);

router.put(
  '/:date',
  asyncHandler(async (req, res) => {
    const date = requireDate(req.params.date, 'Date');
    const today = todayInTimezone(req.user.timezone);
    if (date > today) throw new HttpError(400, 'Future journal entries cannot be saved.');

    const update = {};
    if (req.body.achievements !== undefined) {
      update.achievements = optionalText(req.body.achievements, 'Achievements', 5000);
    }

    for (const [group, keys] of Object.entries(GROUPS)) {
      if (req.body[group] === undefined) continue;
      if (!req.body[group] || typeof req.body[group] !== 'object' || Array.isArray(req.body[group])) {
        throw new HttpError(400, `${group} must be an object.`);
      }
      for (const key of keys) {
        if (req.body[group][key] !== undefined) {
          update[`${group}.${key}`] = optionalText(req.body[group][key], `${group}.${key}`, 5000);
        }
      }
    }

    if (Object.keys(update).length === 0) {
      throw new HttpError(400, 'Nothing to save.');
    }

    const journal = await Journal.findOneAndUpdate(
      { user: req.user._id, date },
      {
        $set: update,
        $setOnInsert: { user: req.user._id, date },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    );

    res.json({
      entry: serialize(journal),
      hasContent: journalHasContent(journal),
      savedAt: journal.updatedAt,
    });
  }),
);

export default router;

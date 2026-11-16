import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { InterviewTopic } from '../models/InterviewTopic.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { InterviewTarget } from '../models/InterviewTarget.js';
import { INTERVIEW_SUBJECTS, TOPIC_DIFFICULTIES, TOPIC_STATUSES } from '../constants.js';
import { getInterviewOverview } from '../services/interviewService.js';
import { todayInTimezone } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';
import {
  optionalText,
  requireDate,
  requireEnum,
  requireInt,
  requireString,
} from '../utils/validate.js';

const router = Router();

function subjectFrom(value) {
  return requireEnum(value, 'Subject', INTERVIEW_SUBJECTS);
}

async function validateParent(userId, parentId, subject, selfId) {
  if (!parentId) return null;
  if (selfId && String(parentId) === String(selfId)) {
    throw new HttpError(400, 'A topic cannot be its own parent.');
  }
  const parent = await InterviewTopic.findOne({
    _id: parentId,
    user: userId,
    archived: false,
  });
  if (!parent) throw new HttpError(404, 'Parent topic not found.');
  if (parent.subject !== subject) throw new HttpError(400, 'Parent topic belongs to another subject.');
  if (parent.parent) throw new HttpError(400, 'Subtopics can only be nested one level deep.');
  return parent._id;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const today = todayInTimezone(req.user.timezone);
    const data = await getInterviewOverview(req.user, today);
    res.json(data);
  }),
);

router.post(
  '/topics',
  asyncHandler(async (req, res) => {
    const subject = subjectFrom(req.body.subject);
    const title = requireString(req.body.title, 'Topic title', { min: 2, max: 200 });
    const notes = optionalText(req.body.notes, 'Notes', 5000);
    const difficulty = requireEnum(req.body.difficulty, 'Difficulty', TOPIC_DIFFICULTIES, {
      optional: true,
      fallback: 'medium',
    });
    const status = requireEnum(req.body.status, 'Status', TOPIC_STATUSES, {
      optional: true,
      fallback: 'not-started',
    });
    const targetMinutes = requireInt(req.body.targetMinutes, 'Target minutes', {
      min: 0,
      max: 10000,
      optional: true,
      fallback: 0,
    });
    const parent = await validateParent(req.user._id, req.body.parent, subject);

    const order = await InterviewTopic.countDocuments({ user: req.user._id, subject, parent });
    const topic = await InterviewTopic.create({
      user: req.user._id,
      subject,
      title,
      notes,
      difficulty,
      status,
      targetMinutes,
      parent,
      order,
    });

    res.status(201).json({
      topic: {
        id: topic._id.toString(),
        subject: topic.subject,
        title: topic.title,
        parent: topic.parent ? topic.parent.toString() : null,
        status: topic.status,
        difficulty: topic.difficulty,
        notes: topic.notes,
        targetMinutes: topic.targetMinutes,
      },
    });
  }),
);

router.patch(
  '/topics/:id',
  asyncHandler(async (req, res) => {
    const topic = await InterviewTopic.findOne({
      _id: req.params.id,
      user: req.user._id,
      archived: false,
    });
    if (!topic) throw new HttpError(404, 'Topic not found.');

    if (req.body.title !== undefined) {
      topic.title = requireString(req.body.title, 'Topic title', { min: 2, max: 200 });
    }
    if (req.body.status !== undefined) {
      topic.status = requireEnum(req.body.status, 'Status', TOPIC_STATUSES);
    }
    if (req.body.difficulty !== undefined) {
      topic.difficulty = requireEnum(req.body.difficulty, 'Difficulty', TOPIC_DIFFICULTIES);
    }
    if (req.body.notes !== undefined) {
      topic.notes = optionalText(req.body.notes, 'Notes', 5000);
    }
    if (req.body.targetMinutes !== undefined) {
      topic.targetMinutes = requireInt(req.body.targetMinutes, 'Target minutes', {
        min: 0,
        max: 10000,
      });
    }
    if (req.body.parent !== undefined) {
      topic.parent = await validateParent(
        req.user._id,
        req.body.parent,
        topic.subject,
        topic._id,
      );
    }

    await topic.save();
    res.json({
      topic: {
        id: topic._id.toString(),
        subject: topic.subject,
        title: topic.title,
        parent: topic.parent ? topic.parent.toString() : null,
        status: topic.status,
        difficulty: topic.difficulty,
        notes: topic.notes,
        targetMinutes: topic.targetMinutes,
      },
    });
  }),
);

router.delete(
  '/topics/:id',
  asyncHandler(async (req, res) => {
    const topic = await InterviewTopic.findOne({
      _id: req.params.id,
      user: req.user._id,
      archived: false,
    });
    if (!topic) throw new HttpError(404, 'Topic not found.');

    await InterviewTopic.updateMany(
      { user: req.user._id, $or: [{ _id: topic._id }, { parent: topic._id }] },
      { $set: { archived: true } },
    );

    res.json({ message: 'Topic and its subtopics removed.' });
  }),
);

router.get(
  '/sessions',
  asyncHandler(async (req, res) => {
    const filter = { user: req.user._id };
    if (req.query.from) filter.date = { $gte: requireDate(req.query.from, 'From date') };
    if (req.query.to) filter.date = { ...(filter.date || {}), $lte: requireDate(req.query.to, 'To date') };
    if (req.query.date) filter.date = requireDate(req.query.date, 'Date');
    if (req.query.subject) filter.subject = subjectFrom(req.query.subject);

    const sessions = await InterviewSession.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .limit(Math.min(Number(req.query.limit) || 100, 500))
      .lean();

    const topicIds = sessions.map((session) => session.topic).filter(Boolean);
    const topics = await InterviewTopic.find({ _id: { $in: topicIds } }).select('title').lean();
    const topicMap = new Map(topics.map((topic) => [String(topic._id), topic.title]));

    res.json({
      sessions: sessions.map((session) => ({
        id: session._id.toString(),
        date: session.date,
        subject: session.subject,
        topic: session.topic ? session.topic.toString() : null,
        topicTitle: session.topic ? topicMap.get(String(session.topic)) || null : null,
        minutes: session.minutes,
        problemsSolved: session.problemsSolved,
        difficultQuestions: session.difficultQuestions || '',
        notes: session.notes || '',
        createdAt: session.createdAt,
      })),
    });
  }),
);

router.post(
  '/sessions',
  asyncHandler(async (req, res) => {
    const today = todayInTimezone(req.user.timezone);
    const date = requireDate(req.body.date || today, 'Date');
    if (date > today) throw new HttpError(400, 'Study sessions cannot be logged for future dates.');

    const subject = subjectFrom(req.body.subject);
    const minutes = requireInt(req.body.minutes, 'Minutes', { min: 1, max: 1440 });
    const problemsSolved = requireInt(req.body.problemsSolved, 'Problems solved', {
      min: 0,
      max: 500,
      optional: true,
      fallback: 0,
    });
    const notes = optionalText(req.body.notes, 'Notes', 5000);
    const difficultQuestions = optionalText(
      req.body.difficultQuestions,
      'Difficult questions',
      5000,
    );

    let topic = null;
    if (req.body.topic) {
      const found = await InterviewTopic.findOne({
        _id: req.body.topic,
        user: req.user._id,
        subject,
      });
      if (!found) throw new HttpError(404, 'Topic not found for this subject.');
      topic = found._id;
    }

    const session = await InterviewSession.create({
      user: req.user._id,
      date,
      subject,
      topic,
      minutes,
      problemsSolved,
      notes,
      difficultQuestions,
    });

    res.status(201).json({
      session: {
        id: session._id.toString(),
        date: session.date,
        subject: session.subject,
        topic: session.topic ? session.topic.toString() : null,
        minutes: session.minutes,
        problemsSolved: session.problemsSolved,
        notes: session.notes,
        difficultQuestions: session.difficultQuestions,
      },
    });
  }),
);

router.delete(
  '/sessions/:id',
  asyncHandler(async (req, res) => {
    const session = await InterviewSession.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!session) throw new HttpError(404, 'Study session not found.');
    res.json({ message: 'Study session deleted.' });
  }),
);

router.put(
  '/targets',
  asyncHandler(async (req, res) => {
    const subject = subjectFrom(req.body.subject);
    const dailyMinutes = requireInt(req.body.dailyMinutes, 'Daily target', { min: 0, max: 1440 });
    const weeklyMinutes = requireInt(req.body.weeklyMinutes, 'Weekly target', {
      min: 0,
      max: 10080,
    });

    const target = await InterviewTarget.findOneAndUpdate(
      { user: req.user._id, subject },
      { $set: { dailyMinutes, weeklyMinutes } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.json({
      target: {
        subject: target.subject,
        dailyMinutes: target.dailyMinutes,
        weeklyMinutes: target.weeklyMinutes,
      },
    });
  }),
);

export default router;

import { Activity } from '../models/Activity.js';
import { DailyLog } from '../models/DailyLog.js';
import { Journal } from '../models/Journal.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { todayInTimezone, weekday } from '../utils/dates.js';

export function activityDateQuery(userId, date) {
  const day = weekday(date);
  const recurrence = [{ recurrence: 'daily' }, { recurrence: 'once', date }];
  if (day >= 1 && day <= 5) recurrence.push({ recurrence: 'weekdays' });

  return {
    user: userId,
    startDate: { $lte: date },
    $and: [
      { $or: [{ archived: false }, { archivedOn: { $gt: date } }] },
      { $or: recurrence },
    ],
  };
}

export async function getActivitiesForDate(userId, date) {
  return Activity.find(activityDateQuery(userId, date))
    .sort({ scheduledTime: 1, order: 1 })
    .lean();
}

export function computeLogStats(activities, statuses) {
  const statusMap = new Map(statuses.map((status) => [String(status.activityId), status]));
  let completedActivities = 0;
  let requiredCompleted = 0;
  let requiredTotal = 0;

  for (const activity of activities) {
    if (activity.required) requiredTotal += 1;
    if (statusMap.get(String(activity._id))?.completed) {
      completedActivities += 1;
      if (activity.required) requiredCompleted += 1;
    }
  }

  const totalActivities = activities.length;
  return {
    totalActivities,
    completedActivities,
    requiredTotal,
    requiredCompleted,
    completionPercent: totalActivities ? Math.round((completedActivities / totalActivities) * 100) : 0,
    isComplete: requiredTotal > 0 && requiredCompleted === requiredTotal,
  };
}

function statsDiffer(log, stats) {
  return (
    log.totalActivities !== stats.totalActivities ||
    log.completedActivities !== stats.completedActivities ||
    log.requiredTotal !== stats.requiredTotal ||
    log.requiredCompleted !== stats.requiredCompleted ||
    log.completionPercent !== stats.completionPercent ||
    log.isComplete !== stats.isComplete
  );
}

/**
 * Returns the day's log, creating it lazily and reconciling any newly added activities.
 * Historical entries are never deleted; stats are recalculated from the current routine.
 */
export async function getOrCreateDailyLog(user, date, { persist = true } = {}) {
  const activities = await getActivitiesForDate(user._id, date);
  let log = await DailyLog.findOne({ user: user._id, date });

  if (!log) {
    log = new DailyLog({
      user: user._id,
      date,
      statuses: [],
    });
  }

  let changed = log.isNew;
  const known = new Set(log.statuses.map((status) => String(status.activityId)));
  for (const activity of activities) {
    if (!known.has(String(activity._id))) {
      log.statuses.push({ activityId: activity._id, completed: false, notes: '', completedAt: null });
      changed = true;
    }
  }

  const stats = computeLogStats(activities, log.statuses);
  if (changed || statsDiffer(log, stats)) {
    Object.assign(log, stats);
    changed = true;
  }

  if (persist && changed) {
    await log.save();
  }

  return { log, activities, stats };
}

export function serializeActivity(activity, status) {
  return {
    id: String(activity._id),
    title: activity.title,
    description: activity.description || '',
    section: activity.section,
    scheduledTime: activity.scheduledTime,
    priority: activity.priority,
    required: Boolean(activity.required),
    recurrence: activity.recurrence,
    date: activity.date || null,
    isDefault: Boolean(activity.isDefault),
    isCustom: Boolean(activity.isCustom),
    completed: Boolean(status?.completed),
    completedAt: status?.completedAt || null,
    notes: status?.notes || '',
  };
}

function stripJournal(journal) {
  if (!journal) return null;
  return {
    id: String(journal._id),
    date: journal.date,
    achievements: journal.achievements || '',
    gratitude: journal.gratitude || {},
    reflection: journal.reflection || {},
    manifestation: journal.manifestation || {},
    updatedAt: journal.updatedAt,
    createdAt: journal.createdAt,
  };
}

export async function getDayPayload(user, date, today, { persist = true } = {}) {
  const { log, activities, stats } = await getOrCreateDailyLog(user, date, { persist });
  const statusMap = new Map(log.statuses.map((status) => [String(status.activityId), status]));

  const [journal, sessions] = await Promise.all([
    Journal.findOne({ user: user._id, date }).lean(),
    InterviewSession.find({ user: user._id, date })
      .sort({ createdAt: 1 })
      .lean(),
  ]);

  const serializedActivities = activities.map((activity) =>
    serializeActivity(activity, statusMap.get(String(activity._id))),
  );

  return {
    date,
    today,
    timezone: user.timezone,
    stats,
    activities: serializedActivities,
    studyMinutes: sessions.reduce((sum, session) => sum + session.minutes, 0),
    problemsSolved: sessions.reduce((sum, session) => sum + session.problemsSolved, 0),
    sessions: sessions.map((session) => ({
      id: String(session._id),
      date: session.date,
      subject: session.subject,
      topic: session.topic ? String(session.topic) : null,
      minutes: session.minutes,
      problemsSolved: session.problemsSolved,
      difficultQuestions: session.difficultQuestions || '',
      notes: session.notes || '',
      createdAt: session.createdAt,
    })),
    journal: stripJournal(journal),
  };
}

/**
 * Toggle a routine activity and persist the new derived stats immediately.
 */
export async function setActivityStatus(user, date, activityId, { completed, notes }) {
  const activities = await getActivitiesForDate(user._id, date);
  const activity = activities.find((item) => String(item._id) === String(activityId));
  if (!activity) {
    return null;
  }

  let log = await DailyLog.findOne({ user: user._id, date });
  if (!log) {
    log = new DailyLog({ user: user._id, date, statuses: [] });
  }

  const known = new Set(log.statuses.map((status) => String(status.activityId)));
  for (const item of activities) {
    if (!known.has(String(item._id))) {
      log.statuses.push({ activityId: item._id, completed: false, notes: '', completedAt: null });
      known.add(String(item._id));
    }
  }

  let entry = log.statuses.find((status) => String(status.activityId) === String(activityId));
  if (!entry) {
    entry = { activityId: activity._id, completed: false, notes: '', completedAt: null };
    log.statuses.push(entry);
  }

  if (typeof completed === 'boolean') {
    entry.completed = completed;
    entry.completedAt = completed ? new Date() : null;
  }
  if (typeof notes === 'string') {
    entry.notes = notes;
  }

  Object.assign(log, computeLogStats(activities, log.statuses));
  await log.save();

  return getDayPayload(user, date, todayInTimezone(user.timezone), { persist: false });
}

export async function setAllActivityStatuses(user, date, completed) {
  const activities = await getActivitiesForDate(user._id, date);
  let log = await DailyLog.findOne({ user: user._id, date });
  if (!log) {
    log = new DailyLog({ user: user._id, date, statuses: [] });
  }

  const statusMap = new Map(log.statuses.map((status) => [String(status.activityId), status]));
  for (const activity of activities) {
    const key = String(activity._id);
    let entry = statusMap.get(key);
    if (!entry) {
      entry = { activityId: activity._id, completed: false, notes: '', completedAt: null };
      log.statuses.push(entry);
      statusMap.set(key, entry);
    }
    entry.completed = completed;
    entry.completedAt = completed ? new Date() : null;
  }

  Object.assign(log, computeLogStats(activities, log.statuses));
  await log.save();

  return getDayPayload(user, date, todayInTimezone(user.timezone), { persist: false });
}
